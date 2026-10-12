// 5 大时代城堡要塞规范比例与炮塔插槽锚点配置表 (100% 严丝合缝对齐真实 3D 几何顶面)
export const BASE_ERA_SPECS = {
  "1": {
    "scale": 1,
    "slotOffsets": [
      {
        "x": 0.27,
        "y": 1.26,
        "z": 0.62,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.19,
        "y": 2.86,
        "z": 0.36,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.25,
        "y": 4.3,
        "z": 0.58,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.27,
        "y": 5.35,
        "z": 0.55,
        "rotationY": 0,
        "scale": 1
      }
    ],
    "expansionOffsets": {
      "Expansion1": {
        "x": 0.02,
        "y": -0.73,
        "z": 0
      },
      "Expansion2": {
        "x": 0,
        "y": -0.73,
        "z": 0
      },
      "Expansion3": {
        "x": 0,
        "y": -0.83,
        "z": 0
      }
    }
  },
  "2": {
    "scale": 1.1,
    "slotOffsets": [
      {
        "x": 0.41,
        "y": 3.64,
        "z": 0.93,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.46,
        "y": 4.75,
        "z": 0.82,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.5,
        "y": 5.38,
        "z": 0.88,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.54,
        "y": 6.61,
        "z": 0.85,
        "rotationY": 0,
        "scale": 1
      }
    ],
    "expansionOffsets": {
      "Expansion1": {
        "x": 0.01,
        "y": -0.12,
        "z": 0
      },
      "Expansion2": {
        "x": 0,
        "y": -0.24,
        "z": 0
      },
      "Expansion3": {
        "x": 0.01,
        "y": -0.37,
        "z": 0
      },
      "Base": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    }
  },
  "3": {
    "scale": 6.2,
    "slotOffsets": [
      {
        "x": 1.05,
        "y": 3.61,
        "z": 1,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 1.05,
        "y": 4.78,
        "z": 1,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 1.05,
        "y": 5.86,
        "z": 1,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 1.05,
        "y": 7.17,
        "z": 0.92,
        "rotationY": 0,
        "scale": 1
      }
    ],
    "expansionOffsets": {
      "Expansion1": {
        "x": 0.054,
        "y": -0.037,
        "z": 0.004
      },
      "Expansion2": {
        "x": 0.05,
        "y": -0.044,
        "z": 0
      },
      "Expansion3": {
        "x": 0.058,
        "y": -0.043,
        "z": 0.008
      },
      "Base3": {
        "x": 0.042,
        "y": -0.019,
        "z": 0
      }
    }
  },
  "4": {
    "scale": 1.1,
    "slotOffsets": [
      {
        "x": 1.25,
        "y": 2.78,
        "z": 1.63,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 1.25,
        "y": 4.52,
        "z": 0.99,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 1.25,
        "y": 6.11,
        "z": 0.83,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 1.31,
        "y": 7.24,
        "z": 0.67,
        "rotationY": 0,
        "scale": 1
      }
    ],
    "expansionOffsets": {
      "Expansion1": {
        "x": 0,
        "y": 0,
        "z": 0
      },
      "Expansion2": {
        "x": 0,
        "y": 0,
        "z": 0
      },
      "Expansion3": {
        "x": 0,
        "y": 0,
        "z": 0
      }
    }
  },
  "5": {
    "scale": 2.2,
    "slotOffsets": [
      {
        "x": 0.39,
        "y": 2.88,
        "z": 0.56,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.36,
        "y": 4.01,
        "z": 0.63,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.2,
        "y": 5.55,
        "z": 0.75,
        "rotationY": 0,
        "scale": 1
      },
      {
        "x": 0.2,
        "y": 6.74,
        "z": 0.8,
        "rotationY": 0,
        "scale": 1
      }
    ],
    "expansionOffsets": {
      "Expansion1": {
        "x": 0,
        "y": -0.085,
        "z": 0
      },
      "Expansion2": {
        "x": 0,
        "y": -0.085,
        "z": 0
      },
      "Expansion3": {
        "x": 0,
        "y": -0.085,
        "z": 0
      }
    }
  }
};

export class Base {
  constructor(config, isPlayer = true, scene) {
    this.config = config;
    this.isPlayer = isPlayer;
    this.scene = scene;

    this.hp = config.maxHp;
    this.maxHp = config.maxHp;
    this.age = config.age || 1;
    this.money = config.startingMoney || 175;
    this.exp = 0;
    this.unlockedExpansions = config.unlockedExpansions || 1;
    this.maxExpansions = config.maxExpansions || 4;

    // 炮塔插槽数据与实体列表 [Turret | null, ...]
    this.turretSlots = [null, null, null, null];

    // 基地世界坐标
    this.position = new THREE.Vector3(isPlayer ? -22 : 22, 0, 0);
    this.mesh = null;
    this.isDead = false;

    // 动态计算基地当前时代的炮塔插槽锚点
    this.updateSlotPositions();
  }

  updateSlotPositions() {
    const spec = BASE_ERA_SPECS[this.age] || BASE_ERA_SPECS[1];
    const dir = this.isPlayer ? 1 : -1;
    this.slotPositions = spec.slotOffsets.map(off => new THREE.Vector3(
      this.position.x + dir * off.x,
      off.y,
      dir * off.z
    ));
  }

