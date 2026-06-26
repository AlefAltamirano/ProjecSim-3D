# ProjecSim 3D
**Simulador de Proyectiles 3D — Aplicación Educativa Científica**

![ProjecSim 3D](https://img.shields.io/badge/version-2.0-F59E0B?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-r158-blue?style=flat-square)
![Licencia](https://img.shields.io/badge/licencia-MIT-green?style=flat-square)

---

## Descripción

ProjecSim 3D es un simulador educativo de movimiento parabólico con física numérica robusta (RK4), visualizaciones científicas interactivas y una interfaz inspirada en software universitario como PhET Simulations, GeoGebra y MATLAB.

Diseñado como proyecto de portafolio para **Física I**, demuestra dominio de:
- Mecánica clásica (MRU + MRUV + rozamiento lineal)
- Integración numérica (Runge-Kutta 4)
- Desarrollo web moderno (ES6 Modules, Three.js, WebGL)
- Arquitectura de software modular

---

## Características

### Física
- **Integrador RK4** con paso fijo de 5 ms para estabilidad numérica
- Movimiento parabólico con rozamiento lineal (dv/dt = −γv)
- Cálculo de energías cinética, potencial y mecánica en tiempo real
- Predicciones analíticas en tiempo real (sin drag)

### Visualización 3D
- Escena WebGL con Three.js r158
- Sombras PCF suaves, niebla atmosférica, iluminación multicapa
- Trayectoria como `BufferGeometry` actualizado in-place (sin GC)
- Vectores de velocidad (total, componentes X e Y)
- Proyecciones horizontales y verticales
- Marcadores de apogeo e impacto
- Objetivo interactivo

### Interfaz
- Modo oscuro científico (`#060C18` base)
- Sin scroll en 1366×768 ni superiores
- Panel de predicciones actualizado en tiempo real
- Telemetría con barras de progreso animadas
- 10 opciones de visualización activables

---

## Arquitectura

```
project/
├── index.html                # Shell HTML, import map
├── css/
│   ├── style.css             # Tokens de diseño, estilos globales
│   ├── layout.css            # Grid del app, secciones principales
│   └── components.css        # Todos los componentes UI
└── js/
    ├── main.js               # Punto de entrada, wiring del EventBus
    ├── core/
    │   ├── Config.js         # Constantes globales (única fuente de verdad)
    │   ├── EventBus.js       # Pub/sub para desacoplamiento entre módulos
    │   └── GameEngine.js     # Loop RAF, timestep fijo, manejo de estados
    ├── physics/
    │   ├── ProjectilePhysics.js     # Integrador RK4
    │   └── TrajectoryCalculator.js  # Predicciones analíticas
    ├── scene/
    │   ├── Scene3D.js        # Renderer, cámara, luces, suelo, grid
    │   └── TargetSystem.js   # Proyectil, trayectoria, vectores, marcadores
    ├── ui/
    │   └── UIController.js   # Binding DOM, telemetría, parámetros
    └── utils/
        ├── MathUtils.js      # clamp, lerp, mapRange
        └── FormatUtils.js    # fmt, fmtTime, fmtDist, fmtVel, fmtEnergy
```

### Principios aplicados
- **Bajo acoplamiento**: módulos se comunican exclusivamente via EventBus
- **Alta cohesión**: cada módulo tiene una sola responsabilidad
- **Principio de responsabilidad única (SRP)**
- **ES6 Modules** nativos con Import Map (sin bundler necesario)
- **Reuso de geometrías**: trayectoria como `BufferGeometry`, sin recrear objetos

---

## Cómo ejecutar

### Opción 1 — Live Server (VS Code)
1. Abrir la carpeta `project/` en VS Code
2. Instalar la extensión **Live Server**
3. Clic derecho en `index.html` → *Open with Live Server*

### Opción 2 — Python HTTP Server
```bash
cd project
python -m http.server 8080
# Abrir http://localhost:8080
```

### Opción 3 — Node.js
```bash
cd project
npx serve .
```

> **⚠ No abrir `index.html` directamente** — ES Modules requieren HTTP.

---

## Parámetros

| Parámetro | Símbolo | Rango | Defecto |
|-----------|---------|-------|---------|
| Ángulo | θ | 1° – 89° | 45° |
| Velocidad inicial | v₀ | 1 – 100 m/s | 30 m/s |
| Altura inicial | y₀ | 0 – 50 m | 0 m |
| Gravedad | g | 0.1 – 25 m/s² | 9.81 m/s² |
| Rozamiento | γ | 0 – 0.5 kg/s | 0 |
| Velocidad simulación | × | 0.1× – 5× | 1× |

---

## Física implementada

### Ecuaciones de movimiento
Con rozamiento lineal proporcional a la velocidad:

```
dx/dt  = vx
dy/dt  = vy
dvx/dt = -(γ/m) · vx
dvy/dt = -g - (γ/m) · vy
```

### Integración RK4
```js
k1 = f(s)
k2 = f(s + dt/2 · k1)
k3 = f(s + dt/2 · k2)
k4 = f(s + dt · k3)
s_new = s + dt/6 · (k1 + 2k2 + 2k3 + k4)
```

### Energías
- **Cinética**: Ek = ½mv²
- **Potencial**: Ep = mgy
- **Mecánica**: Em = Ek + Ep (decrece con rozamiento)

---

## Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Three.js | r158 | Renderizado 3D WebGL |
| ES6 Modules | nativo | Arquitectura modular |
| Import Maps | nativo | Resolución de módulos sin bundler |
| CSS Grid + Flexbox | nativo | Layout responsivo |
| Web Fonts | Google Fonts | JetBrains Mono, DM Sans, Space Grotesk |

---

## Créditos

Proyecto desarrollado para el curso **Física I** como entregable semestral.
Arquitectura, física y diseño originales.

Inspirado en:
- [PhET Interactive Simulations](https://phet.colorado.edu/)
- [GeoGebra](https://www.geogebra.org/)
- MATLAB Physics Toolbox

---

*ProjecSim 3D — Simulador educativo de movimiento parabólico*
