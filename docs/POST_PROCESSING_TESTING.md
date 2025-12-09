# Post-Processing Testing Manual

## Overview

This document provides a complete guide for testing and debugging the post-processing effects system in the Kinetic Visual Synthesizer (KVS). All testing functions are available through the browser console in development mode.

## Quick Start

Open your browser's developer console (F12 or Cmd+Option+I) and access the testing API:

```javascript
// Check if API is available
window.__postProcessingDebug;

// Show help
window.__postProcessingDebug.help();

// Check current status
window.__postProcessingDebug.status();
```

## Global Controls

### Enable/Disable Post-Processing

Post-processing can be completely enabled or disabled globally:

```javascript
// Enable post-processing (all effects can be used)
window.__postProcessingDebug.enable();

// Disable post-processing completely (no effects, passthrough mode)
window.__postProcessingDebug.disable();

// Toggle on/off
window.__postProcessingDebug.toggle();
```

**Note:** When disabled, the system uses passthrough rendering (no overhead). When enabled, effects can be individually controlled.

### Enable/Disable All Effects

Control all effects at once while keeping post-processing enabled:

```javascript
// Enable all effects at once
window.__postProcessingDebug.enableAll();

// Disable all effects (but keep post-processing system active)
window.__postProcessingDebug.disableAll();
```

**Difference:**

- `disable()` - Completely disables post-processing (zero overhead)
- `disableAll()` - Disables all effects but keeps post-processing system active (minimal overhead)

## Individual Effect Controls

### Available Effects

The following effects are available:

- `"glitch"` - Digital glitch/distortion effect
- `"bloom"` - Glow effect for bright particles
- `"chromatic-aberration"` - Color separation effect
- `"vignette"` - Edge darkening effect
- `"color-grading"` - Color temperature, contrast, saturation, brightness
- `"film-grain"` - Film grain texture overlay

### Enable/Disable Individual Effects

```javascript
// Enable a specific effect
window.__postProcessingDebug.enableEffect('bloom');

// Disable a specific effect
window.__postProcessingDebug.disableEffect('bloom');

// Toggle a specific effect
window.__postProcessingDebug.toggleEffect('bloom');
```

### Set Effect Intensity

All effects support intensity control (0.0 to 1.0):

```javascript
// Set intensity for any effect
window.__postProcessingDebug.setIntensity('bloom', 0.8);
window.__postProcessingDebug.setIntensity('vignette', 0.5);
window.__postProcessingDebug.setIntensity('glitch', 0.3);
```

## Effect-Specific Controls

### Bloom Effect

Bloom creates a glow effect around bright particles. It has additional parameters:

```javascript
// Set threshold (lower = more areas bloom)
// Range: 0.0 - 2.0
// Recommended: 0.1 - 0.5 for particles
window.__postProcessingDebug.setBloomThreshold(0.2);

// Set blur radius (how far the glow extends)
// Range: 0.1 - 5.0
// Recommended: 2.0 - 4.0
window.__postProcessingDebug.setBloomRadius(3.0);

// Example: Very aggressive bloom
window.__postProcessingDebug.enableEffect('bloom');
window.__postProcessingDebug.setIntensity('bloom', 2.0);
window.__postProcessingDebug.setBloomThreshold(0.1);
window.__postProcessingDebug.setBloomRadius(5.0);
```

### Color Grading Effect

Color grading allows fine-tuning of color temperature, contrast, saturation, and brightness:

```javascript
// Set color temperature
// Range: -1.0 (cool/blue) to 1.0 (warm/orange)
window.__postProcessingDebug.setTemperature(0.3);

// Set contrast
// Range: -1.0 (low) to 1.0 (high)
window.__postProcessingDebug.setContrast(0.2);

// Set saturation
// Range: -1.0 (desaturated) to 1.0 (vibrant)
window.__postProcessingDebug.setSaturation(0.1);

// Set brightness
// Range: -1.0 (darker) to 1.0 (brighter)
window.__postProcessingDebug.setBrightness(0.05);
```

## Quick Test Presets

### Test Individual Effects

Quick presets for testing each effect with **VERY aggressive settings** (maximum visibility):

```javascript
// Test bloom with VERY aggressive settings
// Settings: intensity: 2.0, threshold: 0.1, radius: 5.0
window.__postProcessingDebug.testBloom();

// Test vignette with VERY aggressive settings
// Settings: intensity: 1.0, radius: 0.4, feather: 0.2
window.__postProcessingDebug.testVignette();

// Test chromatic aberration with VERY aggressive settings
// Settings: intensity: 1.0, offset: 0.1
window.__postProcessingDebug.testChromaticAberration();

// Test color grading with VERY aggressive settings
// Settings: temperature: 0.8, contrast: 0.8, saturation: 0.6, brightness: 0.3
window.__postProcessingDebug.testColorGrading();

// Test film grain with VERY aggressive settings
// Settings: intensity: 1.0
window.__postProcessingDebug.testFilmGrain();

// Test glitch with VERY aggressive settings
// Settings: intensity: 1.0
window.__postProcessingDebug.testGlitch();
```

