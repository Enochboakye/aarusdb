
"use client";
import React from 'react';
import type { Suspect } from '@/types/suspect';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Briefcase,  Gavel, Palette, Sparkles, Eye as EyeIcon, Ruler, Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SuspectPrintLayoutProps {
  suspect: Suspect;
}

interface PrintDetailItemProps {
  icon?: React.ElementType;
  label?: string;
  value?: string | number | boolean | null | string[];
  isBoolean?: boolean;
  className?: string;
  isList?: boolean;
}

const PrintDetailItem: React.FC<PrintDetailItemProps> = ({ icon: Icon, label, value, isBoolean = false, className, isList = false }) => {
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
    displayValue = value.join(', ');
  } else if (typeof value === 'string' && typeof label === 'string' && (label.toLowerCase().includes("date") || label.toLowerCase().includes("created at") || label.toLowerCase().includes("updated at"))) {
    try {
      displayValue = format(parseISO(value), "PPP p");
      if (label.toLowerCase().includes("date of birth")) displayValue = format(parseISO(value), "PPP");
    } catch{ 
      displayValue = value;
     }
  } else {
    displayValue = String(value);
  }

  return (
    <div className={cn("text-sm text-gray-800 print:text-black", className)}>
        {Icon && <Icon className="h-4 w-4 mr-2 inline-block" />}
        {label && <span className="font-extrabold text-black print:font-medium">{label}: </span>}
        {displayValue}
    </div>
  );
};


const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn("mb-4 print:mb-3", className)}>
    <h3 className="text-sm print:text-xs font-bold text-primary print:text-black uppercase tracking-wider border-b-2 border-primary print:border-black pb-1 mb-2 print:mb-1.5">
      {title}
    </h3>
    <div className="space-y-1.5 print:space-y-1">{children}</div>
  </div>
);


