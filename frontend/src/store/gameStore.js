import { create } from 'zustand';
import { api } from '../services/api';

export const useGameStore = create((set, get) => ({
    xp: 0,
    level: 1,
    streak: 0,
    achievements: [],
    loading: false,

    fetchGameState: async (userId) => {
        set({ loading: true });
        try {
            // Fetch XP/Points (from leaderboard or calculated)
            // For now, we'll assume we get it from a profile endpoint or calculate it
            const progress = await api.progress.getUserProgress(userId);
            const quizProgress = await api.progress.getUserQuizProgress(userId);

            const completedLessons = progress.filter(p => p.completed).length;
            const totalScore = quizProgress.reduce((acc, curr) => acc + curr.score, 0);

            // Simple XP formula: 100 XP per lesson, 10 XP per quiz point
            const totalXP = (completedLessons * 100) + (totalScore * 10);
            const level = Math.floor(totalXP / 500) + 1; // Level up every 500 XP

            // Fetch Streak (from user profile)
            const userProfile = await api.users.getProfile(userId);
            const streak = userProfile?.streak_days || 0;

            // Fetch Achievements
            const achievements = await api.achievements.getUserAchievements(userId);

            set({ xp: totalXP, level, streak, achievements });
        } catch (error) {
            console.error('Error fetching game state:', error);
        } finally {
            set({ loading: false });
        }
    },

    addXp: (amount) => {
        set((state) => {
            const newXp = state.xp + amount;
            const newLevel = Math.floor(newXp / 500) + 1;
            return { xp: newXp, level: newLevel };
        });
        // Ideally sync with backend here
    },

    incrementStreak: () => {
        set((state) => ({ streak: state.streak + 1 }));
    }
}));
