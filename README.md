# Proyecto: Cotización de Criptomonedas con SQLite y Node.js

## Descripción
Este proyecto permite obtener la cotización de criptomonedas en Binance, almacenarlas en una base de datos **SQLite** y visualizar la información mediante gráficos en una interfaz web.

## Tecnologías Utilizadas
- **Node.js**: Para el backend y la API.
- **Express.js**: Para manejar las rutas y las solicitudes HTTP.
- **SQLite**: Para almacenar las cotizaciones de criptomonedas.
- **Chart.js**: Para graficar los datos en el frontend.
- **HTML, CSS y JavaScript**: Para la interfaz de usuario.

## Instalación
### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
```

### 2. Instalar dependencias
Asegúrate de tener **Node.js** instalado. Luego, instala las dependencias con:
```bash
npm install
```

### 3. Crear la base de datos SQLite
Ejecuta el siguiente comando para crear el archivo de base de datos:
```bash
touch database.sqlite
```

### 4. Iniciar el servidor
```bash
node main.js
```
Esto iniciará el servidor en **http://localhost:3000**.

## Uso
### Guardar una cotización
Puedes enviar datos a la API con el siguiente comando:
```bash
curl -X POST http://localhost:3000/cotizaciones \
     -H "Content-Type: application/json" \
     -d '{"fecha_hora": "2025-02-20 10:00:00", "moneda": "BTC", "precio_compra": 69000, "precio_venta": 70000}'
```

### Obtener cotizaciones
Para obtener todas las cotizaciones de una moneda:
```bash
curl http://localhost:3000/cotizaciones?moneda=BTC
```

### Interfaz web
1. Abre `index.html` en un navegador.
2. La aplicación recuperará los datos desde la API y generará gráficos con **Chart.js**.

## Estructura del Proyecto
```
.
├── database.sqlite        # Archivo de la base de datos
├── index.html             # Interfaz web
├── main.js                # Código principal del servidor
├── package.json           # Configuración de Node.js
├── README.md              # Documentación del proyecto
```

## Mejoras Futuras
- Agregar autenticación para proteger la API.
- Implementar WebSockets para actualizaciones en tiempo real.
- Soporte para múltiples monedas.

## Contribución
Si deseas contribuir, **haz un fork del repositorio** y envía un Pull Request con tus mejoras.

## Licencia
Este proyecto se distribuye bajo la licencia MIT.

