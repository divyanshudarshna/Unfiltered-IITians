import { Prisma, type SessionSeatHold } from "@prisma/client";
import { getSeatHoldExpiresAt } from "@/lib/session-seat-hold";

type TransactionClient = Prisma.TransactionClient;

export class SessionSeatUnavailableError extends Error {}

export function calculateSessionSeatAvailability(
  capacity: number | null,
  heldCount: number,
  confirmedCount: number,
) {
  if (capacity === null) return null;
  if (!Number.isInteger(capacity) || capacity < 0) {
    throw new SessionSeatUnavailableError("Session capacity must be a non-negative whole number");
  }
  const occupiedSeats = heldCount + confirmedCount;
  if (capacity < occupiedSeats) {
    throw new SessionSeatUnavailableError("Session capacity cannot be lower than occupied seats");
  }
  return capacity - occupiedSeats;
}

export async function synchronizeSessionSeatCapacity(
  tx: TransactionClient,
  sessionId: string,
  capacity: number | null,
) {
  const inventory = await tx.sessionSeatInventory.findUnique({ where: { sessionId } });
  if (!inventory || inventory.capacity === capacity) return;
  await tx.sessionSeatInventory.update({
    where: { id: inventory.id },
    data: {
      capacity,
      availableSeats: calculateSessionSeatAvailability(capacity, inventory.heldCount, inventory.confirmedCount),
    },
  });
}

