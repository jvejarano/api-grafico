# 💹 Sistema de Cotización del Dólar en Bolivia

## 📊 Descripción

Aplicación web avanzada que muestra cotizaciones del dólar estadounidense en Bolivia en tiempo real, utilizando múltiples fuentes confiables incluyendo Binance P2P, dólar oficial y otras plataformas. Incluye visualización gráfica interactiva, análisis técnico y herramientas de conversión.

## ✨ Características Principales

### 🔄 **Datos en Tiempo Real**

- Cotizaciones actualizadas automáticamente desde múltiples fuentes
- Comparación entre Tether (USDT) y dólar oficial
- Cálculo automático de brecha entre mercados
- Indicadores de tendencia y volatilidad

### 📈 **Visualización Avanzada**

- Gráfico interactivo con Chart.js (zoom, pan, tooltips)
- Múltiples períodos de tiempo (día, semana, mes, histórico completo)
- Análisis técnico automatizado (soporte, resistencia, tendencias)
- Tema claro/oscuro con persistencia

### 🧮 **Herramientas Integradas**

- Calculadora de conversión USD ⇄ BOB
- Conversiones adicionales: EUR, BTC (experimental)
- Historial de conversiones
- Función de compartir cotizaciones

### 🔧 **Funcionalidades Técnicas**

- Almacenamiento local de datos históricos
- Manejo robusto de errores con mensajes informativos
- Interfaz responsive para móviles y desktop
- PWA-ready con metadatos optimizados
- Manejo inteligente de reconexiones WebSocket

## 🛠 Tecnologías Utilizadas

### **Frontend**

- **Chart.js 4.x**: Gráficos interactivos con plugins de zoom y anotaciones
- **Vanilla JavaScript ES6+**: Sin dependencias pesadas
- **CSS Variables**: Sistema de temas dinámico
- **LocalStorage**: Persistencia de datos y preferencias
- **Fetch API**: Comunicación asíncrona con APIs
- **Service Workers**: Preparado para PWA

### **Backend (Opcional)**

- **Node.js + Express**: Servidor API local
- **SQLite**: Base de datos ligera para históricos
- **WebSocket**: Actualizaciones en tiempo real
- **CORS**: Configuración para desarrollo

### **APIs Externas**

- **DolarAPI Bolivia**: Fuente principal de cotizaciones
- **Binance P2P**: Datos de mercado descentralizado

## 🚀 Instalación y Uso

### **Opción 1: Uso Directo (Recomendado)**

```bash
# Clonar el repositorio
git clone https://github.com/jvejarano/api-grafico.git
cd api-grafico

# Abrir directamente en navegador
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### **Opción 2: Con Servidor Local**

```bash
# Instalar dependencias
npm install

# Iniciar servidor completo (API + WebSocket)
npm start

# Acceder a http://localhost:3000
```

### **Opción 3: GitHub Pages**

La aplicación está disponible en: `https://jvejarano.github.io/api-grafico/`

## 🎮 Guía de Uso

### **Navegación del Gráfico**

- **Zoom**: Rueda del mouse o gestos touch
- **Pan**: Click y arrastrar
- **Períodos**: Botones para cambiar rango temporal
- **Tooltips**: Hover sobre puntos del gráfico

### **Calculadora de Conversión**

1. Seleccionar tipo de conversión (USD→BOB, BOB→USD, etc.)
2. Ingresar monto
3. El resultado se calcula automáticamente
4. Historial disponible en la interfaz

### **Funciones Avanzadas**

- **Compartir**: Botón para copiar/compartir cotización actual
- **Tema**: Toggle en esquina superior derecha
- **Análisis Técnico**: Soporte, resistencia y tendencias automáticas

## 📁 Estructura del Proyecto

