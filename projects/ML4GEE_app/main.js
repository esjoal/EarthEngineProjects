/*******************************************************************************
 * @file    main.js
 * @brief   Aplicación interactiva para correr en Google Earth Engine APPs
 *          para generar mapas de estimación del Índice de Área Foliar (LAI)
 *          usando algoritmos de Machine Learning
 *          e imágenes del satélite Sentinel-2
 * @date    2026-03-31
 * @author  Jose Estevez
 * @license GNU General Public License v3.0
 * @email   estevez036@gmail.com
 * @github  https://github.com/esjoal
 * @In      https://www.linkedin.com/in/estevez-jose
 ******************************************************************************/

// Importa una librería externa para generar la leyenda del colorbar.
var legend_utils = require('users/jose_estevez/GEE4ML:legend_utils.js');

// ==========================================================================
// 1. VARIABLES GLOBALES Y ENTRENAMIENTO DEL MODELO ML (BACKEND)
// ==========================================================================

// Captura el tiempo inicial en milisegundos para cronometrar el entrenamiento.
var startTraining = Date.now(); 

// Define el nombre de la variable 'objetivo' (target) que queremos predecir (Índice de Área Foliar).
var target = 'LAI'; 

// Lista de las 10 bandas de Sentinel-2 que el modelo usará como variables predictoras.
var featureSel = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12'];

// Nombre que se le asignará a la nueva banda de salida con la predicción del modelo.
var y_pred = 'LAI_pred'; 

// Identificador del proyecto en Google Cloud donde reside el Asset.
var projectCloud = 'project-ml-jose'; 

// Nombre del Asset (FeatureCollection) que contiene los datos de entrenamiento.
var trainCSV = 'S2_10bands_LAI_2017_2022_train';

// Carga los datos de entrenamiento, los ordena y añade una columna aleatoria para mezclarlos.
var trainset = ee.FeatureCollection("projects/" + projectCloud + "/assets/" + trainCSV)
  .sort('index') // Orden inicial por índice.
  .randomColumn('random', 42) // Usamos una semilla para que garantizar que el entrenamiento sea reproducible.
  .sort('random'); // Mezcla los datos para evitar sesgos de orden en el entrenamiento.

// Configura el algoritmo Random Forest.
var modelRF = ee.Classifier.smileRandomForest({
  numberOfTrees: 50, // Defino la cantidad de árboles.
  seed: 42           // Garantiza que el entrenamiento sea reproducible (mismo resultado siempre).
}).train({
  features: trainset,       // Datos de entrenamiento mezclados.
  classProperty: target,    // Variable que el modelo debe aprender a estimar.
  inputProperties: featureSel // Bandas espectrales que sirven de base para el cálculo.
}).setOutputMode('REGRESSION'); // Modo Regresión: el resultado es un valor decimal continuo.

// Calcula el tiempo total de entrenamiento en segundos.
var trainingTime = (Date.now() - startTraining) / 1000;

// Configuración visual para el mapa de LAI (gradiente de Rojo a Verde).
var visParamsLAI = {
  title: 'LAI [m²/m²]',
  palette: ['red', 'yellow', 'green'],
  min: 0.0,
  max: 7.0,
  steps: 7
};

// Diccionario que almacena coordenadas y fechas de interés para las pruebas rápidas.
var locations = {
  'O elegir un ejemplo...': { geo: null, fecha: '2023-07-01' },
  'Munich (Alemania)': {
    geo: ee.Geometry.Polygon([[[11.6742, 48.2951], [11.6713, 48.2386], [11.7391, 48.2370], [11.7421, 48.2935]]]),
    fecha: '2017-07-06'
  },
  'Barrax (España)': {
    geo: ee.Geometry.Polygon([[
      [-2.118301, 38.903992],
      [-2.118301, 38.949797],
      [-2.059593, 38.949797],
      [-2.059593, 38.903992],
      [-2.118301, 38.903992]
    ]]),
    fecha: '2023-06-22'
  }
};

// ==========================================================================
// 2. INTERFAZ DE USUARIO (UI / FRONTEND)
// ==========================================================================

// Crea dos mapas independientes para la visualización comparativa.
var leftMap = ui.Map();
var rightMap = ui.Map();

// Vincula ambos mapas para que el zoom y el desplazamiento estén sincronizados.
var linker = ui.Map.Linker([leftMap, rightMap]);

