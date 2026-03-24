"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";

export interface LearningContext {
    courseTitle: string;
    courseSlug: string;
    currentLessonTitle: string;
    currentLessonId: string;
    lessonType: "video" | "reading" | "quiz";
    lessonContent: string;
    videoUrl: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    currentSection: string;
    recentCompletedTopics: string[];
    courseOutline: string;
}

interface AITutorContextType {
    learningContext: LearningContext | null;
    setLearningContext: (ctx: LearningContext | null) => void;
    updateLesson: (lesson: {
        id: string;
        title: string;
        type: "video" | "reading" | "quiz";
    }) => void;
    updateProgress: (
        progress: number,
        completed: number,
        total: number,
    ) => void;
    updateLessonContent: (content: string) => void;
}

const AITutorContext = createContext<AITutorContextType | undefined>(undefined);

export function AITutorProvider({ children }: { children: ReactNode }) {
    const [learningContext, setLearningContext] =
        useState<LearningContext | null>(null);

    const updateLesson = useCallback(
        (lesson: {
            id: string;
            title: string;
            type: "video" | "reading" | "quiz";
        }) => {
            setLearningContext((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    currentLessonId: lesson.id,
                    currentLessonTitle: lesson.title,
                    lessonType: lesson.type,
                    lessonContent: "",
                };
            });
        },
        [],
    );

    const updateProgress = useCallback(
        (progress: number, completed: number, total: number) => {
            setLearningContext((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    progress,
                    completedLessons: completed,
                    totalLessons: total,
                };
            });
        },
        [],
    );

    const updateLessonContent = useCallback((content: string) => {
        setLearningContext((prev) => {
            if (!prev) return prev;
            return { ...prev, lessonContent: content };
        });
    }, []);

    return (
        <AITutorContext.Provider
            value={{
                learningContext,
                setLearningContext,
                updateLesson,
                updateProgress,
                updateLessonContent,
            }}
        >
            {children}
        </AITutorContext.Provider>
    );
}

export function useAITutor() {
    const context = useContext(AITutorContext);
    if (context === undefined) {
        throw new Error("useAITutor must be used within an AITutorProvider");
    }
    return context;
}
