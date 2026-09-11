-- Crear tabla precios_referencia
CREATE TABLE IF NOT EXISTS public.precios_referencia (
  modelo_id UUID PRIMARY KEY,
  modelo TEXT NOT NULL,
  temporada_alta JSONB NOT NULL,
  temporada_media JSONB NOT NULL,
  temporada_baja JSONB NOT NULL,
  año_actual INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla registros_precios
CREATE TABLE IF NOT EXISTS public.registros_precios (
  id UUID PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  modelo_id UUID NOT NULL,
  modelo TEXT NOT NULL,
  precio_por_dia NUMERIC(10, 2) NOT NULL,
  numero_dias INTEGER NOT NULL,
  precio_total NUMERIC(10, 2) NOT NULL,
  cliente TEXT,
  notas TEXT,
  aceptado BOOLEAN NOT NULL DEFAULT FALSE,
  temporada TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_registros_precios_fecha ON registros_precios(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_precios_modelo ON registros_precios(modelo_id);
CREATE INDEX IF NOT EXISTS idx_registros_precios_temporada ON registros_precios(temporada);