// Oculta las herramientas de dibujo por defecto en el mapa de la izquierda.
leftMap.setControlVisibility({drawingTools: false});

// Crea una línea vertical gris para separar visualmente los dos mapas.
var divider = ui.Panel({style: {width: '4px', backgroundColor: '#333', height: '100%', margin: '0px'}});

// Crea el panel lateral donde irán todos los controles de la aplicación.
var panel = ui.Panel({style: {width: '320px', padding: '15px', border: '1px solid #ccc'}});

// Añade el título principal y la descripción al panel.
panel.add(ui.Label('LAI monitor \nusing Machine Learning', {fontSize: '22px', fontWeight: 'bold', color: '#2e7d32', whiteSpace: 'pre'}));
panel.add(ui.Label('Estimación del Índice de Área Foliar (LAI) mediante \nmodelos de Machine Learning e imágenes Sentinel-2.\n\nDesarrollador: José Estévez', 
  {fontSize: '12px', color: '#555', fontStyle: 'italic', margin: '-5px 0 15px 0', whiteSpace: 'pre'}));

// --- SECCIÓN 1: ÁREA DE INTERÉS ---
panel.add(ui.Label('1. Área de Interés (AOI):', {fontWeight: 'bold', margin: '10px 0 5px 0'}));

// Botón para permitir al usuario dibujar un polígono manualmente.
var drawBtn = ui.Button({
  label: 'Dibujar Rectángulo',
  onClick: function() {
    locationSelect.setValue('O elegir un ejemplo...', false); // Cambia el selector a manual.
    clearMaps(); // Borra capas previas.
    drawingTools.setShape('rectangle'); // Configura la herramienta a rectángulo.
    drawingTools.draw(); // Activa el cursor de dibujo.
  },
  style: {stretch: 'horizontal'}
});
panel.add(drawBtn); // Añade botón al panel

// Selector desplegable con las ciudades predefinidas en el diccionario 'locations'.
var locationSelect = ui.Select({
  items: Object.keys(locations),
  value: 'O elegir un ejemplo...',
  onChange: function(key) {
    var item = locations[key];
    if (item.geo) {
      clearMaps(); // Limpia el mapa antes de navegar.
      leftMap.centerObject(item.geo, 13); // Centra la vista en la geometría elegida.
      dateInput.setValue(item.fecha); // Ajusta la fecha recomendada para esa zona.
    }
  },
  style: {stretch: 'horizontal'}
});
panel.add(locationSelect); // Añade botón al panel

// --- SECCIÓN 2: FECHA ---
panel.add(ui.Label('2. Fecha:', {fontWeight: 'bold', margin: '15px 0 5px 0'}));
var dateInput = ui.Textbox({value: '2023-07-01', style: {stretch: 'horizontal'}}); // Fecha por defecto
panel.add(dateInput); // Añade casilla de ingreso de texto al panel

// --- SECCIÓN 3: MODELO ---
panel.add(ui.Label('3. Seleccionar Modelo:', {fontWeight: 'bold', margin: '15px 0 5px 0'}));
var modelSelect = ui.Select({ // Defino el selector
  items: ['Random Forest'],
  value: 'Random Forest',
  style: {stretch: 'horizontal'}
});
panel.add(modelSelect); // Añade el botón selector al panel

// --- SECCIÓN 4: OPCIONES EXTRA ---
panel.add(ui.Label('4. Opciones extra:', {fontWeight: 'bold', margin: '15px 0 5px 0'}));

// Slider para definir cuántos días buscar antes y después de la fecha base.
var daysSlider = ui.Slider({min: 1, max: 30, value: 7, step: 1, style: {stretch: 'horizontal', margin: '0 0 10px 0'}});
panel.add(ui.Label('Margen de días (+/-):', {fontSize: '11px', color: '#666', margin: '0 0 0 4px'}));
panel.add(daysSlider); // Añade slider al panel

// Slider para filtrar imágenes según el porcentaje máximo de nubes permitido.
var cloudSlider = ui.Slider({min: 0, max: 50, value: 10, step: 1, style: {stretch: 'horizontal', margin: '0 0 10px 0'}});
panel.add(ui.Label('Máximo de nubes en TILE (%):', {fontSize: '11px', color: '#666', margin: '0 0 0 4px'}));
panel.add(cloudSlider);

