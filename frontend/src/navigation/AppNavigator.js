import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LessonsScreen from '../screens/LessonsScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import TopicScreen from '../screens/TopicScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuizScreen from '../screens/QuizScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LessonStackNav = createStackNavigator();

function LessonStack() {
    return (
        <LessonStackNav.Navigator screenOptions={{ headerShown: false }}>
            <LessonStackNav.Screen name="LessonsList" component={LessonsScreen} />
            <LessonStackNav.Screen name="LessonDetail" component={LessonDetailScreen} />
            <LessonStackNav.Screen name="Topic" component={TopicScreen} />
        </LessonStackNav.Navigator>
    );
}

function MainTabs() {
    const theme = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = 'view-dashboard';
                    else if (route.name === 'Lessons') iconName = 'book-open-variant';
                    else if (route.name === 'Quiz') iconName = 'brain';
                    else if (route.name === 'Leaderboard') iconName = 'trophy';
                    else if (route.name === 'Profile') iconName = 'account';
                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopWidth: 0,
                    elevation: 10,
                    height: 60,
                    paddingBottom: 10,
                }
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Lessons" component={LessonStack} />
            <Tab.Screen name="Quiz" component={QuizScreen} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        </Stack.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { session, setSession, setUser, user } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) setUser(session.user);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) setUser(session.user);
            else setUser(null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <>
            {session ? (
                user?.user_metadata?.role === 'admin' ? <AdminStack /> : <MainTabs />
            ) : (
                <AuthStack />
            )}
        </>
    );
}
