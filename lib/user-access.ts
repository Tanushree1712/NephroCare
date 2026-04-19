type UserLike = {
  role?: string | null;
  patientId?: number | null;
  centerId?: number | null;
} | null | undefined;

export function isPatientPortalUser(user: UserLike) {
  return Boolean(user?.patientId || user?.role === "PATIENT");
}

export function getCenterScopeId(user: UserLike) {
  if (!user || isPatientPortalUser(user)) {
    return null;
  }

  return typeof user.centerId === "number" && user.centerId > 0
    ? user.centerId
    : null;
}

export function getUserPortalKind(
  user: UserLike
): "guest" | "patient" | "center" | "operations" {
  if (!user) {
    return "guest";
  }

  if (isPatientPortalUser(user)) {
    return "patient";
  }

  return getCenterScopeId(user) ? "center" : "operations";
}
