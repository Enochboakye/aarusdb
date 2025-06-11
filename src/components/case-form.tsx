
"use client";

import { Formik, Form as FormikForm, Field, FieldArray, ErrorMessage, type FormikHelpers, type FormikErrors } from "formik";
import type { Case } from "@/types/case";
import type { Suspect } from "@/types/suspect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, Save, Loader2, Briefcase, UserPlus, Paperclip, Trash2, UserSquare, Users2, Camera as CameraIconLucide, AlertTriangle, PlusCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid, getYear } from "date-fns";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { uploadExhibitAction, deleteExhibitAction, getSuspectMatchesForCaseRoAction } from "@/app/(authenticated)/cases/actions";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore"; 
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { FormItem } from "@/components/ui/form";

type FormikSetFieldValue = (field: string, value: unknown, shouldValidate?: boolean) => void;

// Manually defined form values types
export interface ExhibitFormValues {
  id: string;
  name: string;
  url: string; 
  type: string; 
  uploadedAt?: string | undefined;
  storagePath?: string | undefined;
  description?: string | undefined;
  isCameraCapture?: boolean | undefined;
}

export interface ComplainantFormValues {
    name: string;
    contact?: string | undefined;
    address?: string | undefined;
    statement?: string | undefined;
}

export interface WitnessFormValues {
    id?: string | undefined;
    name: string;
    contact?: string | undefined;
    address?: string | undefined;
    statement?: string | undefined;
}

export interface CaseLinkFormValues {
    id: string;
    type: 'suspect';
}

export interface CaseFormValues {
  year: number;
  caseSequenceNumber: number;
  assignedInvestigator: string;
  offence: string;
  briefFacts: string;
  status: 'Open' | 'Pending' | 'Closed' | 'Under Investigation' | 'Cold Case';
  priority: 'Low' | 'Medium' | 'High';
  dateReported: string; 
  dateOccurred?: string | undefined; 
  locationOfOffence?: string | undefined;
  complainant: ComplainantFormValues;
  witnesses: WitnessFormValues[]; 
  suspectLinks: CaseLinkFormValues[]; 
  exhibits: ExhibitFormValues[]; 
}


interface CaseFormProps {
  initialData?: Case | null;
  onSubmitForm: (data: CaseFormValues) => Promise<Case | null | {id: string}>;
  isEditMode?: boolean;
}

const FormikErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {msg => <p className="text-sm font-medium text-destructive mt-1">{msg}</p>}
  </ErrorMessage>
);


function parseRoNumber(roNumberString?: string): { year?: number; sequenceNumber?: number } {
  if (!roNumberString) return {};
  const match = roNumberString.match(/^(\d+)\/(\d{4})$/);
  return match ? { sequenceNumber: parseInt(match[1], 10), year: parseInt(match[2], 10) } : {};
}

const formCurrentYear = getYear(new Date());

