/**
 * Vector math utilities
 * Pre-allocated vectors for zero-garbage loops
 */
import * as THREE from 'three';

// Pre-allocated vectors (reused, never recreated)
export const tempVec3 = new THREE.Vector3();
export const tempVec2 = new THREE.Vector2();

/**
 * Calculate Euclidean distance between two 3D points
 * Uses pre-allocated temp vectors to avoid garbage
 */
export function distance3D(
	x1: number,
	y1: number,
	z1: number,
	x2: number,
	y2: number,
	z2: number
): number {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const dz = z2 - z1;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * GLSL smoothstep equivalent
 * Returns smooth interpolation between edge0 and edge1
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}
