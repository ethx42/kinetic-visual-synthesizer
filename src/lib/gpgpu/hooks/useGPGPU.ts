/**
 * GPGPU Hook for Threlte
 * Manages FBO Ping-Pong system for particle simulation
 * Follows "Zero-Garbage" principle: pre-allocates all resources
 */

import { useThrelte } from '@threlte/core';
import {
	WebGLRenderTarget,
	DataTexture,
	RGBAFormat,
	FloatType,
	HalfFloatType,
	NearestFilter,
	ClampToEdgeWrapping,
	BufferGeometry,
	BufferAttribute,
	Scene,
	OrthographicCamera,
	Mesh,
	RawShaderMaterial,
	Sphere,
	Box3,
	Vector3
} from 'three';
import type { GPGPUConfig } from '../types';

/**
 * Initialize Position texture with random particle positions
 * Uniform sphere distribution: particles spread evenly in 3D space
 */
function initializePositionTexture(
	width: number,
	height: number,
	type: typeof FloatType | typeof HalfFloatType
): DataTexture {
	const size = width * height;
	const data = new Float32Array(size * 4); // RGBA: x, y, z, lifetime

	// Uniform sphere distribution
	for (let i = 0; i < size; i++) {
		// Generate random point on unit sphere
		const theta = Math.random() * Math.PI * 2; // Azimuth angle
		const phi = Math.acos(2 * Math.random() - 1); // Polar angle
		const radius = Math.random() * 2.0; // Random radius 0-2

		// Convert spherical to Cartesian coordinates
		const x = radius * Math.sin(phi) * Math.cos(theta);
		const y = radius * Math.sin(phi) * Math.sin(theta);
		const z = radius * Math.cos(phi);

		// Store position (x, y, z) and lifetime (1.0 = full lifetime)
		data[i * 4 + 0] = x;
		data[i * 4 + 1] = y;
		data[i * 4 + 2] = z;
		data[i * 4 + 3] = 1.0; // Lifetime
	}

	const texture = new DataTexture(data, width, height, RGBAFormat, type);
	texture.needsUpdate = true;
	texture.minFilter = NearestFilter;
	texture.magFilter = NearestFilter;
	texture.wrapS = ClampToEdgeWrapping;
	texture.wrapT = ClampToEdgeWrapping;

	return texture;
}

/**
 * Initialize Velocity texture with zero vectors
 */
function initializeVelocityTexture(
	width: number,
	height: number,
	type: typeof FloatType | typeof HalfFloatType
): DataTexture {
	const size = width * height;
	const data = new Float32Array(size * 4); // RGBA: vx, vy, vz, unused

	// All zeros initially
	for (let i = 0; i < size * 4; i++) {
		data[i] = 0.0;
	}

	const texture = new DataTexture(data, width, height, RGBAFormat, type);
	texture.needsUpdate = true;
	texture.minFilter = NearestFilter;
	texture.magFilter = NearestFilter;
	texture.wrapS = ClampToEdgeWrapping;
	texture.wrapT = ClampToEdgeWrapping;

	return texture;
}

/**
 * Create fullscreen quad geometry for GPGPU passes
 * Includes proper UV coordinates for texture sampling
 */
function createFullscreenQuad(): BufferGeometry {
	const geometry = new BufferGeometry();
	// Fullscreen quad vertices: (-1,-1) to (1,1) in clip space
	const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
	// UV coordinates: (0,0) to (1,1)
	const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
	geometry.setAttribute('position', new BufferAttribute(vertices, 2));
	geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
	geometry.setIndex([0, 1, 2, 2, 1, 3]); // Two triangles

	// Create valid bounding sphere and box to prevent null reference errors
	// The quad spans from (-1,-1,0) to (1,1,0), so we use a sphere centered at origin
	// with radius sqrt(2) to encompass all vertices
	geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), Math.SQRT2);
	geometry.boundingBox = new Box3(new Vector3(-1, -1, 0), new Vector3(1, 1, 0));

	// Override compute methods to prevent recalculation (which could cause NaN errors
	// due to 2D vertex positions being interpreted as 3D)
	geometry.computeBoundingSphere = () => {};
	geometry.computeBoundingBox = () => {};

	return geometry;
}

export interface UseGPGPUResult {
	positionTexture: WebGLRenderTarget;
	velocityTexture: WebGLRenderTarget;
	readPosition: () => WebGLRenderTarget;
	readVelocity: () => WebGLRenderTarget;
	writePosition: () => WebGLRenderTarget;
	writeVelocity: () => WebGLRenderTarget;
	swap: () => void;
	dispose: () => void;
}

/**
 * useGPGPU Hook
 * Creates and manages FBO Ping-Pong system for particle simulation
 * Must be called within a Threlte component context
 */
