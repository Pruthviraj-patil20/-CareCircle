export type DocumentCategoryType = 
  | "INSURANCE" 
  | "PROPERTY" 
  | "EDUCATION" 
  | "VEHICLE" 
  | "FINANCIAL" 
  | "PERSONAL";

export type DocumentPermissionType = 
  | "VIEW" 
  | "DOWNLOAD" 
  | "EDIT" 
  | "DELETE";

export type DocumentExpiryStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "NO_EXPIRY";

// Standalone type to avoid IDE caching issues with newly generated Prisma models
export type DocumentItem = {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  category: DocumentCategoryType;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiryDate: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentPermissionItem = {
  id: string;
  documentId: string;
  userId: string;
  permission: DocumentPermissionType;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export type DocumentWithDetails = DocumentItem & {
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  permissions: DocumentPermissionItem[];
  userPermissions?: {
    canView: boolean;
    canDownload: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
};

export type DocumentFilterOptions = {
  search?: string;
  category?: DocumentCategoryType | "ALL";
  expiryStatus?: "ALL" | "EXPIRING_SOON" | "EXPIRED" | "ACTIVE";
  sortBy?: "createdAt" | "title" | "fileSize" | "expiryDate";
  sortOrder?: "asc" | "desc";
};
