const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');

// Inicializar la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Crear servidor WebSocket
const wss = new WebSocket.Server({ noServer: true });

// Almacenar conexiones WebSocket activas
const clients = new Set();

// Configurar WebSocket
wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('✅ Nueva conexión WebSocket establecida');

    ws.on('close', () => {
        clients.delete(ws);
        console.log('❌ Conexión WebSocket cerrada');
    });
});

// Función para enviar actualizaciones a todos los clientes
function broadcastUpdate(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

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
    
    console.log('📥 Datos recibidos:', req.body);

    // Validación de datos más detallada
    if (!fechaHora || !moneda || precioCompra === undefined || precioVenta === undefined) {
        console.error('❌ Datos incompletos:', { fechaHora, moneda, precioCompra, precioVenta });
        return res.status(400).json({ 
            error: 'Todos los campos son requeridos',
            datosRecibidos: req.body
        });
    }

    // Asegurar que los precios sean números
    const compra = Number(precioCompra);
    const venta = Number(precioVenta);

    if (isNaN(compra) || isNaN(venta)) {
        console.error('❌ Precios inválidos:', { precioCompra, precioVenta });
        return res.status(400).json({ 
            error: 'Los precios deben ser números válidos' 
        });
    }

    // Formatear la fecha para asegurar formato correcto
    const fechaFormateada = new Date(fechaHora).toISOString().slice(0, 19).replace('T', ' ');

    const query = `
        INSERT INTO cotizaciones (fechaHora, moneda, precioCompra, precioVenta)
        VALUES (?, ?, ?, ?)
    `;
    
    console.log('📝 Intentando guardar:', { 
        fechaFormateada, 
        moneda, 
        compra, 
        venta 
    });

    db.run(query, [fechaFormateada, moneda, compra, venta], function(err) {
        if (err) {
            console.error('❌ Error insertando datos:', err.message);
            return res.status(500).json({ 
                error: err.message,
                detalles: 'Error al guardar en la base de datos'
            });
        }
        
        console.log(`✅ Nueva cotización guardada con ID: ${this.lastID}`);
        
        const nuevaCotizacion = {
            id: this.lastID,
            fechaHora: fechaFormateada,
            moneda,
            precioCompra: compra,
            precioVenta: venta
        };

        // Enviar actualización a todos los clientes conectados
        broadcastUpdate({
            type: 'nueva_cotizacion',
            data: nuevaCotizacion
        });

        // Verificar inmediatamente que se guardó
        db.get('SELECT * FROM cotizaciones WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                console.error('❌ Error verificando inserción:', err.message);
            } else {
                console.log('✅ Datos guardados verificados:', row);
            }
        });

        res.status(201).json({
            id: this.lastID,
            mensaje: 'Cotización guardada exitosamente',
            datos: nuevaCotizacion
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

    // Formatear fechas para asegurar el formato correcto (YYYY-MM-DD)
    const fechaInicioFormateada = new Date(fechaInicio).toISOString().split('T')[0];
    const fechaFinFormateada = new Date(fechaFin).toISOString().split('T')[0];

    console.log('🔍 Buscando cotizaciones:', {
        moneda,
        fechaInicio: fechaInicioFormateada,
        fechaFin: fechaFinFormateada
    });

    const query = `
        SELECT * FROM cotizaciones 
        WHERE moneda = ? 
        AND date(fechaHora) >= date(?)
        AND date(fechaHora) <= date(?)
        ORDER BY fechaHora ASC
    `;
    
    db.all(query, [moneda, fechaInicioFormateada, fechaFinFormateada], (err, rows) => {
        if (err) {
            console.error('❌ Error consultando datos:', err.message);
            return res.status(500).json({ error: err.message });
        }
        
        console.log(`✅ Se encontraron ${rows.length} registros para el rango especificado`);
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

// Iniciar el servidor HTTP
const server = app.listen(port, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${port}`);
    console.log('📊 API de Cotizaciones inicializada');
});

// Integrar WebSocket con el servidor HTTP
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
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
