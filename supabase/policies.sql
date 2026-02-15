-- Enable RLS on tables
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contenidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visionados ENABLE ROW LEVEL SECURITY;

-- Policies for 'usuarios'
CREATE POLICY "Public profiles are viewable by everyone" 
ON usuarios FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON usuarios FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON usuarios FOR UPDATE 
USING (auth.uid() = id);

-- Policies for 'contenidos'
-- Allow any authenticated user to insert new content (movies/series)
CREATE POLICY "Authenticated users can insert content" 
ON contenidos FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update distinct content (e.g. if metadata improves)
CREATE POLICY "Authenticated users can update content" 
ON contenidos FOR UPDATE 
TO authenticated 
USING (true);

-- Everyone can view content
CREATE POLICY "Content is viewable by everyone" 
ON contenidos FOR SELECT 
USING (true);

-- Policies for 'visionados'
-- Users can only see their own watch logs (or maybe all? let's stick to own for now, or public if it's a social app)
-- For now, let's make visionados public so we can see what friends watch
CREATE POLICY "Visionados are viewable by everyone" 
ON visionados FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own visionados" 
ON visionados FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own visionados" 
ON visionados FOR UPDATE 
TO authenticated 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own visionados" 
ON visionados FOR DELETE 
TO authenticated 
USING (auth.uid() = usuario_id);
