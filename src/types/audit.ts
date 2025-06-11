
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "LOGIN" | "LOGOUT" | "FILE_UPLOAD" | "FILE_DELETE";

export interface AuditLogEntry {
  id: string;
  
  // For backward compatibility with existing suspect logs
  suspectId?: string; 
  suspectFullName?: string; 

  // Generic entity tracking for cases, etc.
  entityId?: string; // ID of the entity (e.g., Case ID, Suspect ID)
  entityType?: "SUSPECT" | "CASE" | "USER" | "SYSTEM"; // Type of entity being audited
  entityIdentifier?: string; // A user-friendly identifier for the entity (e.g., R.O. Number, Suspect Full Name)

  action: AuditAction;
  timestamp: string; // ISO string
  userId: string; // ID of the officer/user making the change
  userName: string; // Name of the officer/user
  details: string; // e.g. "Updated residential address", or JSON string of changes, or "User logged in"
  ipAddress?: string;
  // Potentially add:
  // previousState?: Record<string, any>; // For detailed field changes
  // newState?: Record<string, any>;
}

