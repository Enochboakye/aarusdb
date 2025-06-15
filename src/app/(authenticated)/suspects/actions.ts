"use server";

import type { Suspect, SuspectFormValues } from '@/types/suspect';
import type { AuditLogEntry, AuditAction } from '@/types/audit';
import type { Case, CaseLink } from '@/types/case'; 
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, deleteDoc, Timestamp, getDocs, query, where, writeBatch, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, currentUser } from '@clerk/nextjs/server'

async function getCurrentUser() {
  const { userId } = await auth()
  const user = await currentUser()
  
  return {
    userId: userId || 'system',
    userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'System User'
  };
}

// Helper to convert Data URI to Blob
async function dataUriToBlob(dataURI: string): Promise<Blob> {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// Helper to upload profile image to Firebase Storage
async function _uploadSuspectProfileImage(
  suspectId: string,
  imageDataUri: string
): Promise<{ url: string; storagePath: string }> {
  const blob = await dataUriToBlob(imageDataUri);
  const fileType = blob.type || 'image/jpeg';
  const fileExtension = fileType.split('/')[1] || 'jpg';
  const uniqueFileName = `profile_${Date.now()}.${fileExtension}`;
  const storageRefPath = `suspects/${suspectId}/profileImage/${uniqueFileName}`;
  const imageStorageRef = ref(storage, storageRefPath);

  await uploadBytes(imageStorageRef, blob);
  const downloadURL = await getDownloadURL(imageStorageRef);
  return { url: downloadURL, storagePath: storageRefPath };
}

// Helper to delete profile image from Firebase Storage
async function _deleteSuspectProfileImage(storagePath: string): Promise<void> {
  if (!storagePath) return;
  const imageRef = ref(storage, storagePath);
  try {
    await deleteObject(imageRef);
    console.log("Suspect profile image deleted from storage:", storagePath);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code !== 'storage/object-not-found') {
      console.error("Error deleting suspect profile image from storage:", error);
      // Optionally re-throw or handle if deletion failure is critical
    }
  }
}


// Helper function to serialize suspect data, converting Timestamps to ISO strings
const serializeSuspectData = (docData: Record<string, unknown>, id: string): Suspect => {
  const data = { ...docData }; // Clone
  if (
    data.createdAt &&
    typeof data.createdAt === 'object' &&
    data.createdAt !== null &&
    typeof (data.createdAt as { toDate?: unknown }).toDate === 'function'
  ) {
    data.createdAt = (data.createdAt as { toDate: () => Date }).toDate().toISOString();
  }
  if (
    data.updatedAt &&
    typeof data.updatedAt === 'object' &&
    data.updatedAt !== null &&
    typeof (data.updatedAt as { toDate?: unknown }).toDate === 'function'
  ) {
    data.updatedAt = (data.updatedAt as { toDate: () => Date }).toDate().toISOString();
  }
  if (
    data.dateOfBirth &&
    typeof data.dateOfBirth === 'object' &&
    data.dateOfBirth !== null &&
    typeof (data.dateOfBirth as { toDate?: unknown }).toDate === 'function'
  ) {
    data.dateOfBirth = (data.dateOfBirth as { toDate: () => Date }).toDate().toISOString();
  }

  let phoneNumbersArray: string[] = [];
  if (data.phoneNumbers && Array.isArray(data.phoneNumbers)) {
    phoneNumbersArray = data.phoneNumbers;
  } else if (typeof data.phoneNumber === 'string') { 
    phoneNumbersArray = [data.phoneNumber];
  }
  data.phoneNumbers = phoneNumbersArray;
  delete data.phoneNumber;

  let offencesArray: string[] = [];
  if (data.offences && Array.isArray(data.offences)) {
    offencesArray = data.offences;
  } else if (typeof data.offence === 'string') { 
    offencesArray = [data.offence];
  }
  data.offences = offencesArray;
  delete data.offence;
  
  data.linkedCaseRoNumbers = data.linkedCaseRoNumbers || [];
  
  return { id, ...data } as Suspect;
};


