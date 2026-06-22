export type DashboardRecoveryAction = "logout" | "stay";

export function getDashboardRecoveryAction(input: {
  hasToken: boolean;
  status?: number;
}): DashboardRecoveryAction {
  if (!input.hasToken) return "logout";
  if (input.status === 401 || input.status === 403) return "logout";
  return "stay";
}
