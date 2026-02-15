-- Enable RLS on admin level just in case
ALTER TABLE public.plataformas ENABLE ROW LEVEL SECURITY;

-- Allow public read access (authenticated and anon)
create policy "Public can view platforms"
on public.plataformas for select
using ( true );

-- Insert default platforms if missing (upsert)
INSERT INTO public.plataformas (codigo, descripcion) VALUES
  ('Netflix', 'Netflix'),
  ('HBO Max', 'HBO Max'),
  ('Disney+', 'Disney+'),
  ('Prime Video', 'Prime Video'),
  ('Apple TV+', 'Apple TV+'),
  ('Sky Showtime', 'Sky Showtime'),
  ('Cine', 'Cine'),
  ('TV', 'Televisión')
ON CONFLICT (codigo) DO UPDATE SET descripcion = EXCLUDED.descripcion;
