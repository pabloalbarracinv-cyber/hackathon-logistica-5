-- Eliminar la tabla si existe para empezar limpios
DROP TABLE IF EXISTS public.team_metrics;

-- Crear la tabla team_metrics
CREATE TABLE public.team_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL UNIQUE,
    ai_score INTEGER NOT NULL DEFAULT 0,
    commits INTEGER NOT NULL DEFAULT 0,
    tokens_used VARCHAR(20) NOT NULL DEFAULT '0.0k',
    status VARCHAR(20) NOT NULL DEFAULT 'IDLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar los datos de prueba (Los 4 equipos)
INSERT INTO public.team_metrics (team_id, ai_score, commits, tokens_used, status)
VALUES
    ('T-01_BODEGA', 98, 14, '45.0k', 'OPTIMAL'),
    ('T-04_ADUANAS', 92, 11, '30.0k', 'OPTIMAL'),
    ('T-07_RUTAS', 85, 8, '62.0k', 'WARNING'),
    ('T-02_COMPRAS', 79, 5, '21.0k', 'IDLE');

-- Habilitar la subscripción de Realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_metrics;

-- Desactivar políticas de seguridad temporalmente para pruebas (Lectura/Escritura pública)
ALTER TABLE public.team_metrics DISABLE ROW LEVEL SECURITY;
