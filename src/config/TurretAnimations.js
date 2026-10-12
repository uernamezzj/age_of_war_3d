/**

 * TurretAnimations.js - 全时代 15 款防御塔攻击动画与打击节奏配置库

 * 1:1 完整复刻 Unity 原版 (AgeOfWarRemake/Assets/Resources/Animations/turret_*_attack.anim)

 * 包含精确关键帧插值曲线、PlaySound 音效时机、SpawnBullet 发射时机与子弹槽隐现逻辑

 */



// 辅助函数：在一维按时间排序的 keyframes 中进行线性插值

function interpolateKeys(keys, t, prop) {

  if (!keys || keys.length === 0) return 0;

  if (t <= keys[0].t) return keys[0][prop];

  if (t >= keys[keys.length - 1].t) return keys[keys.length - 1][prop];



  for (let i = 0; i < keys.length - 1; i++) {

    const k0 = keys[i];

    const k1 = keys[i + 1];

    if (t >= k0.t && t <= k1.t) {

      const dt = k1.t - k0.t;

      if (dt <= 0.0001) return k0[prop];

      const alpha = (t - k0.t) / dt;

      return k0[prop] + (k1[prop] - k0[prop]) * alpha;

    }

  }

  return keys[keys.length - 1][prop];

}



// 辅助函数：角度按最短圆弧平滑插值 (度转弧度)

function degToRad(deg) {

  return deg * (Math.PI / 180.0);

}



