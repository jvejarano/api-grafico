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
        if (i === 0) return 'rgba(76, 175, 80, 0.2)'; // Verde suave
        return preciosVenta[i] > preciosVenta[i-1] ? 
               'rgba(76, 175, 80, 0.2)' : // Verde para subida
               'rgba(244, 67, 54, 0.2)';   // Rojo para bajada
    });

    // Calcular bordes
    const bordes = preciosVenta.map((valor, i) => {
        if (i === 0) return '#4CAF50'; // Verde
        return preciosVenta[i] > preciosVenta[i-1] ? 
               '#4CAF50' : // Verde para subida
               '#f44336';  // Rojo para bajada
    });

    const config = {
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
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: (context) => {
                    const index = context.dataIndex;
                    if (index === 0) return '#4CAF50';
                    return preciosVenta[index] > preciosVenta[index-1] ? '#4CAF50' : '#f44336';
                },
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index',
                axis: 'x'
            },
            scales: {
                x: { 
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 10,
                        padding: 8
                    },
                    title: {
                        display: true,
                        text: 'Fecha/Hora',
                        padding: {top: 10}
                    }
                },
                y: { 
                    beginAtZero: false,
                    position: 'right',
                    grace: '5%',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false,
                        lineWidth: 0.5
                    },
                    ticks: {
                        stepSize: 0.25,
                        maxTicksLimit: 20,
                        callback: function(value) {
                            return value.toFixed(2) + ' Bs/$US';
                        },
                        padding: 8,
                        font: {
                            family: 'Consolas, monospace'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Valor en Bs por $US',
                        padding: {bottom: 10}
                    },
                    suggestedMin: Math.floor(Math.min(...preciosVenta) * 4) / 4,
                    suggestedMax: Math.ceil(Math.max(...preciosVenta) * 4) / 4
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const prevValue = context.dataset.data[context.dataIndex - 1];
                            let change = 0;
                            let changePercent = 0;
                            
                            if (prevValue) {
                                change = value - prevValue;
                                changePercent = (change / prevValue * 100);
                            }
                            
                            return [
                                `Valor: ${value.toFixed(4)} Bs/$US`,
                                `Cambio: ${change >= 0 ? '+' : ''}${change.toFixed(4)} (${changePercent.toFixed(2)}%)`
                            ];
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            borderColor: 'rgba(0,0,0,0.3)',
                            borderWidth: 1
                        }
                    },
                    limits: {
                        y: {
                            min: 'original',
                            max: 'original'
                        }
                    }
                },
                crosshair: {
                    line: {
                        color: 'rgba(0, 0, 0, 0.3)',
                        width: 1,
                        dashPattern: [6, 6]
                    },
                    sync: {
                        enabled: true
                    },
                    zoom: {
                        enabled: true
                    }
                }
            }
        }
    };

    if (window.graficoActual) {
        window.graficoActual.destroy();
    }
    window.graficoActual = new Chart(canvas, config);
    return window.graficoActual;
}

