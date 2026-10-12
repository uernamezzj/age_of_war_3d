/**
 * BattleCameraController.js - 2.5D 经典横版卷轴机位 (1:1 映射 CameraPan.cs 及 CameraZoom.cs)
 * 支持：鼠标下半屏抓取左右平移拖拽、屏幕边缘自动卷轴巡航、滚轮缩放
 */

export class BattleCameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // 巡航边界 (X 轴在 -22 到 22 之间)
    this.minX = -20;
    this.maxX = 20;

    // 当前摄影机聚焦点 (开局对准我方基地)
    this.currentX = -13;
    this.baseY = 5.2;
    this.baseZ = 15.5;
    this.lookAtY = 1.5; // 角色胸膛自然中心线 (近摄特写更自然)

    // 缩放系数 (大幅拓宽缩放阈值：0.25 极近特写微距 ~ 3.0 超广角鸟瞰全图)
    this.zoom = 1.0;

    // 交互参数 (对应 CameraPan.cs)
    this.edgeThreshold = 180; // 边缘卷轴阈值 (px)
    this.edgeSpeed = 16.0;
    this.dragSensitivity = 0.035;

    this.isDragging = false;
    this.lastMouseX = 0;
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;

    // 震屏参数 (1:1 映射 CameraShake.cs)
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    BattleCameraController.instance = this;
    window.battleCameraController = this;

    this.initEvents();
    this.updatePosition();
  }

  initEvents() {
    this.domElement.addEventListener('mousedown', (e) => {
      // 仅在屏幕下半部 75% 区域允许拖动 (避开顶部 HUD)
      if (e.clientY > window.innerHeight * 0.18) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
      }
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (this.isDragging) {
        const deltaX = e.clientX - this.lastMouseX;
        // 拖拽向右划，镜头往左推
        this.pan(-deltaX * this.dragSensitivity * this.zoom);
        this.lastMouseX = e.clientX;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // 滚轮缩放
    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.001;
      this.zoom = Math.max(0.25, Math.min(3.0, this.zoom + zoomDelta));
      this.updatePosition();
    }, { passive: false });
  }

  pan(deltaX) {
    this.currentX = Math.max(this.minX, Math.min(this.maxX, this.currentX + deltaX));
    this.updatePosition();
  }

  // 触发镜头震颤 (1:1 映射 CameraShake.cs Shake)
  shake(duration = 0.6, intensity = 0.35) {
    this.shakeDuration = duration;
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  update(dt) {
    // 处于防御塔出售模式时暂停边缘推屏，便于玩家精确点选基地防御塔
    if (window.uiManager && window.uiManager.isSellingMode) {
      return;
    }

    // 边缘推屏 (Edge scroll)
    if (!this.isDragging && this.mouseY > window.innerHeight * 0.18) {
      if (this.mouseX < this.edgeThreshold) {
        const t = Math.max(0, 1 - this.mouseX / this.edgeThreshold);
        this.pan(-this.edgeSpeed * Math.pow(t, 2) * dt);
      } else if (this.mouseX > window.innerWidth - this.edgeThreshold) {
        const t = Math.max(0, 1 - (window.innerWidth - this.mouseX) / this.edgeThreshold);
        this.pan(this.edgeSpeed * Math.pow(t, 2) * dt);
      }
    }

    // 屏幕震颤衰减
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      this.updatePosition();
    }
  }

  updatePosition() {
    let offX = 0;
    let offY = 0;
    if (this.shakeTimer > 0 && this.shakeDuration > 0) {
      const decay = this.shakeTimer / this.shakeDuration;
      const mag = this.shakeIntensity * decay;
      offX = (Math.random() - 0.5) * 2 * mag;
      offY = (Math.random() - 0.5) * 2 * mag;
    }

    this.camera.position.set(
      this.currentX + offX,
      this.baseY * this.zoom + offY,
      this.baseZ * this.zoom
    );
    this.camera.lookAt(this.currentX + offX, this.lookAtY + offY, 0);
  }
}
