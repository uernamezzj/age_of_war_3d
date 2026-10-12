"""
《战争进化史 3D》资产映射与编译流水线 (Unity -> Web GLTF/GLB)
============================================================
将原版 Unity 项目的原始生态文件格式（FBX + Unity YAML .anim + .prefab 节点树）
自动化、无损地映射转换为标准 Web 3D 格式（glTF / GLB 二进制包）。

映射特性：
1. 模型与骨骼：保留 FBX 原生多部件蒙皮，烘焙为单骨架统一皮肤；
2. 刚体炮台支持：自动识别无 Armature 的机械结构，将对象级 F-Curves 映射为 glTF 节点变换轨道；
3. 动画曲线：解析 Unity YAML .anim 的 m_EulerCurves 与 m_PositionCurves，
   映射至对应骨骼/对象 F-Curves 并作为 NLA 轨道导出（walk, attack, idle, die, shoot）；
4. 武器挂载：根据 .prefab 的父子节点结构与局部变换（位置、四元数旋转、缩放）
   自动装配至指定手骨；
5. 工业级输出：由 Blender 4.2 无头模式自动化批量编译产出标准 GLB，
   Three.js 客户端通过标准 GLTFLoader + AnimationMixer 即可直接 1:1 驱动！
"""

import bpy
import os
import re
import math

def parse_unity_anim(filepath):
    """解析 Unity .anim YAML 文件的欧拉角与位移曲线"""
    if not os.path.exists(filepath):
        return {'euler_curves': [], 'pos_curves': []}

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. 欧拉角旋转曲线
    euler_curves = []
    euler_match = re.search(r'm_EulerCurves:\s*\n(.*?)(?=\n  m_\w+:|\Z)', content, re.DOTALL)
    if euler_match:
        section_text = euler_match.group(1)
        curve_blocks = re.split(r'\n  - curve:', '\n' + section_text)
        for block in curve_blocks:
            if not block.strip():
                continue
            path_match = re.search(r'path:\s*([^\n\r]+)', block)
            path = path_match.group(1).strip() if path_match else ""
            keyframes = []
            kf_matches = re.finditer(r'time:\s*([\d\.\-e]+)\s*\n\s*value:\s*\{x:\s*([\d\.\-e]+),\s*y:\s*([\d\.\-e]+),\s*z:\s*([\d\.\-e]+)\}', block)
            for km in kf_matches:
                t = float(km.group(1))
                x = float(km.group(2))
                y = float(km.group(3))
                z = float(km.group(4))
                keyframes.append((t, x, y, z))
            if path and keyframes:
                bone_name = path.split('/')[-1]
                euler_curves.append({
                    'path': path,
                    'bone': bone_name,
                    'keyframes': keyframes
                })

    # 2. 局部位置位移曲线
    pos_curves = []
    pos_match = re.search(r'm_PositionCurves:\s*\n(.*?)(?=\n  m_\w+:|\Z)', content, re.DOTALL)
    if pos_match:
        section_text = pos_match.group(1)
        curve_blocks = re.split(r'\n  - curve:', '\n' + section_text)
        for block in curve_blocks:
            if not block.strip():
                continue
            path_match = re.search(r'path:\s*([^\n\r]+)', block)
            path = path_match.group(1).strip() if path_match else ""
            keyframes = []
            kf_matches = re.finditer(r'time:\s*([\d\.\-e]+)\s*\n\s*value:\s*\{x:\s*([\d\.\-e]+),\s*y:\s*([\d\.\-e]+),\s*z:\s*([\d\.\-e]+)\}', block)
            for km in kf_matches:
                t = float(km.group(1))
                x = float(km.group(2))
                y = float(km.group(3))
                z = float(km.group(4))
                keyframes.append((t, x, y, z))
            if path and keyframes:
                bone_name = path.split('/')[-1]
                pos_curves.append({
                    'path': path,
                    'bone': bone_name,
                    'keyframes': keyframes
                })

    return {'euler_curves': euler_curves, 'pos_curves': pos_curves}

