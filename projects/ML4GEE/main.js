/*******************************************************************************
 * @file    main.js
 * @brief   Ejemplo práctico de como construir un modelo de machine learning
 *          en Google Earth Engine con la API de JavaScript
 *          para estimar el Indice de Area Foliar (LAI)
 *          a partir de imágenes del satélite Sentinel-2.
 * @date    2025-05-30
 * @author  Jose Estevez
 * @license GNU General Public License v3.0
 * @email   estevez036@gmail.com
 * @github  https://github.com/esjoal
 * @In      https://www.linkedin.com/in/estevez-jose
 ******************************************************************************/

//Definimos variables globales

var target = 'LAI'; // Variable objetivo 
var columnasMostrar = ['index','B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12','LAI']; // Columnas a mostrar en la tabla
var featureSel = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12']; // features a usar en el modelo
var y_pred = 'LAI_pred'; // Variable predicha
var projectCloud = 'project-ml4gee'; // Nombre del proyecto en Google Cloud
var trainCSV = 'S2_10bands_LAI_2017_2022_train';
var testCSV = 'S2_10bands_LAI_2023_2023_test';


// ==============
// CARGA DE DATOS
// ==============

print('////// CARGA DE DATOS ///////');

var trainset_unsorted = ee.FeatureCollection("projects" + '/' + projectCloud + '/' + 'assets' + '/' + trainCSV);
var testset = ee.FeatureCollection("projects" + '/' + projectCloud + '/' + 'assets' + '/' + testCSV);

// Restuaro orden original usando index
var trainset_sorted = trainset_unsorted.sort('index');

// Imprimo tabla ordenada
print('Trainset ordenado:');
function imprimirTablaUI(featureCollection, columnas, numFilas) {
  var panel = ui.Panel({layout: ui.Panel.Layout.flow('vertical')});
  var features = featureCollection.limit(numFilas).getInfo().features;

  // Crear encabezado
  var header = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
  columnas.forEach(function(col) {
    header.add(ui.Label({value: col, style: {width: '60px', fontWeight: 'bold'}}));
  });
  panel.add(header);

  // Agregar filas
  features.forEach(function(f) {
    var row = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
    columnas.forEach(function(col) {
      var val = f.properties[col];
      if (typeof val === 'number' && col !== 'index') val = val.toFixed(2);
      row.add(ui.Label({value: String(val).substring(0, 10), style: {width: '60px'}}));
    });
    panel.add(row);
  });

  print(panel);
}
imprimirTablaUI(trainset_sorted, columnasMostrar, 5);

// Aleatoriza el trainset
var trainset = trainset_sorted.randomColumn('random', 42).sort('random');

print('Tamaño de trainset:', trainset.size());
print('Tamaño de testset:', testset.size());


// ===============================
// EXPLORACIÓN DE DATOS (MINI_EDA)
// ===============================

print(''); print('////// EXPLORACIÓN DE DATOS //////');

// Vemos la distribucion de la variable objetivo
var myHistogram = ui.Chart.feature.histogram({
  features: trainset,
  property: target,
  maxBuckets: 20
})
.setOptions({
  title: 'Distribución del target',
  hAxis: {
    title: target,
    gridlines: {count: 10}
  },
  vAxis: {
    title: 'frecuencia'
  },
  colors: ['#1f77b4']
});

print(myHistogram);


// ========================
// ENTRENAMIENTO DEL MODELO
// ========================

print(''); print('////// ENTRENAMIENTO DEL MODELO //////');

//Entrenamos un RandomForest regression
var model = ee.Classifier.smileRandomForest({
  numberOfTrees: 50,
  seed: 42
}).train({
  features: trainset,
  classProperty: target,
  inputProperties: featureSel
}).setOutputMode('REGRESSION'); // Para predecir valores numericos continuos

// Vemos detalles del modelo entrenado
print('Feature importance', model.explain().get('importance'));
print('Estructura del arbol', model.explain().get('trees'));


// ===================
// PRUEBA CONTRA TRAIN
// ===================

print(''); print('////// PRUEBA CONTRA TRAIN //////');

var trainResults = trainset.classify(model, y_pred);

// Imprimo resultados de la predicción en la consola
print(trainResults);
imprimirTablaUI(trainResults, [y_pred,target], 5);


// Graficamos scatterplot de true vs predicted
var trainResults = trainResults.map(function(feature){ // Truco para pintar línea 1:1
  return feature.set('line', feature.get(target));
});

