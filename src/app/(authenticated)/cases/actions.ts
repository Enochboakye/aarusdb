
"use server";

import type { Case, Exhibit, CaseLink } from '@/types/case';
import type { Suspect } from '@/types/suspect';
import type { CaseFormValues } from '@/components/case-form'; 
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, deleteDoc, Timestamp, query, getDocs, arrayUnion, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { AuditAction } from '@/types/audit';
import { addAuditLogAction as addGenericAuditLog } from '../suspects/actions'; // Using the generic audit log from suspects/actions

import { currentUser } from "@clerk/nextjs/server";

export async function getCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    userId: user.id,
    userName: user.username || user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown User",
    email: user.emailAddresses[0]?.emailAddress,
    // add more fields as needed
  };
}

// Helper function to serialize case data, converting Timestamps to ISO strings
const serializeCaseData = (docData: Record<string, unknown>, id: string): Case => {
  const data = { ...docData }; // Clone to avoid modifying original
  if (data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === 'function') {
    data.createdAt = (data.createdAt as { toDate: () => Date }).toDate().toISOString();
  }
  if (data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === 'function') {
    data.updatedAt = (data.updatedAt as { toDate: () => Date }).toDate().toISOString();
  }
  if (data.dateReported && typeof (data.dateReported as { toDate?: () => Date }).toDate === 'function') {
    data.dateReported = (data.dateReported as { toDate: () => Date }).toDate().toISOString();
  }
  if (data.dateOccurred && typeof (data.dateOccurred as { toDate?: () => Date }).toDate === 'function') {
    data.dateOccurred = (data.dateOccurred as { toDate: () => Date }).toDate().toISOString();
  }
  if (data.exhibits && Array.isArray(data.exhibits)) {
    data.exhibits = (data.exhibits as unknown[]).map((ex) => {
      if (
        ex &&
        typeof ex === 'object' &&
        'uploadedAt' in ex &&
        ex.uploadedAt &&
        typeof (ex.uploadedAt as { toDate?: () => Date }).toDate === 'function'
      ) {
        return { ...ex, uploadedAt: (ex.uploadedAt as { toDate: () => Date }).toDate().toISOString() };
      }
      return ex;
    });
  }
  return { id, ...data } as Case;
};


async function addAuditLogForCaseAction(
  caseId: string,
  roNumberString: string, 
  action: AuditAction,
  details: string,
  userId: string,
  userName: string
): Promise<void> {
  await addGenericAuditLog(
    action,
    details,
    {
      userId: userId,
      userName: userName,
      entityId: caseId,
      entityType: "CASE",
      entityIdentifier: roNumberString,
    }
  );
}

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


