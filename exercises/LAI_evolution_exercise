# 📘 Ejercicio Propuesto: Aplicación de Modelo de ML a Nuevos Datos Satelitales

## 🧠 Objetivo del ejercicio

Aplicar el modelo de regresión entrenado en el tutorial para **predecir una variable objetivo** (como el índice de área foliar) sobre un nuevo conjunto de datos, utilizando **Google Earth Engine (GEE)**.

Este ejercicio permite consolidar el flujo completo de trabajo: desde la extracción de datos satelitales hasta la predicción y evaluación del modelo de Machine Learning en un contexto real.

---

## 📂 Archivos suministrados

En la carpeta `data/` encontrarás:

- `test_coordinates.csv`: archivo con coordenadas (`lat`, `lon`), fechas y valores reales de la variable objetivo.
- `README_DATOS.txt`: explicación de la estructura de columnas.

---

## 🔍 Pasos del ejercicio

1. **Leer y explorar el archivo `test_coordinates.csv`.**

2. **Para cada fila:**
   - Localiza una imagen Sentinel-2 correspondiente a la **fecha y coordenadas** dadas.
   - Asegúrate de filtrar las imágenes por:
     - Fecha exacta o más cercana disponible
     - Área geográfica de interés
     - Porcentaje de nubes < 10%
   - Selecciona las mismas bandas utilizadas para entrenar el modelo.
   - Escala los valores dividiendo entre 10.000, como hiciste en el tutorial.

3. **Construye un `FeatureCollection`** con esas observaciones (una por cada punto de test).

4. **Aplica el modelo de Machine Learning entrenado** (Random Forest) sobre este nuevo `FeatureCollection`.

5. **Compara las predicciones con los valores reales**:
   - Genera un gráfico de dispersión (scatter plot) real vs. predicho.
   - Calcula las métricas R² y RMSE.

6. **(Opcional)**: Visualiza los puntos sobre el mapa, coloreados según el error de predicción.

---

## ✅ Resultado esperado

- Un gráfico de dispersión con las predicciones vs los valores reales.
- Cálculo de R² y RMSE para evaluar el modelo.
- Archivo `ejercicio.js` con el código bien estructurado y comentado.

---

## 🧪 ¿Qué vas a practicar?

- Lectura y preprocesado de CSV en GEE
- Uso de `ImageCollection` y `FeatureCollection`
- Aplicación de modelos a nuevos datos
- Visualización de predicciones georreferenciadas
- Evaluación de modelos de regresión en GEE

---

## 🧩 Bonus (opcional)

¿Puedes adaptar el modelo para aplicarlo a una imagen completa de Sentinel-2 (en vez de puntos individuales) y luego comparar los valores predichos con los del CSV?

---

## 🛠️ Requisitos

- Cuenta activa en [Google Earth Engine](https://earthengine.google.com/)
- Haber completado el tutorial previo
- Acceso a los siguientes archivos:
  - `main.js`
  - `metrics.js`
  - `legend.js`
  - Modelo entrenado

---

## 📬 ¿Dudas o sugerencias?

Déjalas como comentario en el [video del tutorial](#) o contáctame por [LinkedIn](#).  
Si completas el ejercicio, ¡me encantaría ver tu resultado!

---

### 👨‍💻 Autor

**José Estévez**  
Especialista en Machine Learning y análisis geoespacial  
📫 [Tu LinkedIn o sitio web aquí]

---
