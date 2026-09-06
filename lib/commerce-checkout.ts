export type CommerceCheckoutProductType =
  | "COURSE"
  | "MOCK_TEST"
  | "MOCK_BUNDLE"
  | "GUIDANCE_SESSION";

export type CommerceCheckoutType = "ONE_TIME" | "COURSE_RECURRING" | "RECURRING";

export type CheckoutIntentInput = {
  productType: CommerceCheckoutProductType;
  checkoutType: CommerceCheckoutType;
  productId: string;
  couponCode: string | null;
  studentPhone: string | null;
  idempotencyKey: string | null;
};

export class CommerceCheckoutInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommerceCheckoutInputError";
  }
}

const PRODUCT_TYPES = new Set<CommerceCheckoutProductType>([
  "COURSE",
  "MOCK_TEST",
  "MOCK_BUNDLE",
  "GUIDANCE_SESSION",
]);

function optionalText(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new CommerceCheckoutInputError(`${field} must be text`);
  }

  const text = value.trim();
  if (!text) return null;
  if (text.length > maxLength) {
    throw new CommerceCheckoutInputError(`${field} is too long`);
  }
  return text;
}

export function parseRupeesToPaise(value: unknown) {
  const text = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new CommerceCheckoutInputError("Amount must be a valid INR amount with up to two decimals");
  }

  const [rupees, paise = ""] = text.split(".");
  const amountPaise = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
    throw new CommerceCheckoutInputError("Amount must be at least ₹1");
  }

  return amountPaise;
}

export function parseCheckoutIntentInput(body: unknown): CheckoutIntentInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CommerceCheckoutInputError("Request body must be an object");
  }

  const input = body as Record<string, unknown>;
  const productType = input.productType;
  if (typeof productType !== "string" || !PRODUCT_TYPES.has(productType as CommerceCheckoutProductType)) {
    throw new CommerceCheckoutInputError("Invalid checkout product type");
  }

  const productId = optionalText(input.productId, "productId", 100);
  if (!productId) throw new CommerceCheckoutInputError("productId is required");

  const requestedCheckoutType = input.checkoutType ?? "ONE_TIME";
  if (
    requestedCheckoutType !== "ONE_TIME"
    && requestedCheckoutType !== "COURSE_RECURRING"
    && requestedCheckoutType !== "RECURRING"
  ) {
    throw new CommerceCheckoutInputError("Invalid checkout type");
  }

  if (requestedCheckoutType === "COURSE_RECURRING" && productType !== "COURSE") {
    throw new CommerceCheckoutInputError("Legacy course recurring checkout is only available for courses");
  }
  if (requestedCheckoutType === "RECURRING" && productType === "COURSE") {
    throw new CommerceCheckoutInputError("Courses must use the course recurring checkout during migration");
  }

  return {
    productType: productType as CommerceCheckoutProductType,
    checkoutType: requestedCheckoutType,
    productId,
    couponCode: optionalText(input.couponCode, "couponCode", 100),
    studentPhone: optionalText(input.studentPhone, "studentPhone", 32),
    idempotencyKey: optionalText(input.idempotencyKey, "idempotencyKey", 100),
  };
}
