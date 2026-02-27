import { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabsParamList = {
    Home: NavigatorScreenParams<HomeStackParamList>;
    Courses: NavigatorScreenParams<CoursesStackParamList>;
    AIChat: NavigatorScreenParams<AIChatStackParamList>;
    Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
    HomeScreen: undefined;
    CourseDetail: { slug: string };
    LessonVideo: { lessonId: string; title: string; videoUrl: string };
    LearnCourse: { slug: string };
    QAList: undefined;
    QuestionDetail: { questionId: string };
};

export type CoursesStackParamList = {
    CoursesList: undefined;
    CourseDetail: { slug: string };
    LessonVideo: { lessonId: string; title: string; videoUrl: string };
    LearnCourse: { slug: string };
};

export type AIChatStackParamList = {
    AIChatScreen: undefined;
};

export type QAStackParamList = {
    QAList: undefined;
    QuestionDetail: { questionId: string };
};

export type ProfileStackParamList = {
    ProfileScreen: undefined;
    EditProfile: undefined;
    Settings: undefined;
    CourseDetail: { slug: string };
};

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainTabsParamList>;
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}