export function CaseForm({ initialData, onSubmitForm, isEditMode = false }: CaseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [allSuspects, setAllSuspects] = useState<Suspect[]>([]);
  
  const [uploadProgress, setUploadProgress] = useState<Record<string, { progress: number, name: string }>>({});
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [autoLinkMessage, setAutoLinkMessage] = useState<string | null>(null);
  const [lastProcessedRoNumber, setLastProcessedRoNumber] = useState<string | null>(null);

  // State to hold the target index and setFieldValue for camera capture
  const [cameraTarget, setCameraTarget] = useState<{ index: number; setFieldValue: FormikSetFieldValue } | null>(null);


  const yearOptions = Array.from({ length: 16 }, (_, i) => formCurrentYear - 10 + i).reverse();

  useEffect(() => {
    const fetchSuspects = async () => {
      try {
        const q = query(collection(db, "suspectdata")); 
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Suspect));
        fetched.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        setAllSuspects(fetched);
      } catch (error) {
        console.error("Error fetching suspects:", error);
        toast({ title: "Error", description: "Could not load suspects list.", variant: "destructive" });
      }
    };
    fetchSuspects();
  }, [toast]);

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return isValid(parseISO(dateString)) ? format(parseISO(dateString), "yyyy-MM-dd") : "";
    } catch { return ""; }
  };
  
  const { year: initialYear, sequenceNumber: initialSequenceNumber } = parseRoNumber(initialData?.roNumber);

  const initialFormValues: CaseFormValues = initialData ? {
    ...initialData,
    year: initialData.year || initialYear || formCurrentYear,
    caseSequenceNumber: initialSequenceNumber || 0,
    dateReported: formatDateForInput(initialData.dateReported),
    dateOccurred: formatDateForInput(initialData.dateOccurred),
    complainant: initialData.complainant || { name: "" }, // removed statement default
    witnesses: initialData.witnesses?.map(w => ({...w, id: w.id || crypto.randomUUID() })) || [],
    suspectLinks: initialData.suspectLinks || [],
    exhibits: initialData.exhibits?.map(ex => ({...ex, id: ex.id || crypto.randomUUID()})) || [],
  } : {
    year: formCurrentYear,
    caseSequenceNumber: 0,
    assignedInvestigator: "",
    offence: "",
    briefFacts: "",
    status: "Open",
    priority: "Medium",
    dateReported: format(new Date(), "yyyy-MM-dd"),
    dateOccurred: "",
    locationOfOffence: "",
    complainant: { name: "", contact: "", address: "", statement: "" },
    witnesses: [],
    suspectLinks: [],
    exhibits: [],
  };

  const validateCaseForm = (values: CaseFormValues): FormikErrors<CaseFormValues> => {
    const errors: FormikErrors<CaseFormValues> = {};
    if (!values.year) errors.year = "Year is required.";
    if (!values.caseSequenceNumber || values.caseSequenceNumber <= 0) errors.caseSequenceNumber = "Valid sequence number required.";
    if (!values.assignedInvestigator) errors.assignedInvestigator = "Assigned Investigator is required.";
    if (!values.offence) errors.offence = "Offence type is required.";
    if (!values.briefFacts) errors.briefFacts = "Brief facts are required.";
    if (!values.status) errors.status = "Case Status is required.";
    if (!values.priority) errors.priority = "Priority is required.";
    if (!values.dateReported) errors.dateReported = "Date Reported is required.";

    if (!values.complainant.name) {
        errors.complainant = { ...errors.complainant, name: "Complainant name is required." };
    }
    
    if (values.witnesses.length > 0) {
        const witnessErrorsArray: (FormikErrors<WitnessFormValues> | undefined)[] = [];
        values.witnesses.forEach((witness, index) => {
            const witnessErrors: FormikErrors<WitnessFormValues> = {};
            if(!witness.name) witnessErrors.name = "Witness name is required.";
            if(Object.keys(witnessErrors).length > 0) witnessErrorsArray[index] = witnessErrors;
            else witnessErrorsArray[index] = undefined;
        });
        if (witnessErrorsArray.some(e => !!e)) {
          errors.witnesses = witnessErrorsArray.filter((e): e is FormikErrors<WitnessFormValues> => !!e);
        }
    }

    if (values.suspectLinks.length > 0) {
        const linkErrorsArray: (FormikErrors<CaseLinkFormValues> | undefined)[] = [];
        values.suspectLinks.forEach((link, index) => {
            const linkErrors: FormikErrors<CaseLinkFormValues> = {};
            if(!link.id) linkErrors.id = "Suspect selection is required.";
            if(Object.keys(linkErrors).length > 0) linkErrorsArray[index] = linkErrors;
            else linkErrorsArray[index] = undefined;
        });
        if (linkErrorsArray.some(e => !!e)) errors.suspectLinks = linkErrorsArray.filter((e): e is FormikErrors<CaseLinkFormValues> => !!e);
    }
    
    if (values.exhibits.length > 0) {
        const exhibitErrorsArray: (FormikErrors<ExhibitFormValues> | undefined)[] = [];
        values.exhibits.forEach((exhibit, index) => {
            const exhibitErrors: FormikErrors<ExhibitFormValues> = {};
            if(!exhibit.name) exhibitErrors.name = "Exhibit name is required.";
            if(!exhibit.url) exhibitErrors.url = "Exhibit file/capture is required.";
            if(!exhibit.type) exhibitErrors.type = "Exhibit type is required.";
            if(Object.keys(exhibitErrors).length > 0) exhibitErrorsArray[index] = exhibitErrors;
            else exhibitErrorsArray[index] = undefined;
        });
        if (exhibitErrorsArray.some(e => !!e)) errors.exhibits = exhibitErrorsArray as FormikErrors<ExhibitFormValues>[];
    }
    return errors;
  };

  const handleFileUploadForExhibit = async (file: File, exhibitIndex: number, setFieldValue: FormikSetFieldValue) => {
    if (!file) return;
    const caseIdForUpload = initialData?.id || "new_case_temp_" + Date.now();
    const tempId = `file-${exhibitIndex}-${file.name}-${Date.now()}`;
    let uploadInterval: NodeJS.Timeout | undefined;

    setUploadProgress(prev => ({ ...prev, [tempId]: { progress: 0, name: file.name } }));
    try {
      uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentEntry = prev[tempId];
          if (!currentEntry || currentEntry.progress >= 90) { if (uploadInterval) clearInterval(uploadInterval); return prev; }
          return { ...prev, [tempId]: { ...currentEntry, progress: currentEntry.progress + 10 } };
        });
      }, 100);

      const uploadedExhibitData = await uploadExhibitAction(file, caseIdForUpload);
      if (uploadInterval) clearInterval(uploadInterval);
      
      setFieldValue(`exhibits.${exhibitIndex}.name`, uploadedExhibitData.name);
      setFieldValue(`exhibits.${exhibitIndex}.url`, uploadedExhibitData.url);
      setFieldValue(`exhibits.${exhibitIndex}.type`, uploadedExhibitData.type);
      setFieldValue(`exhibits.${exhibitIndex}.uploadedAt`, uploadedExhibitData.uploadedAt);
      setFieldValue(`exhibits.${exhibitIndex}.storagePath`, uploadedExhibitData.storagePath);
      setFieldValue(`exhibits.${exhibitIndex}.isCameraCapture`, false);

      setUploadProgress(prev => ({ ...prev, [tempId]: { ...prev[tempId], progress: 100 } }));
      toast({ title: "Exhibit Uploaded", description: `${file.name} uploaded successfully.` });
      setTimeout(() => setUploadProgress(prev => { const newProg = { ...prev }; delete newProg[tempId]; return newProg; }), 2000);
    } catch (error) {
      if (uploadInterval) clearInterval(uploadInterval);
      console.error("Exhibit upload error:", error);
      toast({ title: "Upload Error", description: `Failed to upload ${file.name}.`, variant: "destructive" });
      setUploadProgress(prev => { const newProg = { ...prev }; delete newProg[tempId]; return newProg; });
    }
  };

  const openCameraForExhibit = (index: number, setFieldValue: FormikSetFieldValue) => {
    setCameraTarget({ index, setFieldValue });
    setIsCameraDialogOpen(true);
    setHasCameraPermission(null);
  };

  useEffect(() => {
    if (isCameraDialogOpen && cameraTarget !== null) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(mediaStream => { setCameraStream(mediaStream); setHasCameraPermission(true); if (videoRef.current) videoRef.current.srcObject = mediaStream; })
        .catch(() => { setHasCameraPermission(false); setCameraStream(null); toast({ variant: 'destructive', title: 'Camera Access Denied' }); });
    } else {
      if (cameraStream) { cameraStream.getTracks().forEach(track => track.stop()); setCameraStream(null); }
    }
    return () => { if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraDialogOpen, cameraTarget]); // Added cameraTarget to dependency array

  const handleCaptureImageForExhibit = (setFieldValue: FormikSetFieldValue, exhibitIndex: number | null) => {
    if (videoRef.current && canvasRef.current && exhibitIndex !== null && cameraStream) {
      const video = videoRef.current; const canvas = canvasRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      setFieldValue(`exhibits.${exhibitIndex}.name`, `Camera Capture - ${format(new Date(), "yyyyMMdd_HHmmss")}.jpg`);
      setFieldValue(`exhibits.${exhibitIndex}.url`, dataUrl);
      setFieldValue(`exhibits.${exhibitIndex}.type`, 'image/jpeg');
      setFieldValue(`exhibits.${exhibitIndex}.uploadedAt`, new Date().toISOString());
      setFieldValue(`exhibits.${exhibitIndex}.storagePath`, ''); 
      setFieldValue(`exhibits.${exhibitIndex}.isCameraCapture`, true);
      toast({title: "Image Captured", description: `Image captured for exhibit ${exhibitIndex + 1}.`});
      setIsCameraDialogOpen(false); // Close dialog after capture
    }
  };

  const handleExhibitDelete = async (
    index: number,
    values: CaseFormValues,
    arrayHelpers: import("formik").FieldArrayRenderProps
  ) => { 
    const exhibitToDelete = values.exhibits[index];
    if (exhibitToDelete.storagePath && !exhibitToDelete.isCameraCapture) { 
      try { await deleteExhibitAction(exhibitToDelete.storagePath); } catch (error) { console.error("Error deleting exhibit from storage:", error); }
    }
    arrayHelpers.remove(index);
    toast({ title: "Exhibit Removed", description: `Exhibit ${index + 1} removed.` });
  };

  const handleSubmitHandler = async (values: CaseFormValues, { setSubmitting, resetForm }: FormikHelpers<CaseFormValues>) => {
    setSubmitting(true);
    setAutoLinkMessage(null);
    try {
      const result = await onSubmitForm(values);
      const roNumber = `${String(values.caseSequenceNumber).padStart(3, '0')}/${values.year}`;
      toast({ title: `Case Record ${isEditMode ? 'Updated' : 'Created'}`, description: `R.O. ${roNumber} ${isEditMode ? 'saved' : 'created'}.` });
      
      const caseIdToRedirect = (result as Case)?.id || (result as {id:string})?.id || initialData?.id;
      if (caseIdToRedirect) router.push(`/cases/${caseIdToRedirect}`);
      else router.push('/cases');
      
      router.refresh();
      if (!isEditMode) {
         resetForm({values: initialFormValues}); 
         setLastProcessedRoNumber(null);
      }
    } catch (error) {
      console.error("Case form submission error:", error);
      toast({ title: "Error", description: `Failed to ${isEditMode ? 'update' : 'create'} case: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const performAutoLink = async (roNumber: string, currentLinks: CaseLinkFormValues[], setFieldValue: FormikSetFieldValue) => {
    if (roNumber === lastProcessedRoNumber) return;
    setLastProcessedRoNumber(roNumber);
    setAutoLinkMessage(null);
    try {
      const matchedSuspects = await getSuspectMatchesForCaseRoAction(roNumber);
      if (matchedSuspects.length > 0) {
        const currentLinkIds = new Set(currentLinks.map(link => link.id));
        const newLinksToSuggest = matchedSuspects
          .filter(s => !currentLinkIds.has(s.id))
          .map(s => ({ id: s.id, type: 'suspect' as const }));

        if (newLinksToSuggest.length > 0) {
          setFieldValue('suspectLinks', [...currentLinks, ...newLinksToSuggest]);
          
          const newSuspectDetails = matchedSuspects
            .filter(ms => !allSuspects.some(as => as.id === ms.id))
            .map(ms => ({ ...ms, linkedCaseRoNumbers: [roNumber] } as Suspect)); 

          if (newSuspectDetails.length > 0) {
            setAllSuspects(prev => [...prev, ...newSuspectDetails]);
          }

          const names = newLinksToSuggest.map(link => (allSuspects.find(s => s.id === link.id) || matchedSuspects.find(ms => ms.id === link.id))?.fullName || `ID: ${link.id.substring(0,6)}...`).join(', ');
          setAutoLinkMessage(`Suggested linking: ${names} (based on R.O. ${roNumber}). Review and confirm.`);
        }
      }
    } catch (error) { console.error("Error auto-linking suspects:", error); }
  };

  // Move these refs to the top level of the component
  const setFieldValueRef = useRef<FormikSetFieldValue | null>(null);
  const suspectLinksRef = useRef<CaseLinkFormValues[] | null>(null);
  const currentCaseRoNumberRef = useRef<string | null>(null);

  // This effect handles auto-linking suspects based on R.O. number
  useEffect(() => {
    if (!currentCaseRoNumberRef.current) {
      setLastProcessedRoNumber(null);
      setAutoLinkMessage(null);
      return;
    }
    const debounceTimeout = setTimeout(() => {
      if (
        currentCaseRoNumberRef.current &&
        setFieldValueRef.current &&
        suspectLinksRef.current
      ) {
        performAutoLink(
          currentCaseRoNumberRef.current,
          suspectLinksRef.current,
          setFieldValueRef.current
        );
      }
    }, 700);
    return () => clearTimeout(debounceTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* dependencies will be set in Formik render */]);

  return (
    <>
    <Formik
      initialValues={initialFormValues}
      validate={validateCaseForm}
      onSubmit={handleSubmitHandler}
      enableReinitialize
    >
      {(formikProps) => {
        const { values, isSubmitting, setFieldValue, dirty, isValid: formikIsValid } = formikProps;
        const currentCaseRoNumber = (values.year && values.caseSequenceNumber && String(values.caseSequenceNumber).length > 0) 
          ? `${String(values.caseSequenceNumber).padStart(3, '0')}/${values.year}` 
          : null;

        // Keep refs updated with latest values inside the callback
        setFieldValueRef.current = setFieldValue;
        suspectLinksRef.current = values.suspectLinks;
        currentCaseRoNumberRef.current = currentCaseRoNumber;

        // The useEffect for auto-linking is now outside the callback

        return (
          <FormikForm className="space-y-10">
            <div className="space-y-6 border-b pb-8">
              <div className="flex items-center space-x-3"><Briefcase className="h-6 w-6 text-primary" /><h3 className="text-xl font-semibold text-foreground">Basic Case Information</h3></div>
              <p className="text-sm text-muted-foreground">R.O. Number will be NNN/YYYY.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                <FormItem>
                  <Label htmlFor="year">Year *</Label>
                  <Select onValueChange={(v) => setFieldValue('year', parseInt(v,10))} value={String(values.year || "")} disabled={isSubmitting}>
                    <SelectTrigger id="year"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormikErrorMessage name="year"/>
                </FormItem>
                <FormItem>
                  <Label htmlFor="caseSequenceNumber">Case Sequence Number for Year *</Label>
                  <Field as={Input} type="number" name="caseSequenceNumber" id="caseSequenceNumber" placeholder="e.g., 1, 23" disabled={isSubmitting} />
                  <FormikErrorMessage name="caseSequenceNumber"/>
                </FormItem>
                <FormItem>
                  <Label htmlFor="assignedInvestigator">Assigned Investigator *</Label>
                  <Field as={Input} name="assignedInvestigator" id="assignedInvestigator" placeholder="Officer's Name/ID" disabled={isSubmitting}/>
                  <FormikErrorMessage name="assignedInvestigator"/>
                </FormItem>
                <FormItem>
                  <Label htmlFor="offence">Offence Type *</Label>
                  <Field as={Input} name="offence" id="offence" placeholder="e.g., Armed Robbery" disabled={isSubmitting}/>
                  <FormikErrorMessage name="offence"/>
                </FormItem>
                <FormItem>
                  <Label htmlFor="status">Case Status *</Label>
                  <Select onValueChange={(v) => setFieldValue('status', v)} value={values.status} disabled={isSubmitting}>
                    <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>{['Open', 'Pending', 'Closed', 'Under Investigation', 'Cold Case'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormikErrorMessage name="status"/>
                </FormItem>
                <FormItem>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select onValueChange={(v) => setFieldValue('priority', v)} value={values.priority} disabled={isSubmitting}>
                    <SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>{['Low', 'Medium', 'High'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormikErrorMessage name="priority"/>
                </FormItem>
                <FormItem className="flex flex-col">
                  <Label htmlFor="dateReported">Date Reported *</Label>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" id="dateReported" className={cn("w-full text-left", !values.dateReported && "text-muted-foreground")} disabled={isSubmitting}>
                      {values.dateReported && isValid(parseISO(values.dateReported)) ? format(parseISO(values.dateReported), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={values.dateReported ? parseISO(values.dateReported) : undefined} onSelect={(d) => setFieldValue('dateReported', d ? format(d, "yyyy-MM-dd"):"")} initialFocus /></PopoverContent>
                  </Popover>
                  <FormikErrorMessage name="dateReported"/>
                </FormItem>
                 <FormItem className="flex flex-col">
                  <Label htmlFor="dateOccurred">Date Occurred (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" id="dateOccurred" className={cn("w-full text-left", !values.dateOccurred && "text-muted-foreground")} disabled={isSubmitting}>
                      {values.dateOccurred && isValid(parseISO(values.dateOccurred)) ? format(parseISO(values.dateOccurred), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={values.dateOccurred ? parseISO(values.dateOccurred) : undefined} onSelect={(d) => setFieldValue('dateOccurred', d ? format(d, "yyyy-MM-dd"):"")} initialFocus /></PopoverContent>
                  </Popover>
                  <FormikErrorMessage name="dateOccurred"/>
                </FormItem>
                <FormItem className="md:col-span-2 lg:col-span-3">
                  <Label htmlFor="locationOfOffence">Location of Offence</Label>
                  <Field as={Input} name="locationOfOffence" id="locationOfOffence" placeholder="e.g., Adum, Kumasi" disabled={isSubmitting}/>
                  <FormikErrorMessage name="locationOfOffence"/>
                </FormItem>
                <FormItem className="md:col-span-full">
                  <Label htmlFor="briefFacts">Brief Facts *</Label>
                  <Field as={Textarea} name="briefFacts" id="briefFacts" placeholder="Summarize case facts..." rows={5} disabled={isSubmitting}/>
                  <FormikErrorMessage name="briefFacts"/>
                </FormItem>
              </div>
            </div>

            <div className="space-y-6 border-b pb-8">
                <h3 className="text-xl font-semibold text-foreground flex items-center"><UserSquare className="mr-2 h-5 w-5 text-primary" />Complainant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <FormItem>
                        <Label htmlFor="complainant.name">Full Name *</Label>
                        <Field as={Input} name="complainant.name" id="complainant.name" placeholder="Complainant's full name" disabled={isSubmitting}/>
                        <FormikErrorMessage name="complainant.name"/>
                    </FormItem>
                    <FormItem>
                        <Label htmlFor="complainant.contact">Contact (Phone/Email)</Label>
                        <Field as={Input} name="complainant.contact" id="complainant.contact" placeholder="Complainant's contact" disabled={isSubmitting}/>
                        <FormikErrorMessage name="complainant.contact"/>
                    </FormItem>
                    <FormItem className="md:col-span-2">
                        <Label htmlFor="complainant.address">Address</Label>
                        <Field as={Input} name="complainant.address" id="complainant.address" placeholder="Complainant's address" disabled={isSubmitting}/>
                        <FormikErrorMessage name="complainant.address"/>
                    </FormItem>
                    <FormItem className="md:col-span-2">
                        <Label htmlFor="complainant.statement">Brief Statement (Complainant)</Label>
                        <Field as={Textarea} name="complainant.statement" id="complainant.statement" placeholder="Summary of complainant's statement" rows={3} disabled={isSubmitting}/>
                        <FormikErrorMessage name="complainant.statement"/>
                    </FormItem>
                </div>
            </div>
            
            <div className="space-y-6 border-b pb-8">
              <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-foreground flex items-center"><Users2 className="mr-2 h-5 w-5 text-primary" />Witnesses</h3>
                  <FieldArray name="witnesses">
                      {({ push }) => <Button type="button" variant="outline" size="sm" onClick={() => push({ id: crypto.randomUUID(), name: "", contact: "", address: "", statement: "" })} disabled={isSubmitting}><UserPlus className="mr-2 h-4 w-4" /> Add Witness</Button>}
                  </FieldArray>
              </div>
              <FieldArray name="witnesses">
                {({ remove: removeWitness }) => (
                  values.witnesses.map((witness, index) => (
                    <div key={witness.id || index} className="space-y-4 p-4 border rounded-md shadow-sm relative">
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeWitness(index)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                      <h4 className="font-medium text-md">Witness {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormItem>
                          <Label htmlFor={`witnesses.${index}.name`}>Full Name *</Label>
                          <Field as={Input} name={`witnesses.${index}.name`} id={`witnesses.${index}.name`} placeholder="Witness name" disabled={isSubmitting}/>
                          <FormikErrorMessage name={`witnesses.${index}.name`}/>
                        </FormItem>
                        <FormItem>
                          <Label htmlFor={`witnesses.${index}.contact`}>Contact</Label>
                          <Field as={Input} name={`witnesses.${index}.contact`} id={`witnesses.${index}.contact`} placeholder="Witness contact" disabled={isSubmitting}/>
                           <FormikErrorMessage name={`witnesses.${index}.contact`}/>
                        </FormItem>
                        <FormItem className="md:col-span-2">
                          <Label htmlFor={`witnesses.${index}.address`}>Address</Label>
                          <Field as={Input} name={`witnesses.${index}.address`} id={`witnesses.${index}.address`} placeholder="Witness address" disabled={isSubmitting}/>
                           <FormikErrorMessage name={`witnesses.${index}.address`}/>
                        </FormItem>
                        <FormItem className="md:col-span-2">
                          <Label htmlFor={`witnesses.${index}.statement`}>Brief Statement</Label>
                          <Field as={Textarea} name={`witnesses.${index}.statement`} id={`witnesses.${index}.statement`} placeholder="Summary of witness statement" rows={2} disabled={isSubmitting}/>
                          <FormikErrorMessage name={`witnesses.${index}.statement`}/>
                        </FormItem>
                      </div>
                    </div>
                  ))
                )}
              </FieldArray>
              {values.witnesses.length === 0 && <p className="text-sm text-muted-foreground">No witnesses added yet.</p>}
            </div>

            <div className="space-y-6 border-b pb-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-foreground">Linked Suspects</h3>
                <FieldArray name="suspectLinks">
                    {({ push }) => <Button type="button" variant="outline" size="sm" onClick={() => push({ id: "", type: "suspect" })} disabled={isSubmitting}><UserPlus className="mr-2 h-4 w-4" /> Link Suspect Manually</Button>}
                </FieldArray>
              </div>
              {autoLinkMessage && <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700"><Info className="h-4 w-4 text-blue-600 dark:text-blue-400" /><AlertTitle className="text-blue-700 dark:text-blue-300">Automatic Link Suggestion</AlertTitle><AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">{autoLinkMessage}</AlertDescription></Alert>}
              <FieldArray name="suspectLinks">
                {({ remove: removeLink }) => (
                  values.suspectLinks.map((link, index) => {
                    const currentSelectedIdInThisSlot = values.suspectLinks[index].id;
                    const optionsForThisDropdown = allSuspects.filter(s => {
                        const isSelectedElsewhere = values.suspectLinks.some((otherLink, otherIndex) => otherIndex !== index && otherLink.id === s.id);
                        if (isSelectedElsewhere) return false;
                        if (currentCaseRoNumber) return s.id === currentSelectedIdInThisSlot || s.linkedCaseRoNumbers?.includes(currentCaseRoNumber);
                        return true;
                    });
                    optionsForThisDropdown.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
                    return (
                      <div key={link.id || index} className="flex items-end space-x-2 p-3 border rounded-md">
                        <FormItem className="flex-grow">
                          <Label htmlFor={`suspectLinks.${index}.id`}>Suspect {index + 1}</Label>
                          <Select onValueChange={(val) => setFieldValue(`suspectLinks.${index}.id`, val)} value={link.id} disabled={isSubmitting}>
                            <SelectTrigger id={`suspectLinks.${index}.id`}><SelectValue placeholder={currentCaseRoNumber ? "Select suspect matching R.O." : "Select suspect"} /></SelectTrigger>
                            <SelectContent>
                              {optionsForThisDropdown.length > 0 ? optionsForThisDropdown.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} (ID: {s.id.substring(0,6)}...)</SelectItem>) : <div className="px-2 py-1.5 text-sm text-muted-foreground">{currentCaseRoNumber ? `No suspects match R.O.` : "No suspects available."}</div>}
                            </SelectContent>
                          </Select>
                          <FormikErrorMessage name={`suspectLinks.${index}.id`}/>
                        </FormItem>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeLink(index)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    );
                  })
                )}
              </FieldArray>
              {values.suspectLinks.length === 0 && <p className="text-sm text-muted-foreground">No suspects linked. Suspects matching R.O. number will be suggested.</p>}
              <p className="text-sm text-muted-foreground">Manually link suspects or review auto-suggested links.</p>
            </div>

            <div className="space-y-6 border-b pb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-foreground flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary" />Exhibits</h3>
                    <FieldArray name="exhibits">
                        {({ push }) => <Button type="button" variant="outline" size="sm" onClick={() => push({ id: crypto.randomUUID(), name: "", url: "", type: "", description: "", storagePath: "", uploadedAt: new Date().toISOString(), isCameraCapture: false })} disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4" /> Add Exhibit Item</Button>}
                    </FieldArray>
                </div>
                <FieldArray name="exhibits">
                  {(arrayHelpers) => (
                    values.exhibits.map((exhibit, index) => (
                        <div key={exhibit.id} className="p-4 border rounded-md shadow-sm space-y-4 relative">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => handleExhibitDelete(index, values, arrayHelpers)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                            <h4 className="font-medium text-md">Exhibit {index + 1}</h4>
                            {exhibit.url && (<div className="my-2">{exhibit.type?.startsWith("image/") ? <Image src={exhibit.url} alt={`Exhibit ${index+1}`} width={100} height={100} className="rounded-md border object-cover aspect-square" data-ai-hint="evidence document" /> : <a href={exhibit.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{exhibit.name || "View File"}</a>}</div>)}
                            <FormItem>
                                <Label htmlFor={`exhibits.${index}.description`}>Description</Label>
                                <Field as={Textarea} name={`exhibits.${index}.description`} id={`exhibits.${index}.description`} placeholder="Describe the exhibit..." disabled={isSubmitting}/>
                                <FormikErrorMessage name={`exhibits.${index}.description`}/>
                            </FormItem>
                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                                <FormItem className="w-full">
                                    <Label htmlFor={`exhibits.${index}.file`} className="text-xs">Upload File (Name Required)</Label>
                                    <Input type="file" id={`exhibits.${index}.file`} onChange={(e) => { if (e.target.files?.[0]) { if(!values.exhibits[index].name) setFieldValue(`exhibits.${index}.name`, e.target.files[0].name); setFieldValue(`exhibits.${index}.type`, e.target.files[0].type); handleFileUploadForExhibit(e.target.files[0], index, setFieldValue);}}} className="block w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" disabled={isSubmitting} />
                                </FormItem>
                                <div className="w-full sm:w-auto"><Label className="text-xs">&nbsp;</Label><Button type="button" variant="outline" onClick={() => openCameraForExhibit(index, setFieldValue)} className="w-full text-xs" disabled={isSubmitting}><CameraIconLucide className="mr-1.5 h-3.5 w-3.5" /> Use Camera</Button></div>
                            </div>
                            <Field name={`exhibits.${index}.name`} type="hidden" /> <FormikErrorMessage name={`exhibits.${index}.name`}/>
                            <Field name={`exhibits.${index}.url`} type="hidden" /> <FormikErrorMessage name={`exhibits.${index}.url`}/>
                            <Field name={`exhibits.${index}.type`} type="hidden" /> <FormikErrorMessage name={`exhibits.${index}.type`}/>
                        </div>
                    ))
                  )}
                </FieldArray>
                {Object.entries(uploadProgress).map(([key, {progress, name}]) => progress < 100 && (<div key={key} className="mt-2"><Progress value={progress} className="w-full h-1.5" /><p className="text-xs text-muted-foreground">Uploading {name}... {progress}%</p></div>))}
                {values.exhibits.length === 0 && <p className="text-sm text-muted-foreground">No exhibits added yet.</p>}
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || (isEditMode && !dirty) || !formikIsValid}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? "Save Changes" : "Create Case Record"}</>}
              </Button>
            </div>
          </FormikForm>
        );
      }}
    </Formik>

    <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Capture Image for Exhibit {cameraTarget !== null ? cameraTarget.index + 1 : ''}</DialogTitle></DialogHeader>
            <div className="py-4">
                {hasCameraPermission === false && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions.</AlertDescription></Alert>}
                {hasCameraPermission === null && !cameraStream && <div className="flex items-center justify-center h-64"><Loader2 className="mr-2 h-8 w-8 animate-spin" /> <p>Requesting camera...</p></div>}
                <video ref={videoRef} className={cn("w-full aspect-video rounded-md bg-muted", { 'hidden': !cameraStream || hasCameraPermission === false })} autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden"></canvas>
                 {!cameraStream && hasCameraPermission === true && <div className="flex items-center justify-center h-64"><Loader2 className="mr-2 h-8 w-8 animate-spin" /> <p>Starting camera...</p></div>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCameraDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => {
                    if (cameraTarget) {
                        handleCaptureImageForExhibit(cameraTarget.setFieldValue, cameraTarget.index);
                    } else {
                        toast({ title: "Capture Error", description: "Camera target not set.", variant: "destructive"});
                    }
                }} disabled={!cameraStream || hasCameraPermission !== true || !cameraTarget}>
                    <CameraIconLucide className="mr-2 h-4 w-4" /> Capture
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  )
}
