-- Create tables
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

-- Insert initial data
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
