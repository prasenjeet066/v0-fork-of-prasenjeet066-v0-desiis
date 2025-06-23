-- Add blocking system
CREATE TABLE IF NOT EXISTS blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Add reporting system
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks" ON blocks
    FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "Users can create blocks" ON blocks
    FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete their own blocks" ON blocks
    FOR DELETE USING (blocker_id = auth.uid());

-- Add RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_post_id ON reports(reported_post_id);
CREATE INDEX idx_reports_user_id ON reports(reported_user_id);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_uuid UUID, blocked_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocks 
        WHERE blocker_id = blocker_uuid AND blocked_id = blocked_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
