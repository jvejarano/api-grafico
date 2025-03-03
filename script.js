async function main() {
    const moneda = "$Bs";
    // Mostrar indicador de carga
    document.getElementById("grafico").innerHTML = '<div class="loading">Cargando datos...</div>';
    
    try {
        await actualizarDatos(moneda);
        // Configurar actualización periódica
        setInterval(() => actualizarDatos(moneda), 30 * 60 * 1000); // Actualizar cada 30 minutos
    } catch (error) {
        document.getElementById("grafico").innerHTML = `<div class="error">Error al cargar datos: ${error.message}</div>`;
        console.error("Error en la inicialización:", error);
    }
}

async function actualizarDatos(moneda) {
    try {
        // Usar formato ISO para garantizar compatibilidad entre navegadores
        const fechaHora = new Date().toISOString();
        const datos = await obtenerDatosDolarapi(moneda);

        if (datos) {
            guardarDatos(fechaHora, moneda, datos.precioCompra, datos.precioVenta);
            graficarDatos(moneda);

            // Actualizar el precio de venta en el título
            document.getElementById("precioVenta").innerText = `(Venta: ${datos.precioVenta.toFixed(2)} Bs/$US)`;
            
            // Mostrar información adicional
            actualizarEstadisticas(moneda);
        }
    } catch (error) {
        console.error("Ocurrió un error:", error);
    }
}

async function obtenerDatosDolarapi(moneda) {
    try {
        const url = `https://bo.dolarapi.com/v1/dolares/binance`;
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();

        if (datos && datos.venta !== null) {
            const precioVenta = parseFloat(datos.venta);
            const precioCompra = precioVenta * 0.99;
            return { precioCompra, precioVenta };
        } else {
            throw new Error("Datos no disponibles en la respuesta de la API");
        }
    } catch (error) {
        console.error("Error al obtener datos:", error);
        document.getElementById("estado").innerText = "Error al actualizar datos";
        document.getElementById("estado").className = "error";
        return null;
    }
}

function guardarDatos(fechaHora, moneda, precioCompra, precioVenta) {
    const clave = `precios_${moneda}`;
    let datos = JSON.parse(localStorage.getItem(clave)) || [];
    
    // Limitar la cantidad de datos almacenados (último mes)
    const unMesAtras = new Date();
    unMesAtras.setMonth(unMesAtras.getMonth() - 1);
    
    // Filtrar datos usando Date válidas
    datos = datos.filter(item => {
        try {
            const fecha = new Date(item.fechaHora);
            return !isNaN(fecha.getTime()) && fecha >= unMesAtras;
        } catch (e) {
            return false; // Descartar fechas inválidas
        }
    });
    
    datos.push({ fechaHora, precioCompra, precioVenta });
    localStorage.setItem(clave, JSON.stringify(datos));
}