export async function uploadExhibitAction(file: File, caseId: string): Promise<Omit<Exhibit, 'id' | 'description'>> {
  if (!file) throw new Error("No file provided for upload.");

  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `cases/${caseId}/exhibits/${uniqueFileName}`);

  try {
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return {
      name: file.name,
      url: downloadURL,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      storagePath: storageRef.fullPath, 
    };
  } catch (error) {
    console.error("Error uploading exhibit:", error);
    throw new Error(`Failed to upload exhibit ${file.name}. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteExhibitAction(storagePath: string): Promise<void> {
    if (!storagePath || storagePath === "PENDING_CAMERA_UPLOAD") { 
        console.log("Skipping deletion for exhibit without valid storage path:", storagePath);
        return;
    }
    const exhibitRef = ref(storage, storagePath);
    try {
        await deleteObject(exhibitRef);
        console.log("Exhibit deleted from storage:", storagePath);
    } catch (error: unknown) {
        console.error("Error deleting exhibit from storage:", error);
        if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code !== 'storage/object-not-found') { 
            throw new Error(`Failed to delete exhibit file. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

async function processAndUploadExhibits(
    exhibits: Exhibit[], 
    caseId: string
): Promise<Exhibit[]> {
    const processedExhibits: Exhibit[] = [];
    for (const exhibit of exhibits) {
        const finalExhibit = { ...exhibit };

        if (exhibit.isCameraCapture && exhibit.url.startsWith('data:')) {
            try {
                const blob = await dataUriToBlob(exhibit.url);
                const file = new File([blob], exhibit.name || `camera_capture_${Date.now()}.jpg`, { type: exhibit.type || 'image/jpeg' });
                
                const timestamp = Date.now();
                const uniqueFileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
                const storageRefPath = `cases/${caseId}/exhibits/${uniqueFileName}`;
                const exhibitStorageRef = ref(storage, storageRefPath);
                
                await uploadBytes(exhibitStorageRef, file);
                const downloadURL = await getDownloadURL(exhibitStorageRef);

                finalExhibit.url = downloadURL;
                finalExhibit.storagePath = storageRefPath;
                finalExhibit.isCameraCapture = false; 
                finalExhibit.uploadedAt = new Date().toISOString();
                
                 console.log(`Camera capture ${exhibit.name} uploaded to ${downloadURL}`);
            } catch (uploadError) {
                console.error(`Failed to upload camera capture exhibit ${exhibit.name}:`, uploadError);
                 finalExhibit.url = "upload_failed_placeholder.png"; 
                 finalExhibit.storagePath = "UPLOAD_FAILED";
            }
        }
        if (!finalExhibit.id) finalExhibit.id = crypto.randomUUID();
        
        processedExhibits.push(finalExhibit);
    }
    return processedExhibits;
}

async function updateSuspectRecordsWithCaseLink(
  suspectLinks: CaseLink[],
  caseRoNumber: string,
  currentUserId: string,
  currentUserName: string
): Promise<void> {
  if (!suspectLinks || suspectLinks.length === 0) return;

  for (const link of suspectLinks) {
    if (link.type === 'suspect' && link.id) {
      try {
        const suspectDocRef = doc(db, "suspectdata", link.id);
        const suspectSnap = await getDoc(suspectDocRef);
        if (suspectSnap.exists()) {
          const suspectData = suspectSnap.data() as Suspect;
          await updateDoc(suspectDocRef, {
            linkedCaseRoNumbers: arrayUnion(caseRoNumber),
            updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
            updatedBy: currentUserName,
            updatedById: currentUserId,
          });
          // Audit log for the suspect being updated
          await addGenericAuditLog(
            "UPDATE",
            `Suspect record updated: Automatically linked to Case R.O. ${caseRoNumber}.`,
            {
              userId: currentUserId,
              userName: currentUserName,
              suspectId: link.id,
              suspectFullName: suspectData.fullName,
              entityType: "SUSPECT", // Explicitly state entity type for suspect log
              entityIdentifier: suspectData.fullName,
            }
          );
          console.log(`Suspect ${link.id} (${suspectData.fullName}) updated with link to case ${caseRoNumber}`);
        } else {
          console.warn(`Suspect with ID ${link.id} not found while trying to link to case ${caseRoNumber}.`);
        }
      } catch (error) {
        console.error(`Error updating suspect ${link.id} with case link ${caseRoNumber}:`, error);
      }
    }
  }
}


export async function createCaseAction(
  data: CaseFormValues
): Promise<Case> {
  const currentUserObj = await getCurrentUser();
  if (!currentUserObj) {
    throw new Error("No authenticated user found.");
  }
  const { userId, userName } = currentUserObj;
  
  const roNumberString = `${String(data.caseSequenceNumber).padStart(3, '0')}/${data.year}`;
  const caseIdForUploads = crypto.randomUUID(); 

  const finalExhibits = await processAndUploadExhibits(
    (data.exhibits || []).map(ex => ({
      ...ex,
      uploadedAt: ex.uploadedAt ?? new Date().toISOString(),
      storagePath: ex.storagePath ?? "",
    })),
    caseIdForUploads
  );

  const newCaseData = {
    ...data, 
    roNumber: roNumberString,
    suspectLinks: data.suspectLinks || [],
    exhibits: finalExhibits,
    witnesses: data.witnesses || [],
    createdAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
    updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
    createdBy: userName, 
    createdById: userId, 
  };
  
  const saveData = newCaseData as Omit<Case, "id">;


  try {
    const caseCollectionRef = collection(db, "cases");
    const docRef = await addDoc(caseCollectionRef, saveData);
    
    const createdCaseData = {
      ...saveData,
    };

    await addAuditLogForCaseAction(
      docRef.id,
      createdCaseData.roNumber, 
      "CREATE",
      `Case record created: R.O. ${createdCaseData.roNumber}. Exhibits: ${createdCaseData.exhibits.length}. Suspects linked: ${createdCaseData.suspectLinks.length}.`,
      userId,
      userName
    );
    
    if (createdCaseData.suspectLinks && createdCaseData.suspectLinks.length > 0) {
      await updateSuspectRecordsWithCaseLink(createdCaseData.suspectLinks, createdCaseData.roNumber, userId, userName);
    }
    
    return serializeCaseData(createdCaseData as Record<string, unknown>, docRef.id);
  } catch (error) {
    console.error("Error creating case in Firestore:", error);
    throw new Error(`Failed to create case: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updateCaseAction(
  id: string,
  data: CaseFormValues
): Promise<Case | null> {
  const currentUserObj = await getCurrentUser();
  if (!currentUserObj) {
    throw new Error("No authenticated user found.");
  }
  const { userId, userName } = currentUserObj;
  
  const caseDocRef = doc(db, "cases", id);

  try {
    const docSnap = await getDoc(caseDocRef);
    if (!docSnap.exists()) {
      console.error(`Case with ID ${id} not found for update.`);
      throw new Error(`Case with ID ${id} not found.`);
    }
    const existingCaseData = docSnap.data() as Omit<Case, "id">;
    
    const existingExhibitStoragePaths = (existingCaseData.exhibits || []).map(ex => ex.storagePath).filter(Boolean) as string[];
    const updatedExhibitStoragePaths = (data.exhibits || []).map(ex => ex.storagePath).filter(Boolean) as string[];
    const exhibitsToDeletePaths = existingExhibitStoragePaths.filter(path => !updatedExhibitStoragePaths.includes(path));

    for (const path of exhibitsToDeletePaths) {
        if (path) await deleteExhibitAction(path);
    }

    const finalExhibits = await processAndUploadExhibits(
      (data.exhibits || []).map(ex => ({
        ...ex,
        uploadedAt: ex.uploadedAt ?? new Date().toISOString(),
        storagePath: ex.storagePath ?? "",
      })),
      id
    );

    const roNumberString = `${String(data.caseSequenceNumber).padStart(3, '0')}/${data.year}`;
    const updatedCasePayloadFromForm = {
      ...data,
      roNumber: roNumberString,
      suspectLinks: data.suspectLinks || [],
      exhibits: finalExhibits,
      witnesses: data.witnesses || [],
      updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
      updatedBy: userName, 
      updatedById: userId, 
    };
    
    await updateDoc(caseDocRef, updatedCasePayloadFromForm);

    const fullUpdatedCaseData = {
      id: id, 
      ...existingCaseData,
      ...updatedCasePayloadFromForm,
    } as Case;
    
    const changeDetails = `Case record R.O. ${fullUpdatedCaseData.roNumber} updated. Exhibits: ${fullUpdatedCaseData.exhibits.length}. Suspects linked: ${fullUpdatedCaseData.suspectLinks.length}.`; 

    await addAuditLogForCaseAction(
      id,
      fullUpdatedCaseData.roNumber, 
      "UPDATE",
      changeDetails,
      userId,
      userName
    );

    if (fullUpdatedCaseData.suspectLinks && fullUpdatedCaseData.suspectLinks.length > 0) {
      await updateSuspectRecordsWithCaseLink(fullUpdatedCaseData.suspectLinks, fullUpdatedCaseData.roNumber, userId, userName);
    }

    return serializeCaseData(fullUpdatedCaseData as unknown as Record<string, unknown>, id);
  } catch (error) {
    console.error(`Error updating case ${id} in Firestore:`, error);
    throw new Error(`Failed to update case: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function deleteCaseAction(
  id: string, 
  roNumber: string, 
  exhibitStoragePaths: string[] 
  ): Promise<{ success: boolean; message?: string }> {
  const currentUserObj = await getCurrentUser();
  if (!currentUserObj) {
    throw new Error("No authenticated user found.");
  }
  const { userId, userName } = currentUserObj;

  const caseDocRef = doc(db, "cases", id);

  try {
    // TODO: Also remove this case's R.O. number from linked suspects' linkedCaseRoNumbers array.
    // This requires fetching the case, iterating its suspectLinks, then fetching each suspect and updating them.
    // For now, we only delete the case and its exhibits. Consider adding this full cleanup later.

    for (const path of exhibitStoragePaths) {
        if (path) await deleteExhibitAction(path); 
    }

    await deleteDoc(caseDocRef);
    
    await addAuditLogForCaseAction(
      id,
      roNumber,
      "DELETE",
      `Case record R.O. ${roNumber} (ID: ${id}) and associated exhibits permanently deleted.`,
      userId,
      userName
    );

    return { success: true };
  } catch (error) {
    console.error(`Error deleting case ${id} from Firestore:`, error);
    return { success: false, message: `Failed to delete case: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function fetchCasesAction(): Promise<Case[]> {
  try {
    const casesCollectionRef = collection(db, "cases");
    const q = query(casesCollectionRef); 
    
    const querySnapshot = await getDocs(q);
    const fetchedCases: Case[] = querySnapshot.docs.map(doc => serializeCaseData(doc.data() as Record<string, unknown>, doc.id));
    return fetchedCases;
  } catch (error) {
    console.error("Error fetching cases from Firestore:", error);
    throw new Error(`Failed to fetch cases: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchCaseAction(id: string): Promise<Case | null> {
  try {
    const caseDocRef = doc(db, "cases", id);
    const docSnap = await getDoc(caseDocRef);
    if (docSnap.exists()) {
      return serializeCaseData(docSnap.data() as Record<string, unknown>, docSnap.id);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching case ${id} from Firestore:`, error);
    throw new Error(`Failed to fetch case details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getSuspectMatchesForCaseRoAction(roNumber: string): Promise<Array<{ id: string; fullName: string }>> {
  if (!roNumber) return [];
  try {
    const suspectsCollectionRef = collection(db, 'suspectdata');
    const q = query(suspectsCollectionRef, where('linkedCaseRoNumbers', 'array-contains', roNumber));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      fullName: (doc.data() as Suspect).fullName || 'Unnamed Suspect',
    }));
  } catch (error) {
    console.error(`Error fetching suspect matches for R.O. ${roNumber}:`, error);
    return []; 
  }
}
