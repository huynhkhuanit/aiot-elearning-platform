"use client";

import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { SKILL_OPTIONS, type UserProfile, type SkillLevel } from '@/types/ai-roadmap';
import { Search, X, Check } from 'lucide-react';

interface SkillsStepProps {
  data: Partial<UserProfile>;
  updateData: (updates: Partial<UserProfile>) => void;
}

const skillLevelOptions: { value: SkillLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Mới bắt đầu', description: 'Chưa có kinh nghiệm lập trình' },
  { value: 'intermediate', label: 'Trung cấp', description: 'Đã làm một số project nhỏ' },
  { value: 'advanced', label: 'Nâng cao', description: 'Có kinh nghiệm làm việc thực tế' },
];

export default function SkillsStep({ data, updateData }: SkillsStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedSkills = data.currentSkills || [];

  const groupedSkills = useMemo(() => {
    const groups: Record<string, typeof SKILL_OPTIONS> = {};
    SKILL_OPTIONS.forEach(skill => {
      if (!groups[skill.category]) {
        groups[skill.category] = [];
      }
      groups[skill.category].push(skill);
    });
    return groups;
  }, []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedSkills;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof SKILL_OPTIONS> = {};
    
    Object.entries(groupedSkills).forEach(([category, skills]) => {
      const matchingSkills = skills.filter(
        skill => skill.label.toLowerCase().includes(query)
      );
      if (matchingSkills.length > 0) {
        filtered[category] = matchingSkills;
      }
    });
    
    return filtered;
  }, [searchQuery, groupedSkills]);

  const toggleSkill = (skillValue: string) => {
    const skill = SKILL_OPTIONS.find(s => s.value === skillValue);
    if (!skill) return;

    const newSkills = selectedSkills.includes(skill.label)
      ? selectedSkills.filter(s => s !== skill.label)
      : [...selectedSkills, skill.label];
    
    updateData({ currentSkills: newSkills });
  };

  const removeSkill = (skillLabel: string) => {
    updateData({
      currentSkills: selectedSkills.filter(s => s !== skillLabel)
    });
  };

  return (
    <div className="space-y-6">
      {/* Skill Level Selection */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Trình độ hiện tại của bạn
        </Label>
        <RadioGroup
          value={data.skillLevel || 'beginner'}
          onValueChange={(value) => updateData({ skillLevel: value as SkillLevel })}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {skillLevelOptions.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`level-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`level-${option.value}`}
                className={`
                  flex flex-col p-4 rounded-xl border-2 cursor-pointer text-center
                  transition-all duration-200
                  ${data.skillLevel === option.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span className={`font-semibold ${
                  data.skillLevel === option.value ? 'text-indigo-700' : 'text-gray-900'
                }`}>
                  {option.label}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {option.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Kỹ năng đã chọn ({selectedSkills.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 cursor-pointer"
                onClick={() => removeSkill(skill)}
              >
                {skill}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Skills Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kỹ năng..."
          className="pl-10"
        />
      </div>

      {/* Skills Grid by Category */}
      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
        {Object.entries(filteredGroups).map(([category, skills]) => (
          <div key={category}>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              {category}
            </Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.label);
                return (
                  <button
                    key={skill.value}
                    onClick={() => toggleSkill(skill.value)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      transition-all duration-200 border
                      ${isSelected
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {skill.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(filteredGroups).length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p>Không tìm thấy kỹ năng phù hợp</p>
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">
        Bỏ qua nếu bạn chưa có kỹ năng nào
      </p>
    </div>
  );
}
