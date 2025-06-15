
"use client";
import React from 'react'; // Keep React import
import type { Suspect } from '@/types/suspect';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase,  Mail, MapPin, User,  ShieldAlert, Gavel, Palette, Sparkles, Eye, Phone as PhoneIcon,  Ruler, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SuspectPrintLayoutProps {
  suspect: Suspect;
}

interface PrintDetailItemProps {
  icon?: React.ElementType;
  label: string;
  value?: string | number | boolean | null | string[];
  isBoolean?: boolean;
  className?: string;
  isLongText?: boolean;
  isList?: boolean;
}

const PrintDetailItem: React.FC<PrintDetailItemProps> = ({ icon: Icon, label, value, isBoolean = false, className, isLongText = false, isList = false }) => {
  if (value === null || typeof value === 'undefined' || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) return null;

  let displayValue: React.ReactNode;
  if (isBoolean) {
    displayValue = value ? 'Yes' : 'No';
  } else if (isList && Array.isArray(value)) {
    displayValue = (
      <ul className="list-none p-0 m-0 space-y-0.5">
        {value.map((item, index) => (
          <li key={index} className="text-sm text-gray-800 print:text-black">{item.replace(/\s*\([\w\s]+\)$/, '')}</li>
        ))}
      </ul>
    );
  } else if (Array.isArray(value)) { 
    displayValue = value.map(item => item.replace(/\s*\([\w\s]+\)$/, '')).join(', ');
  } else if (typeof value === 'string' && (label.toLowerCase().includes("date") || label.toLowerCase().includes("created at") || label.toLowerCase().includes("updated at"))) {
    try {
      displayValue = format(parseISO(value), "PPP p");
      if (label.toLowerCase().includes("date of birth")) displayValue = format(parseISO(value), "PPP");
    } catch  { 
      displayValue = value;
     }
  } else {
    displayValue = String(value);
  }

  return (
    <div className={cn("flex items-start space-x-2 py-1.5 print:py-1", className)}>
      {Icon && <Icon className="h-4 w-4 text-gray-700 mt-0.5 print:text-black flex-shrink-0" />}
      <div>
        <p className="text-xs font-semibold text-gray-600 print:text-black print:font-medium">{label}:</p>
        {isLongText || (isList && Array.isArray(value) && value.length > 0) || (Array.isArray(value) && value.length > 3) ? ( 
          <div className={cn("text-sm text-gray-800 print:text-black", isLongText && "whitespace-pre-wrap")}>{displayValue}</div>
        ) : (
          <p className="text-sm text-gray-800 print:text-black">{displayValue}</p>
        )}
      </div>
    </div>
  );
};

const PrintImageDisplay: React.FC<{ title: string; imageUrl?: string; hint: string }> = ({ title, imageUrl, hint }) => (
    <div className="flex flex-col items-center text-center p-1">
        <p className="text-xs font-medium text-gray-600 print:text-black mb-0.5">{title}</p>
        <Image
            src={imageUrl || "https://placehold.co/100x100.png"}
            alt={title}
            width={100}
            height={100}
            className="rounded border border-gray-300 shadow-sm object-cover aspect-square print:w-24 print:h-24"
            data-ai-hint={hint}
            style={{ objectFit: 'cover' }}
        />
    </div>
);

