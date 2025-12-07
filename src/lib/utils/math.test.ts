import { describe, it, expect } from 'vitest';
import { smoothstep, distance3D } from './math';

describe('Math Utils', () => {
	describe('smoothstep', () => {
		it('should return 0 when x is less than edge0', () => {
			expect(smoothstep(0, 1, -0.5)).toBe(0);
		});

		it('should return 1 when x is greater than edge1', () => {
			expect(smoothstep(0, 1, 1.5)).toBe(1);
		});

		it('should interpolate correctly between edges', () => {
			expect(smoothstep(0, 1, 0.5)).toBe(0.5);
			// smoothstep(0.5) = 0.5 * 0.5 * (3 - 2 * 0.5) = 0.25 * 2 = 0.5
		});
	});

	describe('distance3D', () => {
		it('should calculate distance between two points', () => {
			const dist = distance3D(0, 0, 0, 3, 4, 0);
			expect(dist).toBe(5);
		});

		it('should handle negative coordinates', () => {
			const dist = distance3D(-1, -1, -1, 1, 1, 1);
			// sqrt(2^2 + 2^2 + 2^2) = sqrt(12) approx 3.464
			expect(dist).toBeCloseTo(Math.sqrt(12));
		});
	});
});
