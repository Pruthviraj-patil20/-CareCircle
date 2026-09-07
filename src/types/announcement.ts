export type AnnouncementPriorityType = "NORMAL" | "IMPORTANT" | "URGENT";

export type AttachmentItem = {
  name: string;
  url: string;
  size?: number;
  type?: string;
};

export type AnnouncementCommentItem = {
  id: string;
  announcementId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export type AnnouncementReadItem = {
  id: string;
  announcementId: string;
  userId: string;
  readAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export type AnnouncementItem = {
  id: string;
  familyId: string;
  title: string;
  content: string;
  priority: AnnouncementPriorityType;
  isPinned: boolean;
  expiresAt: Date | null;
  attachments: AttachmentItem[] | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AnnouncementWithDetails = AnnouncementItem & {
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  comments: AnnouncementCommentItem[];
  reads: AnnouncementReadItem[];
  isReadByCurrentUser: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type AnnouncementFilterOptions = {
  search?: string;
  filter?: "all" | "active" | "pinned" | "expired";
  priority?: AnnouncementPriorityType | "ALL";
};
