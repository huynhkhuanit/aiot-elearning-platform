"use client";

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LEARNING_STYLE_OPTIONS, type UserProfile, type LearningStyle, type PreferredLanguage } from '@/types/ai-roadmap';
import { BookOpen, Video, Wrench, Gamepad2, Check } from 'lucide-react';

interface StyleStepProps {
  data: Partial<UserProfile>;
  updateData: (updates: Partial<UserProfile>) => void;
}

const styleIcons: Record<LearningStyle, React.ReactNode> = {
  'documentation': <BookOpen className="w-6 h-6" />,
  'video': <Video className="w-6 h-6" />,
  'project': <Wrench className="w-6 h-6" />,
  'interactive': <Gamepad2 className="w-6 h-6" />,
};

export default function StyleStep({ data, updateData }: StyleStepProps) {
  const selectedStyles = data.learningStyle || [];

  const toggleStyle = (style: LearningStyle) => {
    const newStyles = selectedStyles.includes(style)
      ? selectedStyles.filter(s => s !== style)
      : [...selectedStyles, style];
    updateData({ learningStyle: newStyles });
  };

  const handleLanguageChange = (language: PreferredLanguage) => {
    updateData({ preferredLanguage: language });
  };

  return (
    <div className="space-y-8">
      {/* Learning Style Selection */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-4 block">
          Bạn thích học theo cách nào? (chọn 1 hoặc nhiều)
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEARNING_STYLE_OPTIONS.map((option) => {
            const isSelected = selectedStyles.includes(option.value as LearningStyle);
            return (
              <button
                key={option.value}
                onClick={() => toggleStyle(option.value as LearningStyle)}
                className={`
                  relative flex flex-col items-center text-center p-6 rounded-2xl border-2
                  transition-all duration-200
                  ${isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`
                  p-4 rounded-xl mb-3
                  ${isSelected
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {styleIcons[option.value as LearningStyle]}
                </div>
                <span className={`font-semibold text-lg ${
                  isSelected ? 'text-indigo-700' : 'text-gray-900'
                }`}>
                  {option.label}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Preference */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-4 block">
          Ngôn ngữ ưa thích cho lộ trình
        </Label>
        <div className="flex gap-4">
          <button
            onClick={() => handleLanguageChange('vi')}
            className={`
              flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2
              transition-all duration-200
              ${data.preferredLanguage === 'vi'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl">🇻🇳</span>
            <span className={`font-medium ${
              data.preferredLanguage === 'vi' ? 'text-indigo-700' : 'text-gray-900'
            }`}>
              Tiếng Việt
            </span>
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`
              flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2
              transition-all duration-200
              ${data.preferredLanguage === 'en'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl">🇺🇸</span>
            <span className={`font-medium ${
              data.preferredLanguage === 'en' ? 'text-indigo-700' : 'text-gray-900'
            }`}>
              English
            </span>
          </button>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedStyles.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <p className="text-sm text-indigo-600 font-medium mb-2">
            Phong cách học của bạn:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedStyles.map((style) => {
              const option = LEARNING_STYLE_OPTIONS.find(o => o.value === style);
              return (
                <span
                  key={style}
                  className="px-3 py-1 bg-white rounded-full text-sm font-medium text-indigo-700 border border-indigo-200"
                >
                  {option?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