export const TURRET_ANIMATIONS = {

  'turret_1_1': {

    id: 'turret_1_1',

    duration: 1.3333,

    soundName: 'knight_range_attack',

    soundEvents: [{"t": 0.0, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.5667, "func": "SpawnBullet"}],

    ammoPartName: "rock",

    eulers: [{"path": "band_armature/Band_R/Band_M", "keys": [{"t": 0.0, "x": 0.0, "y": 0.0, "z": 26.597}, {"t": 1.1, "x": 0.0, "y": 0.0, "z": 42.329}]}, {"path": "band_armature/Band_R", "keys": [{"t": 0.0, "x": 90.0, "y": 0.0, "z": -57.025}, {"t": 0.3, "x": 90.0, "y": 0.0, "z": -57.025}, {"t": 0.5, "x": 90.0, "y": 0.0, "z": -90.655}, {"t": 0.6333, "x": 90.0, "y": 0.0, "z": -164.368}, {"t": 1.3333, "x": 90.0, "y": 0.0, "z": -81.017}]}],

    positions: [{"path": "band_armature/Band_R", "keys": [{"t": 0.0, "x": -0.0, "y": 0.0, "z": -0.0}, {"t": 0.3, "x": -0.0, "y": 0.0, "z": -0.0}, {"t": 0.5, "x": -0.0002, "y": 0.0, "z": 0.0001}, {"t": 0.6333, "x": -0.0003, "y": 0.0, "z": 0.0005}, {"t": 0.8333, "x": -0.0003, "y": 0.0, "z": 0.0004}, {"t": 1.0, "x": -0.0003, "y": 0.0, "z": 0.0003}, {"t": 1.1667, "x": -0.0002, "y": 0.0001, "z": 0.0001}, {"t": 1.3333, "x": -0.0002, "y": 0.0, "z": 0.0001}]}, {"path": "band_armature/Band_R/Band_M", "keys": [{"t": 0.0, "x": 0.0004, "y": 0.0007, "z": 0.0}, {"t": 0.3, "x": 0.0004, "y": 0.0008, "z": 0.0}, {"t": 0.4, "x": 0.0003, "y": 0.0008, "z": 0.0}, {"t": 0.4333, "x": 0.0003, "y": 0.0007, "z": 0.0}, {"t": 0.4667, "x": 0.0002, "y": 0.0006, "z": 0.0}, {"t": 0.5, "x": 0.0001, "y": 0.0005, "z": 0.0}, {"t": 0.5333, "x": 0.0001, "y": 0.0004, "z": 0.0}, {"t": 0.6333, "x": 0.0002, "y": 0.0004, "z": 0.0}, {"t": 1.1, "x": 0.0003, "y": 0.0006, "z": 0.0}, {"t": 1.3333, "x": 0.0002, "y": 0.0004, "z": 0.0}]}, {"path": "band_armature/Band_R/Band_M/Band_L", "keys": [{"t": 0.0, "x": -0.0, "y": 0.0002, "z": -0.0}, {"t": 1.3333, "x": -0.0001, "y": 0.0001, "z": -0.0}]}, {"path": "rock", "keys": [{"t": 0.0, "x": 0.2425, "y": 0.0421, "z": 0.0881}, {"t": 0.3, "x": 0.33, "y": 0.0421, "z": 0.086}, {"t": 0.3667, "x": 0.261, "y": 0.0421, "z": 0.1047}, {"t": 0.4, "x": 0.215, "y": 0.0421, "z": 0.1191}, {"t": 0.5, "x": -0.098, "y": 0.0421, "z": 0.1643}, {"t": 0.5333, "x": -0.239, "y": 0.0421, "z": 0.17}]}],



    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体

    applyPose(turret, t, cycleDuration, rawTime) {

      const parts = turret.animatedParts;

      if (!parts) return;



      // 1. 弹药显隐逻辑 (如投石车拉臂蓄力阶段石块在碗中显示，甩出瞬间隐藏)

      if (this.ammoPartName && parts[this.ammoPartName]) {

        const ammoPart = parts[this.ammoPartName];

        const firstBulletTime = this.bulletEvents[0] ? this.bulletEvents[0].t : 0.5;

        // 击发前可见，击发后至本周期结束前隐藏，装填新周期重新可见

        const totalCycle = cycleDuration || this.duration;
        const currentT = rawTime !== undefined ? rawTime : t;
        ammoPart.visible = (currentT < firstBulletTime) || (currentT > totalCycle - 0.4);

      }



      // 2. 局部旋转曲线插值应用

      for (const eu of this.eulers) {

        const part = turret.getPartByPath(eu.path);

        if (!part) continue;



        const xDeg = interpolateKeys(eu.keys, t, 'x');

        const yDeg = interpolateKeys(eu.keys, t, 'y');

        const zDeg = interpolateKeys(eu.keys, t, 'z');



        const initRot = part.userData.initRot || { x: 0, y: 0, z: 0 };



        // 针对特殊炮塔的旋转轴映射

        if ('turret_1_1' === 'turret_2_1' || 'turret_1_1' === 'turret_2_2') {

          // 投石机配重臂主要在局部 Z 轴高速 360° 甩投 (Unity y/z 轴映射)

          const angleDeg = ('turret_1_1' === 'turret_2_1') ? yDeg : zDeg;

          part.rotation.z = initRot.z + degToRad(angleDeg);

        } else if ('turret_1_1' === 'turret_2_3') {

          // 沸油倾泻机倾角

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_1_1'.startsWith('turret_3_')) {

          // 加农炮齿轮后坐角

          if (eu.path.toLowerCase().includes('gear')) {

            part.rotation.x = initRot.x + degToRad(xDeg - 90.0);

          } else {

            part.rotation.x = initRot.x + degToRad(xDeg + 89.944);

          }

        } else if ('turret_1_1' === 'turret_5_2' || 'turret_1_1' === 'turret_5_3') {

          // 磁极聚焦翼张合角度

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_1_1' === 'turret_1_3') {

          // 原始投石臂甩石角

          part.rotation.z = initRot.z + degToRad(xDeg);

        } else if ('turret_1_1' === 'turret_1_2') {

          // 啄木鸟机枪与击锤角

          part.rotation.x = initRot.x + degToRad(xDeg + 89.98);

        } else {

          part.rotation.z = initRot.z + degToRad(zDeg);

        }

      }



      // 3. 局部后坐力位移曲线插值应用

      for (const pos of this.positions) {

        const part = turret.getPartByPath(pos.path);

        if (!part) continue;



        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;

        const deltaY = interpolateKeys(pos.keys, t, 'y') - pos.keys[0].y;

        const deltaZ = interpolateKeys(pos.keys, t, 'z') - pos.keys[0].z;



        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };

        part.position.x = initPos.x + deltaX;

        part.position.y = initPos.y + deltaY;

        part.position.z = initPos.z + deltaZ;

      }

    },



    // 姿态平滑归零恢复至 Idle Rest Pose

    resetPose(turret) {

      const parts = turret.animatedParts;

      if (!parts) return;

      for (const name in parts) {

        const part = parts[name];

        if (!part) continue;

        if (part.userData.initRot) {

          part.rotation.x = part.userData.initRot.x;

          part.rotation.y = part.userData.initRot.y;

          part.rotation.z = part.userData.initRot.z;

        }

        if (part.userData.initPos) {

          part.position.x = part.userData.initPos.x;

          part.position.y = part.userData.initPos.y;

          part.position.z = part.userData.initPos.z;

        }

        part.visible = true;

      }

    }

  },

  'turret_1_2': {

    id: 'turret_1_2',

    duration: 0.2750,

    soundName: 'cave_turret_2_attack',

    soundEvents: [{"t": 0.0, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.125, "func": "SpawnBullet"}],

    ammoPartName: null,

    eulers: [{"path": "bird", "keys": [{"t": 0.0, "x": -89.98, "y": -90.0, "z": 90.0}, {"t": 0.1167, "x": -89.98, "y": -90.0, "z": 90.0}, {"t": 0.1333, "x": -117.745, "y": -90.0, "z": 90.0}, {"t": 0.275, "x": -89.98, "y": -90.0, "z": 90.0}]}, {"path": "hammer", "keys": [{"t": 0.0, "x": -89.98, "y": 90.0, "z": -90.0}, {"t": 0.0833, "x": -74.3, "y": 89.996, "z": -89.991}, {"t": 0.1333, "x": -193.695, "y": 89.994, "z": -90.02}, {"t": 0.275, "x": -89.98, "y": 90.0, "z": -90.0}]}],

    positions: [{"path": "bird", "keys": [{"t": 0.0, "x": -0.2804, "y": 0.0388, "z": -0.0537}, {"t": 0.275, "x": -0.2804, "y": 0.0388, "z": -0.0537}]}, {"path": "hammer", "keys": [{"t": 0.0, "x": 0.3381, "y": 0.0534, "z": -0.028}, {"t": 0.275, "x": 0.3381, "y": 0.0534, "z": -0.028}]}],



    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体

    applyPose(turret, t, cycleDuration, rawTime) {

      const parts = turret.animatedParts;

      if (!parts) return;



      // 1. 弹药显隐逻辑 (如投石车拉臂蓄力阶段石块在碗中显示，甩出瞬间隐藏)

      if (this.ammoPartName && parts[this.ammoPartName]) {

        const ammoPart = parts[this.ammoPartName];

        const firstBulletTime = this.bulletEvents[0] ? this.bulletEvents[0].t : 0.5;

        // 击发前可见，击发后至本周期结束前隐藏，装填新周期重新可见

        const totalCycle = cycleDuration || this.duration;
        const currentT = rawTime !== undefined ? rawTime : t;
        ammoPart.visible = (currentT < firstBulletTime) || (currentT > totalCycle - 0.4);

      }



      // 2. 局部旋转曲线插值应用

      for (const eu of this.eulers) {

        const part = turret.getPartByPath(eu.path);

        if (!part) continue;



        const xDeg = interpolateKeys(eu.keys, t, 'x');

        const yDeg = interpolateKeys(eu.keys, t, 'y');

        const zDeg = interpolateKeys(eu.keys, t, 'z');



        const initRot = part.userData.initRot || { x: 0, y: 0, z: 0 };



        // 针对特殊炮塔的旋转轴映射

        if ('turret_1_2' === 'turret_2_1' || 'turret_1_2' === 'turret_2_2') {

          // 投石机配重臂主要在局部 Z 轴高速 360° 甩投 (Unity y/z 轴映射)

          const angleDeg = ('turret_1_2' === 'turret_2_1') ? yDeg : zDeg;

          part.rotation.z = initRot.z + degToRad(angleDeg);

        } else if ('turret_1_2' === 'turret_2_3') {

          // 沸油倾泻机倾角

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_1_2'.startsWith('turret_3_')) {

          // 加农炮齿轮后坐角

          if (eu.path.toLowerCase().includes('gear')) {

            part.rotation.x = initRot.x + degToRad(xDeg - 90.0);

          } else {

            part.rotation.x = initRot.x + degToRad(xDeg + 89.944);

          }

        } else if ('turret_1_2' === 'turret_5_2' || 'turret_1_2' === 'turret_5_3') {

          // 磁极聚焦翼张合角度

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_1_2' === 'turret_1_3') {

          // 原始投石臂甩石角

          part.rotation.z = initRot.z + degToRad(xDeg);

        } else if ('turret_1_2' === 'turret_1_2') {

          // 啄木鸟机枪与击锤角

          part.rotation.x = initRot.x + degToRad(xDeg + 89.98);

        } else {

          part.rotation.z = initRot.z + degToRad(zDeg);

        }

      }



      // 3. 局部后坐力位移曲线插值应用

      for (const pos of this.positions) {

        const part = turret.getPartByPath(pos.path);

        if (!part) continue;



        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;

        const deltaY = interpolateKeys(pos.keys, t, 'y') - pos.keys[0].y;

        const deltaZ = interpolateKeys(pos.keys, t, 'z') - pos.keys[0].z;



        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };

        part.position.x = initPos.x + deltaX;

        part.position.y = initPos.y + deltaY;

        part.position.z = initPos.z + deltaZ;

      }

    },



    // 姿态平滑归零恢复至 Idle Rest Pose

    resetPose(turret) {

      const parts = turret.animatedParts;

      if (!parts) return;

      for (const name in parts) {

        const part = parts[name];

        if (!part) continue;

        if (part.userData.initRot) {

          part.rotation.x = part.userData.initRot.x;

          part.rotation.y = part.userData.initRot.y;

          part.rotation.z = part.userData.initRot.z;

        }

        if (part.userData.initPos) {

          part.position.x = part.userData.initPos.x;

          part.position.y = part.userData.initPos.y;

          part.position.z = part.userData.initPos.z;

        }

        part.visible = true;

      }

    }

  },

  'turret_1_3': {

    id: 'turret_1_3',

    duration: 0.6000,

    soundName: 'catapult',

    soundEvents: [{"t": 0.05, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.2000, "func": "SpawnBullet"}],

    ammoPartName: "rock019",

    eulers: [{"path": "skull_catapult", "keys": [{"t": 0.0, "x": 0.0, "y": -90.0, "z": 90.0}, {"t": 0.16, "x": 140.0, "y": -90.0, "z": 90.0}, {"t": 0.20, "x": 167.985, "y": -90.0, "z": 90.0}, {"t": 0.26, "x": 150.0, "y": -90.0, "z": 90.0}, {"t": 0.60, "x": 0.0, "y": -90.0, "z": 90.0}]}],

    positions: [{"path": "skull_catapult", "keys": [{"t": 0.0, "x": -0.003, "y": -0.0911, "z": 0.0266}, {"t": 0.60, "x": -0.003, "y": -0.0911, "z": 0.0266}]}, {"path": "skull_catapult/rock.019", "keys": [{"t": 0.0, "x": 0.042, "y": -0.0051, "z": -0.8859}, {"t": 0.60, "x": 0.042, "y": -0.0051, "z": -0.8859}]}],



    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体

    applyPose(turret, t, cycleDuration, rawTime) {

      const parts = turret.animatedParts;

      if (!parts) return;



      // 1. 弹药显隐逻辑 (如投石车拉臂蓄力阶段石块在碗中显示，甩出瞬间隐藏)

      if (this.ammoPartName && parts[this.ammoPartName]) {

        const ammoPart = parts[this.ammoPartName];

        const firstBulletTime = this.bulletEvents[0] ? this.bulletEvents[0].t : 0.5;

        // 击发前可见，击发后至本周期结束前隐藏，装填新周期重新可见

        const totalCycle = cycleDuration || this.duration;
        const currentT = rawTime !== undefined ? rawTime : t;
        ammoPart.visible = (currentT < firstBulletTime) || (currentT > totalCycle - 0.4);

      }



      // 2. 局部旋转曲线插值应用

      for (const eu of this.eulers) {

        const part = turret.getPartByPath(eu.path);

        if (!part) continue;



        const xDeg = interpolateKeys(eu.keys, t, 'x');

        const yDeg = interpolateKeys(eu.keys, t, 'y');

        const zDeg = interpolateKeys(eu.keys, t, 'z');



        const initRot = part.userData.initRot || { x: 0, y: 0, z: 0 };



        // 针对特殊炮塔的旋转轴映射

        if ('turret_1_3' === 'turret_2_1' || 'turret_1_3' === 'turret_2_2') {

          // 投石机配重臂主要在局部 Z 轴高速 360° 甩投 (Unity y/z 轴映射)

          const angleDeg = ('turret_1_3' === 'turret_2_1') ? yDeg : zDeg;

          part.rotation.z = initRot.z + degToRad(angleDeg);

        } else if ('turret_1_3' === 'turret_2_3') {

          // 沸油倾泻机倾角

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_1_3'.startsWith('turret_3_')) {

          // 加农炮齿轮后坐角

          if (eu.path.toLowerCase().includes('gear')) {

            part.rotation.x = initRot.x + degToRad(xDeg - 90.0);

          } else {

            part.rotation.x = initRot.x + degToRad(xDeg + 89.944);

          }

        } else if ('turret_1_3' === 'turret_5_2' || 'turret_1_3' === 'turret_5_3') {

          // 磁极聚焦翼张合角度

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_1_3' === 'turret_1_3') {

          // 原始投石臂甩石角 (取负值：向上昂起并向前猛烈甩投抛石)

          part.rotation.z = initRot.z - degToRad(xDeg);

        } else if ('turret_1_3' === 'turret_1_2') {

          // 啄木鸟机枪与击锤角

          part.rotation.x = initRot.x + degToRad(xDeg + 89.98);

        } else {

          part.rotation.z = initRot.z + degToRad(zDeg);

        }

      }



      // 3. 局部后坐力位移曲线插值应用

      for (const pos of this.positions) {

        const part = turret.getPartByPath(pos.path);

        if (!part) continue;



        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;

        const deltaY = interpolateKeys(pos.keys, t, 'y') - pos.keys[0].y;

        const deltaZ = interpolateKeys(pos.keys, t, 'z') - pos.keys[0].z;



        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };

        part.position.x = initPos.x + deltaX;

        part.position.y = initPos.y + deltaY;

        part.position.z = initPos.z + deltaZ;

      }

    },



    // 姿态平滑归零恢复至 Idle Rest Pose

    resetPose(turret) {

      const parts = turret.animatedParts;

      if (!parts) return;

      for (const name in parts) {

        const part = parts[name];

        if (!part) continue;

        if (part.userData.initRot) {

          part.rotation.x = part.userData.initRot.x;

          part.rotation.y = part.userData.initRot.y;

          part.rotation.z = part.userData.initRot.z;

        }

        if (part.userData.initPos) {

          part.position.x = part.userData.initPos.x;

          part.position.y = part.userData.initPos.y;

          part.position.z = part.userData.initPos.z;

        }

        part.visible = true;

      }

    }

  },

  'turret_2_1': {

    id: 'turret_2_1',

    duration: 2.0167,

    soundName: 'catapult',

    soundEvents: [{"t": 0.45, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.65, "func": "SpawnBullet"}],

    ammoPartName: "Bullet1",

    eulers: [{"path": "Gear", "keys": [{"t": 0.0, "x": 0.0, "y": 0.0, "z": 0.0}, {"t": 0.5, "x": 0.0, "y": 54.939, "z": 0.0}, {"t": 0.65, "x": 0.0, "y": -106.087, "z": 0.0}, {"t": 0.7833, "x": 0.0, "y": -169.893, "z": 0.0}, {"t": 1.1, "x": 0.0, "y": -239.462, "z": 0.0}, {"t": 2.0167, "x": 0.0, "y": 0.0, "z": 0.0}]}],

    positions: [],



    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体

    applyPose(turret, t, cycleDuration, rawTime) {

      const parts = turret.animatedParts;

      if (!parts) return;



      // 1. 弹药显隐逻辑 (如投石车拉臂蓄力阶段石块在碗中显示，甩出瞬间隐藏)

      if (this.ammoPartName && parts[this.ammoPartName]) {

        const ammoPart = parts[this.ammoPartName];

        const firstBulletTime = this.bulletEvents[0] ? this.bulletEvents[0].t : 0.5;

        // 击发前可见，击发后至本周期结束前隐藏，装填新周期重新可见

        const totalCycle = cycleDuration || this.duration;
        const currentT = rawTime !== undefined ? rawTime : t;
        ammoPart.visible = (currentT < firstBulletTime) || (currentT > totalCycle - 0.4);

      }



      // 2. 局部旋转曲线插值应用

      for (const eu of this.eulers) {

        const part = turret.getPartByPath(eu.path);

        if (!part) continue;



        const xDeg = interpolateKeys(eu.keys, t, 'x');

        const yDeg = interpolateKeys(eu.keys, t, 'y');

        const zDeg = interpolateKeys(eu.keys, t, 'z');



        const initRot = part.userData.initRot || { x: 0, y: 0, z: 0 };



        // 针对特殊炮塔的旋转轴映射

        if ('turret_2_1' === 'turret_2_1' || 'turret_2_1' === 'turret_2_2') {

          // 投石机配重臂主要在局部 Z 轴高速 360° 甩投 (Unity y/z 轴映射)

          const angleDeg = ('turret_2_1' === 'turret_2_1') ? yDeg : zDeg;

          part.rotation.z = initRot.z + degToRad(angleDeg);

        } else if ('turret_2_1' === 'turret_2_3') {

          // 沸油倾泻机倾角

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_2_1'.startsWith('turret_3_')) {

          // 加农炮齿轮后坐角

          if (eu.path.toLowerCase().includes('gear')) {

            part.rotation.x = initRot.x + degToRad(xDeg - 90.0);

          } else {

            part.rotation.x = initRot.x + degToRad(xDeg + 89.944);

          }

        } else if ('turret_2_1' === 'turret_5_2' || 'turret_2_1' === 'turret_5_3') {

          // 磁极聚焦翼张合角度

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_2_1' === 'turret_1_3') {

          // 原始投石臂甩石角

          part.rotation.z = initRot.z + degToRad(xDeg);

        } else if ('turret_2_1' === 'turret_1_2') {

          // 啄木鸟机枪与击锤角

          part.rotation.x = initRot.x + degToRad(xDeg + 89.98);

        } else {

          part.rotation.z = initRot.z + degToRad(zDeg);

        }

      }



      // 3. 局部后坐力位移曲线插值应用

      for (const pos of this.positions) {

        const part = turret.getPartByPath(pos.path);

        if (!part) continue;



        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;

        const deltaY = interpolateKeys(pos.keys, t, 'y') - pos.keys[0].y;

        const deltaZ = interpolateKeys(pos.keys, t, 'z') - pos.keys[0].z;



        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };

        part.position.x = initPos.x + deltaX;

        part.position.y = initPos.y + deltaY;

        part.position.z = initPos.z + deltaZ;

      }

    },



    // 姿态平滑归零恢复至 Idle Rest Pose

    resetPose(turret) {

      const parts = turret.animatedParts;

      if (!parts) return;

      for (const name in parts) {

        const part = parts[name];

        if (!part) continue;

        if (part.userData.initRot) {

          part.rotation.x = part.userData.initRot.x;

          part.rotation.y = part.userData.initRot.y;

          part.rotation.z = part.userData.initRot.z;

        }

        if (part.userData.initPos) {

          part.position.x = part.userData.initPos.x;

          part.position.y = part.userData.initPos.y;

          part.position.z = part.userData.initPos.z;

        }

        part.visible = true;

      }

    }

  },

  'turret_2_2': {

    id: 'turret_2_2',

    duration: 2.0167,

    soundName: 'catapult',

    soundEvents: [{"t": 0.45, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.65, "func": "SpawnBullet"}],

    ammoPartName: "Bullet2",

    eulers: [{"path": "Gear", "keys": [{"t": 0.0, "x": 0.0, "y": 0.0, "z": 0.0}, {"t": 0.5, "x": 0.0, "y": 0.0, "z": 54.939}, {"t": 0.65, "x": 0.0, "y": 0.0, "z": -106.087}, {"t": 0.7833, "x": 0.0, "y": 0.0, "z": -169.893}, {"t": 1.1, "x": 0.0, "y": 0.0, "z": -239.462}, {"t": 2.0167, "x": 0.0, "y": 0.0, "z": 0.0}]}],

    positions: [],



    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体

    applyPose(turret, t, cycleDuration, rawTime) {

      const parts = turret.animatedParts;

      if (!parts) return;



      // 1. 弹药显隐逻辑 (如投石车拉臂蓄力阶段石块在碗中显示，甩出瞬间隐藏)

      if (this.ammoPartName && parts[this.ammoPartName]) {

        const ammoPart = parts[this.ammoPartName];

        const firstBulletTime = this.bulletEvents[0] ? this.bulletEvents[0].t : 0.5;

        // 击发前可见，击发后至本周期结束前隐藏，装填新周期重新可见

        const totalCycle = cycleDuration || this.duration;
        const currentT = rawTime !== undefined ? rawTime : t;
        ammoPart.visible = (currentT < firstBulletTime) || (currentT > totalCycle - 0.4);

      }



      // 2. 局部旋转曲线插值应用

      for (const eu of this.eulers) {

        const part = turret.getPartByPath(eu.path);

        if (!part) continue;



        const xDeg = interpolateKeys(eu.keys, t, 'x');

        const yDeg = interpolateKeys(eu.keys, t, 'y');

        const zDeg = interpolateKeys(eu.keys, t, 'z');



        const initRot = part.userData.initRot || { x: 0, y: 0, z: 0 };



        // 针对特殊炮塔的旋转轴映射

        if ('turret_2_2' === 'turret_2_1' || 'turret_2_2' === 'turret_2_2') {

          // 投石机配重臂主要在局部 Z 轴高速 360° 甩投 (Unity y/z 轴映射)

          const angleDeg = ('turret_2_2' === 'turret_2_1') ? yDeg : zDeg;

          part.rotation.z = initRot.z + degToRad(angleDeg);

        } else if ('turret_2_2' === 'turret_2_3') {

          // 沸油倾泻机倾角

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_2_2'.startsWith('turret_3_')) {

          // 加农炮齿轮后坐角

          if (eu.path.toLowerCase().includes('gear')) {

            part.rotation.x = initRot.x + degToRad(xDeg - 90.0);

          } else {

            part.rotation.x = initRot.x + degToRad(xDeg + 89.944);

          }

        } else if ('turret_2_2' === 'turret_5_2' || 'turret_2_2' === 'turret_5_3') {

          // 磁极聚焦翼张合角度

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_2_2' === 'turret_1_3') {

          // 原始投石臂甩石角

          part.rotation.z = initRot.z + degToRad(xDeg);

        } else if ('turret_2_2' === 'turret_1_2') {

          // 啄木鸟机枪与击锤角

          part.rotation.x = initRot.x + degToRad(xDeg + 89.98);

        } else {

          part.rotation.z = initRot.z + degToRad(zDeg);

        }

      }



      // 3. 局部后坐力位移曲线插值应用

      for (const pos of this.positions) {

        const part = turret.getPartByPath(pos.path);

        if (!part) continue;



        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;

        const deltaY = interpolateKeys(pos.keys, t, 'y') - pos.keys[0].y;

        const deltaZ = interpolateKeys(pos.keys, t, 'z') - pos.keys[0].z;



        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };

        part.position.x = initPos.x + deltaX;

        part.position.y = initPos.y + deltaY;

        part.position.z = initPos.z + deltaZ;

      }

    },



    // 姿态平滑归零恢复至 Idle Rest Pose

    resetPose(turret) {

      const parts = turret.animatedParts;

      if (!parts) return;

      for (const name in parts) {

        const part = parts[name];

        if (!part) continue;

        if (part.userData.initRot) {

          part.rotation.x = part.userData.initRot.x;

          part.rotation.y = part.userData.initRot.y;

          part.rotation.z = part.userData.initRot.z;

        }

        if (part.userData.initPos) {

          part.position.x = part.userData.initPos.x;

          part.position.y = part.userData.initPos.y;

          part.position.z = part.userData.initPos.z;

        }

        part.visible = true;

      }

    }

  },

  'turret_2_3': {

    id: 'turret_2_3',

    duration: 5.1200,

    soundName: 'fire_01',

    soundEvents: [{"t": 0.16, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.26, "func": "SpawnBullet"}],

    ammoPartName: null,

    eulers: [{"path": "landing/cauldron", "keys": [{"t": 0.0, "x": 0.0, "y": 0.0, "z": -0.099}, {"t": 0.4, "x": 0.0, "y": 0.0, "z": 71.892}, {"t": 2.0, "x": 0.0, "y": 0.0, "z": 59.794}, {"t": 2.4, "x": 0.0, "y": 0.0, "z": -0.099}, {"t": 5.12, "x": 0.0, "y": 0.0, "z": -0.099}]}, {"path": "landing", "keys": [{"t": 0.0, "x": 0.0, "y": 0.0, "z": 0.0}, {"t": 0.62, "x": 0.0, "y": 0.0, "z": 16.737}, {"t": 2.0, "x": 0.0, "y": 0.0, "z": 19.839}, {"t": 2.4, "x": 0.0, "y": 0.0, "z": 0.0}, {"t": 5.12, "x": 0.0, "y": 0.0, "z": 0.0}]}, {"path": "", "keys": [{"t": 0.0, "x": 0.0, "y": 180.0, "z": 0.0}]}],

    positions: [{"path": "landing/cauldron", "keys": [{"t": 0.0, "x": -0.012, "y": -0.345, "z": 0.005}, {"t": 0.4, "x": 0.041, "y": -0.289, "z": 0.005}, {"t": 2.0, "x": 0.036, "y": -0.296, "z": 0.005}, {"t": 2.4, "x": -0.012, "y": -0.345, "z": 0.005}, {"t": 5.12, "x": -0.012, "y": -0.345, "z": 0.005}]}],



    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体

    applyPose(turret, t, cycleDuration, rawTime) {

      const parts = turret.animatedParts;

      if (!parts) return;



      // 1. 弹药显隐逻辑 (如投石车拉臂蓄力阶段石块在碗中显示，甩出瞬间隐藏)

      if (this.ammoPartName && parts[this.ammoPartName]) {

        const ammoPart = parts[this.ammoPartName];

        const firstBulletTime = this.bulletEvents[0] ? this.bulletEvents[0].t : 0.5;

        // 击发前可见，击发后至本周期结束前隐藏，装填新周期重新可见

        const totalCycle = cycleDuration || this.duration;
        const currentT = rawTime !== undefined ? rawTime : t;
        ammoPart.visible = (currentT < firstBulletTime) || (currentT > totalCycle - 0.4);

      }



      // 2. 局部旋转曲线插值应用

      for (const eu of this.eulers) {

        const part = turret.getPartByPath(eu.path);

        if (!part) continue;



        const xDeg = interpolateKeys(eu.keys, t, 'x');

        const yDeg = interpolateKeys(eu.keys, t, 'y');

        const zDeg = interpolateKeys(eu.keys, t, 'z');



        const initRot = part.userData.initRot || { x: 0, y: 0, z: 0 };



        // 针对特殊炮塔的旋转轴映射

        if ('turret_2_3' === 'turret_2_1' || 'turret_2_3' === 'turret_2_2') {

          // 投石机配重臂主要在局部 Z 轴高速 360° 甩投 (Unity y/z 轴映射)

          const angleDeg = ('turret_2_3' === 'turret_2_1') ? yDeg : zDeg;

          part.rotation.z = initRot.z + degToRad(angleDeg);

        } else if ('turret_2_3' === 'turret_2_3') {

          // 沸油倾泻机倾角

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_2_3'.startsWith('turret_3_')) {

          // 加农炮齿轮后坐角

          if (eu.path.toLowerCase().includes('gear')) {

            part.rotation.x = initRot.x + degToRad(xDeg - 90.0);

          } else {

            part.rotation.x = initRot.x + degToRad(xDeg + 89.944);

          }

        } else if ('turret_2_3' === 'turret_5_2' || 'turret_2_3' === 'turret_5_3') {

          // 磁极聚焦翼张合角度

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_2_3' === 'turret_1_3') {

          // 原始投石臂甩石角

          part.rotation.z = initRot.z + degToRad(xDeg);

        } else if ('turret_2_3' === 'turret_1_2') {

          // 啄木鸟机枪与击锤角

          part.rotation.x = initRot.x + degToRad(xDeg + 89.98);

        } else {

          part.rotation.z = initRot.z + degToRad(zDeg);

        }

      }



      // 3. 局部后坐力位移曲线插值应用

      for (const pos of this.positions) {

        const part = turret.getPartByPath(pos.path);

        if (!part) continue;



        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;

        const deltaY = interpolateKeys(pos.keys, t, 'y') - pos.keys[0].y;

        const deltaZ = interpolateKeys(pos.keys, t, 'z') - pos.keys[0].z;



        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };

        part.position.x = initPos.x + deltaX;

        part.position.y = initPos.y + deltaY;

        part.position.z = initPos.z + deltaZ;

      }

    },



    // 姿态平滑归零恢复至 Idle Rest Pose

    resetPose(turret) {

      const parts = turret.animatedParts;

      if (!parts) return;

      for (const name in parts) {

        const part = parts[name];

        if (!part) continue;

        if (part.userData.initRot) {

          part.rotation.x = part.userData.initRot.x;

          part.rotation.y = part.userData.initRot.y;

          part.rotation.z = part.userData.initRot.z;

        }

        if (part.userData.initPos) {

          part.position.x = part.userData.initPos.x;

          part.position.y = part.userData.initPos.y;

          part.position.z = part.userData.initPos.z;

        }

        part.visible = true;

      }

    }

  },

  'turret_3_1': {

    id: 'turret_3_1',

    duration: 2.0,

    soundName: 'medival_range_attack',

    soundEvents: [{"t": 0.08, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.08, "func": "SpawnBullet"}],

    ammoPartName: null,

    eulers: [],

    positions: [],

    applyPose(turret, t, cycleDuration, rawTime) {},

    resetPose(turret) {

      if (turret.recoilBarrel && turret.recoilBarrel.userData.initPos) {

        turret.recoilBarrel.position.copy(turret.recoilBarrel.userData.initPos);

      }

    }

  },

  'turret_3_2': {

    id: 'turret_3_2',

    duration: 2.2,

    soundName: 'medival_range_attack',

    soundEvents: [{"t": 0.08, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.08, "func": "SpawnBullet"}],

    ammoPartName: null,

    eulers: [],

    positions: [],

    applyPose(turret, t, cycleDuration, rawTime) {},

    resetPose(turret) {

      if (turret.recoilBarrel && turret.recoilBarrel.userData.initPos) {

        turret.recoilBarrel.position.copy(turret.recoilBarrel.userData.initPos);

      }

    }

  },

  'turret_3_3': {

    id: 'turret_3_3',

    duration: 2.5,

    soundName: 'medival_range_attack',

    soundEvents: [{"t": 0.08, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.08, "func": "SpawnBullet"}],

    ammoPartName: null,

    eulers: [],

    positions: [],

    applyPose(turret, t, cycleDuration, rawTime) {},

    resetPose(turret) {

      if (turret.recoilBarrel && turret.recoilBarrel.userData.initPos) {

        turret.recoilBarrel.position.copy(turret.recoilBarrel.userData.initPos);

      }

    }

  },

  'turret_4_1': {

    id: 'turret_4_1',

    duration: 0.3667,

    soundName: 'miltary_turret_attack',

    soundEvents: [{"t": 0.1667, "func": "PlaySound"}],

    bulletEvents: [{"t": 0.2, "func": "SpawnBullet"}],

    ammoPartName: null,

    eulers: [],

    positions: [{"path": "Cannon", "keys": [{"t": 0.0, "x": -0.5214, "y": 0.5645, "z": 0.02}, {"t": 0.0917, "x": -0.68, "y": 0.56, "z": 0.02}, {"t": 0.1667, "x": -0.7, "y": 0.56, "z": 0.02}, {"t": 0.2333, "x": 0.7, "y": 0.56, "z": 0.02}, {"t": 0.3667, "x": -0.5214, "y": 0.5645, "z": 0.02}]}, {"path": "Handle", "keys": [{"t": 0.0, "x": -0.0, "y": 0.0, "z": -0.0}, {"t": 0.0917, "x": 0.5, "y": 0.0, "z": -0.0}, {"t": 0.1667, "x": 0.5, "y": 0.0, "z": -0.0}, {"t": 0.2333, "x": -0.28, "y": 0.0, "z": -0.0}, {"t": 0.3667, "x": -0.0, "y": 0.0, "z": -0.0}]}],



    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体

    applyPose(turret, t, cycleDuration, rawTime) {

      const parts = turret.animatedParts;

      if (!parts) return;



      // 1. 弹药显隐逻辑 (如投石车拉臂蓄力阶段石块在碗中显示，甩出瞬间隐藏)

      if (this.ammoPartName && parts[this.ammoPartName]) {

        const ammoPart = parts[this.ammoPartName];

        const firstBulletTime = this.bulletEvents[0] ? this.bulletEvents[0].t : 0.5;

        // 击发前可见，击发后至本周期结束前隐藏，装填新周期重新可见

        const totalCycle = cycleDuration || this.duration;
        const currentT = rawTime !== undefined ? rawTime : t;
        ammoPart.visible = (currentT < firstBulletTime) || (currentT > totalCycle - 0.4);

      }



      // 2. 局部旋转曲线插值应用

      for (const eu of this.eulers) {

        const part = turret.getPartByPath(eu.path);

        if (!part) continue;



        const xDeg = interpolateKeys(eu.keys, t, 'x');

        const yDeg = interpolateKeys(eu.keys, t, 'y');

        const zDeg = interpolateKeys(eu.keys, t, 'z');



        const initRot = part.userData.initRot || { x: 0, y: 0, z: 0 };



        // 针对特殊炮塔的旋转轴映射

        if ('turret_4_1' === 'turret_2_1' || 'turret_4_1' === 'turret_2_2') {

          // 投石机配重臂主要在局部 Z 轴高速 360° 甩投 (Unity y/z 轴映射)

          const angleDeg = ('turret_4_1' === 'turret_2_1') ? yDeg : zDeg;

          part.rotation.z = initRot.z + degToRad(angleDeg);

        } else if ('turret_4_1' === 'turret_2_3') {

          // 沸油倾泻机倾角

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_4_1'.startsWith('turret_3_')) {

          // 加农炮齿轮后坐角

          if (eu.path.toLowerCase().includes('gear')) {

            part.rotation.x = initRot.x + degToRad(xDeg - 90.0);

          } else {

            part.rotation.x = initRot.x + degToRad(xDeg + 89.944);

          }

        } else if ('turret_4_1' === 'turret_5_2' || 'turret_4_1' === 'turret_5_3') {

          // 磁极聚焦翼张合角度

          part.rotation.z = initRot.z + degToRad(zDeg);

        } else if ('turret_4_1' === 'turret_1_3') {

          // 原始投石臂甩石角

          part.rotation.z = initRot.z + degToRad(xDeg);

        } else if ('turret_4_1' === 'turret_1_2') {

          // 啄木鸟机枪与击锤角

          part.rotation.x = initRot.x + degToRad(xDeg + 89.98);

        } else {

          part.rotation.z = initRot.z + degToRad(zDeg);

        }

      }



      // 3. 局部后坐力位移曲线插值应用

      for (const pos of this.positions) {

        const part = turret.getPartByPath(pos.path);

        if (!part) continue;



        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;

        const deltaY = interpolateKeys(pos.keys, t, 'y') - pos.keys[0].y;

        const deltaZ = interpolateKeys(pos.keys, t, 'z') - pos.keys[0].z;



        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };

        part.position.x = initPos.x + deltaX;

        part.position.y = initPos.y + deltaY;

        part.position.z = initPos.z + deltaZ;

      }

    },



    // 姿态平滑归零恢复至 Idle Rest Pose

    resetPose(turret) {

      const parts = turret.animatedParts;

      if (!parts) return;

      for (const name in parts) {

        const part = parts[name];

        if (!part) continue;

        if (part.userData.initRot) {

          part.rotation.x = part.userData.initRot.x;

          part.rotation.y = part.userData.initRot.y;

          part.rotation.z = part.userData.initRot.z;

        }

        if (part.userData.initPos) {

          part.position.x = part.userData.initPos.x;

          part.position.y = part.userData.initPos.y;

          part.position.z = part.userData.initPos.z;

        }

        part.visible = true;

      }

    }

  },

  'turret_4_2': {

    id: 'turret_4_2',

    duration: 2.0000,

    soundName: 'medival_tank_attack',

    soundEvents: [{"t": 1.05, "func": "PlaySound"}],

    bulletEvents: [{"t": 1.1, "func": "SpawnBullet"}],

    ammoPartName: null,

    eulers: [{"path": "Base", "keys": [{"t": 0.0, "x": 0.0, "y": 0.0, "z": 89.994}, {"t": 0.5667, "x": 0.0, "y": 0.0, "z": 89.994}, {"t": 1.15, "x": 0.0, "y": 0.0, "z": 89.994}, {"t": 1.5833, "x": 0.0, "y": 0.0, "z": 89.994}, {"t": 2.0, "x": 0.0, "y": 0.0, "z": 89.994}]}],

    positions: [{"path": "Base", "keys": [{"t": 0.0, "x": 0.0, "y": 0.0, "z": 0.0}, {"t": 0.5667, "x": 0.0, "y": 0.0, "z": 0.0}, {"t": 1.0333, "x": 0.4, "y": 0.0, "z": 0.0}, {"t": 1.15, "x": -0.21, "y": 0.0, "z": 0.0}, {"t": 1.5833, "x": 0.0, "y": 0.0, "z": 0.0}, {"t": 2.0, "x": 0.0, "y": 0.0, "z": 0.0}]}],

    // 逐帧姿态求解器：将时间 t (0 ~ duration) 的关键帧应用到 turret 实体
    applyPose(turret, t, cycleDuration, rawTime) {
      const parts = turret.animatedParts;
      if (!parts) return;
      for (const pos of this.positions) {
        const part = turret.getPartByPath(pos.path);
        if (!part) continue;
        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;
        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };
        part.position.x = initPos.x + deltaX;
      }
    },

    // 姿态平滑归零恢复至 Idle Rest Pose
    resetPose(turret) {
      const parts = turret.animatedParts;
      if (!parts) return;
      for (const name in parts) {
        const part = parts[name];
        if (!part) continue;
        if (part.userData.initPos) {
          part.position.x = part.userData.initPos.x;
          part.position.y = part.userData.initPos.y;
          part.position.z = part.userData.initPos.z;
        }
        part.visible = true;
      }
    }
  },
  'turret_4_3': {
    id: 'turret_4_3',
    duration: 0.6750,
    soundName: 'miltary_turret_3_attack',
    soundEvents: [{"t": 0.125, "func": "PlaySound"}, {"t": 0.4417, "func": "PlaySound"}],
    bulletEvents: [{"t": 0.15, "func": "SpawnBullet"}, {"t": 0.4667, "func": "SpawnBullet"}],
    ammoPartName: null,
    eulers: [],
    positions: [{"path": "Cannon.002", "keys": [{"t": 0.0, "x": -1.2667, "y": 0.3158, "z": 0.0076}, {"t": 0.1167, "x": -1.45, "y": 0.3158, "z": 0.0076}, {"t": 0.1833, "x": 0.13, "y": 0.3158, "z": 0.0076}, {"t": 0.5, "x": -1.2667, "y": 0.3158, "z": 0.0076}]}, {"path": "Cannon.001", "keys": [{"t": 0.0, "x": -1.2667, "y": -0.3332, "z": 0.0076}, {"t": 0.3333, "x": -1.2667, "y": -0.3332, "z": 0.0076}, {"t": 0.4333, "x": -1.45, "y": -0.3332, "z": 0.0076}, {"t": 0.5, "x": 0.15, "y": -0.3332, "z": 0.0076}, {"t": 0.675, "x": -1.2667, "y": -0.3332, "z": 0.0076}]}],
    applyPose(turret, t, cycleDuration, rawTime) {
      const parts = turret.animatedParts;
      if (!parts) return;
      for (const pos of this.positions) {
        const part = turret.getPartByPath(pos.path);
        if (!part) continue;
        const deltaX = interpolateKeys(pos.keys, t, 'x') - pos.keys[0].x;
        const initPos = part.userData.initPos || { x: 0, y: 0, z: 0 };
        part.position.x = initPos.x + deltaX;
      }
    },
    resetPose(turret) {
      const parts = turret.animatedParts;
      if (!parts) return;
      for (const name in parts) {
        const part = parts[name];
        if (!part) continue;
        if (part.userData.initPos) {
          part.position.x = part.userData.initPos.x;
          part.position.y = part.userData.initPos.y;
          part.position.z = part.userData.initPos.z;
        }
        part.visible = true;
      }
    }
  },
  'turret_5_1': {
    id: 'turret_5_1',
    duration: 1.2,
    soundName: 'future_tank_attack',
    soundEvents: [{"t": 0.05, "func": "PlaySound"}],
    bulletEvents: [{"t": 0.05, "func": "SpawnBullet"}],
    ammoPartName: null,
    eulers: [],
    positions: [],
    applyPose(turret, t, cycleDuration, rawTime) {},
    resetPose(turret) {}
  },
  'turret_5_2': {
    id: 'turret_5_2',
    duration: 0.8,
    soundName: 'future_turret_attack',
    soundEvents: [{"t": 0.05, "func": "PlaySound"}],
    bulletEvents: [{"t": 0.05, "func": "SpawnBullet"}],
    ammoPartName: null,
    eulers: [],
    positions: [],
    applyPose(turret, t, cycleDuration, rawTime) {},
    resetPose(turret) {}
  },
  'turret_5_3': {
    id: 'turret_5_3',
    duration: 2.0,
    soundName: 'future_turret_attack',
    soundEvents: [{"t": 0.05, "func": "PlaySound"}],
    bulletEvents: [{"t": 0.05, "func": "SpawnBullet"}],
    ammoPartName: null,
    eulers: [],
    positions: [],
    applyPose(turret, t, cycleDuration, rawTime) {},
    resetPose(turret) {}
  }
};
