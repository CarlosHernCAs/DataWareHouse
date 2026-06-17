DELETE FROM Silver.Fact_Floracion;
DELETE FROM Bronce.Floracion;
DELETE FROM MDM.Cuarentena WHERE Tabla_Origen = 'Bronce.Floracion';