// --- ACCIONES Y RESULTADOS ---
// Etiqueta de carga que se muestra solo durante el procesamiento.
var loadingLabel = ui.Label({value: '⏳ Procesando...', style: {color: 'orange', fontWeight: 'bold', shown: false}});
panel.add(loadingLabel);

// Botón que ejecuta toda la lógica de procesamiento.
var runBtn = ui.Button({
  label: 'MAPEAR',
  style: {stretch: 'horizontal', fontWeight: 'bold', backgroundColor: '#2e7d32', color: 'black', margin: '15px 0 10px 0'}
});
panel.add(runBtn); // Añade botón al panel

// Panel interior para listar las fechas de las imágenes que cumplen los filtros.
panel.add(ui.Label('Imagen procesada y de fechas próximas:', {fontSize: '12px', fontWeight: 'bold', margin: '10px 0 5px 0'}));
var resultsPanel = ui.Panel({
  style: {height: '80px', border: '1px solid #eee', backgroundColor: '#f9f9f9', padding: '5px', margin: '0 0 10px 0'}
});
panel.add(resultsPanel); // Añade subpanel de resultados al panel

// Muestra los tiempos de entrenamiento y procesamiento.
var timeLabel = ui.Label('Entrenamiento: ' + trainingTime.toFixed(4) + 's', {fontSize: '11px', color: 'gray'});
var processTimeLabel = ui.Label('', {fontSize: '11px', color: 'gray'});
panel.add(timeLabel).add(processTimeLabel);

// Botón para resetear mapas.
var resetBtn = ui.Button({label: 'Limpiar Mapas', onClick: clearMaps, style: {stretch: 'horizontal', color: 'black'}});
panel.add(resetBtn);

// Añade la leyenda de colores generada por la librería externa.
panel.add(legend_utils.createLegend(visParamsLAI));

