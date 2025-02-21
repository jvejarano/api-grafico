api-grafico
Este proyecto muestra los precios de criptomonedas utilizando datos obtenidos de una API y los grafica en una página web.

Estructura del Proyecto
.vscode/
    settings.json
database.sqlite
index.html
package.json
script.js
style.css

.vscode/settings.json: Configuración para el servidor en vivo.
database.sqlite: Base de datos SQLite (actualmente vacía).
index.html: Página principal que muestra los gráficos.
package.json: Archivo de configuración de npm con dependencias y scripts.
script.js: Script principal que obtiene datos de la API, los guarda y los grafica.
style.css: Estilos para la página web.
Instalación
Clona el repositorio:
git clone <URL_DEL_REPOSITORIO>
cd api-grafico

Instala las dependencias:
npm install

Uso
Abre index.html en tu navegador o utiliza una extensión de servidor en vivo en tu editor de código (por ejemplo, Live Server en Visual Studio Code).

El script script.js se ejecutará automáticamente, obteniendo datos de la API y actualizando el gráfico cada hora.

Dependencias
sqlite3
Chart.js
chartjs-plugin-zoom
chartjs-plugin-datalabels
chartjs-plugin-annotation
Autor
Nombre del Autor (Completa con tu nombre)
Licencia
Este proyecto está licenciado bajo la Licencia ISC. Consulta el archivo LICENSE para obtener más detalles.

Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para discutir cualquier cambio que desees realizar.

Notas
Asegúrate de tener una conexión a Internet activa para obtener datos de la API y cargar las bibliotecas externas.
Los datos se almacenan en localStorage del navegador y se grafican utilizando Chart.js.
¡Gracias por usar este proyecto!
