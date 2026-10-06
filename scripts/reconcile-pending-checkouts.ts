import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  // Import only after loading server credentials; dry-run is the default.
  const { prisma } = await import("../lib/prisma");
  const { reconcileCheckout } = await import("../lib/billing-reconciliation");
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const checkoutId = args.find((arg) => arg.startsWith("--checkout="))?.slice("--checkout=".length);
  let failed = 0;
  try {
    const checkouts = await prisma.commerceCheckout.findMany({
      where: checkoutId ? { id: checkoutId } : { status: { in: ["CREATED", "PROVIDER_CREATED", "PENDING"] } },
      orderBy: { updatedAt: "asc" }, take: 100,
    });
    for (const checkout of checkouts) {
      try { console.log(JSON.stringify(await reconcileCheckout(checkout, { dryRun: !apply }))); }
      catch { failed++; console.error(JSON.stringify({ checkoutId: checkout.id, error: "Reconciliation failed; verify gateway credentials, payment status and billing period before retrying" })); }
    }
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", checked: checkouts.length, failed }));
    if (failed) process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
