const supabase = require('../config/supabase');

exports.getAll = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('achievements')
            .select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getUserAchievements = async (req, res) => {
    const { userId } = req.params;
    try {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*, achievement:achievements(*)')
            .eq('user_id', userId);
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.checkUnlock = async (req, res) => {
    const { userId, type, value } = req.body;
    // type: 'quiz_count', 'login_streak', 'perfect_score'

    try {
        // 1. Get all achievements of this type
        const { data: potentialAchievements, error: fetchError } = await supabase
            .from('achievements')
            .select('*')
            .eq('condition_type', type)
            .lte('condition_value', value); // Check if condition met

        if (fetchError) throw fetchError;

        // 2. Get already unlocked achievements
        const { data: unlocked, error: unlockedError } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId);

        if (unlockedError) throw unlockedError;

        const unlockedIds = unlocked.map(u => u.achievement_id);
        const newUnlocks = [];

        // 3. Unlock new ones
        for (const achievement of potentialAchievements) {
            if (!unlockedIds.includes(achievement.id)) {
                const { error: insertError } = await supabase
                    .from('user_achievements')
                    .insert({ user_id: userId, achievement_id: achievement.id });

                if (!insertError) {
                    newUnlocks.push(achievement);
                }
            }
        }

        res.status(200).json({ newUnlocks });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
