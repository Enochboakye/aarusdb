
export type Gender = "Male" | "Female" | "Other";
export type EducationLevel = "None" | "Primary" | "JHS/Middle School" | "SHS/Secondary" | "Vocational/Technical" | "Tertiary" | "Postgraduate";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed" | "Separated";

// Added custodyStatus to track detailed suspect status for dashboard reporting
export type CustodyStatus = 
  | 'Police Custody (Active Investigation)' 
  | 'Remanded (Police Custody)' 
  | 'Remanded (Prison Custody)' 
  | 'Bail (Court)' 
  | 'Bail (Police Enquiry)' 
  | 'Released' 
  | 'Wanted' 
  | 'Deceased'
  | 'Other'
  | 'Unknown';

export interface Suspect {
  id: string;
  fullName: string;
  nickname?: string;
  gender: Gender;
  height?: string; 
  dateOfBirth: string; // Store as ISO string, handle conversion in UI
  nationality: string;
  placeOfBirth: string;
  hometown: string;
  residentialAddress: string;
  educationLevel: EducationLevel;
  maritalStatus: MaritalStatus;
  occupation: string;
  emailAddress?: string;
  phoneNumbers?: string[]; 
  assignedInvestigator?: string; 
  physicalMarks?: string[]; 
  languagesSpoken: string; 
  smokes: boolean;
  drinksAlcohol: boolean;
  offences?: string[]; 
  
  profileImageUrl?: string; 
  profileImageStoragePath?: string; // Path in Firebase Storage

  documentUrls?: string[]; 
  custodyStatus?: CustodyStatus; 
  custodyLocation?: string; 

  linkedCaseRoNumbers?: string[]; // Stores R.O. numbers of cases this suspect is linked to

  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  
  createdBy?: string; // User name or ID
  createdById?: string; // Clerk User ID
  updatedBy?: string; // User name or ID
  updatedById?: string; // Clerk User ID

  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeColor?: string;
}

// Form values type, largely mirrors Suspect but profileImageUrl can be data URI initially
export interface SuspectFormValues {
  fullName: string;
  nickname?: string;
  gender: Gender;
  height?: string;
  dateOfBirth: string; // ISO string date
  nationality: string;
  placeOfBirth: string;
  hometown: string;
  residentialAddress: string;
  educationLevel: EducationLevel;
  maritalStatus: MaritalStatus;
  occupation: string;
  emailAddress?: string;
  phoneNumbers: string[]; // Made non-optional
  assignedInvestigator?: string;
  physicalMarks: string[]; // Assuming physicalMarks should also be non-optional for form consistency
  languagesSpoken: string;
  offences: string[]; // Made non-optional
  smokes: boolean;
  drinksAlcohol: boolean;
  profileImageUrl?: string; // Can be data URI from form, or storage URL
  profileImageStoragePath?: string; // Only populated if image is already in storage
  linkedRoNumber?: string;
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeColor?: string;
  custodyStatus?: CustodyStatus;
  custodyLocation?: string;
}

