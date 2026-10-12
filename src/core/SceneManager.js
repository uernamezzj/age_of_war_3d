/**
 * SceneManager.js - Three.js 核心场景、渲染器、主光照与环境管理
 */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    
    // 渲染器初始化
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // 默认透视相机
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.5,
      1000
    );

    // 光照系统
    this.initLights();

    // 窗口尺寸自适应监听
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initLights() {
    // 1. 环境光（柔和基础照度）
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(this.ambientLight);

    // 2. 主平行光（太阳光，覆盖 160 米推线长廊）
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    this.sunLight.position.set(30, 60, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 180;
    
    // 正交视锥覆盖整个 160 米战区
    const d = 95;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = 40;
    this.sunLight.shadow.camera.bottom = -40;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // 3. 辅助侧逆冷补光（增强立体轮廓）
    this.fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.45);
    this.fillLight.position.set(-40, 25, -35);
    this.scene.add(this.fillLight);

    // 4. 地面半球光（天蓝与地土反射）
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x334155, 0.35);
    this.scene.add(this.hemiLight);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
