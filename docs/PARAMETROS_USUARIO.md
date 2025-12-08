# Parámetros Configurables por el Usuario

**Aplicación:** Kinetic Visual Synthesizer (KVS)  
**Fecha:** 2025-01-XX  
**Versión:** 1.0

---

## Resumen Ejecutivo

La aplicación permite al usuario controlar **20+ parámetros** organizados en 5 categorías principales:

1. **Tracking** (Seguimiento de manos)
2. **Simulación** (Física de partículas)
3. **Patch Bay** (Mapeo de tensión a parámetros)
4. **Calibración** (Ajuste fino del tracking)
5. **Sistema** (Configuración general)

Todos los parámetros se **persisten automáticamente** en `localStorage` y se restauran al recargar la aplicación.

---

## 1. Sección TRACKING

### 1.1 Cámara

- **Parámetro:** `cameraEnabled`
- **Tipo:** Checkbox (On/Off)
- **Valor por defecto:** `false`
- **Descripción:** Activa/desactiva la cámara y el tracking de manos
- **Persistente:** ✅ Sí

### 1.2 Estado de Tracking (Solo lectura)

- **Parámetro:** `handTracking.isTracking`
- **Tipo:** Indicador visual (rojo/verde)
- **Descripción:** Muestra si el sistema está detectando manos
- **Valores:** `ACTIVE` / `INACTIVE`

### 1.3 Tensión (Solo lectura)

- **Parámetro:** `tension`
- **Tipo:** Display numérico + barra de progreso
- **Rango:** `0.0` - `1.0`
- **Descripción:** Valor calculado de la tensión de la mano (distancia entre pulgar e índice)
- **Visualización:**
  - Valor numérico grande (16px)
  - Barra de progreso con gradiente (verde → amarillo → rojo)

### 1.4 Confianza (Solo lectura)

- **Parámetro:** `handTracking.confidence`
- **Tipo:** Porcentaje
- **Rango:** `0%` - `100%`
- **Descripción:** Nivel de confianza de la detección de MediaPipe

---

## 2. Sección SIMULATION

### 2.1 Tipo de Campo Vectorial

- **Parámetro:** `vectorFieldType`
- **Tipo:** Dropdown selector
- **Opciones:**
  - `0` = **Curl Noise** (ruido de rizo, fluido)
  - `1` = **Lorenz Attractor** (atractor de Lorenz)
  - `2` = **Aizawa Attractor** (atractor de Aizawa)
- **Valor por defecto:** `0` (Curl Noise)
- **Persistente:** ✅ Sí
- **Nota:** Cambia qué parámetros están disponibles

---

### 2.2 Parámetros de Curl Noise

_Solo visibles cuando `vectorFieldType < 0.5`_

#### 2.2.1 Noise Scale

- **Parámetro:** `noiseScale`
- **Tipo:** Slider
- **Rango:** `0.1` - `2.0`
- **Step:** `0.05`
- **Valor por defecto:** `0.8`
- **Descripción:** Escala del ruido (afecta el tamaño de los patrones)
- **Persistente:** ✅ Sí

#### 2.2.2 Noise Speed

- **Parámetro:** `noiseSpeed`
- **Tipo:** Slider
- **Rango:** `0.0` - `1.0`
- **Step:** `0.01`
- **Valor por defecto:** `0.1`
- **Descripción:** Velocidad de animación del campo de ruido
- **Persistente:** ✅ Sí

#### 2.2.3 Noise Strength

- **Parámetro:** `noiseStrength`
- **Tipo:** Slider
- **Rango:** `1.0` - `20.0`
- **Step:** `0.5`
- **Valor por defecto:** `8.0`
- **Descripción:** Intensidad del campo de ruido (multiplicador de fuerza)
- **Persistente:** ✅ Sí

#### 2.2.4 Damping

- **Parámetro:** `damping`
- **Tipo:** Slider
- **Rango:** `0.90` - `0.999`
- **Step:** `0.001`
- **Valor por defecto:** `0.99`
- **Descripción:** Amortiguación de velocidad (0.0 = sin amortiguación, 1.0 = parada completa)
- **Persistente:** ✅ Sí

---

### 2.3 Parámetros de Atractores

_Solo visibles cuando `vectorFieldType >= 0.5`_

#### 2.3.1 Attractor Strength

- **Parámetro:** `attractorStrength`
- **Tipo:** Slider
- **Rango:** `0.1` - `5.0`
- **Step:** `0.1`
- **Valor por defecto:** `1.0`
- **Descripción:** Fuerza del atractor (Lorenz o Aizawa)
- **Persistente:** ✅ Sí

---

### 2.4 Entropía

- **Parámetro:** `tension` (mapeado como "Entropy")
- **Tipo:** Slider
- **Rango:** `0.0` - `1.0`
- **Step:** `0.01`
- **Valor por defecto:** `0.0`
- **Descripción:** Control manual de entropía (mezcla ruido organizado con ruido blanco)
- **Nota:** ⚠️ Hay un desajuste semántico - el label dice "Entropy" pero controla `tension`
- **Persistente:** ✅ Sí (a través de tension store)

