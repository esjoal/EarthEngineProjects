// metrics_utils.js

// =================================================
// UTILIDADES DE MÉTRICAS PARA VALIDACIÓN DE MODELOS
// =================================================
//
// Cómo importar y usar estas funciones desde tu archivo principal (main.js):
//
//    1. Guarda este archivo como 'metrics_utils.js'.
//    2. En tu archivo 'main.js', importa así:
//
//         var metrics = require('users/TU_USUARIO/NOMBRE_DEL_SCRIPT:metrics_utils.js');
//
//    3. Usa las funciones:
//
//         var rmse = metrics.calculateRMSE(featureCollection, 'real', 'pred');
//         var r2   = metrics.computeRSquared(featureCollection, 'real', 'pred');
//
// Donde:
//   - featureCollection: es un ee.FeatureCollection con propiedades numéricas
//   - 'real': nombre de la propiedad con los valores reales
//   - 'pred': nombre de la propiedad con las predicciones del modelo
//
// Ambas funciones devuelven ee.Number, así que puedes usar:
//   print(rmse);
//   print(r2);
//


// =======================================================
// Función para calcular el Root Mean Squared Error (RMSE)
// =======================================================

exports.calculateRMSE = function(featureCollection, realProperty, predictedProperty) {
  // Asegúrate de que la FeatureCollection tenga las propiedades necesarias.

  // Calcular las diferencias al cuadrado para cada punto.
  var squaredDifferences = featureCollection.map(function(feature) {
    var real = ee.Number(feature.get(realProperty));
    var predicted = ee.Number(feature.get(predictedProperty));
    var diff = real.subtract(predicted);
    return feature.set('squared_diff_res', diff.pow(2));
  });

  // Calcular el Mean Squared Error (MSE) promediando las diferencias al cuadrado.
  var meanSquaredError = squaredDifferences.aggregate_mean('squared_diff_res');

  // Calcular el Root Mean Squared Error (RMSE) tomando la raíz cuadrada del MSE.
  var rmse = ee.Number(meanSquaredError).sqrt();

  return rmse;
};


// ================================
// Función para calcular R-cuadrado
// ================================

exports.computeRSquared = function(resTest, realField, predField) {
  // 1. Calcular la media de los valores reales
  var meanReal = resTest.aggregate_mean(realField);

  // 2. Calcular la Suma de Cuadrados Residuales (SS_res)
  var squaredDifferences = resTest.map(function(feature) {
    var real = ee.Number(feature.get(realField));
    var predicted = ee.Number(feature.get(predField));
    var diff = real.subtract(predicted);
    return feature.set('squared_diff_res', diff.pow(2));
  });
  var ssRes = squaredDifferences.aggregate_sum('squared_diff_res');

  // 3. Calcular la Suma de Cuadrados Totales (SS_tot)
  var squaredDifferencesTot = resTest.map(function(feature) {
    var real = ee.Number(feature.get(realField));
    var diff = real.subtract(meanReal);
    return feature.set('squared_diff_tot', diff.pow(2));
  });
  var ssTot = squaredDifferencesTot.aggregate_sum('squared_diff_tot');

  // 4. Calcular R-cuadrado
  var rSquared = ee.Number(1).subtract(ssRes.divide(ssTot));

  return rSquared;
};
