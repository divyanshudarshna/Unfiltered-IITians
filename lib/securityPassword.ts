export type SecurityPasswordResult =
  | { allowed: true }
  | { allowed: false; status: 400 | 403 | 500; error: string }

export function verifySecurityPassword(
  configuredPassword: string | undefined,
  submittedPassword: unknown,
): SecurityPasswordResult {
  if (!configuredPassword) {
    return { allowed: false, status: 500, error: "Security password is not configured" }
  }

  if (typeof submittedPassword !== "string" || !submittedPassword.trim()) {
    return { allowed: false, status: 400, error: "Security password is required" }
  }

  if (submittedPassword !== configuredPassword) {
    return { allowed: false, status: 403, error: "Invalid security password" }
  }

  return { allowed: true }
}
