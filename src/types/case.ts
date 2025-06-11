
export interface Exhibit {
  id: string; 
  name: string;
  url: string; 
  type: string; 
  uploadedAt: string; // ISO string
  storagePath: string; 
  description?: string;
  isCameraCapture?: boolean; // True if 'url' is a dataURI from camera, false/undefined if uploaded file
}

export interface Complainant {
  name: string;
  contact?: string; 
  address?: string;
  // statement?: string; // Removed as per user request
}

export interface Witness {
  id: string; 
  name: string;
  contact?: string;
  address?: string;
  statement?: string; 
}

export interface CaseLink { 
  id: string; 
  type: 'suspect'; 
}

export interface Case {
  id: string;
  roNumber: string; 
  year: number; 
  assignedInvestigator: string; 
  offence: string; 
  briefFacts: string;
  status: 'Open' | 'Pending' | 'Closed' | 'Under Investigation' | 'Cold Case';
  priority: 'Low' | 'Medium' | 'High';
  dateReported: string; // ISO string
  dateOccurred?: string; // ISO string, if different from reported
  locationOfOffence?: string;

  complainant: Complainant;
  witnesses: Witness[];
  suspectLinks: CaseLink[]; 
  exhibits: Exhibit[]; 

  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  
  createdBy: string; // User name or ID
  createdById: string; // Clerk User ID
  updatedBy?: string; // User name or ID
  updatedById?: string; // Clerk User ID
}

