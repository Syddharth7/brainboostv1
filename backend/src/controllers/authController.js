const supabase = require('../config/supabase');

exports.register = async (req, res) => {
    const { email, password, username, role } = req.body;

    try {
        // 1. Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    role: role || 'student', // Default to student
                },
            },
        });

        if (error) throw error;

        // 2. (Optional) Create user profile in public.users table is handled by Trigger in schema.sql
        // If trigger fails or is not used, we would do it here.

        res.status(201).json({ message: 'User registered successfully', user: data.user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // --- STREAK LOGIC ---
        const userId = data.user.id;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today

        // Fetch current user data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('streak_days, last_login_date')
            .eq('id', userId)
            .single();

        if (!userError && userData) {
            let newStreak = userData.streak_days || 0;
            const lastLogin = userData.last_login_date ? new Date(userData.last_login_date) : null;

            if (lastLogin) {
                const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
                const diffTime = Math.abs(today - lastLoginDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Logged in yesterday, increment streak
                    newStreak += 1;
                } else if (diffDays > 1) {
                    // Missed a day, reset streak
                    newStreak = 1;
                }
                // If diffDays === 0, logged in today already, do nothing to streak
            } else {
                // First login ever
                newStreak = 1;
            }

            // Update user
            await supabase
                .from('users')
                .update({
                    streak_days: newStreak,
                    last_login_date: now.toISOString()
                })
                .eq('id', userId);

            // Attach streak to response
            data.user.streak_days = newStreak;
        }
        // --------------------

        res.status(200).json({ message: 'Login successful', session: data.session, user: data.user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

exports.logout = async (req, res) => {
    // Logout is typically client-side for JWT, but if we have a session cookie we clear it.
    // For Supabase server-side:
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: 'Logged out successfully' });
};
