// Función para cargar los datos combinados
async function cargarDatosCombinados() {
    try {
        const response = await fetch('data-combined.json');
        const datos = await response.json();
        return datos;
    } catch (error) {
        console.error('Error al cargar datos combinados:', error);
        return [];
    }
}

// Modificar la función original para usar los datos combinados
async function graficarDatos(moneda) {
    try {
        const datosCombinados = await cargarDatosCombinados();
        
        // Actualizar datos válidos globales
        window.datosValidos = datosCombinados;
        
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

        // Configurar eventos y mostrar datos
        document.querySelectorAll('.period-btn').forEach(button => {
            button.removeEventListener('click', periodoClickHandler);
            button.addEventListener('click', periodoClickHandler);
        });

        document.querySelector('.period-btn[data-period="1w"]').click();
        configurarBotonCompartir(window.datosValidos);
        
    } catch (error) {
        console.error('Error al graficar datos:', error);
        document.getElementById("grafico").innerHTML = "<p>Error al cargar los datos.</p>";
    }
}
