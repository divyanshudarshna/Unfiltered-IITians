const { spawnSync } = require("node:child_process");
const path = require("node:path");
const tests = [
  "razorpay-webhook.test.ts", "razorpay-events.test.ts", "webhook-processing.test.ts",
  "checkout-status.test.ts", "commerce-checkout.test.ts", "course-billing.test.ts", "commerce-billing.test.ts",
  "commerce-entitlement.test.ts", "purchase-access-window.test.ts", "course-checkout-options.test.ts",
  "course-checkout-reconciliation.test.ts", "session-seat-release.test.ts", "session-seat-hold.test.ts",
  "coupon-reservation-redemption.test.ts", "payment-recovery.test.ts", "client-checkout-confirmation.test.ts",
  "razorpay-webhook-route.test.cjs", "razorpay-webhook-duplicates.test.cjs", "billing-reconciliation.test.cjs",
  "checkout-recovery-routes.test.cjs", "billing-cancellation-cron.test.cjs", "commerce-billing-history-routes.test.cjs",
  "legacy-payment-integrity.test.cjs", "recurring-payment-flow.test.cjs",
];
const root = path.resolve(__dirname, "..");
for (const test of tests) {
  const args = [...(test.endsWith(".ts") ? ["--require", "tsx/cjs"] : []), path.join(__dirname, test)];
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) console.error(result.error);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`All ${tests.length} payment regression suites passed. Provider and database mutations are mocked.`);
