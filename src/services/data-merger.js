const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function mergeData() {
    try {
        // 1. Leer datos del CSV
        const csvData = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream('DATABASE DOLAR BLUE EN BOLIVIA - Hoja1 (1).csv')
                .pipe(csv({
                    skipLines: 2, // Saltar las dos primeras líneas
                    headers: ['fecha', 'compraOficial', 'ventaOficial', 'compraBinance', 'ventaBinance']
                }))
                .on('data', (row) => {
                    try {
                        // Convertir las comas en puntos y parsear a números
                        const data = {
                            source: 'csv',
                            fechaHora: new Date(row.fecha).toISOString(),
                            precioCompraOficial: parseFloat(row.compraOficial.replace(',', '.')),
                            precioVentaOficial: parseFloat(row.ventaOficial.replace(',', '.')),
                            precioCompraBinance: parseFloat(row.compraBinance.replace(',', '.')),
                            precioVentaBinance: parseFloat(row.ventaBinance.replace(',', '.'))
                        };
                        // Solo agregar si los valores son válidos
                        if (!isNaN(data.precioCompraBinance) && !isNaN(data.precioVentaBinance)) {
                            csvData.push(data);
                        }
                    } catch (e) {
                        console.log('Error al procesar fila CSV:', e);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // 2. Leer datos del archivo binance
        let binanceData = [];
        try {
            const binanceContent = fs.readFileSync('data-bs-binance.xml', 'utf8');
            const rawData = JSON.parse(binanceContent);
            binanceData = rawData.map(item => ({
                ...item,
                source: 'binance'
            }));
        } catch (error) {
            console.log('No se encontró data-bs-binance.xml o está vacío:', error);
        }

        // 3. Obtener datos del localStorage
        let localData = [];
        try {
            const localStorageKey = 'precios_$Bs';
            if (typeof localStorage !== 'undefined' && localStorage.getItem(localStorageKey)) {
                localData = JSON.parse(localStorage.getItem(localStorageKey)).map(item => ({
                    ...item,
                    source: 'localStorage'
                }));
            }
        } catch (error) {
            console.log('Error al obtener datos del localStorage:', error);
        }

        // Combinar datos de todas las fuentes
        const allData = [...csvData, ...binanceData, ...localData];

        // Eliminar duplicados, priorizando por fuente más reciente
        const uniqueData = Array.from(
            new Map(
                allData
                    .sort((a, b) => {
                        // Prioridad de fuentes: localStorage > binance > csv
                        const priority = { localStorage: 3, binance: 2, csv: 1 };
                        return priority[b.source] - priority[a.source];
                    })
                    .map(item => [item.fechaHora, item])
            ).values()
        );

        // 5. Ordenar por fecha
        uniqueData.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

        // 6. Guardar el resultado
        fs.writeFileSync(
            'data-combined.json',
            JSON.stringify(uniqueData, null, 2)
        );

        console.log(`Combinación completada. Total de registros: ${uniqueData.length}`);
        return uniqueData;
    } catch (error) {
        console.error('Error al combinar datos:', error);
        throw error;
    }
}

module.exports = { mergeData };