---

## 3. Sección PATCH BAY

El Patch Bay permite mapear la **tensión de la mano** a múltiples parámetros simultáneamente.

### 3.1 Parches Disponibles

#### 3.1.1 Entropy

- **Target:** `entropy`
- **Habilitado por defecto:** ✅ Sí
- **Rango Min:** `0.0` - `2.0` (step: `0.01`)
- **Rango Max:** `0.0` - `2.0` (step: `0.01`)
- **Valores por defecto:** Min: `0.0`, Max: `1.0`
- **Descripción:** Mapea tensión a entropía (caos en el sistema)

#### 3.1.2 Time Scale

- **Target:** `timeScale`
- **Habilitado por defecto:** ❌ No
- **Rango Min:** `0.0` - `2.0` (step: `0.01`)
- **Rango Max:** `0.0` - `5.0` (step: `0.01`)
- **Valores por defecto:** Min: `0.5`, Max: `2.0`
- **Descripción:** Mapea tensión a escala de tiempo (velocidad de simulación)

#### 3.1.3 Color Shift

- **Target:** `colorShift`
- **Habilitado por defecto:** ❌ No
- **Rango Min:** `0.0` - `6.28` (step: `0.01`) - _2π_
- **Rango Max:** `0.0` - `6.28` (step: `0.01`) - _2π_
- **Valores por defecto:** Min: `0.0`, Max: `6.28318`
- **Descripción:** Mapea tensión a desplazamiento de color (hue shift)

#### 3.1.4 Attractor Strength

- **Target:** `attractorStrength`
- **Habilitado por defecto:** ❌ No
- **Rango Min:** `0.0` - `2.0` (step: `0.01`)
- **Rango Max:** `0.0` - `5.0` (step: `0.01`)
- **Valores por defecto:** Min: `0.1`, Max: `2.0`
- **Descripción:** Mapea tensión a fuerza del atractor (solo para modos atractor)

### 3.2 Controles por Parche

Cada parche tiene:

- **Checkbox:** Habilitar/deshabilitar el parche
- **Slider Min:** Valor mínimo cuando tensión = 0
- **Slider Max:** Valor máximo cuando tensión = 1

**Fórmula de mapeo:**

```
valor_mapeado = min + (tension * (max - min))
```

---

## 4. Sección CALIBRATION

### 4.1 Métricas de Calibración (Solo lectura)

#### 4.1.1 Normalized Distance

- **Parámetro:** `normalizedDistance`
- **Tipo:** Display numérico
- **Descripción:** Distancia normalizada entre pulgar e índice
- **Formato:** 3 decimales

#### 4.1.2 Raw Tension

- **Parámetro:** `rawTension`
- **Tipo:** Display numérico
- **Descripción:** Tensión cruda antes del smoothstep
- **Formato:** 3 decimales

#### 4.1.3 Smoothed Tension

