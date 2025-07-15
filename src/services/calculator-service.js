class CalculadoraDivisas {
    constructor() {
        this.historialCalculos = [];
        this.opcionesAdicionales = {
            EUR: { compra: 0, venta: 0 },
            BTC: { compra: 0, venta: 0 },
            USDT: { compra: 0, venta: 0 }
        };
        this.setup();
    }

    setup() {
        // Configurar eventos
        document.getElementById('calcular')?.addEventListener('click', () => this.calcular());
        document.getElementById('montoCalculadora')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calcular();
        });
        
        // Agregar selector de monedas
        this.actualizarSelectoresMonedas();
    }

    actualizarSelectoresMonedas() {
        const select = document.getElementById('tipoConversion');
        if (!select) return;

        // Limpiar opciones existentes
        select.innerHTML = '';

        // Agregar nuevas opciones
        const opciones = [
            { value: 'usdToBob', text: 'USD → BOB' },
            { value: 'bobToUsd', text: 'BOB → USD' },
            { value: 'eurToBob', text: 'EUR → BOB' },
            { value: 'bobToEur', text: 'BOB → EUR' },
            { value: 'btcToUsd', text: 'BTC → USD' },
            { value: 'usdToBtc', text: 'USD → BTC' }
        ];

        opciones.forEach(opcion => {
            const optionElement = document.createElement('option');
            optionElement.value = opcion.value;
            optionElement.textContent = opcion.text;
            select.appendChild(optionElement);
        });
    }

    calcular() {
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
        let simboloResultado;

        switch(tipo) {
            case 'usdToBob':
                resultado = monto * precioVentaBinance;
                simboloResultado = 'BOB';
                break;
            case 'bobToUsd':
                resultado = monto / precioVentaBinance;
                simboloResultado = 'USD';
                break;
            case 'eurToBob':
                resultado = monto * (precioVentaBinance * 1.1); // Ejemplo con tasa EUR/USD = 1.1
                simboloResultado = 'BOB';
                break;
            case 'bobToEur':
                resultado = monto / (precioVentaBinance * 1.1);
                simboloResultado = 'EUR';
                break;
            case 'btcToUsd':
                resultado = monto * 30000; // Ejemplo, debería usar API de precio BTC
                simboloResultado = 'USD';
                break;
            case 'usdToBtc':
                resultado = monto / 30000;
                simboloResultado = 'BTC';
                break;
        }

        // Mostrar resultado
        document.getElementById('resultadoConversion').textContent = 
            `${resultado.toFixed(2)} ${simboloResultado}`;

        // Guardar en historial
        this.guardarEnHistorial({
            fecha: new Date(),
            montoOriginal: monto,
            tipoConversion: tipo,
            resultado: resultado,
            tasaUsada: precioVentaBinance
        });

        // Actualizar historial visual
        this.mostrarHistorial();
    }

    guardarEnHistorial(calculo) {
        this.historialCalculos.unshift(calculo);
        // Mantener solo los últimos 10 cálculos
        if (this.historialCalculos.length > 10) {
            this.historialCalculos.pop();
        }
        // Guardar en localStorage
        localStorage.setItem('calculadoraHistorial', JSON.stringify(this.historialCalculos));
    }

    mostrarHistorial() {
        const historialDiv = document.getElementById('historialCalculos');
        if (!historialDiv) {
            // Crear el contenedor del historial si no existe
            const calculadoraSection = document.querySelector('.calculadora');
            const div = document.createElement('div');
            div.id = 'historialCalculos';
            div.className = 'historial-calculadora';
            calculadoraSection.appendChild(div);
        }

        const html = this.historialCalculos.map(calculo => `
            <div class="historial-item">
                <span class="historial-fecha">${new Date(calculo.fecha).toLocaleString()}</span>
                <span class="historial-operacion">
                    ${calculo.montoOriginal} → ${calculo.resultado.toFixed(2)}
                </span>
                <span class="historial-tasa">Tasa: ${calculo.tasaUsada}</span>
            </div>
        `).join('');

        document.getElementById('historialCalculos').innerHTML = html;
    }

    cargarHistorial() {
        const historialGuardado = localStorage.getItem('calculadoraHistorial');
        if (historialGuardado) {
            this.historialCalculos = JSON.parse(historialGuardado);
            this.mostrarHistorial();
        }
    }
}

export { CalculadoraDivisas };