  initMesh(templateMesh) {
    this.mesh = templateMesh.clone(true);
    this.mesh.position.copy(this.position);
    // 我方要塞朝 +X (rotation.y = 0)，敌方要塞朝 -X (rotation.y = Math.PI)
    this.mesh.rotation.y = this.isPlayer ? 0 : Math.PI;

    // 自动应用当前时代的标准体型缩放
    const spec = BASE_ERA_SPECS[this.age] || BASE_ERA_SPECS[1];
    this.mesh.scale.setScalar(spec.scale);

    this.mesh.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // 动态应用用户对各级 Expansion 构件配置的相对偏移量 (如前后对齐、高低贴合)
    if (spec.expansionOffsets) {
      this.mesh.traverse((node) => {
        const off = spec.expansionOffsets[node.name];
        if (off) {
          if (!node.userData.initialPos) {
            node.userData.initialPos = node.position.clone();
          }
          node.position.set(
            node.userData.initialPos.x + (off.x || 0),
            node.userData.initialPos.y + (off.y || 0),
            node.userData.initialPos.z + (off.z || 0)
          );
        }
      });
    }

    // 动态控制扩建平台与自带静态炮塔部件的显隐
    this.updateExpansionsVisibility();

    this.scene.add(this.mesh);
  }

  // 根据当前时代与已解锁插槽数动态控制扩建平台/自带网格
  updateExpansionsVisibility() {
    if (!this.mesh) return;

    this.mesh.traverse((node) => {
      const name = node.name || '';

      // 隐藏时代 5 基地自带的占位静态 Turret 部件 (由独立 Turret 实体挂载驱动)
      if (name.startsWith('Turret')) {
        node.visible = false;
        return;
      }

      // 控制 Expansion 升降台显隐:
      // 槽位 1 默认开放 (无需额外升降柱)
      // Expansion1 对应槽位 2 (unlockedExpansions >= 2)
      // Expansion2 对应槽位 3 (unlockedExpansions >= 3)
      // Expansion3 对应槽位 4 (unlockedExpansions >= 4)
      if (name.toLowerCase().includes('expansion')) {
        if (name.includes('1')) {
          node.visible = (this.unlockedExpansions >= 2);
        } else if (name.includes('2')) {
          node.visible = (this.unlockedExpansions >= 3);
        } else if (name.includes('3')) {
          node.visible = (this.unlockedExpansions >= 4);
        } else {
          node.visible = (this.unlockedExpansions >= 2);
        }
      }
    });
  }

  // 进化至下一时代：替换城堡模型，更新最大血量并恢复差额生命，重新挂载炮塔
  evolveTo(newConfig, templateMesh) {
    const oldMaxHp = this.maxHp;
    this.config = newConfig;
    this.age = newConfig.age;
    this.maxHp = newConfig.maxHp;
    // 恢复差额生命值 (1:1 对齐 Base.cs: Mathf.Min(newModel.MaxHp, Model.Value.Hp + (newModel.MaxHp - Model.Value.MaxHp)))
    this.hp = Math.min(this.maxHp, this.hp + (this.maxHp - oldMaxHp));

    // 移除旧要塞模型
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh = null;
    }

    // 关键修复：进化后立即根据新时代的城堡规格更新炮塔插槽锚点位置
    this.updateSlotPositions();

    // 实例化新要塞模型
    if (templateMesh) {
      this.initMesh(templateMesh);
    }

    // 重新挂接已有炮塔至要塞插槽
    for (let i = 0; i < this.turretSlots.length; i++) {
      const turret = this.turretSlots[i];
      if (turret) {
        const spec = BASE_ERA_SPECS[this.age] || BASE_ERA_SPECS[1];
        turret.mount(this.slotPositions[i], this.isPlayer, spec.slotOffsets[i]);
      }
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;
    // 玩家与电脑基地均承受伤害
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.isDead = true;
      // 触发坍塌/爆炸效果
      if (this.mesh) {
        this.mesh.visible = false;
      }
    }
  }

  // 购买/安装炮塔到指定槽位
  installTurret(slotIdx, turretEntity) {
    if (slotIdx >= this.unlockedExpansions) return false;
    // 如果已有不同炮塔，先移除旧炮塔
    if (this.turretSlots[slotIdx] && this.turretSlots[slotIdx] !== turretEntity) {
      this.turretSlots[slotIdx].destroy();
    }
    this.turretSlots[slotIdx] = turretEntity;
    const spec = BASE_ERA_SPECS[this.age] || BASE_ERA_SPECS[1];
    turretEntity.mount(this.slotPositions[slotIdx], this.isPlayer, spec.slotOffsets[slotIdx]);
    return true;
  }

  // 出售指定槽位炮塔
  sellTurret(slotIdx) {
    const turret = this.turretSlots[slotIdx];
    if (!turret) return 0;
    const refund = turret.config.sellPrice;
    turret.destroy();
    this.turretSlots[slotIdx] = null;
    this.money += refund;
    return refund;
  }

  // 解锁下一个防御塔插槽
  unlockNextExpansion(cost) {
    if (this.unlockedExpansions >= this.maxExpansions) return false;
    if (this.money < cost) return false;
    this.money -= cost;
    this.unlockedExpansions++;
    this.updateExpansionsVisibility();
    return true;
  }

  update(dt, nowSec) {
    // 基地被动每秒资金收入
    // 由 GameManager 统一按帧结算
    for (const turret of this.turretSlots) {
      if (turret) {
        turret.update(dt, nowSec);
      }
    }
  }
}
