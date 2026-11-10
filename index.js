require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a Neon PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Soporte Técnico en ejecución' });
});

// 1. Consultar todas las solicitudes (GET)
app.get('/api/solicitudes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM solicitudes ORDER BY fecha_creacion DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al consultar:', error);
        res.status(500).json({ error: 'Error interno al consultar solicitudes' });
    }
});

// 2. Consultar una solicitud por Folio (GET)
app.get('/api/solicitudes/:folio', async (req, res) => {
    try {
        const { folio } = req.params;
        const result = await pool.query('SELECT * FROM solicitudes WHERE folio = $1', [folio]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar solicitud' });
    }
});

// 3. Registrar una nueva solicitud (POST)
app.post('/api/solicitudes', async (req, res) => {
    try {
        const { folio, nombre_solicitante, correo, categoria, prioridad, descripcion } = req.body;

        if (!nombre_solicitante || !correo || !categoria || !prioridad || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const folioAsignado = folio || `SOP-${Date.now().toString().slice(-6)}`;

        const query = `
      INSERT INTO solicitudes (folio, nombre_solicitante, correo, categoria, prioridad, descripcion)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
        const values = [folioAsignado, nombre_solicitante, correo, categoria, prioridad, descripcion];
        const result = await pool.query(query, values);

        res.status(201).json({
            mensaje: 'Solicitud registrada correctamente',
            solicitud: result.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar:', error);
        res.status(500).json({ error: 'Error interno al registrar solicitud' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});