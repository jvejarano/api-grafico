async function main() {
    const moneda = "BTC";
    while (true) {
        const fechaHora = new Date().toLocaleString();
        const datos = await obtenerDatosDolarapi(moneda);

        if (datos) { 
            guardarDatos(fechaHora, moneda, datos.precioCompra, datos.precioVenta);
            graficarDatos(moneda);

            // Actualizar el precio de venta en el título
            document.getElementById("precioVenta").innerText = `(Venta: ${datos.precioVenta} USD)`;
        }

        await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000)); // Esperar 1 hora
    }
}

async function obtenerDatosDolarapi(moneda) {
    const url = `https://bo.dolarapi.com/v1/dolares/binance`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (datos && datos.venta !== null) {
        const precioVenta = parseFloat(datos.venta);
        const precioCompra = precioVenta * 0.99;
        return { precioCompra, precioVenta };
    } else {
        console.error("Error al obtener datos de la API o precio de venta no disponible.");
        return null;
    }
}

function guardarDatos(fechaHora, moneda, precioCompra, precioVenta) {
    const clave = `precios_${moneda}`;
    const datos = JSON.parse(localStorage.getItem(clave)) || [];
    datos.push({ fechaHora, precioCompra, precioVenta });
    localStorage.setItem(clave, JSON.stringify(datos));
}

function crearGrafico(canvas, etiquetas, datos, etiqueta) {
    return new Chart(canvas, {
        type: "line",
        data: {
            labels: etiquetas,
            datasets: [{
                label: etiqueta,
                data: datos,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.1)",
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                x: { beginAtZero: false },
                y: { beginAtZero: false }
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: "y",
                    },
                    pan: {
                        enabled: true,
                        mode: "x",
                    }
                }
            }
        }
    });
}

function graficarDatos(moneda) {
    const datos = JSON.parse(localStorage.getItem(`precios_${moneda}`)) || [];
    const fechas = datos.map(dato => dato.fechaHora);
    const preciosVenta = datos.map(dato => dato.precioVenta);

    if (fechas.length === 0) {
        document.getElementById("grafico").innerHTML = "<p>No hay datos para mostrar.</p>";
        return;
    }

    const canvas = document.createElement("canvas");
    document.getElementById("grafico").innerHTML = "";
    document.getElementById("grafico").appendChild(canvas);

    crearGrafico(canvas, fechas, preciosVenta, `Precio de Venta ${moneda}`);
}

async function main() {
    const moneda = "$Bs";
    while (true) {
        try {
            const fechaHora = new Date().toLocaleString();
            const datos = await obtenerDatosDolarapi(moneda);

            if (datos) {
                guardarDatos(fechaHora, moneda, datos.precioCompra, datos.precioVenta);
                graficarDatos(moneda);
            }
        } catch (error) {
            console.error("Ocurrió un error:", error);
        }

        await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
    }
}

main();
