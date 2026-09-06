import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess } from "@/lib/roleAuth";
import { CommerceBillingInputError, hasCommerceBillingInput, normalizeCommerceBillingInput } from "@/lib/commerce-billing";
import { createOrVersionCommerceBillingPlan } from "@/lib/commerce-billing-plan";

export async function GET(req: Request) {
  // Fetch all bundles ordered by display order
  try {
    await assertAdminApiAccess(req.url, req.method);
    const bundles = await prisma.mockBundle.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    const plans = await prisma.commerceBillingPlan.findMany({
      where: { productType: "MOCK_BUNDLE", productId: { in: bundles.map((bundle) => bundle.id) } },
      orderBy: { version: "desc" },
    });
    const plansByBundle = new Map<string, typeof plans>();
    for (const plan of plans) {
      const current = plansByBundle.get(plan.productId) ?? [];
      current.push(plan);
      plansByBundle.set(plan.productId, current);
    }
    return NextResponse.json({ bundles: bundles.map((bundle) => ({ ...bundle, billingPlans: plansByBundle.get(bundle.id) ?? [] })) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch mock bundles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Create new bundle
  try {
    await assertAdminApiAccess(req.url, req.method);
    const body = await req.json();
    const { title, description, mockIds, discountedPrice, status } = body;
    const billing = normalizeCommerceBillingInput(body);

    if (!title || !mockIds?.length) {
      return NextResponse.json({ error: "Title and mockIds are required" }, { status: 400 });
    }

    // Fetch mocks to calculate basePrice
    const mocks = await prisma.mockTest.findMany({
      where: { id: { in: mockIds } },
    });

    if (!mocks.length) {
      return NextResponse.json({ error: "No valid mocks found" }, { status: 400 });
    }

    const basePrice = mocks.reduce((sum, mock) => sum + mock.price, 0);

    const bundle = await prisma.$transaction(async (tx) => {
      const created = await tx.mockBundle.create({
        data: {
        title,
        description,
        mockIds,
        basePrice,
        discountedPrice,
        status: status ?? "DRAFT",
          billingMode: billing.billingMode,
          subscriptionEnabled: billing.subscriptionEnabled,
        },
      });
      await createOrVersionCommerceBillingPlan(tx, {
        productType: "MOCK_BUNDLE",
        productId: created.id,
        billing,
      });
      return created;
    });

    return NextResponse.json({ bundle });
  } catch (err) {
    if (err instanceof CommerceBillingInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create bundle" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Update bundle
  try {
    await assertAdminApiAccess(req.url, req.method);
    const body = await req.json();
    const { id, title, description, mockIds, discountedPrice, status } = body;
    const billing = hasCommerceBillingInput(body) ? normalizeCommerceBillingInput(body) : null;

    if (!id) return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (mockIds?.length) {
      const mocks = await prisma.mockTest.findMany({ where: { id: { in: mockIds } } });
      const basePrice = mocks.reduce((sum, mock) => sum + mock.price, 0);
      updateData.mockIds = mockIds;
      updateData.basePrice = basePrice;
    }
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (status) updateData.status = status;
    if (billing) {
      updateData.billingMode = billing.billingMode;
      updateData.subscriptionEnabled = billing.subscriptionEnabled;
    }

    const updatedBundle = await prisma.$transaction(async (tx) => {
      const updated = await tx.mockBundle.update({
        where: { id },
        data: updateData,
      });
      await createOrVersionCommerceBillingPlan(tx, {
        productType: "MOCK_BUNDLE",
        productId: updated.id,
        billing: billing ?? { billingMode: "ONE_TIME", subscriptionEnabled: false, amountPaise: null, interval: "monthly", totalCount: 120 },
      });
      return updated;
    });

    return NextResponse.json({ bundle: updatedBundle });
  } catch (err) {
    if (err instanceof CommerceBillingInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update bundle" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Delete bundle
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });

    await prisma.mockBundle.delete({ where: { id } });

    return NextResponse.json({ message: "Bundle deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting mock bundle:", error);
    
    // Check if it's a role-based access error
    if (error instanceof Response) {
      const status = error.status;
      if (status === 403) {
        return NextResponse.json({ 
          error: "You don't have permission to delete mock bundles. Only admins can delete mock bundles." 
        }, { status: 403 });
      }
      if (status === 401) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to delete bundle"
    }, { status: 500 });
  }
}
