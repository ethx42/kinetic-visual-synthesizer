/**
 * Vision Module - Main Export Barrel
 * Clean Architecture implementation for MediaPipe hand tracking
 *
 * Architecture:
 * - Domain Layer: Entities, Value Objects, Services
 * - Application Layer: Use Cases, Interfaces
 * - Infrastructure Layer: Adapters, Worker
 * - Presentation Layer: Facade, Components
 */

export * from './domain';
export * from './application';
export * from './infrastructure';
export * from './presentation';

export type { HandLandmarks } from './types';
