/**
 * Performance Module
 * Enterprise-grade performance monitoring and adaptation system
 *
 * Clean Architecture:
 * - Domain: Entities, Services, Strategies
 * - Application: Use Cases, Managers
 * - Presentation: Components
 */

/**
 * Performance Module Public API
 * Enterprise-grade performance monitoring and adaptation system
 *
 * Clean Architecture:
 * - Domain: Entities, Services, Strategies
 * - Application: Use Cases, Managers
 * - Presentation: Components
 *
 * Design Patterns:
 * - Strategy Pattern: Interchangeable degradation strategies
 * - Factory Pattern: Centralized creation of entities
 * - Facade Pattern: Simplified API for components
 */

// Domain Layer Exports
export * from './domain';

// Application Layer Exports
export * from './application';

// Presentation Layer Exports
export { default as PerformanceMonitor } from './presentation/PerformanceMonitor.svelte';
