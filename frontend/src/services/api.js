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
        create: async (title, category, description, order) => {
            const { data, error } = await supabase
                .from('lessons')
                .insert([{ title, category, description, order }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('lessons')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        },
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
        getById: async (id) => {
            const { data, error } = await supabase
                .from('topics')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
        create: async (lessonId, title, content, order, estimatedTime) => {
            const { data, error } = await supabase
                .from('topics')
                .insert([{ lesson_id: lessonId, title, content, order, estimated_time: estimatedTime }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('topics')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('topics')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        },
    },
    quizzesAdmin: {
        getByTopicId: async (topicId) => {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*, quiz_questions(*)')
                .eq('topic_id', topicId);
            if (error) throw error;
            return data;
        },
        getById: async (id) => {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*, quiz_questions(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
        create: async (topicId, title, passingScore = 70) => {
            const { data, error } = await supabase
                .from('quizzes')
                .insert([{ topic_id: topicId, title, passing_score: passingScore }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('quizzes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        },
    },
    quizQuestions: {
        getByQuizId: async (quizId) => {
            const { data, error } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quizId)
                .order('order', { ascending: true });
            if (error) throw error;
            return data;
        },
        create: async (quizId, questionText, options, correctAnswer, order) => {
            const { data, error } = await supabase
                .from('quiz_questions')
                .insert([{ quiz_id: quizId, question_text: questionText, options, correct_answer: correctAnswer, order }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('quiz_questions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('quiz_questions')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        },
    },
    analytics: {
        // Get all students with their quiz performance summary
        getStudentsWithScores: async () => {
            // Get all students
            const { data: students, error: studentsError } = await supabase
                .from('users')
                .select('id, username, email, section, avatar_url')
                .eq('role', 'student');
            if (studentsError) throw studentsError;

            // Get all quiz attempts with quiz and lesson info
            const { data: attempts, error: attemptsError } = await supabase
                .from('quiz_attempts')
                .select(`
                    user_id,
                    score,
                    quiz_id,
                    quizzes (
                        id,
                        title,
                        topic_id,
                        topics (
                            lesson_id,
                            lessons (
                                category
                            )
                        )
                    )
                `);
            if (attemptsError) throw attemptsError;

            // Calculate scores per student
            const studentScores = students.map(student => {
                const studentAttempts = attempts.filter(a => a.user_id === student.id);
                const totalScore = studentAttempts.reduce((sum, a) => sum + a.score, 0);
                const avgScore = studentAttempts.length > 0 ? Math.round(totalScore / studentAttempts.length) : 0;

                // Group by category
                const categoryScores = {};
                studentAttempts.forEach(attempt => {
                    const category = attempt.quizzes?.topics?.lessons?.category;
                    if (category) {
                        if (!categoryScores[category]) {
                            categoryScores[category] = { total: 0, count: 0 };
                        }
                        categoryScores[category].total += attempt.score;
                        categoryScores[category].count += 1;
                    }
                });

                // Calculate avg per category
                const categories = Object.entries(categoryScores).map(([name, data]) => ({
                    name,
                    score: Math.round(data.total / data.count)
                }));

                // Find weakest category
                const weakest = categories.length > 0
                    ? categories.reduce((min, c) => c.score < min.score ? c : min, categories[0])
                    : null;

                return {
                    ...student,
                    avgScore,
                    quizCount: studentAttempts.length,
                    categories,
                    weakestCategory: weakest
                };
            });

            return studentScores;
        },

        // Get unique sections
        getSections: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('section')
                .eq('role', 'student');
            if (error) throw error;

            const sections = [...new Set(data.map(u => u.section).filter(Boolean))];
            return sections.sort();
        },

        // Get detailed progress for a specific student
        getStudentProgress: async (studentId) => {
            // Get student info
            const { data: student, error: studentError } = await supabase
                .from('users')
                .select('*')
                .eq('id', studentId)
                .single();
            if (studentError) throw studentError;

            // Get all quiz attempts with full details
            const { data: attempts, error: attemptsError } = await supabase
                .from('quiz_attempts')
                .select(`
                    *,
                    quizzes (
                        id,
                        title,
                        passing_score,
                        topic_id,
                        topics (
                            id,
                            title,
                            lesson_id,
                            lessons (
                                id,
                                title,
                                category
                            )
                        )
                    )
                `)
                .eq('user_id', studentId)
                .order('completed_at', { ascending: false });
            if (attemptsError) throw attemptsError;

            // Calculate category performance
            const categoryData = {};
            attempts.forEach(attempt => {
                const category = attempt.quizzes?.topics?.lessons?.category;
                if (category) {
                    if (!categoryData[category]) {
                        categoryData[category] = {
                            total: 0,
                            count: 0,
                            passed: 0,
                            quizzes: []
                        };
                    }
                    categoryData[category].total += attempt.score;
                    categoryData[category].count += 1;
                    if (attempt.score >= (attempt.quizzes?.passing_score || 70)) {
                        categoryData[category].passed += 1;
                    }
                    categoryData[category].quizzes.push({
                        id: attempt.quiz_id,
                        title: attempt.quizzes?.title,
                        score: attempt.score,
                        passed: attempt.score >= (attempt.quizzes?.passing_score || 70),
                        date: attempt.completed_at
                    });
                }
            });

            const categories = Object.entries(categoryData).map(([name, data]) => ({
                name,
                avgScore: Math.round(data.total / data.count),
                quizCount: data.count,
                passRate: Math.round((data.passed / data.count) * 100),
                quizzes: data.quizzes
            })).sort((a, b) => b.avgScore - a.avgScore);

            // Overall stats
            const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
            const avgScore = attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0;

            return {
                student,
                avgScore,
                totalQuizzes: attempts.length,
                categories,
                recentAttempts: attempts.slice(0, 10),
                strengths: categories.filter(c => c.avgScore >= 80),
                weaknesses: categories.filter(c => c.avgScore < 60)
            };
        }
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
        },
        registerPushToken: async (userId, pushToken) => {
            const { data, error } = await supabase
                .from('users')
                .update({ push_token: pushToken })
                .eq('id', userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },
    students: {
        getAll: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'student')
                .order('section', { ascending: true });
            if (error) throw error;
            return data;
        },
        getBySection: async (section) => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'student')
                .eq('section', section)
                .order('username', { ascending: true });
            if (error) throw error;
            return data;
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
                .eq('lesson_id', lessonId);
            if (error) throw error;
            return data || [];
        },
        // Get all quizzes for a lesson via its topics
        getAllByLessonIdViaTopics: async (lessonId) => {
            // First get all topics for this lesson
            const { data: topics, error: topicsError } = await supabase
                .from('topics')
                .select('id')
                .eq('lesson_id', lessonId)
                .order('order', { ascending: true });
            if (topicsError) throw topicsError;

            if (!topics || topics.length === 0) return [];

            // Get all quizzes linked to these topics
            const topicIds = topics.map(t => t.id);
            const { data: quizzes, error: quizzesError } = await supabase
                .from('quizzes')
                .select('*, quiz_questions(*)')
                .in('topic_id', topicIds);
            if (quizzesError) throw quizzesError;

            return quizzes || [];
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
        },
        getAllQuizProgress: async () => {
            const { data, error } = await supabase
                .from('quiz_attempts')
                .select('*');
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
    },
    announcements: {
        getAll: async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        create: async (title, message, teacherName, createdBy) => {
            console.log('=== ANNOUNCEMENT CREATE START ===');
            console.log('Title:', title);
            console.log('Message:', message);

            // 1. Insert announcement into database
            const { data: announcement, error: insertError } = await supabase
                .from('announcements')
                .insert([{
                    title,
                    message,
                    teacher_name: teacherName,
                    created_by: createdBy
                }])
                .select()
                .single();

            if (insertError) {
                console.error('Failed to insert announcement:', insertError);
                throw insertError;
            }
            console.log('Announcement inserted:', announcement?.id);

            // 2. Fetch all student push tokens
            console.log('Fetching student push tokens...');
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, username, push_token, role')
                .eq('role', 'student')
                .not('push_token', 'is', null);

            console.log('Users query result:', {
                count: users?.length || 0,
                error: usersError,
                users: users?.map(u => ({
                    id: u.id,
                    username: u.username,
                    hasToken: !!u.push_token,
                    tokenPreview: u.push_token?.substring(0, 30) + '...'
                }))
            });

            if (usersError) {
                console.error('Error fetching push tokens:', usersError);
                return announcement;
            }

            // 3. Filter valid Expo push tokens
            const pushTokens = (users || [])
                .map(u => u.push_token)
                .filter(token => token && token.startsWith('ExponentPushToken'));

            console.log('Valid push tokens found:', pushTokens.length);
            console.log('Tokens:', pushTokens);

            if (pushTokens.length === 0) {
                console.warn('NO PUSH TOKENS FOUND! Students need to log in to register tokens.');
                return announcement;
            }

            // 4. Build notification messages
            const messages = pushTokens.map(token => ({
                to: token,
                sound: 'default',
                title: `📢 ${title}`,
                body: message,
                data: { announcementId: announcement.id, type: 'announcement' }
            }));

            console.log('Sending', messages.length, 'push notifications...');
            console.log('Messages payload:', JSON.stringify(messages, null, 2));

            // 5. Send to Expo Push API
            try {
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(messages)
                });

                console.log('Expo API response status:', response.status);

                const pushResult = await response.json();
                console.log('Expo API response:', JSON.stringify(pushResult, null, 2));

                // Check for errors in the response
                if (pushResult.data) {
                    pushResult.data.forEach((result, index) => {
                        if (result.status === 'error') {
                            console.error(`Push failed for token ${index}:`, result.message, result.details);
                        } else {
                            console.log(`Push success for token ${index}:`, result.id);
                        }
                    });
                }

                console.log('=== ANNOUNCEMENT CREATE END ===');
            } catch (pushError) {
                console.error('Push notification error:', pushError);
                console.error('Error stack:', pushError.stack);
            }

            return announcement;
        },
        delete: async (id) => {
            const { data, error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return data;
        }
    }
};