export async function addAuditLogAction(
  action: AuditAction,
  details: string,
  options: {
    userId: string;
    userName: string;
    suspectId?: string | null;
    suspectFullName?: string | null;
    entityId?: string;
    entityType?: "SUSPECT" | "CASE";
    entityIdentifier?: string;
  }
): Promise<void> {
  try {
    const auditLogRef = collection(db, "auditLogs");
    const logEntry: Partial<AuditLogEntry> = {
      action,
      userId: options.userId,
      userName: options.userName,
      details,
      timestamp: Timestamp.fromDate(new Date()).toDate().toISOString(),
      ipAddress: "server-ip", 
    };

    if (options.entityType === "CASE" && options.entityId && options.entityIdentifier) {
      logEntry.entityId = options.entityId;
      logEntry.entityType = "CASE";
      logEntry.entityIdentifier = options.entityIdentifier;
      if (options.suspectId) logEntry.suspectId = options.suspectId;
      if (options.suspectFullName) logEntry.suspectFullName = options.suspectFullName;
    } else if (options.suspectId && options.suspectFullName) {
      logEntry.suspectId = options.suspectId;
      logEntry.suspectFullName = options.suspectFullName;
      logEntry.entityType = "SUSPECT"; 
      logEntry.entityIdentifier = options.suspectFullName;
    }

    await addDoc(auditLogRef, logEntry);
  } catch (error) {
    console.error("Error adding audit log:", error);
  }
}

