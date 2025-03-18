async function main() {
    const moneda = "$Bs";
    document.getElementById("grafico").innerHTML = '<div class="loading">Cargando datos...</div>';
    
    try {
        await actualizarDatos(moneda);
        setInterval(() => actualizarDatos(moneda), 30 * 60 * 1000);
    } catch (error) {
        document.getElementById("grafico").innerHTML = `<div class="error">Error al cargar datos: ${error.message}</div>`;
        console.error("Error en la inicialización:", error);
    }
}

async function actualizarDatos(moneda) {
    try {
        const fechaHora = new Date().toISOString();
        const datos = await obtenerDatosDolarapi(moneda);

        if (datos) {
            await guardarDatos(fechaHora, moneda, datos.precioCompra, datos.precioVenta);
            await graficarDatos(moneda);
            document.getElementById("precioVenta").innerText = `(Venta: ${datos.precioVenta.toFixed(2)} Bs/$US)`;
            actualizarEstadisticas(moneda);
        }
    } catch (error) {
        console.error("Ocurrió un error:", error);
    }
}

async function guardarDatos(fechaHora, moneda, precioCompra, precioVenta) {
    try {
        // Guardar en localStorage
        const clave = `precios_${moneda}`;
        let datos = JSON.parse(localStorage.getItem(clave)) || [];
        datos.push({ fechaHora, precioCompra, precioVenta });
        localStorage.setItem(clave, JSON.stringify(datos));

        // Guardar en la base de datos
        await fetch('http://localhost:3000/api/cotizacion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fechaHora,
                moneda,
                precioCompra,
                precioVenta
            })
        });
    } catch (error) {
        console.error('Error al guardar datos:', error);
    }
}

async function buscarCotizaciones(fechaInicio, fechaFin, moneda) {
    try {
        const response = await fetch(`http://localhost:3000/api/cotizaciones?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&moneda=${moneda}`);
        return await response.json();
    } catch (error) {
        console.error('Error al buscar cotizaciones:', error);
        return [];
    }
}

// ...resto del código existente...
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
                <button id="btnCompartir" class="btn btn-share">
                    <i class="fas fa-share-alt"></i> Compartir
                </button>
            </div>
            <div id="estadisticas" class="estadisticas"></div>
            <div id="estado" class="estado">Última actualización: ${new Date().toLocaleString()}</div>
        </div>
    `;

    const canvas = document.getElementById("graficoCanvas");
    let grafico = crearGrafico(canvas, datosValidos, fechas, preciosVenta, `Precio Bs/$US`);
    
    // Eliminar el event listener del btnReset ya que el botón ya no existe
    
    document.querySelectorAll('.period-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos los botones
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Agregar clase active al botón seleccionado
            button.classList.add('active');
            
            const period = button.getAttribute('data-period');
            let datosFiltered = [...datosValidos];
            let fechasFiltered = [...fechas];
            let preciosVentaFiltered = [...preciosVenta];
            
            if (period !== 'all') {
                const ahora = new Date();
                let fechaLimite;
                
                switch(period) {
                    case '1d':
                        fechaLimite = new Date(ahora);
                        fechaLimite.setDate(ahora.getDate() - 1);
                        break;
                    case '1w':
                        fechaLimite = new Date(ahora);
                        fechaLimite.setDate(ahora.getDate() - 7);
                        break;
                    case '1m':
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
            }
            
            // Destruir el gráfico anterior y crear uno nuevo con los datos filtrados
            grafico.destroy();
            grafico = crearGrafico(canvas, datosFiltered, fechasFiltered, preciosVentaFiltered, `Precio Bs/$US`);
        });
    });
    
    // Activar el botón de última semana por defecto
    document.querySelector('.period-btn[data-period="1w"]').click();
    
    // Agregar manejador para el botón compartir
    document.getElementById("btnCompartir").addEventListener("click", async () => {
        const ultimoDato = datosValidos[datosValidos.length - 1];
        const mensaje = `Cotización del dólar: ${ultimoDato.precioVenta.toFixed(2)} Bs/$US\nFecha: ${new Date(ultimoDato.fechaHora).toLocaleString()}\n\nVisita nuestra aplicación: ${window.location.href}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Cotización del dólar',
                    text: mensaje,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(mensaje);
                const estadoEl = document.getElementById("estado");
                estadoEl.textContent = "¡Enlace copiado al portapapeles!";
                estadoEl.className = "estado success";
                setTimeout(() => {
                    estadoEl.textContent = `Última actualización: ${new Date().toLocaleString()}`;
                    estadoEl.className = "estado";
                }, 3000);
            }
        } catch (error) {
            console.error("Error al compartir:", error);
            alert("No se pudo compartir la cotización");
        }
    });

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

async function obtenerCotizaciones() {
    try {
        const [resBinance, resOficial] = await Promise.all([
            fetch('https://bo.dolarapi.com/v1/dolares/binance'),
            fetch('https://bo.dolarapi.com/v1/dolares/oficial')
        ]);

        const dataBinance = await resBinance.json();
        const dataOficial = await resOficial.json();

        // Actualizar Binance
        document.getElementById('precioCompraBinance').textContent = 
            dataBinance.compra ? `$${dataBinance.compra}` : 'No disponible';
        document.getElementById('precioVentaBinance').textContent = 
            dataBinance.venta ? `$${dataBinance.venta}` : 'No disponible';

        // Actualizar Oficial
        document.getElementById('precioCompraOficial').textContent = 
            dataOficial.compra ? `$${dataOficial.compra}` : 'No disponible';
        document.getElementById('precioVentaOficial').textContent = 
            dataOficial.venta ? `$${dataOficial.venta}` : 'No disponible';

    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        document.getElementById('estado').textContent = 'Error al obtener las cotizaciones';
    }
}

// Actualizar cotizaciones cada 1 minuto
obtenerCotizaciones();
setInterval(obtenerCotizaciones, 60000);

main();

// Manejador de botones de período
document.querySelectorAll('.period-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remover clase active de todos los botones
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Agregar clase active al botón seleccionado
        button.classList.add('active');
        
        // Obtener el período seleccionado
        const period = button.getAttribute('data-period');
        
        // Actualizar el gráfico según el período
        updateChartByPeriod(period);
    });
});

// Función para actualizar el gráfico según el período
function updateChartByPeriod(period) {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case '1d':
            startDate = new Date(now.setDate(now.getDate() - 1));
            break;
        case '1w':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case '1m':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'all':
            startDate = null; // Mostrar todos los datos disponibles
            break;
    }
    
    // Filtrar datos según el período seleccionado
    let filteredData;
    if (startDate) {
        filteredData = datos.filter(item => new Date(item.fecha) >= startDate);
    } else {
        filteredData = datos; // Usar todos los datos si se selecciona 'all'
    }
    
    // Actualizar el gráfico con los datos filtrados
    actualizarGrafico(filteredData);
}

// Modificar la función actualizarGrafico para usar los datos filtrados
function actualizarGrafico(datosAMostrar) {
    const fechas = datosAMostrar.map(item => item.fecha);
    const precios = datosAMostrar.map(item => item.precio);
    
    if (myChart) {
        myChart.destroy();
    }
    
    const ctx = document.getElementById('grafico').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [{
                label: 'Precio del Dólar',
                data: precios,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-color'),
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-color') + '40',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') + '20'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                },
                y: {
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color') + '20'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                }
            }
        }
    });
}