var trainScatter = ui.Chart.feature.byFeature(trainResults, target, ['line', y_pred])
  .setChartType('ScatterChart')
  .setOptions({
    dataOpacity: 0.3,
    title: 'Prueba contra train',
    hAxis: {title: target + ' true', viewWindow: {min: 0, max: 8}},
    vAxis: {title: target + ' pred', viewWindow: {min: 0, max: 8}},
    series: {
      0: {pointSize: 0, pointVisible: false},
      1: {pointSize: 4, color: 'blue'}
    },
    trendlines: {0: {opacity: 1, type: 'linear', color: 'red'}},
    legend: {position: 'none'},
    width: 500,
    height: 500
  });

print(trainScatter);

// Cálculo de métricas
var metrics = require('users/fit2predictlab/ML4GEE:metrics_utils.js'); // importamos funciones

var trainRMSE = metrics.calculateRMSE(trainResults, target, y_pred);
var trainR2 = metrics.computeRSquared(trainResults, target, y_pred);

print('RMSE (train):', trainRMSE);
print('R² (train):', trainR2);


// ==================
// PRUEBA CONTRA TEST
// ==================

print(''); print('////// PRUEBA CONTRA TEST //////');

// Clasificar puntos de prueba
var testResults = testset.classify(model, y_pred);

// Imprimo resultados de la predicción en la consola
imprimirTablaUI(testResults, [y_pred,target], 5);

// Graficamos scatterplot de true vs predicted
var testResults = testResults.map(function(data){ // Truco para pintar línea 1:1
  return data.set('line', data.get(target));
});

var testScatter = ui.Chart.feature.byFeature(testResults, target, ['line', y_pred])
  .setChartType('ScatterChart')
  .setOptions({
    dataOpacity: 0.3,
    title: 'Prueba contra test',
    hAxis: {title: target + ' true', viewWindow: {min: 0, max: 8}},
    vAxis: {title: target + ' pred', viewWindow: {min: 0, max: 8}},
    series: {
      0: {pointSize: 0, pointVisible: false},
      1: {pointSize: 4, color: 'blue'}
    },
    trendlines: {0: {opacity: 1, type: 'linear', color: 'red'}},
    legend: {position: 'none'},
    width: 500,
    height: 500
  });

print(testScatter);

// Cálculo de métricas
var testRMSE = metrics.calculateRMSE(testResults, target, y_pred);
var testR2 = metrics.computeRSquared(testResults, target, y_pred);

print('RMSE (test):', testRMSE);
print('R² (test):', testR2);


// =====================================
// SELECCION Y PREPROCESADO DE LA IMAGEN
// =====================================

print(''); print('////// CARGA Y PREPROCESADO DE LA IMAGEN //////'); print('Ver mapa')

// Definimos el área geográfica de interés
var aoi = ee.Geometry.Polygon(
  [[[11.67427222, 48.295125],
    [11.67132778, 48.23868889],
    [11.73912778, 48.23709167],
    [11.74214722, 48.293525]]], null, false);

// Definimos la fecha de la imagen
var Date_Start_str = '2017-07-06';
var Date_End_str = '2017-07-07';

// Cargamos la colección de imágenes y filtramos
var inputImage = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
  .filterBounds(aoi) // Filtro de área geográfica
  .filterDate(Date_Start_str, Date_End_str) // Fecha
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))// Porcentaje de nubes < 10
  .first() // Primera imagen de la colección
  .select(featureSel) // Seleccionamos bandas
  .divide(10000)// Aplicamos el factor de escala
  .clip(aoi); //Recortamos la imagen

// Mostrar imagen original en RGB
Map.setOptions('SATELLITE');
Map.centerObject(aoi); // Zoom al área de interés
Map.addLayer(inputImage, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3}, 'Sentinel-2 RGB'); // Agregamos capa raster al mapa

// =================================
// APLICACIÓN DEL MODELO A LA IMAGEN
// =================================

print(''); print('////// APLICACIÓN DEL MODELO A LA IMAGEN //////');
print('Imagen seleccionada:', inputImage);

var predictedImage = inputImage.classify(model, y_pred); // Hacemos la predicción

print('Predicción sobre la imagen:', predictedImage);

// Visualizamos la predicción en el mapa
print('Ver predicción en el mapa');

var visParams = { //Definimos los parámetros de visualización
  title: 'LAI [m²/m²]',
  palette: ['red', 'yellow', 'green'],
  min: 0.0,
  max: 7.0,
  steps: 7
};

// Añadimos capa de la predicción
Map.addLayer(predictedImage, {
  min: visParams.min,
  max: visParams.max,
  palette: visParams.palette
}, 'LAI predicted');

// Creamos la leyenda y la añadimos al mapa
var legend_utils = require('users/fit2predictlab/ML4GEE:legend_utils.js'); // Importamos funciones para la leyenda
var myLegend = legend_utils.createLegend(visParams);
Map.add(myLegend);