async function ensureCaseLinkedToSuspect(
    caseRoNumber: string,
    suspectId: string, 
    suspectFullName: string,
    currentUserId: string,
    currentUserName: string
) {
  if (!caseRoNumber) return;

  try {
    const casesRef = collection(db, "cases");
    const q = query(casesRef, where("roNumber", "==", caseRoNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const caseDoc = querySnapshot.docs[0];
      const caseData = caseDoc.data() as Case;
      const caseId = caseDoc.id;

      const newLink: CaseLink = { id: suspectId, type: "suspect" };
      const alreadyLinked = caseData.suspectLinks?.some(link => link.id === suspectId);

      if (!alreadyLinked) {
        await updateDoc(doc(db, "cases", caseId), { 
          suspectLinks: arrayUnion(newLink),
          updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
          updatedBy: currentUserName,
          updatedById: currentUserId,
        });
        
        console.log(`Case ${caseRoNumber} (ID: ${caseId}) updated to link suspect ${suspectFullName} (ID: ${suspectId}).`);
        await addAuditLogAction(
          "UPDATE", 
          `Case updated: Suspect ${suspectFullName} (ID: ${suspectId}) automatically linked via R.O. ${caseRoNumber} specified in suspect form.`,
          {
            userId: currentUserId,
            userName: currentUserName,
            suspectId: suspectId,
            suspectFullName: suspectFullName,
            entityId: caseId,
            entityType: "CASE",
            entityIdentifier: caseRoNumber
          }
        );
      } else {
        console.log(`Suspect ${suspectFullName} already linked to case ${caseRoNumber}.`);
      }
    } else {
      console.log(`No case found with R.O. Number: ${caseRoNumber} to link suspect ${suspectFullName}.`);
    }
  } catch (error) {
    console.error(`Error linking suspect ${suspectId} to case ${caseRoNumber}:`, error);
  }
}

export async function createSuspectAction(
  data: SuspectFormValues
): Promise<Suspect> {
  const { userId, userName } = await getCurrentUser();
  
  const { linkedRoNumber, profileImageUrl: formProfileImageUrl, ...suspectDataToSave } = data;

  const newSuspectBaseData: Omit<Suspect, 'id' | 'profileImageUrl' | 'profileImageStoragePath'> = {
    ...suspectDataToSave,
    physicalMarks: data.physicalMarks || [],
    phoneNumbers: data.phoneNumbers || [],
    offences: data.offences || [],
    createdAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
    updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
    createdBy: userName, 
    createdById: userId,
    linkedCaseRoNumbers: linkedRoNumber ? [linkedRoNumber] : [],
  };
  delete (newSuspectBaseData as Record<string, unknown>).offence; // Ensure legacy field is removed

  try {
    const suspectCollectionRef = collection(db, "suspectdata"); 
    // Create document first without image URL to get an ID
    const docRef = await addDoc(suspectCollectionRef, newSuspectBaseData);
    const suspectId = docRef.id;

    let finalProfileImageUrl: string | undefined = undefined;
    let finalProfileImageStoragePath: string | undefined = undefined;

    if (formProfileImageUrl && formProfileImageUrl.startsWith('data:image')) {
      try {
        const uploadResult = await _uploadSuspectProfileImage(suspectId, formProfileImageUrl);
        finalProfileImageUrl = uploadResult.url;
        finalProfileImageStoragePath = uploadResult.storagePath;
        // Update the document with image details
        await updateDoc(docRef, { 
          profileImageUrl: finalProfileImageUrl, 
          profileImageStoragePath: finalProfileImageStoragePath,
          updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(), // Also update timestamp
        });
      } catch (uploadError) {
        console.error(`Error uploading profile image for new suspect ${suspectId}:`, uploadError);
        // Decide if you want to throw or continue without image
      }
    }
    
    const createdSuspect: Suspect = {
      id: suspectId,
      ...newSuspectBaseData,
      profileImageUrl: finalProfileImageUrl,
      profileImageStoragePath: finalProfileImageStoragePath,
    };

    await addAuditLogAction(
      "CREATE",
      `Suspect record created for ${createdSuspect.fullName}. ${finalProfileImageUrl ? 'Profile image uploaded.' : ''}`,
      { 
        userId, 
        userName, 
        suspectId: createdSuspect.id, 
        suspectFullName: createdSuspect.fullName
      }
    );
    
    if (linkedRoNumber) {
      await ensureCaseLinkedToSuspect(linkedRoNumber, createdSuspect.id, createdSuspect.fullName, userId, userName);
    }
    
    return serializeSuspectData({ ...createdSuspect }, createdSuspect.id);
  } catch (error) {
    console.error("Error creating suspect in Firestore:", error);
    throw new Error(`Failed to create suspect: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updateSuspectAction(
  id: string,
  data: SuspectFormValues
): Promise<Suspect | null> {
  const { userId, userName } = await getCurrentUser();
  
  const suspectDocRef = doc(db, "suspectdata", id); 

  try {
    const docSnap = await getDoc(suspectDocRef);
    if (!docSnap.exists()) {
      throw new Error(`Suspect with ID ${id} not found.`);
    }
    const existingSuspectData = docSnap.data() as Suspect; 

    const { linkedRoNumber, profileImageUrl: formProfileImageUrl, ...suspectDataToUpdate } = data;

    let finalProfileImageUrl: string | null | undefined = existingSuspectData.profileImageUrl;
    let finalProfileImageStoragePath: string | null | undefined = existingSuspectData.profileImageStoragePath;
    let imageChanged = false;

    if (formProfileImageUrl && formProfileImageUrl.startsWith('data:image')) { // New image uploaded/captured
      if (existingSuspectData.profileImageStoragePath) {
        await _deleteSuspectProfileImage(existingSuspectData.profileImageStoragePath);
      }
      const uploadResult = await _uploadSuspectProfileImage(id, formProfileImageUrl);
      finalProfileImageUrl = uploadResult.url;
      finalProfileImageStoragePath = uploadResult.storagePath;
      imageChanged = true;
    } else if (!formProfileImageUrl && existingSuspectData.profileImageUrl) { // Image cleared
      if (existingSuspectData.profileImageStoragePath) {
        await _deleteSuspectProfileImage(existingSuspectData.profileImageStoragePath);
      }
      finalProfileImageUrl = null; // Use null instead of undefined
      finalProfileImageStoragePath = null; // Use null instead of undefined
      imageChanged = true;
    }
    // If formProfileImageUrl is an existing storage URL (not data URI) and not empty, it means no change by user via upload/clear.
    // In this case, finalProfileImageUrl and finalProfileImageStoragePath retain their initial values from existingSuspectData.


    const updatedSuspectPayload: Partial<Suspect> = {
      ...suspectDataToUpdate, 
      physicalMarks: data.physicalMarks || [],
      phoneNumbers: data.phoneNumbers || [],
      offences: data.offences || [],
      profileImageUrl: finalProfileImageUrl === null ? undefined : finalProfileImageUrl, // Ensure undefined, not null
      profileImageStoragePath: finalProfileImageStoragePath === null ? undefined : finalProfileImageStoragePath, // Ensure undefined, not null
      updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
      updatedBy: userName, 
      updatedById: userId, 
      linkedCaseRoNumbers: linkedRoNumber 
        ? Array.from(new Set([...(existingSuspectData.linkedCaseRoNumbers || []), linkedRoNumber]))
        : existingSuspectData.linkedCaseRoNumbers || [],
    };
    delete (updatedSuspectPayload as Record<string, unknown>).offence; 
    delete (updatedSuspectPayload as Record<string, unknown>).linkedRoNumber; 

    await updateDoc(suspectDocRef, updatedSuspectPayload);

    const fullUpdatedSuspectData = {
      ...existingSuspectData, 
      ...updatedSuspectPayload, 
      id: id, 
    } as Suspect;
    
    let changeDetails = "Suspect record updated.";
    if (imageChanged) {
        changeDetails += ` Profile image ${finalProfileImageUrl ? 'updated' : 'removed'}.`;
    }

    await addAuditLogAction(
      "UPDATE",
      changeDetails + ` For ${fullUpdatedSuspectData.fullName}.`,
      {
        userId,
        userName,
        suspectId: id,
        suspectFullName: fullUpdatedSuspectData.fullName
      }
    );

    if (linkedRoNumber && (!existingSuspectData.linkedCaseRoNumbers?.includes(linkedRoNumber))) {
      await ensureCaseLinkedToSuspect(linkedRoNumber, fullUpdatedSuspectData.id, fullUpdatedSuspectData.fullName, userId, userName);
    }

    return serializeSuspectData({ ...fullUpdatedSuspectData }, id);
  } catch (error) {
    console.error(`Error updating suspect ${id} in Firestore:`, error);
    throw new Error(`Failed to update suspect: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteSuspectAction(
  id: string,
  suspectFullName: string 
): Promise<{ success: boolean; message?: string }> {
  const { userId, userName } = await getCurrentUser();
  const suspectDocRef = doc(db, "suspectdata", id); 

  try {
    const docSnap = await getDoc(suspectDocRef);
    if (docSnap.exists()) {
      const suspectData = docSnap.data() as Suspect;
      if (suspectData.profileImageStoragePath) {
        await _deleteSuspectProfileImage(suspectData.profileImageStoragePath);
      }
    }

    const casesRef = collection(db, "cases");
    const q = query(casesRef, where("suspectLinks", "array-contains", { id: id, type: "suspect" }));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.forEach(caseDoc => {
      const caseData = caseDoc.data() as Case;
      const updatedSuspectLinks = caseData.suspectLinks.filter(link => link.id !== id);
      batch.update(caseDoc.ref, { 
          suspectLinks: updatedSuspectLinks,
          updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
          updatedBy: userName,
          updatedById: userId,
      });
    });
    await batch.commit();

    await deleteDoc(suspectDocRef);
    
    await addAuditLogAction(
      "DELETE",
      `Suspect record permanently deleted for ${suspectFullName} (ID: ${id}). Profile image (if any) and case links removed.`,
      {
        userId,
        userName,
        suspectId: id,
        suspectFullName: suspectFullName 
      }
    );

    return { success: true };
  } catch (error) {
    console.error(`Error deleting suspect ${id} from Firestore:`, error);
    return { success: false, message: `Failed to delete suspect: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function fetchSuspectsAction(): Promise<Suspect[]> {
  try {
    const suspectsCollectionRef = collection(db, "suspectdata");
    const q = query(suspectsCollectionRef); 
    
    const querySnapshot = await getDocs(q);
    const fetchedSuspects: Suspect[] = querySnapshot.docs.map(doc => serializeSuspectData(doc.data(), doc.id));
    return fetchedSuspects;
  } catch (error) {
    console.error("Error fetching suspects from Firestore:", error);
    throw new Error(`Failed to fetch suspects: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchSuspectsByRoAction(roNumber: string): Promise<Pick<Suspect, 'id' | 'fullName'>[]> {
  if (!roNumber) {
    return [];
  }
  try {
    const suspectsCollectionRef = collection(db, "suspectdata");
    const q = query(suspectsCollectionRef, where("linkedCaseRoNumbers", "array-contains", roNumber));
    const querySnapshot = await getDocs(q);
    
    const fetchedSuspects: Pick<Suspect, 'id' | 'fullName'>[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName || "Unknown Name", 
      };
    });
    return fetchedSuspects;
  } catch (error) {
    console.error(`Error fetching suspects by R.O. number ${roNumber}:`, error);
    return []; 
  }
}

