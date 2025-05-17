# Sistema de Cotización del Dólar en Bolivia

## Descripción

Aplicación web que muestra en tiempo real la cotización del dólar en Bolivia, utilizando datos de Binance y fuentes oficiales. Incluye visualización gráfica interactiva y estadísticas detalladas.

## Características Principales

- Visualización en tiempo real de cotizaciones
- Gráfico interactivo con múltiples períodos de tiempo
- Tema claro/oscuro
- Estadísticas detalladas (máximo, mínimo, promedio, volatilidad)
- Interfaz responsive
- Actualización automática de datos
- Comparación entre dólar Binance y oficial

## Tecnologías Utilizadas

- **Chart.js**: Gráficos interactivos con zoom y pan
- **WebSocket**: Actualizaciones en tiempo real
- **LocalStorage**: Almacenamiento local de datos históricos
- **CSS Variables**: Tematización dinámica
- **Fetch API**: Comunicación con servicios externos
- **JavaScript Moderno**: ES6+ features

## Instalación

1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/api-grafico.git
cd api-grafico
```

2. Abrir index.html en un navegador web moderno

## Uso

- **Selección de Período**: Utiliza los botones para ver diferentes rangos de tiempo
- **Interacción con el Gráfico**:
  - Zoom: Usar la rueda del mouse
  - Pan: Click y arrastrar
  - Tooltip: Mover el cursor sobre el gráfico
- **Cambio de Tema**: Botón en la esquina superior derecha

## Estructura del Proyecto

```
.
├── index.html          # Página principal
├── style.css          # Estilos y temas
├── script.js          # Lógica principal y gráficos
└── themeToggle.js     # Control del tema claro/oscuro
```

## API Endpoints

- GET `/v1/dolares/binance`: Cotización actual de Binance
- GET `/v1/dolares/oficial`: Cotización oficial

## Mejoras Futuras

- Añadir más fuentes de cotización
- Implementar exportación de datos
- Añadir alertas de precio
- Mejorar la persistencia de datos
- Implementar PWA

## Notas

Los datos mostrados son referenciales y no deben usarse como base para transacciones financieras.

## Licencia

MIT License
