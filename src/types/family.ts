import { FamilyRole, Family, FamilyMember, User } from "@prisma/client";

export type FamilyMemberWithUser = FamilyMember & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

export type FamilyWithMembers = Family & {
  members: FamilyMemberWithUser[];
};

// Hierarchy of roles. Lower number = higher privileges
export const RoleHierarchy: Record<FamilyRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MEMBER: 2,
  CAREGIVER: 3,
};