// Removed React.forwardRef and ref prop
export const SuspectPrintLayout: React.FC<SuspectPrintLayoutProps> = ({ suspect }) => {
  let displayPhoneNumbers: string[] = [];
  if (suspect.phoneNumbers && Array.isArray(suspect.phoneNumbers)) {
    displayPhoneNumbers = suspect.phoneNumbers;
  } else if ('phoneNumber' in suspect && typeof (suspect as { phoneNumber?: string }).phoneNumber === 'string') { 
    displayPhoneNumbers = [(suspect as { phoneNumber: string }).phoneNumber];
  }

  let displayOffences: string[] = [];
  if (suspect.offences && Array.isArray(suspect.offences)) {
    displayOffences = suspect.offences;
  } else if ('offence' in suspect && typeof (suspect as { offence?: string }).offence === 'string') {
    displayOffences = [(suspect as { offence: string }).offence];
  }
  
  const imageToDisplay = suspect.profileImageUrl || "https://placehold.co/120x120.png";

  return (
    <div className="p-4 bg-white text-black font-sans print:p-0" id="print-layout-content">
      <header className="text-center mb-6 print:mb-4 border-b pb-4 print:pb-2">
        <h1 className="text-xl print:text-lg font-bold text-primary print:text-black mt-4">AARUSDB - Suspect Profile</h1>
        <p className="text-sm text-muted-foreground print:text-gray-600">Anti-Armed Robbery Unit Suspect Database</p>
      </header>

      <div className="space-y-4 print:space-y-3">
        <Card className="print:shadow-none print:border-gray-300 print:rounded-none mb-8">
          <CardHeader className="print:pb-2 print:px-0">
            <CardTitle className="text-lg print:text-base font-semibold text-primary print:text-black flex items-center">
              <User className="mr-2 h-5 w-5 print:h-4 print:w-4" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-[150px_1fr] print:grid-cols-[120px_1fr] gap-4 print:gap-2 items-start print:pt-2 print:px-0">
            <div className="col-span-1 flex flex-col items-center print:items-start">
                <PrintImageDisplay title="Suspect Image" imageUrl={imageToDisplay} hint="person mugshot" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-4 print:gap-x-2">
              <PrintDetailItem label="Full Name" value={suspect.fullName} className="font-bold text-base print:text-sm" />
              {suspect.nickname && <PrintDetailItem label="Nickname/Alias" value={suspect.nickname} />}
              <PrintDetailItem label="Gender" value={suspect.gender} />
              <PrintDetailItem label="Date of Birth" value={suspect.dateOfBirth} />
              <PrintDetailItem label="Nationality" value={suspect.nationality} />
              <PrintDetailItem label="Place of Birth" value={suspect.placeOfBirth} />
              <PrintDetailItem label="Hometown" value={suspect.hometown} />
            </div>
          </CardContent>
        </Card>
        
        <Separator className="my-3 print:my-2 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
          <Card className="print:shadow-none print:border-gray-300 print:rounded-none mb-8">
            <CardHeader className="print:pb-2 print:px-0">
              <CardTitle className="text-base print:text-sm font-semibold text-primary print:text-black flex items-center">
                <Mail className="mr-2 h-5 w-5 print:h-4 print:w-4" /> Contact & Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="print:pt-2 print:px-0">
              <PrintDetailItem icon={PhoneIcon} label="Phone Numbers" value={displayPhoneNumbers} isList />
              <PrintDetailItem label="Email Address" value={suspect.emailAddress} />
              <PrintDetailItem label="Languages Spoken" value={suspect.languagesSpoken} />
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-gray-300 print:rounded-none mb-8">
            <CardHeader className="print:pb-2 print:px-0">
              <CardTitle className="text-base print:text-sm font-semibold text-primary print:text-black flex items-center">
                <User className="mr-2 h-5 w-5 print:h-4 print:w-4" /> Appearance & Lifestyle
              </CardTitle>
            </CardHeader>
            <CardContent className="print:pt-2 print:px-0">
              <PrintDetailItem icon={Ruler} label="Height" value={suspect.height} />
              <PrintDetailItem icon={Palette} label="Skin Tone" value={suspect.skinTone} />
              <PrintDetailItem icon={Sparkles} label="Hair Style" value={suspect.hairStyle} />
              <PrintDetailItem icon={Palette} label="Hair Color" value={suspect.hairColor} />
              <PrintDetailItem icon={Eye} label="Eye Color" value={suspect.eyeColor} />
              <PrintDetailItem label="Physical Marks" value={suspect.physicalMarks} isList />
              <Separator className="my-2 print:my-1" />
              <PrintDetailItem label="Smokes" value={suspect.smokes} isBoolean />
              <PrintDetailItem label="Drinks Alcohol" value={suspect.drinksAlcohol} isBoolean />
            </CardContent>
          </Card>
        </div>
        
        <Card className="print:shadow-none print:border-gray-300 print:rounded-none mb-8">
            <CardHeader className="print:pb-2 print:px-0">
              <CardTitle className="text-base print:text-sm font-semibold text-primary print:text-black flex items-center">
                <Briefcase className="mr-2 h-5 w-5 print:h-4 print:w-4" /> Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="print:pt-2 print:px-0">
              <PrintDetailItem label="Occupation" value={suspect.occupation} />
              <PrintDetailItem label="Level of Education" value={suspect.educationLevel} />
              <PrintDetailItem label="Marital Status" value={suspect.maritalStatus} />
            </CardContent>
          </Card>

        <Card className="print:shadow-none print:border-gray-300 print:rounded-none mb-8">
            <CardHeader className="print:pb-2 print:px-0">
              <CardTitle className="text-base print:text-sm font-semibold text-primary print:text-black flex items-center">
                <MapPin className="mr-2 h-5 w-5 print:h-4 print:w-4" /> Address
              </CardTitle>
            </CardHeader>
            <CardContent className="print:pt-2 print:px-0">
              <PrintDetailItem label="Residential Address" value={suspect.residentialAddress} isLongText />
            </CardContent>
          </Card>

        {displayOffences && displayOffences.length > 0 && (
            <Card className="print:shadow-none print:border-gray-300 print:rounded-none mb-8">
                <CardHeader className="print:pb-2 print:px-0">
                    <CardTitle className="text-base print:text-sm font-semibold text-primary print:text-black flex items-center">
                        <Gavel className="mr-2 h-5 w-5 print:h-4 print:w-4 text-red-700 print:text-black" /> Nature of Offence(s)
                    </CardTitle>
                </CardHeader>
                <CardContent className="print:pt-2 print:px-0">
                    <PrintDetailItem label="" value={displayOffences} isList />
                </CardContent>
            </Card>
        )}

        {suspect.linkedCaseRoNumbers && suspect.linkedCaseRoNumbers.length > 0 && (
            <Card className="print:shadow-none print:border-gray-300 print:rounded-none mb-8">
                <CardHeader className="print:pb-2 print:px-0">
                    <CardTitle className="text-base print:text-sm font-semibold text-primary print:text-black flex items-center">
                        <Link2 className="mr-2 h-5 w-5 print:h-4 print:w-4" /> Linked Case R.O. Numbers
                    </CardTitle>
                </CardHeader>
                <CardContent className="print:pt-2 print:px-0">
                    <PrintDetailItem label="" value={suspect.linkedCaseRoNumbers} isList />
                </CardContent>
            </Card>
        )}

        <Separator className="my-3 print:my-2" />

       

        <Card className="print:shadow-none print:border-gray-300 print:rounded-none">
          <CardHeader className="print:pb-2 print:px-0">
            <CardTitle className="text-base print:text-sm font-semibold text-primary print:text-black flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5 print:h-4 print:w-4" /> SIGNATURES
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-4 print:gap-x-2 print:pt-2 print:px-0">
            <div>
              <h6 className='mb-8'>Signature of Unit Commander</h6>
            </div>
            <div>
              <h6 className='mb-8'>Signature of Unit Station Officer</h6>
            </div>
            <div>
              <h6 className='mb-8'>Signature of Unit Investigator</h6>
            </div>
            <div>
              <h6 className='mb-8'>Signature of Unit Suspect/Accused</h6>
            </div>
            <PrintDetailItem label="Updated By (Officer)" value={suspect.updatedBy} />
          </CardContent>
        </Card>
      </div>

      <footer className="mt-8 print:mt-6 pt-4 print:pt-2 border-t text-center">
        <p className="text-xs text-gray-500 print:text-gray-700">
          Printed on: {format(new Date(), "PPP p")}
        </p>
        <p className="text-xs text-gray-500 print:text-gray-700">
          CONFIDENTIAL - Ghana Police Service - For Official Use Only
        </p>
      </footer>
    </div>
  );
};

// SuspectPrintLayout.displayName = "SuspectPrintLayout"; // Not needed if not using forwardRef
    

    