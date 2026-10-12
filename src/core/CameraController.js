/**
 * CameraController.js - 多机位调度与横版平移巡航系统
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // 当前机位模式：'side' | 'top' | 'orbit' | 'base_player' | 'base_enemy'
    this.mode = 'side';

    // 目标跟踪中心 (X 轴主推进范围 [-75, 75])
    this.targetX = -45;
    this.targetY = 2;
    this.targetZ = 0;

    // 当前平滑插值中心
    this.currentLookAt = new THREE.Vector3(0, 2, 0);

    // 经典横版视角基础偏移量
    this.sideOffset = new THREE.Vector3(0, 18, 38);
    this.zoomLevel = 1.0; // 滚轮缩放倍率 (0.6 ~ 1.8)

    // 自由轨道控制器 (用于 orbit 模式)
    this.orbitControls = new THREE.OrbitControls(this.camera, this.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.enabled = false;

    // 拖拽与按键交互状态
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.keysPressed = {};

    this.initEvents();
    this.setMode('side');
  }

  initEvents() {
    // 鼠标拖拽平移
    this.domElement.addEventListener('mousedown', (e) => {
      if (this.mode === 'orbit') return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || this.mode === 'orbit') return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      // 屏幕水平拖动映射到战场 X 轴移动
      this.pan(-deltaX * 0.12 * this.zoomLevel);
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // 滚轮推拉视距
    this.domElement.addEventListener('wheel', (e) => {
      if (this.mode === 'orbit') return;
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.001;
      this.zoomLevel = Math.max(0.25, Math.min(3.0, this.zoomLevel + zoomDelta));
    }, { passive: false });

    // 键盘巡航 (A / D 或 方向键)
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });
  }

  pan(deltaX) {
    this.targetX = Math.max(-75, Math.min(75, this.targetX + deltaX));
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'orbit') {
      this.orbitControls.enabled = true;
      this.orbitControls.target.set(this.targetX, this.targetY, this.targetZ);
    } else {
      this.orbitControls.enabled = false;
      if (mode === 'base_player') {
        this.targetX = -60;
      } else if (mode === 'base_enemy') {
        this.targetX = 60;
      } else if (mode === 'frontline') {
        this.targetX = 0;
      }
    }
  }

  update(deltaTime) {
    const dt = Math.min(deltaTime, 0.1);

    // 键盘持续推屏
    const panSpeed = 45 * dt * this.zoomLevel;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) {
      this.pan(-panSpeed);
    }
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) {
      this.pan(panSpeed);
    }

    if (this.mode === 'orbit') {
      this.orbitControls.update();
      return;
    }

    // 根据模式计算目标相机位置
    let desiredCamPos = new THREE.Vector3();
    let desiredLookAt = new THREE.Vector3(this.targetX, this.targetY, this.targetZ);

    if (this.mode === 'top') {
      // 战术俯瞰鸟瞰
      desiredCamPos.set(this.targetX, 65 * this.zoomLevel, 6);
    } else {
      // 经典横版视角 (Side) 或 基地特写
      desiredCamPos.set(
        this.targetX,
        this.sideOffset.y * this.zoomLevel,
        this.sideOffset.z * this.zoomLevel
      );
    }

    // 平滑缓动 (Lerp)
    this.camera.position.lerp(desiredCamPos, dt * 7.0);
    this.currentLookAt.lerp(desiredLookAt, dt * 7.0);
    this.camera.lookAt(this.currentLookAt);
  }
}
