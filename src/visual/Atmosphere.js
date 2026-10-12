import { ERAS } from '../config/eras.js';

/**
 * Atmosphere.js - 时代天空盒、环境体积雾与动态光照色温管理器
 */
export class Atmosphere {
  constructor(scene, sceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    this.currentEraId = 2; // 默认中世纪

    // 初始化环境雾
    this.scene.fog = new THREE.FogExp2(0x182825, 0.008);

    // 天空渐变半球背景
    this.initSkyDome();

    // 应用初始时代
    this.setEra(2, false);
  }

  initSkyDome() {
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;

    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x6495ED) },
      bottomColor: { value: new THREE.Color(0xdbeafe) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };

    const skyGeo = new THREE.SphereGeometry(450, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.skyUniforms,
      side: THREE.BackSide
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);
  }

  setEra(eraId, animate = true) {
    const era = ERAS.find(e => e.id === eraId) || ERAS[1];
    this.currentEraId = eraId;

    const targetSky = new THREE.Color(era.skyColor);
    const targetFog = new THREE.Color(era.fogColor);

    if (!animate) {
      this.skyUniforms.topColor.value.copy(targetSky);
      this.scene.fog.color.copy(targetFog);
      this.scene.background = targetFog;
      return;
    }

    // 简单平滑渐变
    const startSky = this.skyUniforms.topColor.value.clone();
    const startFog = this.scene.fog.color.clone();
    const duration = 1.0;
    let elapsed = 0;

    const transitionInterval = setInterval(() => {
      elapsed += 0.05;
      const progress = Math.min(1.0, elapsed / duration);
      this.skyUniforms.topColor.value.lerpColors(startSky, targetSky, progress);
      this.scene.fog.color.lerpColors(startFog, targetFog, progress);
      this.scene.background = this.scene.fog.color;
      if (progress >= 1.0) {
        clearInterval(transitionInterval);
      }
    }, 50);
  }
}