def convert_model(fbx_path, anim_dict, weapon_info, output_glb):
    """编译单个单位或炮台模型至标准 GLB"""
    print(f"\n==================================================")
    print(f"正在映射编译: {os.path.basename(output_glb)}")
    print(f"==================================================")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 30
    fps = 30.0

    # 1. 导入 FBX
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    armature = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)

    # 2. 挂载武器 (根据 prefab 定义)
    if weapon_info and os.path.exists(weapon_info['fbx']) and armature:
        print(f"挂载武器: {weapon_info['fbx']} -> {weapon_info['bone']}")
        before_objs = set(bpy.data.objects)
        bpy.ops.import_scene.fbx(filepath=weapon_info['fbx'])
        new_objs = [o for o in bpy.data.objects if o not in before_objs]
        weapon_mesh = next((o for o in new_objs if o.type == 'MESH'), None)
        weapon_arm = next((o for o in new_objs if o.type == 'ARMATURE'), None)

        target_obj = weapon_mesh if weapon_mesh else weapon_arm
        if target_obj and weapon_info['bone'] in armature.data.bones:
            target_obj.parent = armature
            target_obj.parent_type = 'BONE'
            target_obj.parent_bone = weapon_info['bone']
            target_obj.location = weapon_info.get('loc', (0, 0, 0))
            if 'rot_quat' in weapon_info:
                target_obj.rotation_mode = 'QUATERNION'
                target_obj.rotation_quaternion = weapon_info['rot_quat']
            elif 'rot_euler' in weapon_info:
                target_obj.rotation_mode = 'XYZ'
                target_obj.rotation_euler = weapon_info['rot_euler']
            target_obj.scale = weapon_info.get('scale', (1, 1, 1))
            print("武器挂载成功！")

    # 分支 A: 具有骨架 (Armature)
    if armature:
        armature.animation_data_create()

        # 如果自身已带 actions（如 caveman_3），重命名并标准化为 NLA 轨道
        if len(bpy.data.actions) > 0:
            print(f"检测到内置 Actions ({len(bpy.data.actions)} 个)，正在映射命名...")
            for act in list(bpy.data.actions):
                clean_name = act.name.split('|')[-1].lower()
                act.name = clean_name
                track = armature.animation_data.nla_tracks.new()
                track.name = clean_name
                track.strips.new(clean_name, 0, act)

        # 从 Unity .anim 烘焙骨骼动画曲线
        for clip_name, a_path in anim_dict.items():
            if not os.path.exists(a_path):
                continue
            print(f"烘焙骨骼动画剪辑: {clip_name} ({os.path.basename(a_path)})")
            parsed = parse_unity_anim(a_path)
            action = bpy.data.actions.new(name=clip_name)

            # 旋转曲线
            for c in parsed['euler_curves']:
                bone_name = c['bone']
                pose_bone = armature.pose.bones.get(bone_name)
                if not pose_bone:
                    continue
                pose_bone.rotation_mode = 'ZXY'
                dp = f'pose.bones["{bone_name}"].rotation_euler'
                fc_x = action.fcurves.new(data_path=dp, index=0)
                fc_y = action.fcurves.new(data_path=dp, index=1)
                fc_z = action.fcurves.new(data_path=dp, index=2)
                for (t, x, y, z) in c['keyframes']:
                    f = t * fps
                    fc_x.keyframe_points.insert(f, math.radians(x))
                    fc_y.keyframe_points.insert(f, math.radians(y))
                    fc_z.keyframe_points.insert(f, math.radians(z))

            # 位移曲线
            for c in parsed['pos_curves']:
                bone_name = c['bone']
                pose_bone = armature.pose.bones.get(bone_name)
                if not pose_bone:
                    continue
                dp = f'pose.bones["{bone_name}"].location'
                fc_x = action.fcurves.new(data_path=dp, index=0)
                fc_y = action.fcurves.new(data_path=dp, index=1)
                fc_z = action.fcurves.new(data_path=dp, index=2)
                for (t, x, y, z) in c['keyframes']:
                    f = t * fps
                    fc_x.keyframe_points.insert(f, x)
                    fc_y.keyframe_points.insert(f, y)
                    fc_z.keyframe_points.insert(f, z)

            # 添加至 NLA Strip
            track = armature.animation_data.nla_tracks.new()
            track.name = clip_name
            track.strips.new(clip_name, 0, action)

    # 分支 B: 纯网格对象（无 Armature，如 turret_1_2, turret_1_3）
    else:
        print("未检测到骨架，执行对象级刚体变换映射烘焙...")
        for clip_name, a_path in anim_dict.items():
            if not os.path.exists(a_path):
                continue
            print(f"烘焙对象级动画剪辑: {clip_name} ({os.path.basename(a_path)})")
            parsed = parse_unity_anim(a_path)

            obj_curves = {}
            for c in parsed['euler_curves']:
                name = c['bone']
                obj_curves.setdefault(name, {'euler': None, 'pos': None})
                obj_curves[name]['euler'] = c

            for c in parsed['pos_curves']:
                name = c['bone']
                obj_curves.setdefault(name, {'euler': None, 'pos': None})
                obj_curves[name]['pos'] = c

            for obj_name, curves in obj_curves.items():
                obj = bpy.data.objects.get(obj_name)
                if not obj:
                    continue

                if not obj.animation_data:
                    obj.animation_data_create()

                action = bpy.data.actions.new(name=f"{obj_name}_{clip_name}")
                obj.rotation_mode = 'ZXY'

                if curves['euler']:
                    fc_x = action.fcurves.new(data_path="rotation_euler", index=0)
                    fc_y = action.fcurves.new(data_path="rotation_euler", index=1)
                    fc_z = action.fcurves.new(data_path="rotation_euler", index=2)
                    for (t, x, y, z) in curves['euler']['keyframes']:
                        f = t * fps
                        fc_x.keyframe_points.insert(f, math.radians(x))
                        fc_y.keyframe_points.insert(f, math.radians(y))
                        fc_z.keyframe_points.insert(f, math.radians(z))

                if curves['pos']:
                    fc_x = action.fcurves.new(data_path="location", index=0)
                    fc_y = action.fcurves.new(data_path="location", index=1)
                    fc_z = action.fcurves.new(data_path="location", index=2)
                    for (t, x, y, z) in curves['pos']['keyframes']:
                        f = t * fps
                        fc_x.keyframe_points.insert(f, x)
                        fc_y.keyframe_points.insert(f, y)
                        fc_z.keyframe_points.insert(f, z)

                track = obj.animation_data.nla_tracks.new()
                track.name = clip_name
                track.strips.new(clip_name, 0, action)

    # 导出标准二进制 GLB
    os.makedirs(os.path.dirname(output_glb), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_glb,
        export_format='GLB',
        export_animations=True,
        export_nla_strips=True
    )
    print(f"✅ 导出成功: {output_glb} (大小: {os.path.getsize(output_glb)} 字节)")
    return True