function graficarDatos(moneda) {
    // Obtener datos del localStorage
    let datosLocalStorage = JSON.parse(localStorage.getItem(`precios_${moneda}`)) || [];
    
    // Cargar datos del archivo JSON
    fetch('data-bs-binance.xml')
        .then(response => response.text())
        .then(jsonText => {
            let datosArchivo = [];
            try {
                datosArchivo = JSON.parse(jsonText);
            } catch (e) {
                console.error('Error al parsear archivo:', e);
            }
            
            // Usar un Map para eliminar duplicados basados en fechaHora
            const mapaRegistros = new Map();
            
            // Primero agregar los datos del archivo (datos históricos)
            datosArchivo.forEach(dato => {
                if (dato.fechaHora && dato.precioCompra && dato.precioVenta) {
                    mapaRegistros.set(dato.fechaHora, dato);
                }
            });
            
            // Luego agregar los datos del localStorage (más recientes)
            // Si hay duplicados, los del localStorage tienen prioridad
            datosLocalStorage.forEach(dato => {
                if (dato.fechaHora && dato.precioCompra && dato.precioVenta) {
                    mapaRegistros.set(dato.fechaHora, dato);
                }
            });
            
            // Convertir el Map a array y ordenar por fecha
            window.datosValidos = Array.from(mapaRegistros.values()).sort((a, b) => 
                new Date(a.fechaHora) - new Date(b.fechaHora)
            );
            
            if (window.datosValidos.length === 0) {
                document.getElementById("grafico").innerHTML = "<p>No hay datos válidos para mostrar.</p>";
                return;
            }
            
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
                    <div id="estado" class="estado">
                        Última actualización: ${new Date().toLocaleString()}<br>
                        Total registros únicos: ${window.datosValidos.length}
                    </div>
                </div>
            `;

            // Configurar manejadores de eventos para los botones de período
            document.querySelectorAll('.period-btn').forEach(button => {
                button.removeEventListener('click', periodoClickHandler);
                button.addEventListener('click', periodoClickHandler);
            });

            // Activar el botón de última semana por defecto
            document.querySelector('.period-btn[data-period="1w"]').click();
            
            // Configurar botón compartir
            configurarBotonCompartir(window.datosValidos);
        })
        .catch(error => {
            console.error('Error al cargar datos:', error);
            graficarDatosLocales(datosLocalStorage, moneda);
        });
}

function periodoClickHandler(event) {
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    const period = event.target.getAttribute('data-period');
    filtrarYMostrarDatos(period);
}

function filtrarYMostrarDatos(periodo) {
    if (!window.datosValidos) return;
    
    const ahora = new Date();
    let fechaLimite;
    let datosFiltrados;
    
    switch(periodo) {
        case '1d':
            fechaLimite = new Date(ahora.getTime() - (24 * 60 * 60 * 1000));
            // Agrupar por intervalos de 15 minutos y calcular promedio
            const datosUltimoDia = window.datosValidos
                .filter(item => {
                    const fechaItem = new Date(item.fechaHora);
                    return fechaItem >= fechaLimite;
                })
                .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
            const agrupados = {};
            datosUltimoDia.forEach(d => {
                const fecha = new Date(d.fechaHora);
                const clave = fecha.getFullYear() + '-' + (fecha.getMonth()+1) + '-' + fecha.getDate() + ' ' +
                    fecha.getHours() + ':' + (Math.floor(fecha.getMinutes()/15)*15).toString().padStart(2, '0');
                if (!agrupados[clave]) agrupados[clave] = [];
                agrupados[clave].push(d.precioVenta);
            });
            datosFiltrados = Object.entries(agrupados).map(([k, v]) => ({
                fechaHora: k,
                precioVenta: v.reduce((a, b) => a + b, 0) / v.length
            }));
            break;
        case '1w':
            fechaLimite = new Date(ahora.getTime() - (7 * 24 * 60 * 60 * 1000));
            datosFiltrados = window.datosValidos.filter(item => {
                const fechaItem = new Date(item.fechaHora);
                return fechaItem >= fechaLimite;
            });
            break;
        case '1m':
            fechaLimite = new Date(ahora.getTime() - (30 * 24 * 60 * 60 * 1000));
            datosFiltrados = window.datosValidos.filter(item => {
                const fechaItem = new Date(item.fechaHora);
                return fechaItem >= fechaLimite;
            });
            break;
        case 'all':
            fechaLimite = new Date(0);
            datosFiltrados = window.datosValidos.filter(item => {
                const fechaItem = new Date(item.fechaHora);
                return fechaItem >= fechaLimite;
            });
            break;
    }
    // Formatear fechas para la visualización
    const fechas = datosFiltrados.map(dato => {
        const fecha = new Date(dato.fechaHora);
        if (periodo === '1d') {
            // Para el último día, mostrar hora:minutos
            return fecha.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false // Formato 24 horas
            });
        } else {
            // Para otros períodos, mostrar fecha y hora
            return fecha.toLocaleDateString() + ' ' + 
                   fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    });
    const preciosVenta = datosFiltrados.map(dato => dato.precioVenta);
    // --- Calcular tendencia ---
    let tendencia = '-';
    if (preciosVenta.length > 1) {
        const diff = preciosVenta[preciosVenta.length-1] - preciosVenta[0];
        if (diff > 0.01) tendencia = 'Alcista';
        else if (diff < -0.01) tendencia = 'Bajista';
        else tendencia = 'Lateral';
    }
    document.getElementById('tendenciaValor').textContent = tendencia;
    // --- Calcular horario de mayor volatilidad ---
    let volatilidadHora = '-';
    if (datosFiltrados.length > 2) {
        // Agrupar por hora y calcular desviación estándar
        const volatilidadPorHora = {};
        datosFiltrados.forEach(d => {
            const fecha = new Date(d.fechaHora);
            const hora = fecha.getHours();
            if (!volatilidadPorHora[hora]) volatilidadPorHora[hora] = [];
            volatilidadPorHora[hora].push(d.precioVenta);
        });
        let maxVol = 0;
        let horaMax = null;
        for (const [hora, valores] of Object.entries(volatilidadPorHora)) {
            if (valores.length > 1) {
                const prom = valores.reduce((a,b) => a+b,0)/valores.length;
                const varianza = valores.reduce((a,v) => a+Math.pow(v-prom,2),0)/valores.length;
                const desv = Math.sqrt(varianza);
                if (desv > maxVol) {
                    maxVol = desv;
                    horaMax = hora;
                }
            }
        }
        if (horaMax !== null) {
            volatilidadHora = horaMax.padStart(2,'0')+':00-'+horaMax.padStart(2,'0')+':59';
        }
    }
    document.getElementById('volatilidadHora').textContent = volatilidadHora;
    // --- Calcular soporte y resistencia (mínimos y máximos locales) ---
    let soporte = '-';
    let resistencia = '-';
    if (preciosVenta.length > 2) {
        // Soporte: mínimo local (mínimo entre los valores, pero no el valor absoluto si está en los extremos)
        let minLocal = Math.min(...preciosVenta);
        let maxLocal = Math.max(...preciosVenta);
        soporte = minLocal.toFixed(4) + ' Bs/$US';
        resistencia = maxLocal.toFixed(4) + ' Bs/$US';
    }
    document.getElementById('soporteValor').textContent = soporte;
    document.getElementById('resistenciaValor').textContent = resistencia;
    // ---
    // Actualizar gráfico y estadísticas
    const canvas = document.getElementById("graficoCanvas");
    if (canvas) {
        if (window.graficoActual) {
            window.graficoActual.destroy();
        }
        window.graficoActual = crearGrafico(canvas, datosFiltrados, fechas, preciosVenta, `Precio Bs/$US`);
        actualizarEstadisticas('$Bs', datosFiltrados);
    }
}

function configurarBotonCompartir(datosValidos) {
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
}

// Función auxiliar para graficar solo con datos locales en caso de error
function graficarDatosLocales(datos, moneda) {
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
    const preciosCompra = datos.map(dato => dato.precioCompra);
    const precioActual = preciosVenta[preciosVenta.length - 1];
    const precioAnterior = preciosVenta[preciosVenta.length - 2];
    const cambio = precioActual - precioAnterior;
    const cambioPorcentaje = (cambio / precioAnterior) * 100;
    
    // Calcular spread actual
    const spreadActual = preciosVenta[preciosVenta.length - 1] - preciosCompra[preciosCompra.length - 1];
    const spreadPorcentaje = (spreadActual / preciosCompra[preciosCompra.length - 1]) * 100;
    
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
                <span class="stat-label">Spread (Venta-Compra):</span>
                <span class="stat-value">${spreadActual.toFixed(4)} Bs/$US (${spreadPorcentaje.toFixed(2)}%)</span>
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

function guardarDatos(fechaHora, moneda, precioCompra, precioVenta, esManual = false) {
    const clave = `precios_${moneda}`;
    let datos = JSON.parse(localStorage.getItem(clave)) || [];
    
    // Filtrar datos antiguos (último mes)
    const unMesAtras = new Date();
    unMesAtras.setMonth(unMesAtras.getMonth() - 1);
    
    // Filtrar datos usando Date válidas y eliminar duplicados
    datos = datos.filter(item => {
        try {
            const fecha = new Date(item.fechaHora);
            return !isNaN(fecha.getTime()) && fecha >= unMesAtras;
        } catch (e) {
            return false;
        }
    });

    // Verificar si el último precio es diferente antes de agregar
    const ultimoDato = datos[datos.length - 1];
    if (!ultimoDato || 
        Math.abs(ultimoDato.precioVenta - precioVenta) >= 0.01 || 
        Math.abs(ultimoDato.precioCompra - precioCompra) >= 0.01 || 
        esManual) {
        
        datos.push({ 
            fechaHora, 
            precioCompra, 
            precioVenta,
            actualizacionManual: esManual 
        });
        localStorage.setItem(clave, JSON.stringify(datos));
    }
}

// Configuración de WebSocket
let ws;
function conectarWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
        const datos = JSON.parse(event.data);
        if (datos.type === 'nueva_cotizacion') {
            actualizarDatosEnTiempoReal(datos.data);
        }
    };

    ws.onclose = () => {
        console.log('Conexión WebSocket cerrada. Reconectando...');
        setTimeout(conectarWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
    };
}

function actualizarDatosEnTiempoReal(nuevaCotizacion) {
    // Agregar nueva cotización a los datos existentes
    if (!window.datosValidos) window.datosValidos = [];
    window.datosValidos.push(nuevaCotizacion);
    
    // Ordenar por fecha
    window.datosValidos.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
    
    // Actualizar gráfico con animación
    const periodoActual = document.querySelector('.period-btn.active')?.dataset.period || '1w';
    filtrarYMostrarDatos(periodoActual);
    
    // Actualizar estadísticas
    actualizarEstadisticas('$Bs', window.datosValidos);
}

// Iniciar conexión WebSocket al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    conectarWebSocket();
    main();
});

function calcularConversion() {
    const monto = parseFloat(document.getElementById('montoCalculadora').value);
    const tipo = document.getElementById('tipoConversion').value;
    const precioVentaBinance = parseFloat(document.getElementById('precioVentaBinance').textContent.replace('$', ''));
    
    if (isNaN(monto) || monto < 0) {
        alert('Por favor, ingrese un monto válido');
        return;
    }

    if (isNaN(precioVentaBinance)) {
        alert('Cotización no disponible en este momento');
        return;
    }

    let resultado;
    if (tipo === 'usdToBob') {
        resultado = monto * precioVentaBinance;
        document.getElementById('resultadoConversion').textContent = 
            resultado.toFixed(2) + ' BOB';
    } else {
        resultado = monto / precioVentaBinance;
        document.getElementById('resultadoConversion').textContent = 
            resultado.toFixed(2) + ' USD';
    }
}

// Inicializar la calculadora
document.addEventListener('DOMContentLoaded', () => {
    conectarWebSocket();
    main();
    
    // Eventos de la calculadora
    document.getElementById('calcular')?.addEventListener('click', calcularConversion);
    document.getElementById('montoCalculadora')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calcularConversion();
        }
    });
});