async function getOrCreateInventory(
  tx: TransactionClient,
  session: { id: string; maxEnrollment: number | null },
) {
  const existing = await tx.sessionSeatInventory.findUnique({ where: { sessionId: session.id } });
  if (existing) {
    if (existing.capacity !== session.maxEnrollment) {
      throw new SessionSeatUnavailableError("Session capacity changed. Please contact support");
    }
    return existing;
  }

  const confirmedCount = await tx.sessionEnrollment.count({
    where: { sessionId: session.id, paymentStatus: "SUCCESS" },
  });
  const availableSeats = session.maxEnrollment === null
    ? null
    : Math.max(0, session.maxEnrollment - confirmedCount);

  try {
    return await tx.sessionSeatInventory.create({
      data: {
        sessionId: session.id,
        capacity: session.maxEnrollment,
        availableSeats,
        confirmedCount,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const racedInventory = await tx.sessionSeatInventory.findUniqueOrThrow({
      where: { sessionId: session.id },
    });
    if (racedInventory.capacity !== session.maxEnrollment) {
      throw new SessionSeatUnavailableError("Session capacity changed. Please contact support");
    }
    return racedInventory;
  }
}

async function expireSessionSeatHolds(
  tx: TransactionClient,
  sessionId: string,
  now: Date,
) {
  const expired = await tx.sessionSeatHold.updateMany({
    where: { sessionId, status: "HELD", expiresAt: { lte: now } },
    data: { status: "EXPIRED", releasedAt: now },
  });
  if (expired.count === 0) return;

  const inventory = await tx.sessionSeatInventory.findUnique({ where: { sessionId } });
  if (inventory?.capacity !== null && inventory) {
    await tx.sessionSeatInventory.update({
      where: { id: inventory.id },
      data: {
        availableSeats: { increment: expired.count },
        heldCount: { decrement: expired.count },
      },
    });
  }
}

async function releaseInventorySeat(
  tx: TransactionClient,
  sessionId: string,
) {
  const inventory = await tx.sessionSeatInventory.findUnique({ where: { sessionId } });
  if (!inventory || inventory.capacity === null) return;
  await tx.sessionSeatInventory.update({
    where: { id: inventory.id },
    data: {
      availableSeats: { increment: 1 },
      heldCount: { decrement: 1 },
    },
  });
}

export async function releaseConfirmedSessionSeat(
  tx: TransactionClient,
  input: { checkoutId: string; sessionId?: string; now: Date },
) {
  const hold = await tx.sessionSeatHold.findFirst({
    where: {
      checkoutId: input.checkoutId,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    },
  });
  if (!hold || hold.status !== "CONFIRMED") return false;

  const released = await tx.sessionSeatHold.updateMany({
    where: { id: hold.id, status: "CONFIRMED" },
    data: { status: "RELEASED", releasedAt: input.now },
  });
  if (released.count !== 1) return false;

  const inventory = await tx.sessionSeatInventory.findUnique({ where: { sessionId: hold.sessionId } });
  if (inventory?.capacity !== null && inventory) {
    await tx.sessionSeatInventory.update({
      where: { id: inventory.id },
      data: { availableSeats: { increment: 1 }, confirmedCount: { decrement: 1 } },
    });
  }
  return true;
}

export async function acquireSessionSeatHold(
  tx: TransactionClient,
  input: {
    checkoutId: string;
    userId: string;
    session: { id: string; maxEnrollment: number | null };
    now: Date;
  },
) {
  await expireSessionSeatHolds(tx, input.session.id, input.now);
  const previousHold = await tx.sessionSeatHold.findUnique({
    where: { sessionId_userId: { sessionId: input.session.id, userId: input.userId } },
  });
  if (previousHold?.status === "HELD" || previousHold?.status === "CONFIRMED") {
    throw new SessionSeatUnavailableError(
      previousHold.status === "CONFIRMED"
        ? "You already have access to this guidance session"
        : "A guidance-session checkout is already in progress",
    );
  }

  const inventory = await getOrCreateInventory(tx, input.session);
  if (inventory.capacity !== null) {
    const claim = await tx.sessionSeatInventory.updateMany({
      where: { id: inventory.id, availableSeats: { gt: 0 } },
      data: {
        availableSeats: { decrement: 1 },
        heldCount: { increment: 1 },
      },
    });
    if (claim.count !== 1) throw new SessionSeatUnavailableError("Guidance session is full");
  }

  const expiresAt = getSeatHoldExpiresAt(input.now);
  if (previousHold) {
    return tx.sessionSeatHold.update({
      where: { id: previousHold.id },
      data: {
        checkoutId: input.checkoutId,
        status: "HELD",
        expiresAt,
        confirmedAt: null,
        releasedAt: null,
        requiresReviewAt: null,
      },
    });
  }

  return tx.sessionSeatHold.create({
    data: {
      checkoutId: input.checkoutId,
      sessionId: input.session.id,
      userId: input.userId,
      expiresAt,
    },
  });
}

export async function releaseSessionSeatHold(
  tx: TransactionClient,
  checkoutId: string,
  now: Date,
) {
  const holds = await tx.sessionSeatHold.findMany({ where: { checkoutId, status: "HELD" } });
  for (const hold of holds) {
    const released = await tx.sessionSeatHold.updateMany({
      where: { id: hold.id, status: "HELD" },
      data: { status: "RELEASED", releasedAt: now },
    });
    if (released.count === 1) await releaseInventorySeat(tx, hold.sessionId);
  }
}

async function getConfirmableSeatInventory(tx: TransactionClient, hold: SessionSeatHold) {
  const inventory = await tx.sessionSeatInventory.findUnique({ where: { sessionId: hold.sessionId } });
  if (!inventory) return null;
  // Expiry alone does not release an allocated seat. Released reservations must
  // claim current capacity again; unlimited sessions have no capacity conflict.
  const canConfirm = inventory.capacity === null
    || (hold.status === "HELD" ? inventory.heldCount > 0 : (inventory.availableSeats ?? 0) > 0);
  return canConfirm ? inventory : null;
}

export async function confirmSessionSeatHold(
  tx: TransactionClient,
  checkoutId: string,
  capturedAt: Date,
  sessionId?: string,
) {
  const hold = await tx.sessionSeatHold.findFirst({
    where: { checkoutId, ...(sessionId ? { sessionId } : {}) },
  });
  if (!hold) return "REQUIRES_REVIEW" as const;

  if (hold.status === "CONFIRMED") return "ALREADY_CONFIRMED" as const;
  const inventory = await getConfirmableSeatInventory(tx, hold);
  if (!inventory) return "REQUIRES_REVIEW" as const;
  const wasHeld = hold.status === "HELD";
  const confirmed = await tx.sessionSeatHold.updateMany({
    where: { id: hold.id, checkoutId, status: hold.status },
    data: { status: "CONFIRMED", confirmedAt: capturedAt, releasedAt: null, requiresReviewAt: null },
  });
  if (confirmed.count !== 1) {
    const current = await tx.sessionSeatHold.findFirst({ where: { id: hold.id, checkoutId } });
    if (current?.status === "CONFIRMED") return "ALREADY_CONFIRMED" as const;
    throw new Error(`Session hold ${hold.sessionId} changed during confirmation`);
  }
  if (inventory.capacity !== null) {
    const claimed = await tx.sessionSeatInventory.updateMany({
      where: {
        id: inventory.id,
        capacity: inventory.capacity,
        ...(wasHeld ? { heldCount: { gt: 0 } } : { availableSeats: { gt: 0 } }),
      },
      data: {
        ...(wasHeld ? { heldCount: { decrement: 1 } } : { availableSeats: { decrement: 1 } }),
        confirmedCount: { increment: 1 },
      },
    });
    // Roll back the entire fulfillment transaction if capacity was claimed by a
    // concurrent buyer. Never commit partial course access or overbook a session.
    if (claimed.count !== 1) throw new Error(`Session capacity ${hold.sessionId} changed during confirmation`);
  }
  return "CONFIRM" as const;
}

export async function confirmSessionSeatHolds(
  tx: TransactionClient,
  checkoutId: string,
  sessionIds: string[],
  capturedAt: Date,
) {
  const uniqueSessionIds = [...new Set(sessionIds)];
  const holds = await tx.sessionSeatHold.findMany({
    where: { checkoutId, sessionId: { in: uniqueSessionIds } },
  });
  const holdsBySession = new Map(holds.map((hold) => [hold.sessionId, hold]));

  for (const sessionId of uniqueSessionIds) {
    const hold = holdsBySession.get(sessionId);
    if (!hold || (hold.status !== "CONFIRMED" && !await getConfirmableSeatInventory(tx, hold))) {
      await releaseSessionSeatHold(tx, checkoutId, capturedAt);
      return sessionId;
    }
  }

  for (const sessionId of uniqueSessionIds) {
    const decision = await confirmSessionSeatHold(tx, checkoutId, capturedAt, sessionId);
    if (decision === "REQUIRES_REVIEW") {
      throw new Error(`Session hold ${sessionId} changed during confirmation`);
    }
  }
  return null;
}
