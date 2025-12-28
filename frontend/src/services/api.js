import { supabase } from '../utils/supabase';

export const api = {
    lessons: {
        getAll: async () => {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .order('order', { ascending: true });
            if (error) throw error;
            return data;
        },
        getById: async (id) => {
            const { data, error } = await supabase
                .from('lessons')
                .select('*, topics(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
    },
    users: {
        getProfile: async (userId) => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) throw error;
            return data;
        },
        updateStreak: async (userId) => {
            // This would typically be handled by a backend function/trigger on login
            // But for now we can check client side or call a specific RPC
            return null;
        }
    },
    topics: {
        getByLessonId: async (lessonId) => {
            const { data, error } = await supabase
                .from('topics')
                .select('*')
                .eq('lesson_id', lessonId)
                .order('order', { ascending: true });
            if (error) throw error;
            return data;
        },
        markComplete: async (userId, topicId) => {
            const { data, error } = await supabase
                .from('user_topic_progress')
                .upsert({
                    user_id: userId,
                    topic_id: topicId,
                    completed: true,
                    completed_at: new Date(),
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
    },
    quizzes: {
        getByLessonId: async (lessonId) => {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*, quiz_questions(*)')
                .eq('lesson_id', lessonId)
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            return data; // Will return null if no quiz found, or first quiz if multiple exist
        },
        getByTopicId: async (topicId) => {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*, quiz_questions(*)')
                .eq('topic_id', topicId)
                .maybeSingle();
            if (error) throw error;
            return data; // Will return null if no quiz found
        },
        submitAttempt: async (userId, quizId, score, answers) => {
            const { data, error } = await supabase
                .from('quiz_attempts')
                .insert([{ user_id: userId, quiz_id: quizId, score, answers }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
    },
    progress: {
        getUserProgress: async (userId) => {
            const { data, error } = await supabase
                .from('user_topic_progress')
                .select('*')
                .eq('user_id', userId);
            if (error) throw error;
            return data;
        },
        getUserQuizProgress: async (userId) => {
            const { data, error } = await supabase
                .from('quiz_attempts')
                .select('*')
                .eq('user_id', userId);
            if (error) throw error;
            return data;
        }
    },
    leaderboard: {
        getTopStudents: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('username, avatar_url')
                .limit(10);
            if (error) throw error;
            return data.map((u, i) => ({ ...u, rank: i + 1, points: Math.floor(Math.random() * 1000) }));
        }
    },
    achievements: {
        getAll: async () => {
            const { data, error } = await supabase.from('achievements').select('*');
            if (error) throw error;
            return data;
        },
        getUserAchievements: async (userId) => {
            const { data, error } = await supabase
                .from('user_achievements')
                .select('*, achievement:achievements(*)')
                .eq('user_id', userId);
            if (error) throw error;
            return data;
        },
        checkUnlock: async (userId, type, value) => {
            return [];
        }
    }
};
