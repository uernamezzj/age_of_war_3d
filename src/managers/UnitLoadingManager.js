/**
 * UnitLoadingManager.js - 出兵训练队列管理器 (1:1 映射 AgeOfWarRemake/Assets/Scripts/UI/Menu/UnitLoadingMenu.cs)
 * 管理 5 格方形排队缓冲队列 + 当前单位训练充能滑动进度条
 */

export class UnitLoadingManager {
  constructor(maxSlots = 5, onSpawnUnitCallback) {
    this.maxSlots = maxSlots;
    this.onSpawnUnit = onSpawnUnitCallback;

    // 队列中等待训练的单位数据 [{ config, duration, callback }]
    this.queue = [];

    // 当前正在训练的单位信息
    this.currentSpawnTime = null;
    this.currentCallback = null;
    this.currentUnitConfig = null;
    this.progressAcc = 0; // 累积训练时间
  }

  // 尝试加入训练队列
  enqueue(unitConfig) {
    if (this.queue.length >= this.maxSlots) {
      return false; // 队列已满 (5个)
    }

    this.queue.push({
      config: unitConfig,
      duration: unitConfig.spawnTime || 1.0,
      callback: () => {
        if (this.onSpawnUnit) {
          this.onSpawnUnit(unitConfig);
        }
      }
    });

    return true;
  }

  update(dt) {
    if (this.currentSpawnTime === null) {
      if (this.queue.length === 0) return;
      // 取出队首开始训练
      const next = this.queue[0];
      this.currentSpawnTime = next.duration;
      this.currentCallback = next.callback;
      this.currentUnitConfig = next.config;
      this.progressAcc = 0;
    }

    this.progressAcc += dt;

    if (this.progressAcc >= this.currentSpawnTime) {
      // 训练完成，出生下场
      if (this.currentCallback) {
        this.currentCallback();
      }
      this.queue.shift(); // 移出队首
      this.currentSpawnTime = null;
      this.currentCallback = null;
      this.currentUnitConfig = null;
      this.progressAcc = 0;
    }
  }

  // 获取当前训练进度 0.0 ~ 1.0 (用于 UI 充能条渲染)
  getProgress() {
    if (this.currentSpawnTime === null || this.currentSpawnTime <= 0) return 0;
    return Math.min(1.0, this.progressAcc / this.currentSpawnTime);
  }

  // 获取队列中总等待单位数 (0 ~ 5)
  getQueueLength() {
    return this.queue.length;
  }

  // 清空训练队列
  clear() {
    this.queue = [];
    this.currentSpawnTime = null;
    this.currentCallback = null;
    this.currentUnitConfig = null;
    this.progressAcc = 0;
  }
}
