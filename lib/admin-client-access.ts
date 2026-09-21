import type { PermissionKey } from "./roleConfig";

export type ClientRoleAccess = {
  role: string;
  permissions: readonly PermissionKey[];
  readOnly: boolean;
  canDelete: boolean;
};

export function canPerformAdminAction(
  access: ClientRoleAccess | null,
  permission: PermissionKey,
  method: string,
) {
  if (!access) return false;
  if (access.role === "ADMIN") return true;
  if (!access.permissions.includes(permission)) return false;
  if (method.toUpperCase() === "DELETE" && !access.canDelete) return false;
  return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) || !access.readOnly;
}

export async function getApiErrorMessage(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Use a stable fallback for non-JSON error responses.
  }
  return fallback;
}
