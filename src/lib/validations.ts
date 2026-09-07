import * as z from "zod";

// --- Authentication Schemas ---

export const LoginSchema = z.object({
  email: z.string().trim().email({
    message: "Valid email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const RegisterSchema = z.object({
  email: z.string().trim().email({
    message: "Valid email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().trim().min(1, {
    message: "Name is required",
  }).max(100, "Name cannot exceed 100 characters"),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  confirmPassword: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email({
    message: "Valid email is required",
  }),
});

// --- Family Management Schemas ---

export const CreateFamilySchema = z.object({
  name: z.string().trim().min(1, "Family circle name is required").max(100, "Name too long"),
  description: z.string().trim().max(500, "Description too long").optional().nullable(),
});

export const UpdateFamilySchema = z.object({
  familyId: z.string().min(1, "Family ID is required"),
  name: z.string().trim().min(1, "Family circle name is required").max(100, "Name too long"),
  description: z.string().trim().max(500, "Description too long").optional().nullable(),
});

export const InviteMemberSchema = z.object({
  familyId: z.string().min(1, "Family ID is required"),
  email: z.string().trim().email("Please provide a valid email address"),
  role: z.enum(["ADMIN", "MEMBER", "CAREGIVER"], {
    errorMap: () => ({ message: "Cannot invite member as OWNER. Valid roles are ADMIN, MEMBER, or CAREGIVER." }),
  }),
});

export const ChangeRoleSchema = z.object({
  familyId: z.string().min(1, "Family ID is required"),
  targetUserId: z.string().min(1, "Target user ID is required"),
  newRole: z.enum(["ADMIN", "MEMBER", "CAREGIVER"], {
    errorMap: () => ({ message: "Role cannot be changed to OWNER directly." }),
  }),
});

export const RemoveMemberSchema = z.object({
  familyId: z.string().min(1, "Family ID is required"),
  targetUserId: z.string().min(1, "Target user ID is required"),
});

// --- Task Schemas ---

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().trim().max(5000, "Description too long").optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().trim().max(5000, "Description too long").optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

// --- Calendar Schemas ---

const BaseEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().trim().max(5000, "Description too long").optional().nullable(),
  type: z.enum(["FAMILY", "APPOINTMENT", "BIRTHDAY", "TRAVEL", "SCHOOL", "RENEWAL", "OTHER"]).default("OTHER"),
  isAllDay: z.boolean().default(false),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().trim().max(300, "Location too long").optional().nullable(),
  participantIds: z.array(z.string()).optional(),
});

export const CreateEventSchema = BaseEventSchema.refine(data => new Date(data.endTime) >= new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const UpdateEventSchema = BaseEventSchema.partial();

// --- Document Schemas ---

export const DocumentCategoryEnum = z.enum([
  "INSURANCE",
  "PROPERTY",
  "EDUCATION",
  "VEHICLE",
  "FINANCIAL",
  "PERSONAL",
]);

export const DocumentPermissionTypeEnum = z.enum(["VIEW", "DOWNLOAD", "EDIT", "DELETE"]);

export const UploadDocumentMetadataSchema = z.object({
  title: z.string().trim().min(1, "Document title is required").max(200, "Title too long"),
  description: z.string().trim().max(2000, "Description too long").optional().nullable(),
  category: DocumentCategoryEnum.default("PERSONAL"),
  expiryDate: z.string().optional().nullable(),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().trim().min(1, "Document title is required").max(200, "Title too long"),
  description: z.string().trim().max(2000, "Description too long").optional().nullable(),
  category: DocumentCategoryEnum,
  expiryDate: z.string().optional().nullable(),
});

export const UpdateDocumentPermissionsSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  userPermissions: z.array(
    z.object({
      userId: z.string().min(1, "User ID is required"),
      permissions: z.array(DocumentPermissionTypeEnum),
    })
  ),
});

// --- Announcement Schemas ---

export const AnnouncementPriorityEnum = z.enum(["NORMAL", "IMPORTANT", "URGENT"]);

export const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().trim().min(1, "Content is required").max(10000, "Content too long"),
  priority: AnnouncementPriorityEnum.default("NORMAL"),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().optional().nullable(),
  attachments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
    })
  ).optional().nullable(),
});

export const UpdateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().trim().min(1, "Content is required").max(10000, "Content too long"),
  priority: AnnouncementPriorityEnum,
  isPinned: z.boolean().default(false),
  expiresAt: z.string().optional().nullable(),
});

export const AnnouncementCommentSchema = z.object({
  announcementId: z.string().min(1, "Announcement ID is required"),
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000, "Comment too long"),
});

// --- Emergency Schemas ---

export const EmergencyContactTypeEnum = z.enum([
  "FAMILY_DOCTOR",
  "INSURANCE",
  "SERVICE",
  "PERSONAL",
  "OTHER",
]);

export const CreateEmergencyContactSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required").max(100, "Name too long"),
  type: EmergencyContactTypeEnum.default("PERSONAL"),
  relationship: z.string().trim().max(100, "Relationship too long").optional().nullable(),
  phone: z.string().trim().min(3, "Phone number is required").max(30, "Phone number too long"),
  alternatePhone: z.string().trim().max(30, "Alternate phone too long").optional().nullable(),
  email: z.string().trim().email("Invalid email address").optional().nullable().or(z.literal("")),
  address: z.string().trim().max(300, "Address too long").optional().nullable(),
  notes: z.string().trim().max(2000, "Notes too long").optional().nullable(),
  sensitiveInfo: z.string().trim().max(5000, "Sensitive info too long").optional().nullable(),
  isEmergencyService: z.boolean().default(false),
});

export const UpdateEmergencyContactSchema = CreateEmergencyContactSchema;

export const EmergencyInstructionCategoryEnum = z.enum([
  "MEDICAL",
  "HOME_SAFETY",
  "EVACUATION",
  "GENERAL",
]);

export const CreateEmergencyInstructionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  category: EmergencyInstructionCategoryEnum.default("GENERAL"),
  content: z.string().trim().min(1, "Instructions content is required").max(10000, "Content too long"),
  isSensitive: z.boolean().default(false),
  priority: z.number().int().min(0).max(100).default(0),
});

export const UpdateEmergencyInstructionSchema = CreateEmergencyInstructionSchema;

// --- Escalation Schemas ---

export const AddEscalationRuleSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  afterMinutes: z.number().int().min(1, "Must be at least 1 minute").max(43200, "Exceeds 30 days limit"),
  notifyUserId: z.string().min(1, "Recipient user ID is required"),
  channel: z.enum(["EMAIL", "IN_APP", "BOTH"]).default("BOTH"),
});
