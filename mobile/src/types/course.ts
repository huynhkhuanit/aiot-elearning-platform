export interface Course {
    id: string;
    title: string;
    slug: string;
    subtitle: string;
    thumbnailUrl: string | null;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    price: string;
    priceAmount: number;
    isFree: boolean;
    isPro: boolean;
    duration: string;
    rating: number;
    students: number;
    totalLessons: number;
    category: {
        name: string;
        slug: string;
    };
    instructor: {
        name: string;
        username: string;
        avatar: string | null;
    };
    createdAt: string;
}

export interface CourseDetail extends Course {
    description: string;
    requirements: string[];
    whatYouLearn: string[];
    isEnrolled: boolean;
    progress: number;
}

export interface Chapter {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
}

export interface Lesson {
    id: string;
    title: string;
    video_url: string | null;
    duration: number;
    order_index: number;
    is_completed: boolean;
}

export interface EnrolledCourse {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    progress_percentage: number;
    enrolled_at: string;
    is_completed: boolean;
}

export interface CoursesResponse {
    success: boolean;
    data: {
        courses: Course[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasMore: boolean;
        };
    };
}
