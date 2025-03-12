const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Datos de prueba
const cotizacionPrueba = {
    fechaHora: '2024-01-20 10:00:00',
    moneda: 'USD',
    precioCompra: 850,
    precioVenta: 950
};

// Función para insertar cotización de prueba
function insertarCotizacion() {
    const query = `
        INSERT INTO cotizaciones (fechaHora, moneda, precioCompra, precioVenta)
        VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, 
        [cotizacionPrueba.fechaHora, cotizacionPrueba.moneda, 
         cotizacionPrueba.precioCompra, cotizacionPrueba.precioVenta], 
        function(err) {
            if (err) {
                console.error('❌ Error al insertar:', err.message);
                return;
            }
            console.log('✅ Cotización de prueba insertada con ID:', this.lastID);
            verificarInsercion();
        }
    );
}

// Función para verificar la inserción
function verificarInsercion() {
    const query = `
        SELECT * FROM cotizaciones 
        WHERE moneda = ? 
        ORDER BY id DESC 
        LIMIT 1
    `;
    
    db.get(query, [cotizacionPrueba.moneda], (err, row) => {
        if (err) {
            console.error('❌ Error al consultar:', err.message);
            return;
        }
        console.log('📝 Última cotización guardada:', row);
        db.close();
    });
}

// Ejecutar prueba
console.log('🔍 Iniciando prueba de base de datos...');
insertarCotizacion();
