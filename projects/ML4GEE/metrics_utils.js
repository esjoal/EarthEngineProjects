// metrics_utils.js

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
