"use server";

import type { Case, Exhibit, CaseLink } from '@/types/case';
import type { Suspect } from '@/types/suspect';
import type { CaseFormValues } from '@/components/case-form'; 
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, deleteDoc, Timestamp, query, getDocs, arrayUnion, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { AuditAction } from '@/types/audit';
import { addAuditLogAction as addGenericAuditLog } from '../suspects/actions'; // Using the generic audit log from suspects/actions
import { currentUser } from '@clerk/nextjs/server';
import { writeBatch } from "firebase/firestore";
import { arrayRemove } from "firebase/firestore";

async function getCurrentUser() {
  const user = await currentUser();
  return {
    userId: user?.id || 'system',
    userName: user?.firstName || 'System'
  };
}

interface CaseData {
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  dateReported?: Date | Timestamp | string;
  dateOccurred?: Date | Timestamp | string;
  exhibits?: {uploadedAt?: Timestamp | string}[]
  // Add other properties as needed
}


const serializeCaseData = (docData: CaseData, id: string): Case => {
  const data = { ...docData }; // Clone to avoid modifying original
  if (data.createdAt && (data.createdAt as Timestamp).toDate) {
  data.createdAt = (data.createdAt as Timestamp).toDate().toISOString();
  }
  if (data.updatedAt && (data.updatedAt as Timestamp).toDate) {
    data.updatedAt = (data.updatedAt as Timestamp).toDate().toISOString();
  }
  if (data.dateReported && (data.dateReported as Timestamp).toDate) {
    data.dateReported = (data.dateReported as Timestamp).toDate().toISOString();
  }
  if (data.dateOccurred && (data.dateOccurred as Timestamp).toDate) {
    data.dateOccurred = ( data.dateOccurred as Timestamp).toDate().toISOString();
  }

  if (data.exhibits && Array.isArray(data.exhibits)) {
    data.exhibits = data.exhibits.map((exDate) => {
      if (exDate.uploadedAt && (exDate.uploadedAt as Timestamp).toDate) {
        return { ...exDate, uploadedAt:( exDate.uploadedAt as Timestamp).toDate().toISOString() };
      }
      return exDate;
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
        if ((error as { code?: string }).code !== 'storage/object-not-found') { 
            throw new Error(`Failed to delete exhibit file. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

async function processAndUploadExhibits(
    exhibits: Exhibit[], 
    caseId: string, 
    
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
  const { userId, userName } = await getCurrentUser();
  
  const roNumberString = `${String(data.caseSequenceNumber).padStart(3, '0')}/${data.year}`;
  const caseIdForUploads = crypto.randomUUID(); 

  //const finalExhibits = await processAndUploadExhibits(data.exhibits || [], caseIdForUploads, userId, userName);
    const finalExhibits = await processAndUploadExhibits(
  data.exhibits.map((exhibit) => ({
  ...exhibit,
  uploadedAt: exhibit.uploadedAt ?? '',
})) as Exhibit[],
  caseIdForUploads,
);

  const newCaseData: Omit<Case, 'id'> = {
    ...data, 
    roNumber: roNumberString,
    suspectLinks: data.suspectLinks || [],
    exhibits: finalExhibits,
    witnesses: data.witnesses?.map(witness => ({
      ...witness,
      address: witness.address ?? '',
      contact: witness.contact ?? ''
    })) || [],
    createdAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
    updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
    createdBy: userName, 
    createdById: userId, 
  };
  
  const { ...saveData } = newCaseData as Case; 


  try {
    const caseCollectionRef = collection(db, "cases");
    const docRef = await addDoc(caseCollectionRef, saveData);
    
    const createdCase: Case = {
      ...saveData,
      id: docRef.id,
    } as Case; 

    await addAuditLogForCaseAction(
      createdCase.id,
      createdCase.roNumber, 
      "CREATE",
      `Case record created: R.O. ${createdCase.roNumber}. Exhibits: ${createdCase.exhibits.length}. Suspects linked: ${createdCase.suspectLinks.length}.`,
      userId,
      userName
    );
    
    if (createdCase.suspectLinks && createdCase.suspectLinks.length > 0) {
      await updateSuspectRecordsWithCaseLink(createdCase.suspectLinks, createdCase.roNumber, userId, userName);
    }
    
    return serializeCaseData(createdCase, createdCase.id);
  } catch (error) {
    console.error("Error creating case in Firestore:", error);
    throw new Error(`Failed to create case: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updateCaseAction(
  id: string,
  data: CaseFormValues
): Promise<Case | null> {
  const { userId, userName } = await getCurrentUser();
  
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
  data.exhibits.map((exhibit) => ({
    ...exhibit,
    uploadedAt: exhibit.uploadedAt ?? '', // Ensure uploadedAt is always a string
  })) as Exhibit[],
  id,
);

    const roNumberString = `${String(data.caseSequenceNumber).padStart(3, '0')}/${data.year}`;

    const updatedCasePayloadFromForm: Partial<Case> = {
      ...data,
      roNumber: roNumberString,
      suspectLinks: data.suspectLinks || [],
      exhibits: finalExhibits,
      witnesses: data.witnesses?.map(witness => ({
        ...witness,
        address: witness.address ?? '',
        contact: witness.contact ?? ''
      })) || [],
      updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
      updatedBy: userName, 
      updatedById: userId, 
    };
    
    const { ...updatedCasePayload } = updatedCasePayloadFromForm;

    await updateDoc(caseDocRef, updatedCasePayload);

    const fullUpdatedCaseData = {
      id: id, 
      ...existingCaseData,
      ...updatedCasePayload,
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

    return serializeCaseData(fullUpdatedCaseData, id);
  } catch (error) {
    console.error(`Error updating case ${id} in Firestore:`, error);
    throw new Error(`Failed to update case: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function deleteCaseAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { userId, userName } = await getCurrentUser();
  const caseDocRef = doc(db, "cases", id);

  try {
    const caseSnap = await getDoc(caseDocRef);
    if (!caseSnap.exists()) {
      return { success: false, message: `Case with ID ${id} not found.` };
    }
    const caseData = caseSnap.data() as Case;
    const roNumber = caseData.roNumber;
    const exhibitStoragePaths = (caseData.exhibits || []).map(ex => ex.storagePath).filter(Boolean) as string[];
    const suspectLinks = caseData.suspectLinks || [];

    // 1. Unlink suspects
    if (suspectLinks.length > 0 && roNumber) {
      const batch = writeBatch(db);
      for (const link of suspectLinks) {
        if (link.type === 'suspect' && link.id) {
          const suspectDocRef = doc(db, "suspectdata", link.id);
          // We don't need to fetch the suspect if we're just removing the RO number.
          // arrayRemove handles non-existent elements gracefully.
          batch.update(suspectDocRef, {
            linkedCaseRoNumbers: arrayRemove(roNumber),
            updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
            updatedBy: userName,
            updatedById: userId,
          });
        }
      }
      await batch.commit();
      console.log(`Successfully unlinked case R.O. ${roNumber} from ${suspectLinks.length} suspects.`);
    }

    // 2. Delete exhibits
    for (const path of exhibitStoragePaths) {
      if (path) await deleteExhibitAction(path);
    }

    // 3. Delete the case document
    await deleteDoc(caseDocRef);
    
    // 4. Add audit log
    await addAuditLogForCaseAction(
      id,
      roNumber,
      "DELETE",
      `Case record R.O. ${roNumber} (ID: ${id}), associated exhibits, and links from suspects permanently deleted.`,
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
    const fetchedCases: Case[] = querySnapshot.docs.map(doc => serializeCaseData(doc.data(), doc.id));
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
      return serializeCaseData(docSnap.data(), docSnap.id);
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

