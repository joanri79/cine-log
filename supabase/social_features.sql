-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES usuarios(id) NOT NULL,
  friend_id uuid REFERENCES usuarios(id) NOT NULL,
  status text CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Policies for friendships

-- 1. Users can view their own friendships (either as user_id or friend_id)
CREATE POLICY "Users can view their own friendships"
ON friendships FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 2. Users can insert a friendship request (as user_id)
CREATE POLICY "Users can send friendship requests"
ON friendships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update status (accept requests where they are friend_id, or update their own)
-- Simplification: Allow updating if you involved in the friendship
CREATE POLICY "Users can update their own friendships"
ON friendships FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 4. Users can delete their own friendships
CREATE POLICY "Users can delete their own friendships"
ON friendships FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON friendships(friend_id);
