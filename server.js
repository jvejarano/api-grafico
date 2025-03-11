const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Inicializar la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Habilitar CORS para peticiones desde el frontend
app.use(express.json()); // Para parsear JSON en las peticiones
app.use(express.static(path.join(__dirname))); // Servir archivos estáticos

// Configuración de la base de datos
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('✅ Conectado exitosamente a la base de datos SQLite');
    
    // Crear tabla de cotizaciones si no existe
    db.run(`
        CREATE TABLE IF NOT EXISTS cotizaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fechaHora TEXT NOT NULL,
            moneda TEXT NOT NULL,
            precioCompra REAL NOT NULL,
            precioVenta REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando tabla:', err.message);
        } else {
            console.log('✅ Tabla de cotizaciones verificada/creada');
        }
    });
});

// Endpoints de la API

// POST: Guardar nueva cotización
app.post('/api/cotizacion', (req, res) => {
    const { fechaHora, moneda, precioCompra, precioVenta } = req.body;
    
    // Validación de datos
    if (!fechaHora || !moneda || !precioCompra || !precioVenta) {
        return res.status(400).json({ 
            error: 'Todos los campos son requeridos' 
        });
    }

    const query = `
        INSERT INTO cotizaciones (fechaHora, moneda, precioCompra, precioVenta)
        VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [fechaHora, moneda, precioCompra, precioVenta], function(err) {
        if (err) {
            console.error('❌ Error insertando datos:', err.message);
            return res.status(500).json({ error: err.message });
        }
        
        console.log(`✅ Nueva cotización guardada con ID: ${this.lastID}`);
        res.status(201).json({
            id: this.lastID,
            mensaje: 'Cotización guardada exitosamente'
        });
    });
});

// GET: Obtener cotizaciones por rango de fechas
app.get('/api/cotizaciones', (req, res) => {
    const { fechaInicio, fechaFin, moneda } = req.query;
    
    // Validación de parámetros
    if (!fechaInicio || !fechaFin || !moneda) {
        return res.status(400).json({ 
            error: 'Fecha inicio, fecha fin y moneda son requeridos' 
        });
    }

    const query = `
        SELECT * FROM cotizaciones 
        WHERE moneda = ? 
        AND fechaHora BETWEEN ? AND ?
        ORDER BY fechaHora ASC
    `;
    
    db.all(query, [moneda, fechaInicio, fechaFin], (err, rows) => {
        if (err) {
            console.error('❌ Error consultando datos:', err.message);
            return res.status(500).json({ error: err.message });
        }
        
        console.log(`✅ Se encontraron ${rows.length} registros`);
        res.json(rows);
    });
});

// GET: Obtener última cotización
app.get('/api/ultima-cotizacion/:moneda', (req, res) => {
    const { moneda } = req.params;
    
    const query = `
        SELECT * FROM cotizaciones 
        WHERE moneda = ? 
        ORDER BY fechaHora DESC 
        LIMIT 1
    `;
    
    db.get(query, [moneda], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ 
                mensaje: 'No se encontraron cotizaciones' 
            });
        }
        
        res.json(row);
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        mensaje: err.message 
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${port}`);
    console.log('📊 API de Cotizaciones inicializada');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('❌ Error al cerrar la base de datos:', err.message);
        } else {
            console.log('✅ Conexión a la base de datos cerrada');
        }
        process.exit(0);
    });
});
