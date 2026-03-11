"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AUDIENCE_TYPE_OPTIONS, type UserProfile } from '@/types/ai-roadmap';
import { User, GraduationCap, Users, Lightbulb, Video, HelpCircle } from 'lucide-react';

interface AudienceStepProps {
  data: Partial<UserProfile>;
  updateData: (updates: Partial<UserProfile>) => void;
}

const audienceIcons: Record<string, React.ReactNode> = {
  'self-learner': <User className="w-5 h-5" />,
  'teacher': <GraduationCap className="w-5 h-5" />,
  'team-lead': <Users className="w-5 h-5" />,
  'mentor': <Lightbulb className="w-5 h-5" />,
  'content-creator': <Video className="w-5 h-5" />,
  'other': <HelpCircle className="w-5 h-5" />,
};

export default function AudienceStep({ data, updateData }: AudienceStepProps) {
  const [showCustomInput, setShowCustomInput] = useState(data.audienceType === 'other');
  const [customAudience, setCustomAudience] = useState('');

  const handleAudienceChange = (value: string) => {
    if (value === 'other') {
      setShowCustomInput(true);
      updateData({ audienceType: 'other' });
    } else {
      setShowCustomInput(false);
      updateData({ audienceType: value as UserProfile['audienceType'] });
    }
  };

  const handleCustomAudienceChange = (value: string) => {
    setCustomAudience(value);
    // Keep audienceType as 'other', the custom text is supplementary
    updateData({ audienceType: 'other' });
  };

  const selectedValue = data.audienceType || 'self-learner';

  return (
    <div className="space-y-6">
      <RadioGroup
        value={selectedValue}
        onValueChange={handleAudienceChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {AUDIENCE_TYPE_OPTIONS.map((option) => (
          <div key={option.value}>
            <RadioGroupItem
              value={option.value}
              id={`audience-${option.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`audience-${option.value}`}
              className={`
                flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                transition-all duration-200
                ${selectedValue === option.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg mt-0.5
                ${selectedValue === option.value
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-500'
                }
              `}>
                {audienceIcons[option.value] || <User className="w-5 h-5" />}
              </div>
              <div>
                <span className="font-medium block">{option.label}</span>
                <span className={`text-sm ${
                  selectedValue === option.value ? 'text-indigo-500' : 'text-gray-400'
                }`}>
                  {option.description}
                </span>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Custom Input for "Other" */}
      {showCustomInput && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <Label htmlFor="customAudience" className="text-sm font-medium text-gray-700">
            Mô tả mục đích của bạn
          </Label>
          <Input
            id="customAudience"
            type="text"
            value={customAudience}
            onChange={(e) => handleCustomAudienceChange(e.target.value)}
            placeholder="VD: Nghiên cứu sinh, Quản lý dự án, HR tuyển dụng..."
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}
