import { Prisma } from "@prisma/client";
import {
  getSeatHoldCaptureDecision,
  getSeatHoldExpiresAt,
  type SessionSeatHoldStatus,
} from "@/lib/session-seat-hold";

type TransactionClient = Prisma.TransactionClient;

export class SessionSeatUnavailableError extends Error {}

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
  input: { checkoutId: string; now: Date },
) {
  const hold = await tx.sessionSeatHold.findUnique({ where: { checkoutId: input.checkoutId } });
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
  const hold = await tx.sessionSeatHold.findUnique({ where: { checkoutId } });
  if (!hold || hold.status !== "HELD") return;
  await tx.sessionSeatHold.update({
    where: { id: hold.id },
    data: { status: "RELEASED", releasedAt: now },
  });
  await releaseInventorySeat(tx, hold.sessionId);
}

export async function confirmSessionSeatHold(
  tx: TransactionClient,
  checkoutId: string,
  capturedAt: Date,
) {
  const hold = await tx.sessionSeatHold.findUnique({ where: { checkoutId } });
  if (!hold) return "REQUIRES_REVIEW" as const;

  const decision = getSeatHoldCaptureDecision({
    status: hold.status as SessionSeatHoldStatus,
    expiresAt: hold.expiresAt,
    capturedAt,
  });
  if (decision === "ALREADY_CONFIRMED") return decision;

  if (decision === "CONFIRM") {
    const confirmed = await tx.sessionSeatHold.updateMany({
      where: { id: hold.id, status: "HELD", expiresAt: { gt: capturedAt } },
      data: { status: "CONFIRMED", confirmedAt: capturedAt },
    });
    if (confirmed.count === 1) {
      const inventory = await tx.sessionSeatInventory.findUnique({ where: { sessionId: hold.sessionId } });
      if (inventory?.capacity !== null && inventory) {
        await tx.sessionSeatInventory.update({
          where: { id: inventory.id },
          data: {
            heldCount: { decrement: 1 },
            confirmedCount: { increment: 1 },
          },
        });
      }
      return "CONFIRM" as const;
    }
  }

  const staleHold = await tx.sessionSeatHold.findUnique({ where: { id: hold.id } });
  if (staleHold?.status === "CONFIRMED") return "ALREADY_CONFIRMED" as const;
  if (staleHold?.status === "HELD") {
    await tx.sessionSeatHold.update({
      where: { id: staleHold.id },
      data: { status: "REQUIRES_REVIEW", requiresReviewAt: capturedAt },
    });
    await releaseInventorySeat(tx, staleHold.sessionId);
  }
  return "REQUIRES_REVIEW" as const;
}
