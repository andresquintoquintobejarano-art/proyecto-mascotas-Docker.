const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configuración de conexión tomada de variables de entorno (sin credenciales en el código)
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

// Espera activa a que MySQL esté listo para aceptar conexiones
async function conectarConReintentos(intentos = 10, esperaMs = 3000) {
  for (let i = 1; i <= intentos; i++) {
    try {
      pool = mysql.createPool(dbConfig);
      await pool.query('SELECT 1');
      console.log('Conexión a MySQL establecida correctamente.');
      return;
    } catch (err) {
      console.log(`Intento ${i}/${intentos}: MySQL aún no está listo (${err.code || err.message}). Reintentando en ${esperaMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
    }
  }
  throw new Error('No se pudo conectar a MySQL después de varios intentos.');
}

// GET /mascotas - listar todas
app.get('/mascotas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mascotas ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar mascotas', detalle: err.message });
  }
});

// GET /mascotas/:id - obtener una
app.get('/mascotas/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mascotas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la mascota', detalle: err.message });
  }
});

// POST /mascotas - registrar
app.post('/mascotas', async (req, res) => {
  try {
    const { nombre, especie, edad, peso } = req.body;
    if (!nombre || !especie || edad === undefined || peso === undefined) {
      return res.status(400).json({ error: 'Faltan campos: nombre, especie, edad, peso' });
    }
    const [result] = await pool.query(
      'INSERT INTO mascotas (nombre, especie, edad, peso) VALUES (?, ?, ?, ?)',
      [nombre, especie, edad, peso]
    );
    const [rows] = await pool.query('SELECT * FROM mascotas WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar la mascota', detalle: err.message });
  }
});

// PUT /mascotas/:id - actualizar
app.put('/mascotas/:id', async (req, res) => {
  try {
    const { nombre, especie, edad, peso } = req.body;
    const [existe] = await pool.query('SELECT id FROM mascotas WHERE id = ?', [req.params.id]);
    if (existe.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    await pool.query(
      'UPDATE mascotas SET nombre = ?, especie = ?, edad = ?, peso = ? WHERE id = ?',
      [nombre, especie, edad, peso, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM mascotas WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar la mascota', detalle: err.message });
  }
});

// DELETE /mascotas/:id - eliminar
app.delete('/mascotas/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM mascotas WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la mascota', detalle: err.message });
  }
});

// Endpoint simple de salud (útil para depurar Nginx -> API)
app.get('/', (req, res) => {
  res.json({ estado: 'ok', servicio: 'api-mascotas' });
});

conectarConReintentos()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API de mascotas escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
