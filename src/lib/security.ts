import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { AuditLogActionType } from "@/types/audit";
import { FamilyRole } from "@prisma/client";

export class SecurityError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 403) {
    super(message);
    this.name = "SecurityError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface SecurityContext {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: string;
  };
  membership?: {
    id: string;
    familyId: string;
    userId: string;
    role: FamilyRole;
  } | null;
  family?: {
    id: string;
    name: string;
  } | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthorizeActionOptions {
  familyId?: string | null;
  requiredRoles?: FamilyRole[];
  resourceOwnerId?: string | null;
  allowOwnerOrAdminOverride?: boolean;
  permissionCheck?: (ctx: SecurityContext) => boolean | Promise<boolean>;
  actionName: string;
}

/**
 * Extracts request metadata (IP address and User-Agent) securely from Next.js headers.
 */
export async function getClientMetadata(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headerList.get("x-real-ip") || null;
    const userAgent = headerList.get("user-agent") || null;
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

/**
 * Server-Side Authorization Pipeline:
 * 1. Authentication
 * 2. Session validation
 * 3. Family membership
 * 4. RBAC (Role-Based Access Control)
 * 5. Resource ownership
 * 6. Permission check
 * 7. Action context delivery
 */
export async function authorizeAction(options: AuthorizeActionOptions): Promise<SecurityContext> {
  const { ipAddress, userAgent } = await getClientMetadata();

  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    throw new SecurityError("UNAUTHENTICATED", "You must be signed in to perform this action", 401);
  }

  // 2. Session validation (active DB user check)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, image: true, role: true },
  });

  if (!dbUser || !dbUser.email) {
    throw new SecurityError("INVALID_SESSION", "User account not found or session expired", 401);
  }

  const context: SecurityContext = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role,
    },
    ipAddress,
    userAgent,
  };

  // If action is family-scoped, validate family membership
  if (options.familyId) {
    // 3. Family membership
    const membership = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: options.familyId,
          userId: dbUser.id,
        },
      },
      include: {
        family: {
          select: { id: true, name: true },
        },
      },
    });

    if (!membership) {
      throw new SecurityError("FORBIDDEN_FAMILY_ACCESS", "You are not a member of this family circle", 403);
    }

    context.membership = {
      id: membership.id,
      familyId: membership.familyId,
      userId: membership.userId,
      role: membership.role,
    };
    context.family = membership.family;

    // 4. RBAC & 5. Resource ownership
    const isOwnerOrAdmin = membership.role === "OWNER" || membership.role === "ADMIN";
    const isResourceOwner = options.resourceOwnerId ? options.resourceOwnerId === dbUser.id : false;

    if (options.requiredRoles && options.requiredRoles.length > 0) {
      const hasRequiredRole = options.requiredRoles.includes(membership.role);
      const isOverrideAllowed = (options.allowOwnerOrAdminOverride && isOwnerOrAdmin) || isResourceOwner;

      if (!hasRequiredRole && !isOverrideAllowed) {
        throw new SecurityError(
          "FORBIDDEN_INSUFFICIENT_ROLE",
          `Action requires role ${options.requiredRoles.join(" or ")}, current role is ${membership.role}`,
          403
        );
      }
    } else if (options.resourceOwnerId) {
      // Resource-specific action (e.g. edit/delete)
      const canAccess = isResourceOwner || (options.allowOwnerOrAdminOverride !== false && isOwnerOrAdmin);
      if (!canAccess) {
        throw new SecurityError(
          "FORBIDDEN_NOT_RESOURCE_OWNER",
          "You are not authorized to modify or delete this resource",
          403
        );
      }
    }
  }

  // 6. Fine-grained Permission Check
  if (options.permissionCheck) {
    const isPermitted = await options.permissionCheck(context);
    if (!isPermitted) {
      throw new SecurityError("FORBIDDEN_PERMISSION_DENIED", "You do not have permission to perform this action", 403);
    }
  }

  // 7. Return safe execution context
  return context;
}

/**
 * Asynchronously and non-blockingly writes an entry to the AuditLog.
 * Never throws an uncaught error to prevent disrupting user workflows.
 */
export async function logAuditEvent(params: {
  action: AuditLogActionType;
  entityType: string;
  familyId?: string | null;
  userId?: string | null;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    let { ipAddress, userAgent } = params;
    if (!ipAddress || !userAgent) {
      const clientMeta = await getClientMetadata();
      ipAddress = ipAddress || clientMeta.ipAddress;
      userAgent = userAgent || clientMeta.userAgent;
    }

    await (prisma as any).auditLog.create({
      data: {
        familyId: params.familyId || null,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: params.details || undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
      },
    });
  } catch (error) {
    console.error("[AuditLog Error] Failed to write audit event:", error);
  }
}
