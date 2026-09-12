export type WebhookProcessingDecision = "PROCESSED" | "RETRY" | "ACKNOWLEDGE_REVIEW";

const RETRYABLE_PREFIXES = [
  "No V2 checkout found",
  "No V2 recurring subscription found",
  "No V2 payment found for refund",
];

export function classifyWebhookProcessingError(error: string | null): WebhookProcessingDecision {
  if (!error) return "PROCESSED";
  return RETRYABLE_PREFIXES.some((prefix) => error.startsWith(prefix))
    ? "RETRY"
    : "ACKNOWLEDGE_REVIEW";
}
