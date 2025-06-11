
"use client"

import { Formik, Form as FormikForm, Field, FieldArray, ErrorMessage, type FormikHelpers, type FormikErrors } from "formik";
import type { Suspect, CustodyStatus, Gender, EducationLevel, MaritalStatus, SuspectFormValues } from "@/types/suspect";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, Save, Loader2, UserCog, UserPlus, Edit3, XCircle, Phone as PhoneIcon, ClipboardList, Landmark, Ruler, PlusCircle, Trash2, Gavel, Camera as CameraIconLucide, Upload, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { GENDERS, EDUCATION_LEVELS, MARITAL_STATUSES, NATIONALITIES, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, PHYSICAL_MARK_OPTIONS, CUSTODY_STATUS_OPTIONS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { FormItem } from "@/components/ui/form";

type FormikSetFieldValue = (field: string, value: any, shouldValidate?: boolean) => void;

interface SuspectFormProps {
  initialData?: Suspect | null;
  onSubmitForm: (data: SuspectFormValues) => Promise<Suspect | null>;
  isEditMode?: boolean;
}

const FormikErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {msg => <p className="text-sm font-medium text-destructive mt-1">{msg}</p>}
  </ErrorMessage>
);


export function SuspectForm({ initialData, onSubmitForm, isEditMode = false }: SuspectFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(initialData?.profileImageUrl || null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  const [cameraCaptureActions, setCameraCaptureActions] = useState<{ setFieldValue: FormikSetFieldValue } | null>(null);


  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const parsedDate = parseISO(dateString);
      if (isValid(parsedDate)) {
        return format(parsedDate, "yyyy-MM-dd");
      }
    } catch { /* ignore */ }
    return "";
  };

  const getInitialPhysicalMarks = (): string[] => {
    if (!initialData?.physicalMarks) return [];
    return Array.isArray(initialData.physicalMarks) ? initialData.physicalMarks : [];
  };

  const initialFormValues: SuspectFormValues = initialData ? {
    ...initialData,
    physicalMarks: getInitialPhysicalMarks(),
    phoneNumbers: initialData.phoneNumbers || [],
    offences: initialData.offences || [],
    smokes: initialData.smokes || false,
    drinksAlcohol: initialData.drinksAlcohol || false,
    dateOfBirth: formatDateForInput(initialData.dateOfBirth),
    emailAddress: initialData.emailAddress || "",
    assignedInvestigator: initialData.assignedInvestigator || "",
    nickname: initialData.nickname || "",
    profileImageUrl: initialData.profileImageUrl || "",
    profileImageStoragePath: initialData.profileImageStoragePath || "",
    linkedRoNumber: (initialData.linkedCaseRoNumbers && initialData.linkedCaseRoNumbers.length > 0) ? initialData.linkedCaseRoNumbers[0] : "",
    skinTone: initialData.skinTone || "",
    hairStyle: initialData.hairStyle || "",
    hairColor: initialData.hairColor || "",
    eyeColor: initialData.eyeColor || "",
    custodyStatus: initialData.custodyStatus || "Unknown",
    custodyLocation: initialData.custodyLocation || "",
    height: initialData.height || "",
  } : {
    fullName: "",
    nickname: "",
    gender: undefined as unknown as Gender,
    nationality: undefined as unknown as string,
    maritalStatus: undefined as unknown as MaritalStatus,
    educationLevel: "None",
    custodyStatus: "Unknown",
    height: "",
    dateOfBirth: "",
    placeOfBirth: "",
    hometown: "",
    residentialAddress: "",
    occupation: "",
    emailAddress: "",
    phoneNumbers: [],
    assignedInvestigator: "",
    physicalMarks: [],
    offences: [],
    languagesSpoken: "",
    smokes: false,
    drinksAlcohol: false,
    profileImageUrl: "",
    profileImageStoragePath: "",
    linkedRoNumber: "",
    skinTone: "",
    hairStyle: "",
    hairColor: "",
    eyeColor: "",
    custodyLocation: "",
  };

  const validateForm = (values: SuspectFormValues): FormikErrors<SuspectFormValues> => {
    const errors: FormikErrors<SuspectFormValues> = {};
    if (!values.fullName) errors.fullName = "Full name is required.";
    else if (values.fullName.length < 2) errors.fullName = "Full name must be at least 2 characters.";
    else if (values.fullName.length > 100) errors.fullName = "Full name cannot exceed 100 characters.";

    if (values.nickname && values.nickname.length > 50) errors.nickname = "Nickname cannot exceed 50 characters.";
    if (!values.gender) errors.gender = "Gender is required.";
    if (!values.dateOfBirth) errors.dateOfBirth = "Date of Birth is required.";
    if (!values.nationality) errors.nationality = "Nationality is required.";
    if (!values.placeOfBirth) errors.placeOfBirth = "Place of birth is required.";
    if (!values.hometown) errors.hometown = "Hometown is required.";
    if (!values.residentialAddress) errors.residentialAddress = "Residential address is required.";
    if (!values.educationLevel) errors.educationLevel = "Education level is required.";
    if (!values.maritalStatus) errors.maritalStatus = "Marital status is required.";
    if (!values.occupation) errors.occupation = "Occupation is required.";
    if (values.emailAddress && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.emailAddress)) {
      errors.emailAddress = "Invalid email address.";
    }
    if (!values.languagesSpoken) errors.languagesSpoken = "Languages spoken is required.";

    if (values.phoneNumbers && values.phoneNumbers.length > 0) {
      const phoneErrors: (string | undefined)[] = [];
      values.phoneNumbers.forEach((phone, index) => {
        if (!phone || phone.trim() === "") {
          phoneErrors[index] = "Phone number cannot be empty if added.";
        } else if (phone.length > 20) {
          phoneErrors[index] = "Phone number is too long.";
        } else {
          phoneErrors[index] = undefined;
        }
      });
      if (phoneErrors.some(e => !!e)) {
        errors.phoneNumbers = phoneErrors.filter((e): e is string => typeof e === "string");
      }
    }

    if (values.offences && values.offences.length > 0) {
      const offenceErrors: (string | undefined)[] = [];
      values.offences.forEach((offence, index) => {
        if (!offence || offence.trim() === "") {
          offenceErrors[index] = "Offence description cannot be empty if added.";
        } else if (offence.length < 3) {
           offenceErrors[index] = "Offence must be at least 3 characters.";
        } else if (offence.length > 500) {
           offenceErrors[index] = "Offence description is too long.";
        } else {
          offenceErrors[index] = undefined;
        }
      });
      if (offenceErrors.some(e => !!e)) {
        errors.offences = offenceErrors as string[];
      }
    }
    if (values.linkedRoNumber && !/^(\d{1,4}\/\d{4})?$/.test(values.linkedRoNumber)) {
      errors.linkedRoNumber = "R.O. Number must be in NNN/YYYY format or empty."
    }

    return errors;
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: FormikSetFieldValue) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image Too Large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        updateImageState(result, setFieldValue);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateImageState = (dataUrl: string, setFieldValue: FormikSetFieldValue) => {
    setFieldValue('profileImageUrl', dataUrl);
    setFieldValue('profileImageStoragePath', undefined); // Clear storage path as this is new data
    setProfileImagePreview(dataUrl);
  };

  const clearImage = (setFieldValue: FormikSetFieldValue) => {
    const fileInput = document.getElementById('profileImageFile') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    setFieldValue('profileImageUrl', "");
    setFieldValue('profileImageStoragePath', null); // Use null for Firestore compatibility
    setProfileImagePreview(null);
  };

  const openCameraDialog = useCallback((setFieldValueFromForm: FormikSetFieldValue) => {
    setCameraCaptureActions({ setFieldValue: setFieldValueFromForm });
    setIsCameraDialogOpen(true);
    setHasCameraPermission(null); // Reset permission status on dialog open
  }, []);


  useEffect(() => {
    let streamToCleanUp: MediaStream | null = null;

    if (isCameraDialogOpen) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(mediaStream => {
          streamToCleanUp = mediaStream;
          setActiveStream(mediaStream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch(error => {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setActiveStream(null);
          toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in your browser settings.' });
        });
    } else {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        setActiveStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (streamToCleanUp) {
        streamToCleanUp.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraDialogOpen, toast, activeStream]);

  const handleCaptureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current && activeStream && cameraCaptureActions?.setFieldValue) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      updateImageState(dataUrl, cameraCaptureActions.setFieldValue);
      setIsCameraDialogOpen(false);
    } else {
        toast({ title: "Capture Error", description: "Could not capture image. Camera or form actions not ready.", variant: "destructive" });
    }
  }, [activeStream, cameraCaptureActions, toast]);

  const twentyFiveYearsAgo = new Date();
  twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);

  const handleSubmitHandler = async (values: SuspectFormValues, { setSubmitting, resetForm }: FormikHelpers<SuspectFormValues>) => {
    setSubmitting(true);
    try {
      const result = await onSubmitForm(values);
      let suspectIdToRedirect: string | null = null;
      if (result && 'id' in result && typeof result.id === 'string') suspectIdToRedirect = result.id;
      else if (isEditMode && initialData?.id) suspectIdToRedirect = initialData.id;

      toast({
        title: `Suspect Record ${isEditMode ? 'Updated' : 'Created'}`,
        description: `${values.fullName}'s record has been successfully ${isEditMode ? 'saved' : 'created'}.${values.linkedRoNumber ? ` Attempted to link to case ${values.linkedRoNumber}.` : ''}`,
      });

      if (suspectIdToRedirect) router.push(`/suspects/${suspectIdToRedirect}`);
      else router.push('/dashboard');

      router.refresh();
      if (!isEditMode) {
        resetForm({ values: initialFormValues });
        setProfileImagePreview(null);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({ title: "Error", description: `Failed to ${isEditMode ? 'update' : 'create'} suspect record: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Formik
        initialValues={initialFormValues}
        validate={validateForm}
        onSubmit={handleSubmitHandler}
        enableReinitialize
      >
        {({ values,  isSubmitting: formikSubmitting, setFieldValue,  dirty, isValid: formikIsValid }) => (
          <FormikForm className="space-y-10">
            <div className="space-y-6 border-b pb-8">
              <div className="flex items-center space-x-3">
                {isEditMode ? <Edit3 className="h-6 w-6 text-primary" /> : <UserPlus className="h-6 w-6 text-primary" />}
                <h3 className="text-xl font-semibold text-foreground">
                  {isEditMode ? "Edit Suspect Details" : "Personal Information"}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                <FormItem>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Field as={Input} name="fullName" id="fullName" placeholder="Enter full name" disabled={formikSubmitting} />
                  <FormikErrorMessage name="fullName" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="nickname">Nickname/Alias</Label>
                  <Field as={Input} name="nickname" id="nickname" placeholder="Enter nickname (if any)" disabled={formikSubmitting}/>
                  <FormikErrorMessage name="nickname" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => setFieldValue('gender', value)} value={values.gender ?? ""} disabled={formikSubmitting}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>{GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormikErrorMessage name="gender" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="height">Height</Label>
                  <Field as={Input} name="height" id="height" placeholder="e.g., 5 ft 8 in or 1.75 m" disabled={formikSubmitting}/>
                   <FormikErrorMessage name="height" />
                </FormItem>
                <FormItem className="flex flex-col">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" id="dateOfBirth" className={cn("w-full pl-3 text-left font-normal", !values.dateOfBirth && "text-muted-foreground")} disabled={formikSubmitting}>
                        {values.dateOfBirth && isValid(parseISO(values.dateOfBirth)) ? format(parseISO(values.dateOfBirth), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={values.dateOfBirth ? parseISO(values.dateOfBirth) : undefined} defaultMonth={values.dateOfBirth ? parseISO(values.dateOfBirth) : twentyFiveYearsAgo} onSelect={(date) => setFieldValue('dateOfBirth', date ? format(date, "yyyy-MM-dd") : "")} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus captionLayout="dropdown" fromYear={1900} toYear={new Date().getFullYear()} />
                    </PopoverContent>
                  </Popover>
                  <FormikErrorMessage name="dateOfBirth" />
                </FormItem>
                 <FormItem>
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Select onValueChange={(value) => setFieldValue('nationality', value)} value={values.nationality ?? ""} disabled={formikSubmitting}>
                    <SelectTrigger id="nationality"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                    <SelectContent>{NATIONALITIES.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormikErrorMessage name="nationality" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="placeOfBirth">Place of Birth *</Label>
                  <Field as={Input} name="placeOfBirth" id="placeOfBirth" placeholder="Enter place of birth" disabled={formikSubmitting}/>
                  <FormikErrorMessage name="placeOfBirth" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="hometown">Hometown *</Label>
                  <Field as={Input} name="hometown" id="hometown" placeholder="Enter hometown" disabled={formikSubmitting}/>
                  <FormikErrorMessage name="hometown" />
                </FormItem>
                <FormItem className="md:col-span-2 lg:col-span-1">
                  <Label htmlFor="residentialAddress">Residential Address *</Label>
                  <Field as={Textarea} name="residentialAddress" id="residentialAddress" placeholder="Enter residential address" disabled={formikSubmitting}/>
                  <FormikErrorMessage name="residentialAddress" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="educationLevel">Level of Education *</Label>
                  <Select onValueChange={(value) => setFieldValue('educationLevel', value)} value={values.educationLevel ?? ""} disabled={formikSubmitting}>
                    <SelectTrigger id="educationLevel"><SelectValue placeholder="Select education level" /></SelectTrigger>
                    <SelectContent>{EDUCATION_LEVELS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormikErrorMessage name="educationLevel" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="maritalStatus">Marital Status *</Label>
                   <Select onValueChange={(value) => setFieldValue('maritalStatus', value)} value={values.maritalStatus ?? ""} disabled={formikSubmitting}>
                    <SelectTrigger id="maritalStatus"><SelectValue placeholder="Select marital status" /></SelectTrigger>
                    <SelectContent>{MARITAL_STATUSES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormikErrorMessage name="maritalStatus" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Field as={Input} name="occupation" id="occupation" placeholder="Enter occupation" disabled={formikSubmitting}/>
                  <FormikErrorMessage name="occupation" />
                </FormItem>
                <FormItem>
                  <Label htmlFor="emailAddress">Email Address</Label>
                  <Field as={Input} type="email" name="emailAddress" id="emailAddress" placeholder="Enter email address" disabled={formikSubmitting}/>
                  <FormikErrorMessage name="emailAddress" />
                </FormItem>
                 <FormItem>
                  <Label htmlFor="languagesSpoken">Languages Spoken *</Label>
                  <Field as={Input} name="languagesSpoken" id="languagesSpoken" placeholder="e.g., English, Twi, French" disabled={formikSubmitting}/>
                  <p className="text-sm text-muted-foreground">Enter languages separated by commas.</p>
                  <FormikErrorMessage name="languagesSpoken" />
                </FormItem>
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-foreground flex items-center"><PhoneIcon className="mr-2 h-5 w-5 text-primary" /> Phone Numbers</h4>
                    <FieldArray name="phoneNumbers">
                      {({ push }) => (
                        <Button type="button" variant="outline" size="sm" onClick={() => push('')} disabled={formikSubmitting}><PlusCircle className="mr-2 h-4 w-4" /> Add Phone</Button>
                      )}
                    </FieldArray>
                </div>
                <FieldArray name="phoneNumbers">
                  {({ remove }) => (
                    <>
                      {values.phoneNumbers.map((phoneNumber, index) => (
                        <FormItem key={index} className="flex items-center space-x-2">
                          <Field name={`phoneNumbers.${index}`} as={Input} placeholder="Enter phone number" className="flex-grow" disabled={formikSubmitting}/>
                          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)} disabled={formikSubmitting}><Trash2 className="h-4 w-4" /></Button>
                          <FormikErrorMessage name={`phoneNumbers.${index}`} />
                        </FormItem>
                      ))}
                    </>
                  )}
                </FieldArray>
                {values.phoneNumbers.length === 0 && <p className="text-sm text-muted-foreground">No phone numbers added.</p>}
                <p className="text-sm text-muted-foreground">Add one or more contact phone numbers.</p>
              </div>
            </div>

            <div className="space-y-6 border-b pb-8">
                <h3 className="text-xl font-semibold text-foreground">Physical Characteristics & Lifestyle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    <FormItem className="md:col-span-full lg:col-span-2 space-y-3">
                        <Label>Physical Marks (Select all that apply)</Label>
                        <ScrollArea className="h-40 rounded-md border p-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {PHYSICAL_MARK_OPTIONS.map((option) => (
                                    <FormItem key={option.value} className="flex flex-row items-start space-x-2 space-y-0">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                id={`physicalMark-${option.value}`}
                                                checked={values.physicalMarks.includes(option.value)}
                                                onCheckedChange={(checked) => {
                                                    const currentMarks = values.physicalMarks;
                                                    if (checked) {
                                                        setFieldValue("physicalMarks", [...currentMarks, option.value]);
                                                    } else {
                                                        setFieldValue("physicalMarks", currentMarks.filter(v => v !== option.value));
                                                    }
                                                }}
                                                disabled={formikSubmitting}
                                            />
                                        </div>
                                        <Label htmlFor={`physicalMark-${option.value}`} className="font-normal text-sm">{option.label}</Label>
                                    </FormItem>
                                ))}
                            </div>
                        </ScrollArea>
                        <p className="text-sm text-muted-foreground">Select the most prominent physical marks.</p>
                        <FormikErrorMessage name="physicalMarks" />
                    </FormItem>
                    <FormItem>
                        <Label htmlFor="skinTone">Skin Tone</Label>
                        <Select onValueChange={(value) => setFieldValue('skinTone', value)} value={values.skinTone ?? ""} disabled={formikSubmitting}>
                            <SelectTrigger id="skinTone"><SelectValue placeholder="Select skin tone" /></SelectTrigger>
                            <SelectContent>{SKIN_TONES.map(st => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormikErrorMessage name="skinTone" />
                    </FormItem>
                     <FormItem>
                        <Label htmlFor="hairStyle">Hair Style</Label>
                        <Select onValueChange={(value) => setFieldValue('hairStyle', value)} value={values.hairStyle ?? ""} disabled={formikSubmitting}>
                            <SelectTrigger id="hairStyle"><SelectValue placeholder="Select hair style" /></SelectTrigger>
                            <SelectContent>{HAIR_STYLES.map(hs => <SelectItem key={hs.value} value={hs.value}>{hs.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormikErrorMessage name="hairStyle" />
                    </FormItem>
                    <FormItem>
                        <Label htmlFor="hairColor">Hair Color</Label>
                        <Select onValueChange={(value) => setFieldValue('hairColor', value)} value={values.hairColor ?? ""} disabled={formikSubmitting}>
                            <SelectTrigger id="hairColor"><SelectValue placeholder="Select hair color" /></SelectTrigger>
                            <SelectContent>{HAIR_COLORS.map(hc => <SelectItem key={hc.value} value={hc.value}>{hc.label}</SelectItem>)}</SelectContent>
                        </Select>
                         <FormikErrorMessage name="hairColor" />
                    </FormItem>
                    <FormItem>
                        <Label htmlFor="eyeColor">Eye Color</Label>
                         <Select onValueChange={(value) => setFieldValue('eyeColor', value)} value={values.eyeColor ?? ""} disabled={formikSubmitting}>
                            <SelectTrigger id="eyeColor"><SelectValue placeholder="Select eye color" /></SelectTrigger>
                            <SelectContent>{EYE_COLORS.map(ec => <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormikErrorMessage name="eyeColor" />
                    </FormItem>
                    <div className="flex items-center space-x-4">
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm h-fit">
                            <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    id="smokes"
                                    checked={values.smokes}
                                    onCheckedChange={(checked) => setFieldValue('smokes', !!checked)}
                                    disabled={formikSubmitting}
                                />
                            </div>
                            <div className="space-y-1 leading-none"><Label htmlFor="smokes">Smokes?</Label></div>
                        </FormItem>
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm h-fit">
                            <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    id="drinksAlcohol"
                                    checked={values.drinksAlcohol}
                                    onCheckedChange={(checked) => setFieldValue('drinksAlcohol', !!checked)}
                                    disabled={formikSubmitting}
                                />
                            </div>
                            <div className="space-y-1 leading-none"><Label htmlFor="drinksAlcohol">Drinks Alcohol?</Label></div>
                        </FormItem>
                    </div>
                </div>
            </div>

            <div className="space-y-6 border-b pb-8">
              <h3 className="text-xl font-semibold text-foreground">Suspect Image</h3>
              <p className="text-sm text-muted-foreground">Upload or capture an image for the suspect.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-3 p-4 border rounded-md shadow-sm">
                    <Label className="text-md font-semibold">Suspect Image</Label>
                    {profileImagePreview && (
                        <div className="shrink-0 my-2">
                            <Image src={profileImagePreview} alt="Suspect Image Preview" width={128} height={128} className="rounded-md border object-cover aspect-square" data-ai-hint="person mugshot" />
                        </div>
                    )}
                    <FormItem className="w-full">
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <Input id="profileImageFile" type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setFieldValue)}
                                   className="block w-full text-sm text-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 flex-grow" disabled={formikSubmitting}/>
                            <Button type="button" variant="outline" size="sm" onClick={() => openCameraDialog(setFieldValue)} className="w-full sm:w-auto text-xs" disabled={formikSubmitting}><CameraIconLucide className="mr-1.5 h-3.5 w-3.5" /> Use Camera</Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Upload or use camera.</p>
                        {(values.profileImageUrl || profileImagePreview) && (
                            <Button type="button" variant="outline" size="sm" onClick={() => clearImage(setFieldValue)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 border-destructive/50 hover:border-destructive mt-2 w-full sm:w-auto text-xs" disabled={formikSubmitting}>
                                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Clear Image</Button>
                        )}
                        <FormikErrorMessage name="profileImageUrl" />
                    </FormItem>
                </div>
              </div>
            </div>

            <div className="space-y-6 border-b pb-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-foreground flex items-center"><Gavel className="mr-2 h-5 w-5 text-primary" /> Nature of Offence(s)</h3>
                    <FieldArray name="offences">
                        {({ push }) => (
                            <Button type="button" variant="outline" size="sm" onClick={() => push('')} disabled={formikSubmitting}><PlusCircle className="mr-2 h-4 w-4" /> Add Offence</Button>
                        )}
                    </FieldArray>
                </div>
                <FieldArray name="offences">
                  {({ remove }) => (
                    <>
                      {values.offences.map((offence, index) => (
                        <FormItem key={index} className="space-y-2">
                           <div className="flex justify-between items-center">
                                <Label htmlFor={`offences.${index}`}>Offence #{index + 1}</Label>
                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)} disabled={formikSubmitting}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          <Field name={`offences.${index}`} as={Textarea} placeholder="Describe the offence..." className="min-h-[80px]" id={`offences.${index}`} disabled={formikSubmitting}/>
                          <FormikErrorMessage name={`offences.${index}`} />
                        </FormItem>
                      ))}
                    </>
                  )}
                </FieldArray>
                {values.offences.length === 0 && <p className="text-sm text-muted-foreground">No offences added.</p>}
                <p className="text-sm text-muted-foreground">Add one or more alleged offences. Provide a detailed description for each.</p>
            </div>

            <div className="space-y-6 border-b pb-8">
                 <h3 className="text-xl font-semibold text-foreground flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary" /> Case & Record Administration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    <FormItem>
                        <Label htmlFor="assignedInvestigator">Assigned Investigator</Label>
                        <Field as={Input} name="assignedInvestigator" id="assignedInvestigator" placeholder="Enter name of assigned investigator" disabled={formikSubmitting}/>
                        <p className="text-sm text-muted-foreground">Officer in charge of this suspect&#39;s case (if known).</p>
                        <FormikErrorMessage name="assignedInvestigator" />
                    </FormItem>
                    <FormItem>
                        <Label htmlFor="linkedRoNumber">Link to Case (R.O. Number)</Label>
                        <Field as={Input} name="linkedRoNumber" id="linkedRoNumber" placeholder="e.g., 001/2024" disabled={formikSubmitting}/>
                        <p className="text-sm text-muted-foreground">If suspect tied to a case, enter R.O. Number (NNN/YYYY).</p>
                        <FormikErrorMessage name="linkedRoNumber" />
                    </FormItem>
                    {isEditMode && initialData && (
                        <>
                          <FormItem className="lg:col-start-1"><Label>Record Created At</Label><p className="text-sm text-muted-foreground pt-2">{initialData.createdAt && isValid(parseISO(initialData.createdAt)) ? format(parseISO(initialData.createdAt), "PPP p") : 'N/A'}</p></FormItem>
                          <FormItem><Label>Created By</Label><p className="text-sm text-muted-foreground pt-2">{initialData.createdBy || 'N/A'}</p></FormItem>
                          <FormItem><Label>Last Updated At</Label><p className="text-sm text-muted-foreground pt-2">{initialData.updatedAt && isValid(parseISO(initialData.updatedAt)) ? format(parseISO(initialData.updatedAt), "PPP p") : 'N/A'}</p></FormItem>
                          <FormItem><Label>Last Updated By</Label><p className="text-sm text-muted-foreground pt-2">{initialData.updatedBy || 'N/A'}</p></FormItem>
                        </>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={formikSubmitting}>Cancel</Button>
              <Button type="submit" disabled={formikSubmitting || (isEditMode && !dirty) || !formikIsValid}>
                {formikSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? "Save Changes" : "Create Record"}</>}
              </Button>
            </div>
          </FormikForm>
        )}
      </Formik>

      <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Capture Suspect Image</DialogTitle></DialogHeader>
            <div className="py-4">
              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Camera Access Denied</AlertTitle>
                  <AlertDescription>Please enable camera permissions in your browser settings.</AlertDescription>
                </Alert>
              )}
              {hasCameraPermission === null && !activeStream && (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="mr-2 h-8 w-8 animate-spin" /> <p>Requesting camera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                className={cn("w-full aspect-video rounded-md bg-muted", { 'hidden': !activeStream || hasCameraPermission === false })}
                autoPlay
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden"></canvas>
              {hasCameraPermission === true && !activeStream && (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="mr-2 h-8 w-8 animate-spin" /> <p>Starting camera...</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCameraDialogOpen(false)}>Cancel</Button>
              <Button
                type="button"
                onClick={handleCaptureImage}
                disabled={!activeStream || hasCameraPermission !== true || !cameraCaptureActions}
              >
                <CameraIconLucide className="mr-2 h-4 w-4" /> Capture
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
