"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import RoleStep from './steps/RoleStep';
import GoalStep from './steps/GoalStep';
import SkillsStep from './steps/SkillsStep';
import StyleStep from './steps/StyleStep';
import TimelineStep from './steps/TimelineStep';
import type { UserProfile, SkillLevel, LearningStyle, PreferredLanguage } from '@/types/ai-roadmap';

interface OnboardingFormProps {
  onSubmit: (profile: UserProfile) => Promise<void>;
  isLoading?: boolean;
}

const TOTAL_STEPS = 5;

const stepTitles = [
  'Bạn là ai?',
  'Mục tiêu của bạn?',
  'Kỹ năng hiện tại',
  'Phong cách học',
  'Thời gian & Timeline',
];

const stepDescriptions = [
  'Cho chúng tôi biết về vai trò hiện tại của bạn',
  'Bạn muốn trở thành vị trí nào trong tương lai?',
  'Bạn đã biết những công nghệ/kỹ năng nào rồi?',
  'Bạn thích học theo cách nào nhất?',
  'Bạn có thể dành bao nhiêu thời gian để học?',
];

export default function OnboardingForm({ onSubmit, isLoading = false }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    currentRole: '',
    targetRole: '',
    currentSkills: [],
    skillLevel: 'beginner',
    learningStyle: [],
    hoursPerWeek: 10,
    targetMonths: 6,
    preferredLanguage: 'vi',
    focusAreas: [],
  });

  const updateFormData = (updates: Partial<UserProfile>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.currentRole && formData.currentRole.length > 0;
      case 2:
        return formData.targetRole && formData.targetRole.length > 0;
      case 3:
        return formData.currentSkills && formData.currentSkills.length >= 0; // Allow empty (no skills)
      case 4:
        return formData.learningStyle && formData.learningStyle.length > 0;
      case 5:
        return formData.hoursPerWeek && formData.targetMonths;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canGoNext()) return;
    
    const profile: UserProfile = {
      currentRole: formData.currentRole || '',
      targetRole: formData.targetRole || '',
      currentSkills: formData.currentSkills || [],
      skillLevel: (formData.skillLevel as SkillLevel) || 'beginner',
      learningStyle: (formData.learningStyle as LearningStyle[]) || [],
      hoursPerWeek: formData.hoursPerWeek || 10,
      targetMonths: formData.targetMonths || 6,
      preferredLanguage: (formData.preferredLanguage as PreferredLanguage) || 'vi',
      focusAreas: formData.focusAreas || [],
    };

    await onSubmit(profile);
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const renderStep = () => {
    const commonProps = {
      data: formData,
      updateData: updateFormData,
    };

    switch (currentStep) {
      case 1:
        return <RoleStep {...commonProps} />;
      case 2:
        return <GoalStep {...commonProps} />;
      case 3:
        return <SkillsStep {...commonProps} />;
      case 4:
        return <StyleStep {...commonProps} />;
      case 5:
        return <TimelineStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">
            Bước {currentStep} / {TOTAL_STEPS}
          </span>
          <span className="text-sm font-medium text-indigo-600">
            {Math.round(progress)}% hoàn thành
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Step Title */}
          <div className="text-center mb-8">
            <motion.h2
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {stepTitles[currentStep - 1]}
            </motion.h2>
            <motion.p
              key={`desc-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500"
            >
              {stepDescriptions[currentStep - 1]}
            </motion.p>
          </div>

          {/* Step Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isLoading}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            Tiếp theo
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canGoNext() || isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo lộ trình...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Tạo lộ trình AI
              </>
            )}
          </Button>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center mt-8 gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <button
            key={index}
            onClick={() => !isLoading && setCurrentStep(index + 1)}
            disabled={isLoading}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index + 1 === currentStep
                ? 'bg-indigo-600 w-8'
                : index + 1 < currentStep
                ? 'bg-indigo-400'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
