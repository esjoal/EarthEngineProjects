// Archivo: legend_utils.js

/*
===========================================
EJEMPLO DE USO EN GOOGLE EARTH ENGINE (GEE)
===========================================

// Si usas este archivo llamándolo desde un script principal, ve al main y haz lo siguiente...

//Define los parámetros de la leyenda
var visParams = { 
  title: 'LAI [m²/m²]',
  palette: ['red', 'yellow', 'green'],
  min: 0.0,
  max: 7.0,
  steps: 7
};

// Importa el módulo
var legend = require('users/TU_USUARIO/NOMBRE_DEL_SCRIPT:legend_utils');

// Crea la leyenda
var myLegend = legend_utils.createLegend(visParams);

// Agrega la leyenda al mapa intereactivo
Map.add(myLegend);
*/


// Función para construir los parámetros de la barra de color
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, 1, 0.1],         // Define el área de la imagen de salida: ancho (1) x alto (0.1)
    dimensions: '400x20',         // Tamaño de la imagen generada (400 píxeles de ancho por 20 de alto)
    format: 'png',                // Formato de salida de la imagen
    min: 0,                       // Valor mínimo del rango de datos representado en la leyenda
    max: 1,                       // Valor máximo del rango
    palette: palette,             // Paleta de colores usada (lista de strings con colores hexadecimales)
  };
}

// =============================
// FUNCION PARA CREAR LA LEYENDA
// =============================

exports.createLegend = function(params) {
  // Se espera que `params` sea un objeto con los siguientes campos:
  // title: string         -> Título de la leyenda (ej: "Índice NDVI")
  // palette: array        -> Lista de colores en formato string (hex, RGB, etc.)
  // min: number           -> Valor mínimo del rango
  // max: number           -> Valor máximo del rango
  // steps: number         -> Número de divisiones o marcas en la escala

  // Se crea la imagen de la barra de color utilizando una imagen dummy y los parámetros de color
  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),  // Imagen ficticia (usa coordenadas de longitud)
    params: makeColorBarParams(params.palette), // Se le aplica la paleta usando los parámetros definidos antes
    style: {
      stretch: 'horizontal',  // Estira la imagen horizontalmente
      margin: '4px 8px',      // Márgenes exteriores
      maxHeight: '24px'       // Altura máxima para mantener tamaño compacto
    },
  });

  // Lista para almacenar las etiquetas numéricas debajo de la barra de color
  var widgetList = [];

  // Se calcula el tamaño de cada paso entre valores (por ejemplo, 0.0, 0.2, 0.4... etc.)
  var step = (params.max - params.min) / params.steps;

  // Se genera una etiqueta por cada paso y se agrega a la lista
  for (var i = params.min; i <= params.max; i += step) {
    var label = ui.Label(i.toFixed(1), {      // Se limita a 1 decimal para mejor presentación
      margin: '2px 6px',                      // Espaciado interno
      textAlign: 'center',                    // Centrado del texto
      stretch: 'horizontal'                   // Que ocupe espacio proporcional en el panel
    });
    widgetList.push(label);                   // Se agrega a la lista de etiquetas
  }

  // Se crea un panel horizontal que contiene todas las etiquetas numéricas
  var legendLabels = ui.Panel({
    widgets: widgetList,                      // Lista de etiquetas como widgets
    layout: ui.Panel.Layout.flow('horizontal') // Layout en fila horizontal
  });

  // Se crea una etiqueta para el título de la leyenda
  var legendTitle = ui.Label({
    value: params.title,                      // Título que se muestra
    style: {
      fontSize: '15px',                       // Tamaño de fuente
      fontWeight: 'bold',                     // Negrita
      textAlign: 'center',                    // Centrado del texto
      fontFamily: 'Lucida Sans Unicode',      // Tipo de fuente
      stretch: 'both'                         // Ocupa todo el ancho del contenedor
    }
  });

  // Finalmente, se construye el panel de la leyenda con:
  // 1. El título
  // 2. La barra de color
  // 3. Las etiquetas numéricas
  var legendPanel = ui.Panel([legendTitle, colorBar, legendLabels]);

  // Se retorna el panel completo para que pueda ser agregado a la interfaz de usuario
  return legendPanel;
};