// Configura la raíz de la UI: el panel a la izquierda y el mapa dividido a la derecha.
ui.root.clear();
ui.root.add(panel);
ui.root.add(ui.Panel([leftMap, divider, rightMap], ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'}));

// Activa las herramientas de dibujo en el mapa pero las mantiene invisibles hasta que se pulsa el botón.
var drawingTools = leftMap.drawingTools();
drawingTools.setShown(false);

// Función para resetear las capas de los mapas y borrar polígonos dibujados.
function clearMaps() {
  leftMap.layers().reset();
  rightMap.layers().reset();
  loadingLabel.style().set('shown', false);
  processTimeLabel.setValue('');
  resultsPanel.clear();
  // Borra cualquier geometría que el usuario haya dibujado.
  while (drawingTools.layers().length() > 0) {
    drawingTools.layers().remove(drawingTools.layers().get(0));
  }
}

// ==========================================================================
// 3. LÓGICA DE PROCESAMIENTO (MOTOR DE CÁLCULO)
// ==========================================================================

// Define lo que ocurre al hacer clic en el botón "MAPEAR".
runBtn.onClick(function() {
  var aoi;
  var selectedKey = locationSelect.getValue();
  
  // Paso 1: Determinar el Área de Interés (AOI).
  if (selectedKey !== 'O elegir un ejemplo...') { 
    aoi = locations[selectedKey].geo; 
  } else {
    var layers = drawingTools.layers();
    if (layers.length() === 0) { alert('Error: Dibuja un área.'); return; }
    aoi = layers.get(0).getEeObject(); // Captura la geometría dibujada.
    drawingTools.layers().get(0).setShown(false); // Oculta el polígono para ver la imagen debajo.
  }

  // Muestra el aviso de carga y limpia resultados previos.
  loadingLabel.style().set('shown', true);
  resultsPanel.clear();
  
  var startProcess = Date.now(); // Arranco cronómetro mapeo
  
  // Cargo los valores de los botones, sliders y casillas de texto
  var userDate = ee.Date(dateInput.getValue());
  var margin = daysSlider.getValue();
  var cloudThresh = cloudSlider.getValue(); 
  var selectedModel = (modelSelect.getValue() === 'Random Forest') ? modelRF : null;

  // Paso 2: Filtrar la colección Sentinel-2 Harmonized (corregida atmosféricamente).
  var s2Col = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
    .filterBounds(aoi) // Filtro espacial.
    .filterDate(userDate.advance(-margin, 'day'), userDate.advance(margin, 'day')) // Filtro temporal.
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudThresh)); // Filtro de nubes.

  // Función para añadir metadatos a cada imagen.
  var getImgMetadata = function(img) {
    var imgDate = img.date();
    // Calcula cuántos días separan la imagen de la fecha que pidió el usuario.
    var diffDays = imgDate.difference(userDate, 'day').round();
    
    // Genera la etiqueta de texto (ej. "(+2days)") usando concatenación.
    var sign = ee.Algorithms.If(diffDays.gte(0), '+', '');
    var deltaStr = ee.String('(')
      .cat(sign)
      .cat(ee.Number(diffDays).format('%d'))
      .cat('days)');
    
    return img.set({
      'tile_cloud_perc': img.get('CLOUDY_PIXEL_PERCENTAGE'),
      'abs_diff': diffDays.abs(), // Usado para ordenar por proximidad absoluta.
      'delta_label': deltaStr,
      'raw_date': imgDate.format('YYYY-MM-dd'),
      'date_only': imgDate.format('YYYY-MM-dd')
    });
  };

  // Aplica los metadatos, quita duplicados del mismo día y ordena por la más cercana a la fecha base.
  var filteredCol = s2Col.map(getImgMetadata)
    .distinct(['date_only']) 
    .sort('abs_diff'); 

  // Paso 3: Mete los metadatos en un array. Cada fila es una lista que corresponde a una imagen.
  filteredCol.reduceColumns({
    reducer: ee.Reducer.toList(4),
    selectors: ['raw_date', 'tile_cloud_perc', 'delta_label', 'abs_diff']
  }).get('list').evaluate(function(list) {
    resultsPanel.clear();
    // Si no hay imágenes, avisa al usuario y detiene el proceso.
    if (!list || list.length === 0) {
      resultsPanel.add(ui.Label('Sin imágenes (Tile con nubes).', {fontSize: '11px', color: 'red'}));
      loadingLabel.style().set('shown', false);
      if (selectedKey === 'O elegir un ejemplo...') drawingTools.layers().get(0).setShown(true);
      return;
    }
    
    // Lista todas las imágenes encontradas.
    list.forEach(function(row, i) {
      var isFirst = (i === 0); // La primera es la que se procesará.
      var labelText = '📅 ' + row[0] + ' ' + row[2] + ' | Nubes: ' + parseFloat(row[1]).toFixed(1) + '%';
      resultsPanel.add(ui.Label(labelText, {
        fontSize: '11px', color: isFirst ? '#2e7d32' : '#333', fontWeight: isFirst ? 'bold' : 'normal', margin: '2px 0'
      })); // Imprimo la primera fecha en color verde en la lista
    });

    // Paso 4: Carga y procesa la mejor imagen (la primera de la lista).
    var inputImage = ee.Image(filteredCol.first());
    var clippedImg = inputImage.clip(aoi); // Recorta al área de interés.
    
    // Normalización: Sentinel-2 viene escalado (0-10000). Dividimos por 10000 para obtener reflectancia (0-1).
    var processedImg = clippedImg.select(featureSel).divide(10000);
    
    // Regresión: El modelo Random Forest estima el LAI para cada píxel de la imagen.
    var predictedImage = processedImg.classify(selectedModel, y_pred);
    
    // Configura la visualización en Color Real (RGB).
    var visRGB = {bands:['B4','B3','B2'], min:0, max:0.3, gamma:1.4};

    // Añade las capas a los mapas izquierdo y derecho.
    leftMap.layers().set(0, ui.Map.Layer(processedImg, visRGB, 'S2 RGB'));
    rightMap.layers().set(0, ui.Map.Layer(predictedImage, visParamsLAI, 'LAI Predicho'));
    
    // Finaliza el aviso de carga y muestra el tiempo de procesamiento.
    loadingLabel.style().set('shown', false);
    processTimeLabel.setValue('Mapeo: ' + ((Date.now() - startProcess) / 1000).toFixed(4) + 's');
  });
});

// Posición inicial del visor al cargar la aplicación.
// 1. Limpiamos cualquier rastro anterior
clearMaps();

// 2. Forzamos el centro en Europa (Longitud 15, Latitud 50, Zoom 4)
leftMap.setCenter(15.0, 50.0, 4);
rightMap.setCenter(15.0, 50.0, 4);
