export interface ScoreBreakdown {
  sortingUnnecessary: number; // 1 to 5
  clearAisles: number;         // 1 to 5
  storageLabels: number;       // 1 to 5
  binDisposal: number;         // 1 to 5
  safetyHazards: number;       // 1 to 5
}

export interface AdminMessage {
  id: string;
  senderName: string;
  senderPin: string;
  message: string;
  zone: string;
  createdAt?: any;
}

export type ZoneGroup = "General" | "SMS";

export interface ZoneOption {
  label: string;
  zoneGroup: ZoneGroup;
  value: string;
  hod: string;
}

export interface Audit {
  id: string;
  auditorName: string;
  auditorEmail: string;
  zone: string;
  zoneGroup: ZoneGroup;
  date: string;
  checklistImg: string; // Base64 Data URL
  siteImg: string;      // Base64 Data URL
  scores: ScoreBreakdown;
  totalScore: number;     // 5 to 25
  maxScore: number;       // always 25
  compliancePercentage: number; // calculated status percentage (0 - 100)
  feedback?: string;
  createdAt?: any;        // Firestore ServerTimestamp or ISO string
}

export const STARSTEEL_ZONES: ZoneOption[] = [
  // General Departments (C5 to C8, C1 to C4, Roughing, Mech Dev, Mech Maint, etc.)
  {
    label: "C5 TO C8 (ZONE -1)",
    zoneGroup: "General",
    value: "C5 TO C8 - ZONE -1",
    hod: "General Operations HOD",
  },
  {
    label: "C1 TO C4 (ZONE -2)",
    zoneGroup: "General",
    value: "C1 TO C4 - ZONE -2",
    hod: "General Operations HOD",
  },
  {
    label: "ROUCHING (ZONE -3)",
    zoneGroup: "General",
    value: "ROUCHING - ZONE -3",
    hod: "Roughing HOD",
  },
  {
    label: "MECHANICAL DEVELOPMENT (ZONE -4)",
    zoneGroup: "General",
    value: "MECHANICAL DEVELOPMENT - ZONE -4",
    hod: "Mechanical Development HOD",
  },
  {
    label: "MECHANICAL MAINTENANCE (ZONE -5)",
    zoneGroup: "General",
    value: "MECHANICAL MAINTENANCE - ZONE -5",
    hod: "Mechanical Maintenance HOD",
  },
  {
    label: "HOT CHARGING (ZONE -6)",
    zoneGroup: "General",
    value: "HOT CHARGING - ZONE -6",
    hod: "Hot Charging HOD",
  },
  {
    label: "ECR ROOM (ZONE -7)",
    zoneGroup: "General",
    value: "ECR ROOM ZONE -7",
    hod: "ECR Room HOD",
  },
  {
    label: "CHAIN TRANSFER (ZONE -8)",
    zoneGroup: "General",
    value: "CHAIN TRANSFER ZONE -8",
    hod: "Chain Transfer HOD",
  },
  {
    label: "RHF & RFO (ZONE -9)",
    zoneGroup: "General",
    value: "RHF & RFO -9",
    hod: "RHF & RFO HOD",
  },
  {
    label: "ROLL SHOP (ZONE -10)",
    zoneGroup: "General",
    value: "ROLL SHOP -ZONE -10",
    hod: "Roll Shop HOD",
  },
  {
    label: "WORKSHOP (ZONE -10)",
    zoneGroup: "General",
    value: "WORKSHOP -ZONE -10",
    hod: "Workshop HOD",
  },

  // SMS Department Branches (Each branch has their own HOD)
  {
    label: "SMS FURNACE-1 (ZONE -1)",
    zoneGroup: "SMS",
    value: "FURNACE-1 -ZONE -1",
    hod: "Furnace-1 HOD",
  },
  {
    label: "SMS FURNACE-2 (ZONE -2)",
    zoneGroup: "SMS",
    value: "FURNACE-2 -ZONE 2",
    hod: "Furnace-2 HOD",
  },
  {
    label: "SMS CCM (ZONE -3)",
    zoneGroup: "SMS",
    value: "CCM -ZONE -3",
    hod: "CCM HOD",
  },
  {
    label: "SMS FABRICATION YARD (ZONE -4)",
    zoneGroup: "SMS",
    value: "FABRICATION YARD -ZONE -4",
    hod: "Fabrication Yard HOD",
  },
  {
    label: "SMS ELECTRICAL (ZONE-5)",
    zoneGroup: "SMS",
    value: "SMS ELECTRICAL -ZONE-5",
    hod: "SMS Electrical HOD",
  },
  {
    label: "SMS REWIDING ROOM (ZONE-6)",
    zoneGroup: "SMS",
    value: "SMS REWIDING ROOM -ZONE-6",
    hod: "SMS Rewinding Room HOD",
  },
];
