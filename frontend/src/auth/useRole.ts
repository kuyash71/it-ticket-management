import { useAuth } from "./AuthProvider";
import type { UserRole } from "./AuthProvider";

export const useRole = () => {
  const { roles } = useAuth();

  const hasRole = (role: UserRole) => roles.includes(role);
  const isCustomer = () => !hasRole("AGENT") && !hasRole("MANAGER");
  const isAgent = () => hasRole("AGENT");
  const isManager = () => hasRole("MANAGER");

  return { roles, hasRole, isCustomer, isAgent, isManager };
};
