-- Limpiar cuarentena
DELETE FROM MDM.Cuarentena
WHERE Tabla_Origen IN ('Bronce.Fisiologia', 'Bronce.Floracion', 'Bronce.Induccion_Floral');

-- Resetear estado en Bronce para volver a procesarlos
UPDATE Bronce.Fisiologia
SET Estado_Carga = 'CARGADO'
WHERE Estado_Carga = 'RECHAZADO';

UPDATE Bronce.Floracion
SET Estado_Carga = 'CARGADO'
WHERE Estado_Carga = 'RECHAZADO';

UPDATE Bronce.Induccion_Floral
SET Estado_Carga = 'CARGADO'
WHERE Estado_Carga = 'RECHAZADO';
