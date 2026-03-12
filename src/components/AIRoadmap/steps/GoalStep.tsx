"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TARGET_ROLE_OPTIONS, type UserProfile } from "@/types/ai-roadmap";
import {
    Search,
    Code,
    Database,
    Cloud,
    Smartphone,
    Brain,
    Shield,
    Gamepad,
    Link,
    Plus,
    X,
} from "lucide-react";

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

const FOCUS_AREA_SUGGESTIONS = [
  "Lý thuyết cốt lõi",
  "Kiến trúc hệ thống",
  "Data structures",
  "Algorithms",
  "System design",
  "Performance",
  "Security",
  "Testing",
  "Portfolio",
  "Interview prep",
];

export default function GoalStep({ data, updateData }: GoalStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [focusAreaInput, setFocusAreaInput] = useState("");
  const selectedFocusAreas = data.focusAreas || [];

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return TARGET_ROLE_OPTIONS;
    const query = searchQuery.toLowerCase();
    return TARGET_ROLE_OPTIONS.filter(
      option => option.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const selectedValue = TARGET_ROLE_OPTIONS.find(r => r.label === data.targetRole)?.value || "";

  const handleSelect = (value: string) => {
    const roleOption = TARGET_ROLE_OPTIONS.find(r => r.value === value);
    updateData({ targetRole: roleOption?.label || value });
  };

  const addFocusArea = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    const nextValues = [...selectedFocusAreas];
    if (!nextValues.some((item) => item.toLowerCase() === trimmedValue.toLowerCase())) {
      nextValues.push(trimmedValue);
      updateData({ focusAreas: nextValues });
    }

    setFocusAreaInput("");
  };

  const handleFocusAreaKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFocusArea(focusAreaInput);
    }
  };

  const removeFocusArea = (value: string) => {
    updateData({
      focusAreas: selectedFocusAreas.filter((item) => item !== value),
    });
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

      <div className="space-y-4 border-t border-gray-100 pt-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Chủ đề bạn muốn AI đào sâu
          </Label>
          <p className="text-sm text-gray-500">
            Thêm các cụm kiến thức bạn muốn lộ trình chia nhỏ và ưu tiên hơn.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            value={focusAreaInput}
            onChange={(event) => setFocusAreaInput(event.target.value)}
            onKeyDown={handleFocusAreaKeyDown}
            placeholder="Ví dụ: React internals, Distributed systems, AI theory..."
          />
          <button
            type="button"
            onClick={() => addFocusArea(focusAreaInput)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            <Plus className="h-4 w-4" />
            Thêm
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {FOCUS_AREA_SUGGESTIONS.map((suggestion) => {
            const isActive = selectedFocusAreas.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  isActive ? removeFocusArea(suggestion) : addFocusArea(suggestion)
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-indigo-300 bg-indigo-100 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {suggestion}
              </button>
            );
          })}
        </div>

        {selectedFocusAreas.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-4">
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              Chủ đề đã chọn ({selectedFocusAreas.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedFocusAreas.map((focusArea) => (
                <Badge
                  key={focusArea}
                  variant="secondary"
                  className="cursor-pointer bg-indigo-100 px-3 py-1 text-indigo-700 hover:bg-indigo-200"
                  onClick={() => removeFocusArea(focusArea)}
                >
                  {focusArea}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
