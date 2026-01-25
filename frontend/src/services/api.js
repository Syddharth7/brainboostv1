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
        updateProfile: async (userId, updates) => {
            // Update user_metadata in auth
            const { data: authData, error: authError } = await supabase.auth.updateUser({
                data: updates
            });
            if (authError) throw authError;

            // Update users table (user should already exist from signup trigger)
            try {
                const { data: updateData, error: updateError } = await supabase
                    .from('users')
                    .update({
                        username: updates.username || updates.display_name,
                        avatar_url: updates.avatar_url
                    })
                    .eq('id', userId)
                    .select();

                if (updateError) {
                    console.log('Users table update error:', updateError);
                } else {
                    console.log('Users table updated successfully:', updateData);
                }
            } catch (e) {
                console.log('Users table update exception:', e);
            }

            return authData;
        },
        uploadAvatar: async (userId, imageUri) => {
            // Read image as base64
            const response = await fetch(imageUri);
            const arrayBuffer = await response.arrayBuffer();

            // Create unique filename
            const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Convert ArrayBuffer to Uint8Array for upload
            const uint8Array = new Uint8Array(arrayBuffer);

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(filePath, uint8Array, {
                    contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        },
        updateStreak: async (userId) => {
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
                .select('id, username, avatar_url')
                .limit(10);
            if (error) throw error;
            return data.map((u, i) => ({
                ...u,
                rank: i + 1,
                points: Math.floor(Math.random() * 1000) + 1500
            }));
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
    },
    xp: {
        // Calculate level from total XP (no level cap, formula: level n requires 100*n*(n+1)/2 XP)
        calculateLevel: (totalXp) => {
            // Using quadratic formula to solve: 100*n*(n+1)/2 = xp
            // Simplified: 50n² + 50n - xp = 0
            // n = (-50 + sqrt(2500 + 200*xp)) / 100
            const level = Math.floor((-50 + Math.sqrt(2500 + 200 * totalXp)) / 100) + 1;
            return Math.max(1, level);
        },

        // XP required for a specific level
        getXpForLevel: (level) => {
            if (level <= 1) return 0;
            // Sum of 100*1 + 100*2 + ... + 100*(level-1) = 100 * (level-1)*level/2
            return 100 * (level - 1) * level / 2;
        },

        // Get user XP and level
        getUserXP: async (userId) => {
            const { data, error } = await supabase
                .from('users')
                .select('xp, level')
                .eq('id', userId)
                .single();
            if (error) throw error;
            return data || { xp: 0, level: 1 };
        },

        // Award XP for completing a topic (progressive based on topic order)
        // Topic 1: 150 XP, Topic 2: 225 XP, Topic 3: 300 XP, etc.
        awardTopicXP: async (userId, topicOrder) => {
            const xpReward = 75 + (topicOrder * 75); // Progressive: 150, 225, 300, 375...

            // Get current XP
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('xp, level')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const currentXp = userData?.xp || 0;
            const newXp = currentXp + xpReward;

            // Calculate new level
            const newLevel = api.xp.calculateLevel(newXp);

            // Update user XP and level
            const { data, error } = await supabase
                .from('users')
                .update({ xp: newXp, level: newLevel })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return {
                xpAwarded: xpReward,
                totalXp: newXp,
                level: newLevel,
                leveledUp: newLevel > (userData?.level || 1)
            };
        },

        // Award XP for completing a quiz (progressive based on quiz/topic order)
        // Only if passed (score >= 70%)
        // Quiz 1: 200 XP, Quiz 2: 300 XP, Quiz 3: 400 XP, etc.
        awardQuizXP: async (userId, topicOrder, passed, score) => {
            if (!passed) return { xpAwarded: 0, totalXp: 0, level: 1, leveledUp: false };

            // Base XP + bonus for higher score
            const baseXp = 100 + (topicOrder * 100); // Progressive: 200, 300, 400, 500...
            const scoreBonus = Math.floor((score - 70) * 2); // Bonus for scores above 70%
            const xpReward = baseXp + scoreBonus;

            // Get current XP
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('xp, level')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const currentXp = userData?.xp || 0;
            const newXp = currentXp + xpReward;

            // Calculate new level
            const newLevel = api.xp.calculateLevel(newXp);

            // Update user XP and level
            const { data, error } = await supabase
                .from('users')
                .update({ xp: newXp, level: newLevel })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return {
                xpAwarded: xpReward,
                totalXp: newXp,
                level: newLevel,
                leveledUp: newLevel > (userData?.level || 1)
            };
        }
    }
};
