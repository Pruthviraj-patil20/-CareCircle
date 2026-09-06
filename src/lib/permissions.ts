import { FamilyRole } from "@prisma/client";
import { RoleHierarchy } from "@/types/family";

export function canManageFamily(role: FamilyRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canInviteMembers(role: FamilyRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canRemoveMember(currentUserRole: FamilyRole, targetUserRole: FamilyRole): boolean {
  if (currentUserRole === "OWNER") return true;
  if (currentUserRole === "ADMIN") {
    // Admin can only remove Members and Caregivers, not Owners or other Admins
    return RoleHierarchy[targetUserRole] > RoleHierarchy.ADMIN;
  }
  return false;
}

export function canChangeRole(currentUserRole: FamilyRole, targetUserRole: FamilyRole, newRole: FamilyRole): boolean {
  if (currentUserRole === "OWNER") {
    // Owner cannot change someone to Owner (requires transfer logic if needed)
    return newRole !== "OWNER";
  }
  if (currentUserRole === "ADMIN") {
    // Admin can only change roles of Members and Caregivers
    const targetIsLower = RoleHierarchy[targetUserRole] > RoleHierarchy.ADMIN;
    // Admin cannot promote someone to Owner or Admin
    const newRoleIsLower = RoleHierarchy[newRole] > RoleHierarchy.ADMIN;
    
    return targetIsLower && newRoleIsLower;
  }
  return false;
}
