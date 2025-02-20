const sqlite3 = require("sqlite3").verbose();

// Configuración de la base de datos
const db = new sqlite3.Database("cotizaciones.db", (err) => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
        inicializarBD();
    }
});

// Crear la tabla si no existe
function inicializarBD() {
    db.run(
        `CREATE TABLE IF NOT EXISTS cotizaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_hora TEXT NOT NULL,
            moneda TEXT NOT NULL,
            precio_compra REAL NOT NULL,
            precio_venta REAL NOT NULL
        )`,
        (err) => {
            if (err) {
                console.error("Error al crear la tabla:", err.message);
            } else {
                console.log("Tabla 'cotizaciones' lista.");
            }
        }
    );
}

// Función para guardar datos en la base de datos
function guardarEnBD(fechaHora, moneda, precioCompra, precioVenta) {
    const query = `INSERT INTO cotizaciones (fecha_hora, moneda, precio_compra, precio_venta) VALUES (?, ?, ?, ?)`;
    db.run(query, [fechaHora, moneda, precioCompra, precioVenta], (err) => {
        if (err) {
            console.error("Error al guardar en la base de datos:", err.message);
        } else {
            console.log(`Cotización guardada: ${moneda} - ${precioVenta}`);
        }
    });
}

// Función para obtener datos de la base de datos
function obtenerDeBD(moneda, callback) {
    const query = `SELECT fecha_hora, precio_venta FROM cotizaciones WHERE moneda = ? ORDER BY fecha_hora ASC`;
    db.all(query, [moneda], (err, rows) => {
        if (err) {
            console.error("Error al obtener datos de la base de datos:", err.message);
            callback([]);
        } else {
            callback(rows);
        }
    });
}

// Función para obtener datos de la API
async function obtenerDatosDolarapi(moneda) {
    const url = `https://bo.dolarapi.com/v1/dolares/binance`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (datos && datos.venta !== null) {
        const precioVenta = parseFloat(datos.venta);
        const precioCompra = precioVenta * 0.99; // Ejemplo: 99% del precio de venta
        return { precioCompra, precioVenta };
    } else {
        console.error("Error al obtener datos de la API o precio de venta no disponible.");
        return null;
    }
}

// Función para graficar datos desde la base de datos
function graficarDatos(moneda) {
    obtenerDeBD(moneda, (datos) => {
        const fechas = datos.map((dato) => dato.fecha_hora);
        const preciosVenta = datos.map((dato) => dato.precio_venta);

        if (fechas.length === 0) {
            document.getElementById("grafico").innerHTML = "<p>No hay datos para mostrar.</p>";
            return;
        }

        const canvas = document.createElement("canvas");
        document.getElementById("grafico").innerHTML = ""; // Limpia el contenedor del gráfico anterior
        document.getElementById("grafico").appendChild(canvas);

        new Chart(canvas, {
            type: "line",
            data: {
                labels: fechas,
                datasets: [{
                    label: `Precio de Venta ${moneda}`,
                    data: preciosVenta,
                    borderColor: "blue",
                    borderWidth: 1,
                }],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                    },
                },
            },
        });
    });
}

// Función principal
async function main() {
    const moneda = "BTC";
    while (true) {
        const fechaHora = new Date().toLocaleString();
        const datos = await obtenerDatosDolarapi(moneda);

        if (datos) {
            guardarEnBD(fechaHora, moneda, datos.precioCompra, datos.precioVenta);
            graficarDatos(moneda);
        }

        await new Promise((resolve) => setTimeout(resolve, 60 * 60 * 1000)); // Esperar 1 hora
    }
}

main();
