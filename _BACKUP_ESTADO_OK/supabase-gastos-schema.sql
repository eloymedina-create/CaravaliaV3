-- Crear tabla de gastos
CREATE TABLE IF NOT EXISTS public.gastos (
  id UUID PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  modelo_id TEXT NOT NULL,
  concepto TEXT NOT NULL,
  importe NUMERIC(10,2) NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON public.gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_modelo_id ON public.gastos(modelo_id);

-- Trigger para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.gastos;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.gastos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
