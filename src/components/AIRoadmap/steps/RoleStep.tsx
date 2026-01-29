"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CURRENT_ROLE_OPTIONS, type UserProfile } from '@/types/ai-roadmap';
import { User, GraduationCap, Briefcase, RefreshCw } from 'lucide-react';

interface RoleStepProps {
  data: Partial<UserProfile>;
  updateData: (updates: Partial<UserProfile>) => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  'student-1': <GraduationCap className="w-5 h-5" />,
  'student-2': <GraduationCap className="w-5 h-5" />,
  'student-3': <GraduationCap className="w-5 h-5" />,
  'student-4': <GraduationCap className="w-5 h-5" />,
  'fresh-graduate': <GraduationCap className="w-5 h-5" />,
  'career-changer': <RefreshCw className="w-5 h-5" />,
  'junior-dev': <Briefcase className="w-5 h-5" />,
  'mid-dev': <Briefcase className="w-5 h-5" />,
  'senior-dev': <Briefcase className="w-5 h-5" />,
  'other': <User className="w-5 h-5" />,
};

export default function RoleStep({ data, updateData }: RoleStepProps) {
  const [showCustomInput, setShowCustomInput] = useState(data.currentRole === 'other');
  const [customRole, setCustomRole] = useState('');

  const handleRoleChange = (value: string) => {
    if (value === 'other') {
      setShowCustomInput(true);
      updateData({ currentRole: customRole || 'other' });
    } else {
      setShowCustomInput(false);
      const roleOption = CURRENT_ROLE_OPTIONS.find(r => r.value === value);
      updateData({ currentRole: roleOption?.label || value });
    }
  };

  const handleCustomRoleChange = (value: string) => {
    setCustomRole(value);
    updateData({ currentRole: value });
  };

  const selectedValue = CURRENT_ROLE_OPTIONS.find(r => r.label === data.currentRole)?.value || 
    (showCustomInput ? 'other' : '');

  return (
    <div className="space-y-6">
      <RadioGroup
        value={selectedValue}
        onValueChange={handleRoleChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {CURRENT_ROLE_OPTIONS.map((option) => (
          <div key={option.value}>
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={option.value}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
                transition-all duration-200
                ${selectedValue === option.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg
                ${selectedValue === option.value
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-500'
                }
              `}>
                {roleIcons[option.value] || <User className="w-5 h-5" />}
              </div>
              <span className="font-medium">{option.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Custom Input for "Other" */}
      {showCustomInput && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <Label htmlFor="customRole" className="text-sm font-medium text-gray-700">
            Nhập vai trò của bạn
          </Label>
          <Input
            id="customRole"
            type="text"
            value={customRole}
            onChange={(e) => handleCustomRoleChange(e.target.value)}
            placeholder="VD: Sinh viên năm 5, Freelancer, Product Manager..."
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}
