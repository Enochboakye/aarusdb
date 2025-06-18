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