export const SuspectPrintLayout: React.FC<SuspectPrintLayoutProps> = ({ suspect }) => {
  const imageToDisplay = suspect.profileImageUrl && (suspect.profileImageUrl.startsWith('http') || suspect.profileImageUrl.startsWith('data:'))
    ? suspect.profileImageUrl
    : "https://placehold.co/150x150.png";

  return (
    <div className="p-8  font-sans print:p-0" id="print-layout-content">
      <header className="text-center mb-4 print:mb-2">
       <h1 className="text-3xl text-extrabold">ANTI-ARMED ROBBERY UNIT</h1>
       <h1 className="text xl text-extrabold text-black">SUSPECT PROFILE FORM</h1>
      </header>

      <Separator className="my-3 print:my-2 bg-gray-400" />
      <div className="text-center mb-4 print:mb-2">
        <h1 className="text-2xl print:text-2xl font-bold text-primary float-left">R.O NUMBER: {suspect.linkedCaseRoNumbers}</h1>
      </div>
      
      <Separator className="my-3 print:my-2 bg-gray-400" />
        <div className="text-center mb-4 print:mb-2">
           <h1 className="text-2xl print:text-2xl font-bold text-primary">NAME: {suspect.fullName}</h1>
        {suspect.nickname && <p className="text-lg print:text-base text-gray-600 print:text-gray-700">&quot;{suspect.nickname}&quot;</p>}
        </div>
      <main>
        <div className="flex justify-center mb-4 print:mb-3">
            <Image
              src={imageToDisplay}
              alt="Suspect Profile"
              width={150} height={150}
              className="rounded-md border-2 border-gray-300 shadow-md object-cover aspect-square print:w-[130px] print:h-[130px]"
              style={{ objectFit: 'cover' }}
            />
        </div>
      
        <div className="grid grid-cols-2 gap-x-6 print:gap-x-4">
            {/* --- Left Column --- */}
            <div className="space-y-4 print:space-y-3">
                <Section title="Personal Details" className="ml-4">
                    <PrintDetailItem label=" Date of Birth" value={suspect.dateOfBirth} />
                    <PrintDetailItem label=" Gender" value={suspect.gender} />
                    <PrintDetailItem label=" Nationality" value={suspect.nationality} />
                    <PrintDetailItem label=" Place of Birth" value={suspect.placeOfBirth} />
                    <PrintDetailItem label=" Hometown" value={suspect.hometown} />
                    <PrintDetailItem label=" Marital Status" value={suspect.maritalStatus} />
                </Section>

                <Section title="Physical Description" className='ml-4'>
                    <PrintDetailItem icon={Ruler} label=" Height" value={suspect.height} />
                    <PrintDetailItem icon={Palette} label=" Skin Tone" value={suspect.skinTone} />
                    <PrintDetailItem icon={Sparkles} label=" Hair Style" value={suspect.hairStyle} />
                    <PrintDetailItem icon={Palette} label=" Hair Color" value={suspect.hairColor} />
                    <PrintDetailItem icon={EyeIcon} label=" Eye Color" value={suspect.eyeColor} />
                    <Separator className="my-1.5 print:my-1" />
                    <p className="font-semibold text-gray-600 print:font-medium text-xs">Physical Marks</p>
                    <PrintDetailItem value={suspect.physicalMarks} isList />
                </Section>

                 <Section title="Lifestyle" className='ml-4'>
                    <PrintDetailItem label=" Smokes" value={suspect.smokes} isBoolean />
                    <PrintDetailItem label=" Drinks Alcohol" value={suspect.drinksAlcohol} isBoolean />
                </Section>
            </div>

            {/* --- Right Column --- */}
            <div className="space-y-4 print:space-y-3">
                <Section title="Criminal Profile">
                    <h4 className="text-md print:text-sm font-semibold text-gray-800 print:text-black mb-1 flex items-center"><Gavel className="h-4 w-4 mr-2 text-red-700 print:text-black"/>Nature of Offence(s)</h4>
                    {(suspect.offences && suspect.offences.length > 0) ? (
                    <PrintDetailItem value={suspect.offences} isList />
                    ) : (
                    <p className="text-sm text-gray-500">No offences listed.</p>
                    )}
                    <Separator className="my-2.5 print:my-1.5" />
                </Section>

                <Section title="Contact Information">
                    <PrintDetailItem icon={Phone} label=" Phone Number(s)" value={suspect.phoneNumbers} isList />
                    <PrintDetailItem icon={Mail} label=" Email Address" value={suspect.emailAddress} />
                    <PrintDetailItem icon={MapPin} label=" Residential Address" value={suspect.residentialAddress} />
                </Section>

                <Section title="Background">
                    <h4 className="text-md print:text-sm font-semibold text-gray-800 print:text-black mb-1 flex items-center"><Briefcase className="h-4 w-4 mr-2"/>Occupation & Education</h4>
                    <PrintDetailItem label=" Occupation" value={suspect.occupation} />
                    <PrintDetailItem label=" Education Level" value={suspect.educationLevel} />
                    <Separator className="my-2.5 print:my-1.5" />
                    <PrintDetailItem label=" Languages Spoken" value={suspect.languagesSpoken} />
                </Section>

                <Section title="Family & Kin Information">
                    {suspect.father?.name && (
                        <div className="mb-2">
                            <p className="font-semibold text-gray-600 print:font-medium text-xs">Father</p>
                            <PrintDetailItem label="Name" value={suspect.father.name} />
                            <PrintDetailItem label="Address" value={suspect.father.address} />
                        </div>
                    )}
                    {suspect.mother?.name && (
                        <div className="mb-2">
                            <p className="font-semibold text-gray-600 print:font-medium text-xs">Mother</p>
                            <PrintDetailItem label="Name" value={suspect.mother.name} />
                            <PrintDetailItem label="Address" value={suspect.mother.address} />
                        </div>
                    )}
                    {suspect.nextOfKin?.name && (
                        <div className="mb-2">
                            <p className="font-semibold text-gray-600 print:font-medium text-xs">Next of Kin</p>
                            <PrintDetailItem label="Name" value={suspect.nextOfKin.name} />
                            <PrintDetailItem label="Address" value={suspect.nextOfKin.address} />
                        </div>
                    )}
                </Section>
            </div>
        </div>

        <div className="mt-12 print:mt-8 pt-4 grid grid-cols-3 gap-x-6 text-center">
            <div className="flex flex-col justify-end">
                <div className="border-t border-gray-500 print:border-black pt-1">
                    <p className="text-sm print:text-xs font-medium">Case Officer</p>
                    <p className="text-xs text-gray-500 print:text-gray-600">(Signature)</p>
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="border-t border-gray-500 print:border-black pt-1">
                    <p className="text-sm print:text-xs font-medium">Station Officer</p>
                    <p className="text-xs text-gray-500 print:text-gray-600">(Signature)</p>
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="border-t border-gray-500 print:border-black pt-1">
                    <p className="text-sm print:text-xs font-medium">Suspect/Accused</p>
                    <p className="text-xs text-gray-500 print:text-gray-600">(Signature)</p>
                </div>
            </div>
        </div>
      </main>
      
      <footer className="mt-6 print:mt-4 pt-3 print:pt-2 border-t text-center">
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
