/**
 * Color Grading Post-Processing Effect
 * High-quality color adjustment (temperature, contrast, saturation, brightness)
 * Creates cinematic color grading
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
import colorGradingVert from '$shaders/postprocessing/color-grading.vert.glsl?raw';
import colorGradingFrag from '$shaders/postprocessing/color-grading.frag.glsl?raw';

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
 * ColorGradingEffect - Color adjustment for cinematic look
 */
export class ColorGradingEffect extends BasePostProcessingEffect {
	readonly name = 'ColorGradingEffect';

	private _scene: Scene | null = null;
	private _camera: OrthographicCamera | null = null;
	private _mesh: Mesh | null = null;
	private _geometry: BufferGeometry | null = null;

	// Color grading-specific parameters
	public temperature: number = 0.0; // -1.0 (cool) to 1.0 (warm)
	public contrast: number = 0.0; // -1.0 to 1.0
	public saturation: number = 0.0; // -1.0 (desaturated) to 1.0 (saturated)
	public brightness: number = 0.0; // -1.0 to 1.0

	constructor() {
		super();
		this.intensity = 1.0;
	}

	initialize(renderer: WebGLRenderer): void {
		if (this._initialized) {
			return;
		}

		this._geometry = createFullscreenQuad();

		this.material = new RawShaderMaterial({
			vertexShader: colorGradingVert,
			fragmentShader: colorGradingFrag,
			uniforms: {
				uInputTexture: { value: null },
				uIntensity: { value: this.intensity },
				uTemperature: { value: this.temperature },
				uContrast: { value: this.contrast },
				uSaturation: { value: this.saturation },
				uBrightness: { value: this.brightness },
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
		this.material.uniforms.uTemperature.value = this.temperature;
		this.material.uniforms.uContrast.value = this.contrast;
		this.material.uniforms.uSaturation.value = this.saturation;
		this.material.uniforms.uBrightness.value = this.brightness;
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
