const sqlite3 = require('sqlite3').verbose();

// Crear o conectar a la base de datos
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        inicializarBD();
    }
});

// Crear la tabla "cotizaciones" si no existe
function inicializarBD() {
    const query = `
        CREATE TABLE IF NOT EXISTS cotizaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_hora TEXT NOT NULL,
            moneda TEXT NOT NULL,
            precio_compra REAL NOT NULL,
            precio_venta REAL NOT NULL
        )
    `;
    db.run(query, (err) => {
        if (err) {
            console.error('Error al crear la tabla:', err.message);
        } else {
            console.log('Tabla "cotizaciones" lista.');
        }
    });
}

// Exportar funciones de base de datos
module.exports = db;