**Note:** All test functions use maximum/aggressive settings to ensure the effect is clearly visible. For production use, adjust parameters to more moderate values.

### Cinematic Preset

Activate a combination of effects for a cinematic look:

```javascript
window.__postProcessingDebug.testAll();
```

This activates:

- Bloom (intensity: 1.2, threshold: 0.3)
- Vignette (intensity: 0.6)
- Color Grading (temperature: 0.2, contrast: 0.15)
- Film Grain (intensity: 0.25)

## Status and Debugging

### Check Current Status

Get detailed information about the current post-processing state:

```javascript
window.__postProcessingDebug.status();
```

This shows:

- Global enabled/disabled state
- Facade initialization status
- Pipeline effects (what's actually in the render pipeline)
- Store effects (what's configured in the store)
- Individual effect states and parameters

### Example Status Output

```javascript
📊 Post-Processing Status: {
  enabled: true,
  facadeInitialized: true,
  facadeHasError: false,
  pipelineEffects: [
    { name: "BloomEffect", enabled: true, intensity: 1.5 },
    { name: "VignetteEffect", enabled: true, intensity: 0.6 }
  ],
  storeEffects: {
    bloom: { enabled: true, intensity: 1.5, threshold: 0.2, radius: 4.0 },
    vignette: { enabled: true, intensity: 0.6, ... }
  }
}
```

## Common Workflows

### Workflow 1: Test Bloom Visibility

If bloom isn't visible, try progressively more aggressive settings:

```javascript
// Step 1: Enable and check status
window.__postProcessingDebug.enable();
window.__postProcessingDebug.enableEffect('bloom');
window.__postProcessingDebug.status();

// Step 2: Lower threshold (more areas bloom)
window.__postProcessingDebug.setBloomThreshold(0.1);

// Step 3: Increase intensity
window.__postProcessingDebug.setIntensity('bloom', 2.0);

// Step 4: Increase blur radius
window.__postProcessingDebug.setBloomRadius(5.0);

// Step 5: If still not visible, check if particles are bright enough
// Try the VERY aggressive test preset
window.__postProcessingDebug.testBloom();
```

### Workflow 2: Create Custom Preset

```javascript
// Start fresh
window.__postProcessingDebug.disableAll();

// Enable and configure effects
window.__postProcessingDebug.enableEffect('bloom');
window.__postProcessingDebug.setIntensity('bloom', 1.2);
window.__postProcessingDebug.setBloomThreshold(0.3);

window.__postProcessingDebug.enableEffect('vignette');
window.__postProcessingDebug.setIntensity('vignette', 0.4);

window.__postProcessingDebug.enableEffect('color-grading');
window.__postProcessingDebug.setTemperature(0.2);
window.__postProcessingDebug.setContrast(0.15);

// Verify
window.__postProcessingDebug.status();
```

### Workflow 3: Compare Effects

```javascript
// Test one effect at a time
window.__postProcessingDebug.disableAll();
window.__postProcessingDebug.enableEffect('bloom');
// ... observe ...

window.__postProcessingDebug.disableEffect('bloom');
window.__postProcessingDebug.enableEffect('vignette');
// ... observe ...

window.__postProcessingDebug.disableEffect('vignette');
window.__postProcessingDebug.enableEffect('chromatic-aberration');
// ... observe ...
```

### Workflow 4: Performance Testing

```javascript
// Baseline: no post-processing
window.__postProcessingDebug.disable();
// ... measure FPS ...

// Single effect
window.__postProcessingDebug.enable();
window.__postProcessingDebug.enableEffect('bloom');
// ... measure FPS ...

// Multiple effects
window.__postProcessingDebug.enableAll();
// ... measure FPS ...
```

## Troubleshooting

### Bloom Not Visible

1. **Check if effect is in pipeline:**

   ```javascript
   window.__postProcessingDebug.status();
   // Look for "BloomEffect" in pipelineEffects array
   ```

2. **Lower threshold:**

   ```javascript
   window.__postProcessingDebug.setBloomThreshold(0.05); // Very low
   ```

3. **Increase intensity:**

   ```javascript
   window.__postProcessingDebug.setIntensity('bloom', 2.5); // Very high
   ```

4. **Check if particles are bright enough:**
   - Bloom only affects bright areas
   - If particles are too dark, they won't bloom
   - Try increasing particle brightness/color intensity

### Effect Not Applying

1. **Verify post-processing is enabled:**

   ```javascript
   window.__postProcessingDebug.status();
   // Check: enabled: true
   ```

2. **Verify effect is enabled:**

   ```javascript
   window.__postProcessingDebug.status();
   // Check: storeEffects.bloom.enabled: true
   ```

3. **Check if effect is in pipeline:**

   ```javascript
   window.__postProcessingDebug.status();
   // Check: pipelineEffects contains the effect
   ```

4. **Re-enable the effect:**
   ```javascript
   window.__postProcessingDebug.disableEffect('bloom');
   window.__postProcessingDebug.enableEffect('bloom');
   ```

### Performance Issues

1. **Disable effects you're not using:**

   ```javascript
   window.__postProcessingDebug.disableAll();
   // Then enable only what you need
   ```

2. **Reduce intensity:**

   ```javascript
   window.__postProcessingDebug.setIntensity('bloom', 0.5); // Lower = faster
   ```

3. **Disable post-processing completely:**
   ```javascript
   window.__postProcessingDebug.disable(); // Zero overhead
   ```

## API Reference

### Global Functions

| Function       | Description                              | Parameters |
| -------------- | ---------------------------------------- | ---------- |
| `enable()`     | Enable post-processing system            | None       |
| `disable()`    | Disable post-processing completely       | None       |
| `toggle()`     | Toggle post-processing on/off            | None       |
| `enableAll()`  | Enable all effects at once               | None       |
| `disableAll()` | Disable all effects (keep system active) | None       |

### Effect Functions

| Function                    | Description             | Parameters                   |
| --------------------------- | ----------------------- | ---------------------------- |
| `enableEffect(type)`        | Enable specific effect  | `type`: string               |
| `disableEffect(type)`       | Disable specific effect | `type`: string               |
| `toggleEffect(type)`        | Toggle specific effect  | `type`: string               |
| `setIntensity(type, value)` | Set effect intensity    | `type`: string, `value`: 0-1 |

### Specialized Functions

| Function                   | Description           | Parameters       |
| -------------------------- | --------------------- | ---------------- |
| `setBloomThreshold(value)` | Set bloom threshold   | `value`: 0-2     |
| `setBloomRadius(value)`    | Set bloom blur radius | `value`: 0.1-5   |
| `setTemperature(value)`    | Set color temperature | `value`: -1 to 1 |
| `setContrast(value)`       | Set contrast          | `value`: -1 to 1 |
| `setSaturation(value)`     | Set saturation        | `value`: -1 to 1 |
| `setBrightness(value)`     | Set brightness        | `value`: -1 to 1 |

### Test Presets

All test functions use **VERY aggressive settings** for maximum visibility:

| Function                    | Description                                    | Aggressive Settings                             |
| --------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| `testBloom()`               | Test bloom with VERY aggressive settings       | intensity: 2.0, threshold: 0.1, radius: 5.0     |
| `testVignette()`            | Test vignette with VERY aggressive settings    | intensity: 1.0, radius: 0.4, feather: 0.2       |
| `testChromaticAberration()` | Test chromatic aberration with VERY aggressive | intensity: 1.0, offset: 0.1                     |
| `testColorGrading()`        | Test color grading with VERY aggressive        | temp: 0.8, contrast: 0.8, sat: 0.6, bright: 0.3 |
| `testFilmGrain()`           | Test film grain with VERY aggressive           | intensity: 1.0                                  |
| `testGlitch()`              | Test glitch with VERY aggressive               | intensity: 1.0                                  |
| `testAll()`                 | Activate cinematic preset (moderate settings)  | Balanced combination for cinematic look         |

### Info Functions

| Function   | Description          |
| ---------- | -------------------- |
| `status()` | Show detailed status |
| `help()`   | Show help message    |

## Notes

- All settings are persisted to `localStorage` automatically
- Effects are added/removed from the pipeline dynamically
- The system uses lazy initialization (effects only created when needed)
- Post-processing runs in a separate render stage after the main scene render
- Effects are ordered alphabetically in the pipeline

## Examples

### Minimal Bloom Setup

```javascript
window.__postProcessingDebug.enable();
window.__postProcessingDebug.enableEffect('bloom');
window.__postProcessingDebug.setIntensity('bloom', 1.0);
window.__postProcessingDebug.setBloomThreshold(0.3);
```

### Full Cinematic Look

```javascript
window.__postProcessingDebug.testAll();
```

### Custom Subtle Look

```javascript
window.__postProcessingDebug.enable();
window.__postProcessingDebug.enableEffect('vignette');
window.__postProcessingDebug.setIntensity('vignette', 0.3);
window.__postProcessingDebug.enableEffect('color-grading');
window.__postProcessingDebug.setTemperature(0.1);
window.__postProcessingDebug.setContrast(0.1);
```

---

**Last Updated:** 2024
**Version:** 1.0
