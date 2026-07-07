-- Tabla para almacenar los gastos
CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY,
    fecha DATE NOT NULL,
    modelo_id TEXT NOT NULL,
    modelo TEXT,
    concepto TEXT NOT NULL,
    importe DECIMAL(10, 2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_modelo_id ON gastos(modelo_id);

-- Tabla para almacenar un caché de los cálculos de rentabilidad
CREATE TABLE IF NOT EXISTS rentabilidad_resumen (
    id UUID PRIMARY KEY,
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    modelo_id TEXT NOT NULL,
    modelo TEXT,
    ingresos_totales DECIMAL(10, 2) NOT NULL DEFAULT 0,
    gastos_totales DECIMAL(10, 2) NOT NULL DEFAULT 0,
    beneficio_neto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    precio_medio_alquiler DECIMAL(10, 2) NOT NULL DEFAULT 0,
    dias_alquilados INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(año, mes, modelo_id)
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_rentabilidad_año_mes ON rentabilidad_resumen(año, mes);
CREATE INDEX IF NOT EXISTS idx_rentabilidad_modelo_id ON rentabilidad_resumen(modelo_id);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp de updated_at en la tabla gastos
DROP TRIGGER IF EXISTS update_gastos_updated_at ON gastos;
CREATE TRIGGER update_gastos_updated_at
BEFORE UPDATE ON gastos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar el timestamp de updated_at en la tabla rentabilidad_resumen
DROP TRIGGER IF EXISTS update_rentabilidad_updated_at ON rentabilidad_resumen;
CREATE TRIGGER update_rentabilidad_updated_at
BEFORE UPDATE ON rentabilidad_resumen
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
