import { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabsParamList = {
    Home: NavigatorScreenParams<HomeStackParamList>;
    Courses: NavigatorScreenParams<CoursesStackParamList>;
    Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
    HomeScreen: undefined;
    CourseDetail: { slug: string };
    LessonVideo: { lessonId: string; title: string; videoUrl: string };
};

export type CoursesStackParamList = {
    CoursesList: undefined;
    CourseDetail: { slug: string };
    LessonVideo: { lessonId: string; title: string; videoUrl: string };
};

export type ProfileStackParamList = {
    ProfileScreen: undefined;
    EditProfile: undefined;
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