- **Parámetro:** `tension`
- **Tipo:** Display numérico (resaltado)
- **Descripción:** Tensión final después de smoothstep y suavizado
- **Formato:** 3 decimales
- **Color:** Verde (#69db7c)

---

### 4.2 Parámetros de Calibración

#### 4.2.1 Smoothstep Min

- **Parámetro:** `calibration.smoothstepMin`
- **Tipo:** Slider
- **Rango:** `0.0` - `2.0`
- **Step:** `0.01`
- **Valor por defecto:** `0.3`
- **Descripción:** Valor mínimo para la función smoothstep (ajusta sensibilidad inferior)
- **Persistente:** ✅ Sí

#### 4.2.2 Smoothstep Max

- **Parámetro:** `calibration.smoothstepMax`
- **Tipo:** Slider
- **Rango:** `0.0` - `3.0`
- **Step:** `0.01`
- **Valor por defecto:** `1.5`
- **Descripción:** Valor máximo para la función smoothstep (ajusta sensibilidad superior)
- **Persistente:** ✅ Sí

#### 4.2.3 Smoothing Alpha

- **Parámetro:** `calibration.smoothingAlpha`
- **Tipo:** Slider
- **Rango:** `0.0` - `1.0`
- **Step:** `0.01`
- **Valor por defecto:** `0.2`
- **Descripción:** Factor de suavizado exponencial (0.0 = sin suavizado, 1.0 = máximo suavizado)
- **Persistente:** ✅ Sí

---

### 4.3 Proceso de Calibración Automática

#### 4.3.1 Start Auto Calibration

- **Tipo:** Botón
- **Acción:** Inicia el proceso de calibración paso a paso
- **Estado:** Solo visible cuando no está calibrando

#### 4.3.2 Capture Open Hand

- **Tipo:** Botón
- **Acción:** Captura el valor de distancia con la mano abierta
- **Estado:** Visible durante calibración
- **Feedback:** Muestra valor capturado

#### 4.3.3 Capture Closed Hand

- **Tipo:** Botón
- **Acción:** Captura el valor de distancia con la mano cerrada
- **Estado:** Visible durante calibración
- **Feedback:** Muestra valor capturado

#### 4.3.4 Apply

- **Tipo:** Botón primario
- **Acción:** Aplica los valores capturados a la calibración
- **Estado:** Deshabilitado hasta que ambas posiciones estén capturadas

#### 4.3.5 Cancel

- **Tipo:** Botón secundario
- **Acción:** Cancela el proceso de calibración

#### 4.3.6 Reset to Defaults

- **Tipo:** Botón secundario
- **Acción:** Restaura los valores de calibración por defecto
- **Valores por defecto:**
  - `smoothstepMin`: `0.3`
  - `smoothstepMax`: `1.5`
  - `smoothingAlpha`: `0.2`

---

## 5. Parámetros del Sistema (No visibles en UI)

### 5.1 Particle Count

- **Parámetro:** `particleCount`
- **Tipo:** Configuración interna
- **Valor por defecto:** `1,000,000`
- **Máximo:** `1,000,000`
- **Descripción:** Número de partículas en la simulación
- **Persistente:** ✅ Sí
- **Nota:** No hay control UI para esto actualmente

---

## Resumen de Parámetros por Categoría

| Categoría       | Parámetros Configurables        | Parámetros Solo Lectura         | Total     |
| --------------- | ------------------------------- | ------------------------------- | --------- |
| **Tracking**    | 1 (cameraEnabled)               | 3 (status, tension, confidence) | 4         |
| **Simulation**  | 6-7 (depende del tipo de campo) | 0                               | 6-7       |
| **Patch Bay**   | 12 (4 parches × 3 controles)    | 1 (tension display)             | 13        |
| **Calibration** | 3 (smoothstep min/max, alpha)   | 3 (métricas)                    | 6         |
| **Sistema**     | 1 (particleCount)               | 0                               | 1         |
| **TOTAL**       | **23-24**                       | **7**                           | **30-31** |

---

## Persistencia

### Parámetros Persistentes (localStorage)

Todos los parámetros configurables se guardan automáticamente en `localStorage` con el prefijo `kvs_`:

- ✅ `kvs_cameraEnabled`
- ✅ `kvs_vectorFieldType`
- ✅ `kvs_noiseScale`
- ✅ `kvs_noiseSpeed`
- ✅ `kvs_noiseStrength`
- ✅ `kvs_attractorStrength`
- ✅ `kvs_damping`
- ✅ `kvs_patchMappings` (objeto completo)
- ✅ `kvs_calibration` (objeto completo)
- ✅ `kvs_particleCount`
- ✅ `kvs_panelSections` (estados de secciones expandidas)
- ✅ `kvs_unifiedPanelPosition` (posición del tab)

### Parámetros No Persistentes

- ❌ `tension` (se calcula en tiempo real)
- ❌ `handTracking` (estado temporal)
- ❌ `rawTension` (valor temporal)
- ❌ `normalizedDistance` (valor temporal)

---

## Rangos y Valores por Defecto

### Valores por Defecto Completos

```typescript
// Tracking
cameraEnabled: false

// Simulation
vectorFieldType: 0 (Curl Noise)
noiseScale: 0.8
noiseSpeed: 0.1
noiseStrength: 8.0
attractorStrength: 1.0
damping: 0.99

// Patch Bay
entropy: { enabled: true, min: 0.0, max: 1.0 }
timeScale: { enabled: false, min: 0.5, max: 2.0 }
colorShift: { enabled: false, min: 0.0, max: 6.28318 }
attractorStrength: { enabled: false, min: 0.1, max: 2.0 }

// Calibration
smoothstepMin: 0.3
smoothstepMax: 1.5
smoothingAlpha: 0.2

// System
particleCount: 1,000,000
```

---

## Notas Importantes

### ⚠️ Desajuste Semántico

- El control "Entropy" en SimulationSection en realidad controla `tension`
- Debería renombrarse o usar un store separado para entropía

### 📊 Parámetros Derivados

Algunos parámetros se calculan automáticamente:

- `computedTimeScale`: Calculado desde patch bay
- `computedColorShift`: Calculado desde patch bay
- `tension`: Calculado desde tracking de manos

### 🎛️ Controles Condicionales

- Los parámetros de Curl Noise solo aparecen cuando `vectorFieldType < 0.5`
- Los parámetros de Atractores solo aparecen cuando `vectorFieldType >= 0.5`
- El Patch Bay de `attractorStrength` solo tiene efecto en modos atractor

---

## Acceso Rápido

**Atajos de Teclado:**

- `H` o `h`: Toggle panel de control
- `Escape`: Cerrar panel (cuando esté implementado)

**Ubicación de Controles:**

- Panel de control: Presionar `H` o hacer clic en el tab "CTRL"
- Secciones colapsables: Click en el header para expandir/colapsar

---

**Documento generado por:** The Kinetic Systems Architect  
**Última actualización:** 2025-01-XX
