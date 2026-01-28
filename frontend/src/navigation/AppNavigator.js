import React, { useEffect, useState, useRef } from 'react';
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
import { ActivityIndicator, View, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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

// Custom Pill Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;

                    // Get icon name and label based on route
                    let iconName;
                    let label;
                    switch (route.name) {
                        case 'Dashboard':
                            iconName = isFocused ? 'home' : 'home-outline';
                            label = 'Home';
                            break;
                        case 'Lessons':
                            iconName = isFocused ? 'book-open-page-variant' : 'book-open-page-variant-outline';
                            label = 'Lessons';
                            break;
                        case 'Quiz':
                            iconName = isFocused ? 'head-question' : 'head-question-outline';
                            label = 'Quiz';
                            break;
                        case 'Leaderboard':
                            iconName = isFocused ? 'trophy' : 'trophy-outline';
                            label = 'Rank';
                            break;
                        case 'Profile':
                            iconName = isFocused ? 'account' : 'account-outline';
                            label = 'Profile';
                            break;
                        default:
                            iconName = 'circle-outline';
                            label = route.name;
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TabItem
                            key={route.key}
                            iconName={iconName}
                            label={label}
                            isFocused={isFocused}
                            onPress={onPress}
                        />
                    );
                })}
            </View>
        </View>
    );
};

// Individual Tab Item with tooltip label
const TabItem = ({ iconName, label, isFocused, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const tooltipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: isFocused ? 1.05 : 1,
                friction: 6,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.spring(tooltipAnim, {
                toValue: isFocused ? 1 : 0,
                friction: 6,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isFocused]);

    return (
        <View style={styles.tabItemWrapper}>
            {/* Tooltip Label */}
            <Animated.View
                style={[
                    styles.tooltip,
                    {
                        opacity: tooltipAnim,
                        transform: [
                            {
                                translateY: tooltipAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [10, 0],
                                })
                            },
                            { scale: tooltipAnim },
                        ],
                    },
                ]}
            >
                <Text style={styles.tooltipText}>{label}</Text>
                <View style={styles.tooltipArrow} />
            </Animated.View>

            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.tabItemTouchable}
            >
                <Animated.View
                    style={[
                        styles.tabItem,
                        isFocused && styles.tabItemFocused,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <MaterialCommunityIcons
                        name={iconName}
                        size={24}
                        color={isFocused ? '#2D3436' : '#636E72'}
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

function MainTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
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

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 70,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 8,
        borderWidth: 3,
        borderColor: '#2D3436',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    tabItemWrapper: {
        alignItems: 'center',
        position: 'relative',
    },
    tooltip: {
        position: 'absolute',
        top: -45,
        backgroundColor: '#2D3436',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 12,
        zIndex: 100,
        minWidth: 90,
        alignItems: 'center',
    },
    tooltipText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    tooltipArrow: {
        position: 'absolute',
        bottom: -8,
        left: '50%',
        marginLeft: -8,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#2D3436',
    },
    tabItemTouchable: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabItem: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    tabItemFocused: {
        borderColor: '#2D3436',
        borderWidth: 3,
    },
});