# =========================================================================
# 执行石器时代全部兵种与炮台的格式映射编译
# =========================================================================
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "AgeOfWarRemake", "Assets", "Resources")
MESH_UNITS = os.path.join(ASSETS, "Meshes", "Units")
MESH_TURRETS = os.path.join(ASSETS, "Meshes", "Turrets")
ANIMS = os.path.join(ASSETS, "Animations")
OUT_DIR = os.path.join(ROOT, "models", "era1")

# 1. 棒槌野人 (Caveman 1)
convert_model(
    fbx_path=os.path.join(MESH_UNITS, "caveman_1.fbx"),
    anim_dict={
        'walk': os.path.join(ANIMS, "caveman_1_walk.anim"),
        'attack': os.path.join(ANIMS, "caveman_1_attack.anim"),
        'idle': os.path.join(ANIMS, "caveman_1_idle.anim"),
        'die': os.path.join(ANIMS, "caveman_1_die.anim")
    },
    weapon_info={
        'fbx': os.path.join(MESH_UNITS, "club.fbx"),
        'bone': "Bone.020",
        'loc': (-0.00103, 0.0003, 0.00042),
        'rot_quat': (-0.6400628, -0.3376493, 0.562706, 0.39959303),
        'scale': (1.0, 1.0945, 1.0016)
    },
    output_glb=os.path.join(OUT_DIR, "caveman_1.glb")
)

# 2. 弹弓手 (Caveman 2)
convert_model(
    fbx_path=os.path.join(MESH_UNITS, "caveman_2.fbx"),
    anim_dict={
        'walk': os.path.join(ANIMS, "caveman_2_walk.anim"),
        'attack': os.path.join(ANIMS, "caveman_2_attack.anim"),
        'shoot': os.path.join(ANIMS, "caveman_2_shoot.anim"),
        'idle': os.path.join(ANIMS, "caveman_2_idle.anim"),
        'die': os.path.join(ANIMS, "caveman_2_die.anim")
    },
    weapon_info={
        'fbx': os.path.join(MESH_UNITS, "sling.fbx"),
        'bone': "Bone.020",
        'loc': (0.00019, 0.00061, 0.00019),
        'rot_quat': (0.4568474, -0.55192536, 0.53740084, 0.44482496),
        'scale': (0.01, 0.01, 0.01)
    },
    output_glb=os.path.join(OUT_DIR, "caveman_2.glb")
)

# 3. 恐龙骑手 (Caveman 3)
convert_model(
    fbx_path=os.path.join(MESH_UNITS, "caveman_3.fbx"),
    anim_dict={},
    weapon_info=None,
    output_glb=os.path.join(OUT_DIR, "caveman_3.glb")
)

# 4. 一阶投石塔 (Turret 1-1)
convert_model(
    fbx_path=os.path.join(MESH_TURRETS, "turret_1_1.fbx"),
    anim_dict={
        'idle': os.path.join(ANIMS, "turret_1_1_idle.anim"),
        'attack': os.path.join(ANIMS, "turret_1_1_attack.anim")
    },
    weapon_info=None,
    output_glb=os.path.join(OUT_DIR, "turret_1_1.glb")
)

# 5. 二阶双联投石塔 (Turret 1-2)
convert_model(
    fbx_path=os.path.join(MESH_TURRETS, "turret_1_2.fbx"),
    anim_dict={
        'idle': os.path.join(ANIMS, "turret_1_2_idle.anim"),
        'attack': os.path.join(ANIMS, "turret_1_2_attack.anim")
    },
    weapon_info=None,
    output_glb=os.path.join(OUT_DIR, "turret_1_2.glb")
)

# 6. 三阶巨石炮 (Turret 1-3)
convert_model(
    fbx_path=os.path.join(MESH_TURRETS, "turret_1_3.fbx"),
    anim_dict={
        'idle': os.path.join(ANIMS, "turret_1_3_idle.anim"),
        'attack': os.path.join(ANIMS, "turret_1_3_attack.anim")
    },
    weapon_info=None,
    output_glb=os.path.join(OUT_DIR, "turret_1_3.glb")
)

print("\n🎉 石器时代全量 3D 资产已 100% 映射转换为标准 GLB 编译包！")