export function useGPGPU(config: GPGPUConfig): UseGPGPUResult {
	const { renderer } = useThrelte();

	// Calculate texture dimensions
	const textureSize = Math.ceil(Math.sqrt(config.particleCount));
	const width = textureSize;
	const height = textureSize;

	// Detect WebGL2 capability
	const gl = renderer.getContext();
	const isWebGL2 = gl instanceof WebGL2RenderingContext;
	const textureType = isWebGL2 ? FloatType : HalfFloatType;

	if (!isWebGL2) {
		console.warn(
			'WebGL2 not available. Using HalfFloatType with reduced precision. Some artifacts may occur.'
		);
	}

	// Create Ping-Pong FBOs for Position
	const positionA = new WebGLRenderTarget(width, height, {
		type: textureType,
		format: RGBAFormat,
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		wrapS: ClampToEdgeWrapping,
		wrapT: ClampToEdgeWrapping,
		depthBuffer: false,
		stencilBuffer: false
	});

	const positionB = new WebGLRenderTarget(width, height, {
		type: textureType,
		format: RGBAFormat,
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		wrapS: ClampToEdgeWrapping,
		wrapT: ClampToEdgeWrapping,
		depthBuffer: false,
		stencilBuffer: false
	});

	// Create Ping-Pong FBOs for Velocity
	const velocityA = new WebGLRenderTarget(width, height, {
		type: textureType,
		format: RGBAFormat,
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		wrapS: ClampToEdgeWrapping,
		wrapT: ClampToEdgeWrapping,
		depthBuffer: false,
		stencilBuffer: false
	});

	const velocityB = new WebGLRenderTarget(width, height, {
		type: textureType,
		format: RGBAFormat,
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		wrapS: ClampToEdgeWrapping,
		wrapT: ClampToEdgeWrapping,
		depthBuffer: false,
		stencilBuffer: false
	});

	// Initialize Position textures with random sphere distribution
	const initialPositionData = initializePositionTexture(width, height, textureType);
	const initialVelocityData = initializeVelocityTexture(width, height, textureType);

	// Copy initial data to FBOs using fullscreen quad
	const quadGeometry = createFullscreenQuad();
	const initScene = new Scene();
	const initCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

	// Initialize Position textures
	// Use RawShaderMaterial to avoid Three.js automatic attribute injection
	const initPositionMaterial = new RawShaderMaterial({
		vertexShader: `
			attribute vec2 position;
			attribute vec2 uv;
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`,
		fragmentShader: `
			precision highp float;
			uniform sampler2D uInitTexture;
			varying vec2 vUv;
			void main() {
				gl_FragColor = texture2D(uInitTexture, vUv);
			}
		`,
		uniforms: {
			uInitTexture: { value: initialPositionData }
		}
	});

	const initPositionMesh = new Mesh(quadGeometry, initPositionMaterial);
	initPositionMesh.frustumCulled = false; // Prevent bounding sphere errors
	initScene.add(initPositionMesh);

	// Save current render target
	const currentRenderTarget = renderer.getRenderTarget();

	// Initialize Position A
	renderer.setRenderTarget(positionA);
	renderer.render(initScene, initCamera);

	// Initialize Position B (copy from A)
	renderer.setRenderTarget(positionB);
	renderer.render(initScene, initCamera);

	// Initialize Velocity textures
	const initVelocityMaterial = new RawShaderMaterial({
		vertexShader: `
			attribute vec2 position;
			attribute vec2 uv;
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`,
		fragmentShader: `
			precision highp float;
			uniform sampler2D uInitTexture;
			varying vec2 vUv;
			void main() {
				gl_FragColor = texture2D(uInitTexture, vUv);
			}
		`,
		uniforms: {
			uInitTexture: { value: initialVelocityData }
		}
	});

	initPositionMesh.material = initVelocityMaterial;

	// Initialize Velocity A
	renderer.setRenderTarget(velocityA);
	renderer.render(initScene, initCamera);

	// Initialize Velocity B (copy from A)
	renderer.setRenderTarget(velocityB);
	renderer.render(initScene, initCamera);

	// Restore previous render target
	renderer.setRenderTarget(currentRenderTarget);

	// Cleanup initialization resources
	initPositionMaterial.dispose();
	initVelocityMaterial.dispose();
	quadGeometry.dispose();
	initialPositionData.dispose();
	initialVelocityData.dispose();
	initScene.remove(initPositionMesh);

	// Ping-Pong state
	let positionRead = positionA;
	let positionWrite = positionB;
	let velocityRead = velocityA;
	let velocityWrite = velocityB;

	// Swap function for ping-pong
	const swap = () => {
		const tempPos = positionRead;
		positionRead = positionWrite;
		positionWrite = tempPos;

		const tempVel = velocityRead;
		velocityRead = velocityWrite;
		velocityWrite = tempVel;
	};

	// Return current read textures (for particle rendering)
	const readPosition = () => positionRead;
	const readVelocity = () => velocityRead;

	// Return current write textures (for simulation rendering)
	const writePosition = () => positionWrite;
	const writeVelocity = () => velocityWrite;

	// Cleanup function
	const dispose = () => {
		positionA.dispose();
		positionB.dispose();
		velocityA.dispose();
		velocityB.dispose();
	};

	return {
		positionTexture: positionRead, // Expose read texture for initial render
		velocityTexture: velocityRead,
		readPosition,
		readVelocity,
		writePosition,
		writeVelocity,
		swap,
		dispose
	};
}

