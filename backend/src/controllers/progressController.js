const supabase = require('../config/supabase');

exports.updateTopicProgress = async (req, res) => {
    const { userId, topicId, completed, timeSpent } = req.body;
    try {
        const { data, error } = await supabase
            .from('user_topic_progress')
            .upsert({
                user_id: userId,
                topic_id: topicId,
                completed,
                time_spent: timeSpent,
                completed_at: completed ? new Date() : null
            })
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserProgress = async (req, res) => {
    const { userId } = req.params;
    try {
        const { data, error } = await supabase
            .from('user_topic_progress')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
