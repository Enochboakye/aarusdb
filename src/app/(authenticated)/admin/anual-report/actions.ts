
"use server";

import { db } from '@/lib/firebase';
import type { Suspect, CustodyStatus } from '@/types/suspect';
import type { Case } from '@/types/case';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CUSTODY_STATUS_OPTIONS } from '@/lib/constants';

export interface AnnualReportData {
  casesReported: number;
  suspectsRecorded: number;
  suspectsByGender: {
    male: number;
    female: number;
    other: number;
  };
  casesByPriority: {
    low: number;
    medium: number;
    high: number;
    unknown: number; 
  };
  suspectsByCustodyStatus: Record<CustodyStatus, number>;
}

export async function fetchAnnualReportDataAction(year: number): Promise<AnnualReportData> {
  try {
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 5) {
      throw new Error("Invalid year provided.");
    }

    const startDateOfYearStr = new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
    const endDateOfYearStr = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    // Fetch cases
    const casesRef = collection(db, "cases");
    const casesQuery = query(
      casesRef,
      where("dateReported", ">=", startDateOfYearStr),
      where("dateReported", "<=", endDateOfYearStr)
    );
    const casesSnapshot = await getDocs(casesQuery);
    const casesReported = casesSnapshot.size;
    
    const casesByPriority: AnnualReportData['casesByPriority'] = { low: 0, medium: 0, high: 0, unknown: 0 };
    casesSnapshot.docs.forEach(doc => {
      const caseData = doc.data() as Case;
      switch (caseData.priority) {
        case 'Low':
          casesByPriority.low++;
          break;
        case 'Medium':
          casesByPriority.medium++;
          break;
        case 'High':
          casesByPriority.high++;
          break;
        default:
          casesByPriority.unknown++;
          break;
      }
    });

    // Fetch suspects
    const suspectsRef = collection(db, "suspectdata");
    const suspectsQuery = query(
      suspectsRef,
      where("createdAt", ">=", startDateOfYearStr),
      where("createdAt", "<=", endDateOfYearStr)
    );
    const suspectsSnapshot = await getDocs(suspectsQuery);
    const suspectsRecorded = suspectsSnapshot.size;

    const suspectsByGender: AnnualReportData['suspectsByGender'] = { male: 0, female: 0, other: 0 };
    const initialCustodyStatus = CUSTODY_STATUS_OPTIONS.reduce((acc, option) => {
        acc[option.value] = 0;
        return acc;
    }, {} as Record<CustodyStatus, number>);
    
    const suspectsByCustodyStatus = { ...initialCustodyStatus };

    suspectsSnapshot.docs.forEach(doc => {
      const suspectData = doc.data() as Suspect;
      // Tally gender
      switch (suspectData.gender) {
        case 'Male':
          suspectsByGender.male++;
          break;
        case 'Female':
          suspectsByGender.female++;
          break;
        case 'Other':
          suspectsByGender.other++;
          break;
        default:
          break;
      }
      // Tally custody status
      if (suspectData.custodyStatus && suspectsByCustodyStatus.hasOwnProperty(suspectData.custodyStatus)) {
          suspectsByCustodyStatus[suspectData.custodyStatus]++;
      }
    });

    return {
      casesReported,
      suspectsRecorded,
      suspectsByGender,
      casesByPriority,
      suspectsByCustodyStatus,
    };
  } catch (error) {
    console.error(`Error fetching annual report data for year ${year}:`, error);
    throw new Error(`Failed to fetch report data: ${error instanceof Error ? error.message : String(error)}`);
  }
}
