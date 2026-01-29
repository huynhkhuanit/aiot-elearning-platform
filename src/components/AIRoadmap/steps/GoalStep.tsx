"use client";

import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TARGET_ROLE_OPTIONS, type UserProfile } from '@/types/ai-roadmap';
import { Search, Code, Database, Cloud, Smartphone, Brain, Shield, Gamepad, Link } from 'lucide-react';

interface GoalStepProps {
  data: Partial<UserProfile>;
  updateData: (updates: Partial<UserProfile>) => void;
}

const roleCategories = {
  'Frontend': ['frontend-developer'],
  'Backend': ['backend-developer'],
  'Fullstack': ['fullstack-developer'],
  'Mobile': ['mobile-developer'],
  'DevOps & Cloud': ['devops-engineer', 'cloud-architect'],
  'Data & AI': ['data-engineer', 'data-scientist', 'ml-engineer', 'ai-engineer'],
  'Specialized': ['security-engineer', 'qa-engineer', 'game-developer', 'blockchain-developer', 'embedded-engineer'],
};

const roleIcons: Record<string, React.ReactNode> = {
  'frontend-developer': <Code className="w-5 h-5" />,
  'backend-developer': <Database className="w-5 h-5" />,
  'fullstack-developer': <Code className="w-5 h-5" />,
  'mobile-developer': <Smartphone className="w-5 h-5" />,
  'devops-engineer': <Cloud className="w-5 h-5" />,
  'cloud-architect': <Cloud className="w-5 h-5" />,
  'data-engineer': <Database className="w-5 h-5" />,
  'data-scientist': <Brain className="w-5 h-5" />,
  'ml-engineer': <Brain className="w-5 h-5" />,
  'ai-engineer': <Brain className="w-5 h-5" />,
  'security-engineer': <Shield className="w-5 h-5" />,
  'qa-engineer': <Shield className="w-5 h-5" />,
  'game-developer': <Gamepad className="w-5 h-5" />,
  'blockchain-developer': <Link className="w-5 h-5" />,
  'embedded-engineer': <Code className="w-5 h-5" />,
};

export default function GoalStep({ data, updateData }: GoalStepProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return TARGET_ROLE_OPTIONS;
    const query = searchQuery.toLowerCase();
    return TARGET_ROLE_OPTIONS.filter(
      option => option.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const selectedValue = TARGET_ROLE_OPTIONS.find(r => r.label === data.targetRole)?.value || '';

  const handleSelect = (value: string) => {
    const roleOption = TARGET_ROLE_OPTIONS.find(r => r.value === value);
    updateData({ targetRole: roleOption?.label || value });
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm vị trí..."
          className="pl-10"
        />
      </div>

      {/* Role Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`
              flex items-center gap-3 p-4 rounded-xl border-2 text-left
              transition-all duration-200
              ${selectedValue === option.value
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className={`
              p-2 rounded-lg flex-shrink-0
              ${selectedValue === option.value
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-500'
              }
            `}>
              {roleIcons[option.value] || <Code className="w-5 h-5" />}
            </div>
            <div>
              <span className={`font-medium ${
                selectedValue === option.value ? 'text-indigo-700' : 'text-gray-900'
              }`}>
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredOptions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Không tìm thấy vị trí phù hợp</p>
          <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      )}

      {/* Selected Info */}
      {data.targetRole && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <p className="text-sm text-indigo-600 font-medium">
            Mục tiêu của bạn:
          </p>
          <p className="text-lg font-bold text-indigo-900">
            {data.targetRole}
          </p>
        </div>
      )}
    </div>
  );
}
