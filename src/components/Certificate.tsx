import React from 'react';
import { Award } from 'lucide-react';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  courseDuration: string;
  certificateId?: string;
}

const Certificate: React.FC<CertificateProps> = ({
  studentName,
  courseName,
  completionDate,
  instructorName,
  courseDuration,
  certificateId = `DHV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}) => {
  return (
    <div className="certificate-container w-full max-w-[1000px] mx-auto bg-white p-8 md:p-12 text-center relative overflow-hidden shadow-2xl print:shadow-none print:w-[100%] print:max-w-none print:p-0">
      {/* Decorative Border */}
      <div className="absolute inset-4 border-[12px] border-double border-yellow-600/30 pointer-events-none print:inset-0"></div>
      <div className="absolute inset-8 border-[2px] border-yellow-600/20 pointer-events-none print:inset-4"></div>

      {/* Corner Ornaments */}
      <div className="absolute top-4 left-4 w-24 h-24 border-t-[4px] border-l-[4px] border-yellow-600/40 rounded-tl-3xl pointer-events-none print:top-0 print:left-0"></div>
      <div className="absolute top-4 right-4 w-24 h-24 border-t-[4px] border-r-[4px] border-yellow-600/40 rounded-tr-3xl pointer-events-none print:top-0 print:right-0"></div>
      <div className="absolute bottom-4 left-4 w-24 h-24 border-b-[4px] border-l-[4px] border-yellow-600/40 rounded-bl-3xl pointer-events-none print:bottom-0 print:left-0"></div>
      <div className="absolute bottom-4 right-4 w-24 h-24 border-b-[4px] border-r-[4px] border-yellow-600/40 rounded-br-3xl pointer-events-none print:bottom-0 print:right-0"></div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/grid-pattern.svg')] pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 py-8 px-4">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-widest uppercase">CodeSense AIoT</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-yellow-800 to-yellow-600">
            Certificate
          </h1>
          <p className="text-xl md:text-2xl text-yellow-700 font-serif italic">of Completion</p>
        </div>

        {/* Body */}
        <div className="space-y-6 mb-16">
          <p className="text-gray-600 text-lg uppercase tracking-widest">This is to certify that</p>
          
          <div className="py-4">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 border-b-2 border-gray-200 inline-block px-12 pb-2 min-w-[300px]">
              {studentName}
            </h2>
          </div>

          <p className="text-gray-600 text-lg">has successfully completed the course</p>

          <div className="py-2">
            <h3 className="text-3xl md:text-4xl font-bold text-indigo-900">
              {courseName}
            </h3>
          </div>

          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Demonstrating dedication and proficiency in the subject matter, completing {courseDuration} of intensive training and practical exercises.
          </p>
        </div>

        {/* Footer / Signatures */}
        <div className="flex flex-col md:flex-row justify-between items-end max-w-4xl mx-auto mt-12 gap-12">
          {/* Instructor Signature */}
          <div className="text-center flex-1">
            <div className="h-16 flex items-end justify-center mb-2">
              <span className="font-script text-3xl text-gray-800 transform -rotate-6">{instructorName}</span>
            </div>
            <div className="border-t border-gray-400 w-48 mx-auto pt-2">
              <p className="font-bold text-gray-900">{instructorName}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Instructor</p>
            </div>
          </div>

          {/* Seal */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-yellow-600/30 flex items-center justify-center relative bg-white shadow-inner">
              <div className="absolute inset-1 border border-yellow-600/20 rounded-full"></div>
              <div className="text-center">
                <Award className="w-12 h-12 text-yellow-600 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest">Official<br/>Certified</div>
              </div>
            </div>
          </div>

          {/* Date & ID */}
          <div className="text-center flex-1">
            <div className="h-16 flex items-end justify-center mb-2">
              <span className="text-xl text-gray-800">{completionDate}</span>
            </div>
            <div className="border-t border-gray-400 w-48 mx-auto pt-2">
              <p className="font-bold text-gray-900">Date Issued</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">ID: {certificateId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