```
api-grafico/
├── 📄 index.html              # Página principal con UI completa
├── 🎨 style.css               # Estilos principales y temas
├── ⚡ script.js               # Lógica principal, gráficos y APIs
├── 🌙 themeToggle.js          # Control de tema claro/oscuro
├── 🗃️ package.json           # Dependencias y scripts NPM
├── 🌐 server.js               # Servidor Express con API y WebSocket
├── 📊 database.sqlite         # Base de datos local (auto-generada)
├── 📈 data-bs-binance.xml     # Datos históricos de Binance
├── 📋 *.csv                   # Archivos de datos importados
│
├── src/services/              # Servicios modulares
│   ├── 🧮 calculator-service.js     # Lógica de calculadora
│   ├── 📊 data-merger.js            # Fusión de múltiples fuentes
│   ├── 🔍 search-service.ts         # Búsquedas de datos
│   └── 📈 statistics-service.js     # Cálculos estadísticos
│
├── src/visualization/         # Componentes de visualización
│   └── 📉 chart-handler.js          # Manejo avanzado de gráficos
│
└── tests/                     # Suite de pruebas y reportes
    ├── 🧪 date-search.test.ts        # Tests de búsqueda temporal
    └── 📋 *.md                       # Reportes de estabilidad
```

## 🔌 API Endpoints

### **APIs Externas (DolarAPI Bolivia)**

- `GET https://bo.dolarapi.com/v1/dolares/binance` - Cotización USDT/BOB
- `GET https://bo.dolarapi.com/v1/dolares/oficial` - Cotización oficial

### **API Local (cuando se usa servidor)**

- `POST /api/cotizacion` - Guardar nueva cotización
- `GET /api/cotizaciones` - Obtener histórico por rango
- `GET /api/ultima-cotizacion/:moneda` - Última cotización
- `WebSocket /` - Actualizaciones en tiempo real

## 🔧 Configuración Avanzada

### **Variables de Entorno**

```bash
PORT=3000                    # Puerto del servidor
NODE_ENV=production         # Entorno de ejecución
```

### **Personalización**

```javascript
// En script.js - Configurar intervalo de actualización
const INTERVALO_ACTUALIZACION = 30000; // 30 segundos

// Configurar límites de reconexión WebSocket
const MAX_RECONNECTS = 3;
const RECONNECT_DELAY = 5000;
```

## 🚨 Estado de Estabilidad

**Última evaluación**: 23/7/2025  
**Estado**: ✅ **ESTABLE Y FUNCIONAL**

### **Correcciones Recientes**

- ✅ Eliminado bucle infinito de reconexión WebSocket
- ✅ Corregido error "datos is not defined" en filtros de gráfico
- ✅ Implementado manejo robusto de errores con mensajes al usuario
- ✅ Optimizada compatibilidad con GitHub Pages y entornos sin servidor

### **Métricas de Performance**

- **Errores por minuto**: <5 (reducido de ~50-60)
- **Funcionalidad core**: 95% operativa
- **Compatibilidad**: Chrome 90+, Firefox 88+, Safari 14+

## 🔮 Mejoras Futuras

### **Próximas Versiones**

- [ ] **v2.0**: Alertas de precio configurables
- [ ] **v2.1**: Exportación de datos (CSV, JSON)
- [ ] **v2.2**: API de múltiples exchanges
- [ ] **v2.3**: Análisis técnico avanzado (RSI, MACD)
- [ ] **v2.4**: Modo offline completo (Service Worker)

### **Funcionalidades en Desarrollo**

- Integración con más exchanges (Kraken, Coinbase)
- Dashboard administrativo
- Notificaciones push
- Análisis de patrones de trading
- Modo de comparación histórica

## ⚠️ Avisos Importantes

### **Disclaimer Legal**

Los datos mostrados son **estrictamente referenciales** y pueden variar. Esta información se proporciona únicamente con fines informativos y **NO** debe utilizarse como base para transacciones financieras. Siempre consulte fuentes oficiales antes de tomar decisiones financieras.

### **Limitaciones Técnicas**

- Dependencia de APIs externas para datos en tiempo real
- WebSocket funcional solo con servidor local
- Históricos limitados por almacenamiento local del navegador

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crear una rama para la funcionalidad: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

**MIT License** - Ver archivo `LICENSE` para detalles completos.

---

**Desarrollado con ❤️ para la comunidad boliviana**  
**Última actualización**: Julio 2025
