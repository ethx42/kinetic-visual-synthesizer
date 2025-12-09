/**
 * Film Grain Post-Processing Effect
 * High-quality film grain/noise overlay
 * Creates cinematic texture
 */

import {
	WebGLRenderer,
	WebGLRenderTarget,
	RawShaderMaterial,
	BufferGeometry,
	BufferAttribute,
	Mesh,
	Scene,
	OrthographicCamera,
	Sphere,
	Box3,
	Vector3,
	Vector2
} from 'three';
import { BasePostProcessingEffect, type EffectUniforms } from '../entities/PostProcessingEffect';
import filmGrainVert from '$shaders/postprocessing/film-grain.vert.glsl?raw';
import filmGrainFrag from '$shaders/postprocessing/film-grain.frag.glsl?raw';

/**
 * Creates a fullscreen quad geometry for post-processing passes
 */
function createFullscreenQuad(): BufferGeometry {
	const geometry = new BufferGeometry();
	const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
	const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
	geometry.setAttribute('position', new BufferAttribute(vertices, 2));
	geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
	geometry.setIndex([0, 1, 2, 2, 1, 3]);

	geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), Math.SQRT2);
	geometry.boundingBox = new Box3(new Vector3(-1, -1, 0), new Vector3(1, 1, 0));
	geometry.computeBoundingSphere = () => {};
	geometry.computeBoundingBox = () => {};

	return geometry;
}

/**
 * FilmGrainEffect - Film grain texture overlay
 */
export class FilmGrainEffect extends BasePostProcessingEffect {
	readonly name = 'FilmGrainEffect';

	private _scene: Scene | null = null;
	private _camera: OrthographicCamera | null = null;
	private _mesh: Mesh | null = null;
	private _geometry: BufferGeometry | null = null;

	constructor() {
		super();
		this.intensity = 0.3;
	}

	initialize(renderer: WebGLRenderer): void {
		if (this._initialized) {
			return;
		}

		this._geometry = createFullscreenQuad();

		this.material = new RawShaderMaterial({
			vertexShader: filmGrainVert,
			fragmentShader: filmGrainFrag,
			uniforms: {
				uInputTexture: { value: null },
				uIntensity: { value: this.intensity },
				uTime: { value: 0.0 },
				uResolution: { value: new Vector2(renderer.domElement.width, renderer.domElement.height) }
			},
			depthTest: false,
			depthWrite: false
		});

		this._mesh = new Mesh(this._geometry, this.material);
		this._mesh.frustumCulled = false;

		this._scene = new Scene();
		this._scene.add(this._mesh);

		this._camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

		this._initialized = true;
	}

	render(
		renderer: WebGLRenderer,
		inputTarget: WebGLRenderTarget,
		outputTarget: WebGLRenderTarget | null
	): void {
		if (!this._initialized || !this.material || !this._scene || !this._camera) {
			return;
		}

		if (!this.enabled) {
			if (outputTarget) {
				renderer.setRenderTarget(outputTarget);
				renderer.clear();
			}
			return;
		}

		this.material.uniforms.uInputTexture.value = inputTarget.texture;

		renderer.setRenderTarget(outputTarget);
		if (outputTarget === null) {
			renderer.clear();
		}
		renderer.render(this._scene, this._camera);
	}

	updateUniforms(uniforms: EffectUniforms): void {
		if (!this.material) {
			return;
		}

		this.material.uniforms.uIntensity.value = this.enabled ? this.intensity : 0.0;
		this.material.uniforms.uTime.value = uniforms.uTime;
		this.material.uniforms.uResolution.value.set(uniforms.uResolution[0], uniforms.uResolution[1]);
	}

	dispose(): void {
		if (this._mesh && this._scene) {
			this._scene.remove(this._mesh);
		}

		if (this._geometry) {
			this._geometry.dispose();
			this._geometry = null;
		}

		this._mesh = null;
		this._scene = null;
		this._camera = null;

		super.dispose();
	}
}
