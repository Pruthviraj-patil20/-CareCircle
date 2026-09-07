export type EmergencyContactTypeEnum = 
  | "FAMILY_DOCTOR" 
  | "INSURANCE" 
  | "SERVICE" 
  | "PERSONAL" 
  | "OTHER";

export type EmergencyContactItem = {
  id: string;
  familyId: string;
  name: string;
  type: EmergencyContactTypeEnum;
  relationship: string | null;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  sensitiveInfo: string | null;
  isEmergencyService: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EmergencyInstructionItem = {
  id: string;
  familyId: string;
  title: string;
  category: "MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL";
  content: string;
  isSensitive: boolean;
  priority: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FamilyMemberEmergencyContact = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  phone?: string | null;
};

export type EmergencyCenterData = {
  familyMembers: FamilyMemberEmergencyContact[];
  emergencyServices: EmergencyContactItem[];
  familyDoctors: EmergencyContactItem[];
  insuranceContacts: EmergencyContactItem[];
  personalContacts: EmergencyContactItem[];
  instructions: EmergencyInstructionItem[];
  isFamilyAdmin: boolean;
};
