# Performance Fallback System

Enterprise-grade performance monitoring and adaptation system following Clean Architecture principles.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  PerformanceMonitor.svelte (Component Integration)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    APPLICATION LAYER                       │
│  PerformanceManager (Orchestration, Business Logic)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    DOMAIN LAYER                             │
│  - PerformanceProfile (Entities)                          │
│  - PerformanceAnalyzer (Domain Services)                   │
│  - IDegradationStrategy (Strategies)                       │
└─────────────────────────────────────────────────────────────┘
```

## Design Patterns

1. **Strategy Pattern**: Degradation strategies are interchangeable
2. **Observer Pattern**: Reactive stores for state management
3. **Facade Pattern**: PerformanceMonitor simplifies complex API
4. **Dependency Injection**: All dependencies injected via constructor

## Usage

### Basic Integration

Add the `PerformanceMonitor` component to your main app:

```svelte
<script>
	import PerformanceMonitor from '$lib/performance';
</script>

<!-- Your app content -->
<YourApp />

<!-- Performance monitoring (runs in background) -->
<PerformanceMonitor />
```

### Custom Configuration

```svelte
<script>
	import PerformanceMonitor from '$lib/performance';
	import type { PerformanceThresholds } from '$lib/performance';

	const customThresholds: PerformanceThresholds = {
		excellent: { fps: 60, frameTime: 16.67 },
		good: { fps: 50, frameTime: 20 },
		poor: { fps: 30, frameTime: 33.33 }
	};
</script>

<PerformanceMonitor
	thresholds={customThresholds}
	samplingInterval={2000}
	enableDebugLogging={true}
	autoStart={true}
/>
```

### Programmatic Usage

```typescript
import { PerformanceManager } from '$lib/performance/application/PerformanceManager';
import { PerformanceAnalyzer } from '$lib/performance/domain/services/PerformanceAnalyzer';
import { ReduceParticleCountStrategy } from '$lib/performance/domain/strategies';
import { particleCount } from '$lib/stores/settings';
import { fps } from '$lib/stores/telemetry';

const analyzer = new PerformanceAnalyzer({
	excellent: { fps: 58, frameTime: 17 },
	good: { fps: 45, frameTime: 22 },
	poor: { fps: 30, frameTime: 33 }
});

const context = {
	particleCount
	// ... other stores
};

const manager = new PerformanceManager(analyzer, context);
manager.registerStrategy(new ReduceParticleCountStrategy());
manager.start();
```

## Degradation Strategies

### 1. ReduceParticleCountStrategy

- **Priority**: 1 (highest - applied first)
- **Behavior**: Gradually reduces particle count in 8 steps (~20% per step)
- **Minimum**: 200,000 particles
- **Reversible**: Yes, step-by-step

### 2. DisablePostProcessingStrategy

- **Priority**: 2
- **Behavior**: Disables all post-processing effects
- **Reversible**: Yes

### 3. ReduceQualityStrategy

- **Priority**: 3 (lowest - applied last)
- **Behavior**: Reduces quality level in 4 steps (100% → 75% → 50% → 25%)
- **Reversible**: Yes, step-by-step

## Performance Levels

- **EXCELLENT**: FPS ≥ 58, FrameTime ≤ 17ms
- **GOOD**: FPS ≥ 45, FrameTime ≤ 22ms
- **ACCEPTABLE**: FPS ≥ 30, FrameTime ≤ 33ms
- **POOR**: FPS ≥ 20, FrameTime ≤ 50ms
- **CRITICAL**: FPS < 20, FrameTime > 50ms

## Degradation Triggers

- **Degrade**: Requires 3+ consecutive frames with POOR or CRITICAL performance
- **Upgrade**: Requires 10+ consecutive frames with EXCELLENT or GOOD performance AND current FPS ≥ 55

## Clean Code Principles

✅ **Single Responsibility**: Each class has one reason to change  
✅ **Open/Closed**: Open for extension (new strategies), closed for modification  
✅ **Dependency Inversion**: Depend on abstractions (interfaces), not concretions  
✅ **Interface Segregation**: Small, focused interfaces  
✅ **DRY**: No code duplication

## Enterprise Features

- ✅ Comprehensive error handling
- ✅ Configurable thresholds
- ✅ Debug logging (dev mode)
- ✅ Lifecycle management
- ✅ Strategy pattern for extensibility
- ✅ Clean Architecture separation
- ✅ TypeScript strict mode
- ✅ JSDoc documentation
