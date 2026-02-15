-- 1. Create Tables (Schema)
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  nombre TEXT,
  apellido1 TEXT,
  apellido2 TEXT,
  mail TEXT UNIQUE,
  nickname TEXT,
  ciudad TEXT,
  fecha_nacimiento DATE,
  sexo TEXT,
  es_admin BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS plataformas (
  codigo TEXT PRIMARY KEY,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS contenidos (
  id SERIAL PRIMARY KEY,
  tmdb_id INT UNIQUE,
  titulo TEXT,
  tipo TEXT,
  año INT,
  genero TEXT,
  duracion INT
);

CREATE TABLE IF NOT EXISTS visionados (
  id SERIAL PRIMARY KEY,
  usuario_id uuid REFERENCES usuarios(id),
  contenido_id INT REFERENCES contenidos(id),
  plataforma_id TEXT REFERENCES plataformas(codigo),
  fecha_hora TIMESTAMP DEFAULT now(),
  nota INT CHECK (nota >= 0 AND nota <= 10),
  comentarios TEXT
);

-- Insert initial data for plataformas
INSERT INTO plataformas (codigo, descripcion) VALUES
  ('Cine', 'Cine'),
  ('Netflix', 'Netflix'),
  ('Prime Video', 'Prime Video'),
  ('Disney+', 'Disney+'),
  ('HBO Max', 'HBO Max'),
  ('Apple TV', 'Apple TV'),
  ('Sky Showtime', 'Sky Showtime'),
  ('Televisión', 'Televisión')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Enable RLS and Policies
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
CREATE POLICY "Authenticated users can insert content" 
ON contenidos FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update content" 
ON contenidos FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Content is viewable by everyone" 
ON contenidos FOR SELECT 
USING (true);

-- Policies for 'visionados'
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

-- 3. Triggers for Auto User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, mail, nombre)
  VALUES (new.id, new.email, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Fix Existing Users (Backfill)
INSERT INTO public.usuarios (id, mail, nombre)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;
