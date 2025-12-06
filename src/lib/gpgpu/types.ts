/**
 * GPGPU type definitions
 * Defines interfaces for FBO management, texture formats, etc.
 */
import type { WebGLRenderTarget } from 'three';

export interface GPGPUConfig {
	width: number;
	height: number;
	particleCount: number;
}

export interface GPGPUBuffers {
	position: WebGLRenderTarget;
	velocity: WebGLRenderTarget;
}