function crearGrafico(canvas, datos, etiquetas, preciosVenta, etiqueta) {
    // Calcular valores estadísticos
    const max = Math.max(...preciosVenta);
    const min = Math.min(...preciosVenta);
    const promedio = preciosVenta.reduce((sum, value) => sum + value, 0) / preciosVenta.length;
    
    // Calcular colores basados en el cambio
    const colores = preciosVenta.map((valor, i) => {
        if (i === 0) return 'rgba(75, 192, 192, 0.7)';
        return preciosVenta[i] > preciosVenta[i-1] ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)';
    });

    // Calcular bordes
    const bordes = preciosVenta.map((valor, i) => {
        if (i === 0) return 'rgba(75, 192, 192, 1)';
        return preciosVenta[i] > preciosVenta[i-1] ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
    });

    return new Chart(canvas, {
        type: "line",
        data: {
            labels: etiquetas,
            datasets: [{
                label: etiqueta,
                data: preciosVenta,
                borderColor: bordes,
                backgroundColor: colores,
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                segment: {
                    borderColor: ctx => {
                        const index = ctx.p0.parsed.x;
                        return index > 0 && preciosVenta[index] < preciosVenta[index-1] ? 
                               'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 10
                    },
                    title: {
                        display: true,
                        text: 'Fecha/Hora'
                    }
                },
                y: { 
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + ' Bs/$US';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Valor en Bs por $US'
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${etiqueta}: ${context.parsed.y.toFixed(4)} Bs/$US`;
                        },
                        title: function(tooltipItems) {
                            // Obtener el índice del punto seleccionado
                            const index = tooltipItems[0].dataIndex;
                            // Mostrar la fecha formateada
                            try {
                                const fecha = new Date(datos[index].fechaHora);
                                return fecha.toLocaleString();
                            } catch(e) {
                                return etiquetas[index];
                            }
                        }
                    }
                },
                annotation: {
                    annotations: {
                        lineMax: {
                            type: 'line',
                            yMin: max,
                            yMax: max,
                            borderColor: 'rgba(75, 192, 192, 0.5)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: `Max: ${max.toFixed(4)} Bs/$US`,
                                enabled: true,
                                position: 'left'
                            }
                        },
                        lineMin: {
                            type: 'line',
                            yMin: min,
                            yMax: min,
                            borderColor: 'rgba(255, 99, 132, 0.5)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: `Min: ${min.toFixed(4)} Bs/$US`,
                                enabled: true,
                                position: 'left'
                            }
                        },
                        lineAvg: {
                            type: 'line',
                            yMin: promedio,
                            yMax: promedio,
                            borderColor: 'rgba(201, 203, 207, 0.5)',
                            borderWidth: 1,
                            borderDash: [3, 3],
                            label: {
                                content: `Prom: ${promedio.toFixed(4)} Bs/$US`,
                                enabled: true,
                                position: 'right'
                            }
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                    zoom: {
                        wheel: { 
                            enabled: true 
                        },
                        pinch: { 
                            enabled: true 
                        },
                        mode: 'xy',
                    },
                    limits: {
                        y: {min: min * 0.95, max: max * 1.05}
                    }
                }
            }
        }
    });
}

function graficarDatos(moneda) {
    const datos = JSON.parse(localStorage.getItem(`precios_${moneda}`)) || [];
    
    if (datos.length === 0) {
        document.getElementById("grafico").innerHTML = "<p>No hay datos para mostrar.</p>";
        return;
    }
    
    // Asegurar que todas las fechas sean válidas
    const datosValidos = datos.filter(dato => {
        try {
            const fecha = new Date(dato.fechaHora);
            return !isNaN(fecha.getTime());
        } catch(e) {
            return false;
        }
    });
    
    if (datosValidos.length === 0) {
        document.getElementById("grafico").innerHTML = "<p>No hay datos válidos para mostrar.</p>";
        return;
    }
    
    // Ordenar datos por fecha
    datosValidos.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
    
    // Formatear fechas para mejor visualización
    const fechas = datosValidos.map(dato => {
        try {
            const fecha = new Date(dato.fechaHora);
            return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch(e) {
            return "Fecha inválida";
        }
    });
    
    const preciosVenta = datosValidos.map(dato => dato.precioVenta);

    // Crear contenedor para el gráfico y estadísticas
    document.getElementById("grafico").innerHTML = `
        <div class="grafico-contenedor">
            <div class="grafico-canvas-container">
                <canvas id="graficoCanvas"></canvas>
            </div>
            <div class="controles">
                <button id="btnReset">Restablecer zoom</button>
                <select id="periodoSelect">
                    <option value="todo">Todo</option>
                    <option value="semana" selected>Última semana</option>
                    <option value="mes">Último mes</option>
                    <option value="dia">Último día</option>
                </select>
            </div>
            <div id="estadisticas" class="estadisticas"></div>
            <div id="estado" class="estado">Última actualización: ${new Date().toLocaleString()}</div>
        </div>
    `;

    const canvas = document.getElementById("graficoCanvas");
    let grafico = crearGrafico(canvas, datosValidos, fechas, preciosVenta, `Precio Bs/$US`);
    
    // Añadir funcionalidad a los controles
    document.getElementById("btnReset").addEventListener("click", () => {
        grafico.resetZoom();
    });
    
    document.getElementById("periodoSelect").addEventListener("change", (e) => {
        const periodo = e.target.value;
        let datosFiltered = [...datosValidos];
        let fechasFiltered = [...fechas];
        let preciosVentaFiltered = [...preciosVenta];
        
        if (periodo !== "todo") {
            const ahora = new Date();
            let fechaLimite;
            
            switch(periodo) {
                case "dia":
                    fechaLimite = new Date(ahora);
                    fechaLimite.setDate(ahora.getDate() - 1);
                    break;
                case "semana":
                    fechaLimite = new Date(ahora);
                    fechaLimite.setDate(ahora.getDate() - 7);
                    break;
                case "mes":
                    fechaLimite = new Date(ahora);
                    fechaLimite.setMonth(ahora.getMonth() - 1);
                    break;
            }
            
            // Filtrar los datos según el período seleccionado
            const indicesFiltrados = datosValidos.map((item, index) => {
                try {
                    return {
                        index,
                        fecha: new Date(item.fechaHora)
                    };
                } catch(e) {
                    return null;
                }
            }).filter(item => item !== null && item.fecha >= fechaLimite)
              .map(item => item.index);
            
            datosFiltered = indicesFiltrados.map(i => datosValidos[i]);
            fechasFiltered = indicesFiltrados.map(i => fechas[i]);
            preciosVentaFiltered = indicesFiltrados.map(i => preciosVenta[i]);
            
            // Destruir el gráfico anterior y crear uno nuevo con los datos filtrados
            grafico.destroy();
            grafico = crearGrafico(canvas, datosFiltered, fechasFiltered, preciosVentaFiltered, `Precio Bs/$US`);
        } else {
            // Mostrar todos los datos
            grafico.destroy();
            grafico = crearGrafico(canvas, datosValidos, fechas, preciosVenta, `Precio Bs/$US`);
        }
    });
    
    // Trigger para mostrar el período seleccionado inicialmente
    document.getElementById("periodoSelect").dispatchEvent(new Event("change"));
    
    // Actualizar estadísticas
    actualizarEstadisticas(moneda, datosValidos);
}

function actualizarEstadisticas(moneda, datos) {
    if (!datos) {
        datos = JSON.parse(localStorage.getItem(`precios_${moneda}`)) || [];
        // Filtrar para usar solo fechas válidas
        datos = datos.filter(dato => {
            try {
                const fecha = new Date(dato.fechaHora);
                return !isNaN(fecha.getTime());
            } catch(e) {
                return false;
            }
        });
    }
    
    if (datos.length < 2) return;
    
    const preciosVenta = datos.map(dato => dato.precioVenta);
    const precioActual = preciosVenta[preciosVenta.length - 1];
    const precioAnterior = preciosVenta[preciosVenta.length - 2];
    const cambio = precioActual - precioAnterior;
    const cambioPorcentaje = (cambio / precioAnterior) * 100;
    
    const max = Math.max(...preciosVenta);
    const min = Math.min(...preciosVenta);
    const promedio = preciosVenta.reduce((sum, val) => sum + val, 0) / preciosVenta.length;
    
    // Calcular volatilidad (desviación estándar)
    const varianza = preciosVenta.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / preciosVenta.length;
    const desviacion = Math.sqrt(varianza);
    const volatilidad = (desviacion / promedio) * 100;
    
    const estadisticasHTML = `
        <h3>Estadísticas</h3>
        <div class="stat-grid">
            <div class="stat-item">
                <span class="stat-label">Actual:</span>
                <span class="stat-value">${precioActual.toFixed(4)} Bs/$US</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Cambio:</span>
                <span class="stat-value ${cambio >= 0 ? 'positivo' : 'negativo'}">${cambio.toFixed(4)} Bs/$US (${cambioPorcentaje.toFixed(2)}%)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Máximo:</span>
                <span class="stat-value">${max.toFixed(4)} Bs/$US</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Mínimo:</span>
                <span class="stat-value">${min.toFixed(4)} Bs/$US</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Promedio:</span>
                <span class="stat-value">${promedio.toFixed(4)} Bs/$US</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Volatilidad:</span>
                <span class="stat-value">${volatilidad.toFixed(2)}%</span>
            </div>
        </div>
    `;
    
    const estadisticasElement = document.getElementById("estadisticas");
    if (estadisticasElement) {
        estadisticasElement.innerHTML = estadisticasHTML;
    }
}

main();