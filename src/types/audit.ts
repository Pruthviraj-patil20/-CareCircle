export type AuditLogActionType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_LOGOUT"
  | "AUTH_PASSWORD_RESET_REQUESTED"
  | "AUTH_PASSWORD_RESET_COMPLETED"
  | "FAMILY_CREATED"
  | "FAMILY_UPDATED"
  | "FAMILY_INVITATION_SENT"
  | "FAMILY_INVITATION_ACCEPTED"
  | "MEMBER_REMOVED"
  | "ROLE_CHANGED"
  | "PERMISSION_CHANGED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_DELETED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMPLETED"
  | "TASK_DELETED"
  | "TASK_ESCALATION_CREATED"
  | "TASK_ESCALATION_DELETED"
  | "TASK_ESCALATED"
  | "ANNOUNCEMENT_CREATED"
  | "ANNOUNCEMENT_UPDATED"
  | "ANNOUNCEMENT_DELETED"
  | "EMERGENCY_CONTACT_CREATED"
  | "EMERGENCY_CONTACT_UPDATED"
  | "EMERGENCY_CONTACT_DELETED"
  | "EMERGENCY_INSTRUCTION_CREATED"
  | "EMERGENCY_INSTRUCTION_UPDATED"
  | "EMERGENCY_INSTRUCTION_DELETED";

export interface AuditLogItem {
  id: string;
  familyId?: string | null;
  userId?: string | null;
  action: AuditLogActionType;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  family?: {
    id: string;
    name: string;
  } | null;
}

export interface AuditLogFilters {
  actionCategory?: "ALL" | "AUTH" | "FAMILY" | "DOCUMENT" | "TASK" | "SECURITY" | "EMERGENCY";
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
