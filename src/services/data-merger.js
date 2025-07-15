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
                    // Convertir las comas en puntos y parsear a números
                    const data = {
                        fechaHora: new Date(row.fecha).toISOString(),
                        precioCompraOficial: parseFloat(row.compraOficial.replace(',', '.')),
                        precioVentaOficial: parseFloat(row.ventaOficial.replace(',', '.')),
                        precioCompraBinance: parseFloat(row.compraBinance.replace(',', '.')),
                        precioVentaBinance: parseFloat(row.ventaBinance.replace(',', '.'))
                    };
                    csvData.push(data);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // 2. Leer datos del localStorage (simularemos leyendo data-bs-binance.xml)
        let binanceData = [];
        try {
            const binanceContent = fs.readFileSync('data-bs-binance.xml', 'utf8');
            binanceData = JSON.parse(binanceContent);
        } catch (error) {
            console.log('No se encontró data-bs-binance.xml o está vacío');
        }

        // 3. Combinar datos
        const allData = [...csvData, ...binanceData];

        // 4. Eliminar duplicados basados en fechaHora
        const uniqueData = Array.from(
            new Map(allData.map(item => [item.fechaHora, item])).values()
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
