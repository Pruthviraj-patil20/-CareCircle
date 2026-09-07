import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveFamilyId } from "@/actions/family";
import { getEmergencyCenterData } from "@/actions/emergency";
import { QuickServiceDialer } from "@/components/emergency/QuickServiceDialer";
import { FamilyMemberEmergencyGrid } from "@/components/emergency/FamilyMemberEmergencyGrid";
import { EmergencyContactCard } from "@/components/emergency/EmergencyContactCard";
import { EmergencyInstructionsList } from "@/components/emergency/EmergencyInstructionsList";
import { CreateContactDialog } from "@/components/emergency/CreateContactDialog";
import {
  ShieldAlert,
  Stethoscope,
  Shield,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

export default async function EmergencyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();

  if (!familyId) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-rose-600">No Family Selected</h2>
        <p className="text-muted-foreground text-sm">
          Please select or create a family in the sidebar to access the emergency response center.
        </p>
      </div>
    );
  }

  const data = await getEmergencyCenterData();

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-rose-600" />
              Emergency Center
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
              High Priority Hub
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Instant 1-tap mobile calling for hotlines, family doctors, insurance contacts, and critical medical protocols.
          </p>
        </div>

        <CreateContactDialog />
      </div>

      {/* Section 1: 1-Tap Speed Dial */}
      <QuickServiceDialer customServices={data.emergencyServices} />

      {/* Section 2: Family Members Immediate Contact */}
      <FamilyMemberEmergencyGrid members={data.familyMembers} />

      {/* Section 3: Medical & Insurance Contacts */}
      <div className="space-y-6">
        {/* Family Doctor & Clinics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              Family Doctor & Primary Healthcare
            </h3>
            <CreateContactDialog defaultType="FAMILY_DOCTOR" />
          </div>

          {data.familyDoctors.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed text-center text-xs text-muted-foreground bg-muted/10">
              No primary physician or pediatrician listed. Add your family doctor for quick emergency reference.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.familyDoctors.map((doc) => (
                <EmergencyContactCard
                  key={doc.id}
                  contact={doc}
                  isFamilyAdmin={data.isFamilyAdmin}
                />
              ))}
            </div>
          )}
        </div>

        {/* Insurance & Coverage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Health & Home Insurance Helplines
            </h3>
            <CreateContactDialog defaultType="INSURANCE" />
          </div>

          {data.insuranceContacts.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed text-center text-xs text-muted-foreground bg-muted/10">
              No insurance providers listed. Add health, auto, or home insurance claim helplines.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.insuranceContacts.map((ins) => (
                <EmergencyContactCard
                  key={ins.id}
                  contact={ins}
                  isFamilyAdmin={data.isFamilyAdmin}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trusted Personal Contacts / Neighbors */}
        {data.personalContacts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-500" />
                Trusted Neighbors & Alternate Contacts
              </h3>
              <CreateContactDialog defaultType="PERSONAL" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.personalContacts.map((contact) => (
                <EmergencyContactCard
                  key={contact.id}
                  contact={contact}
                  isFamilyAdmin={data.isFamilyAdmin}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Emergency Protocols & Instructions */}
      <EmergencyInstructionsList
        instructions={data.instructions}
        isFamilyAdmin={data.isFamilyAdmin}
      />
    </div>
  );
}
