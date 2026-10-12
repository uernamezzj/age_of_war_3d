"""
Blender Automated Pipeline: Combine Mount & Rider Rigging
=========================================================
工业级 Blender 自动化装配脚本：骑兵与坐骑骨骼合体与骑姿重定向绑定

用法 (Headless CLI):
  blender -b -P pipeline/combine_mount_blender.py

功能:
1. 自动化导入坐骑 (Dinosaur / Horse / Mech) 与 骑手 (Caveman / Spartan / Knight) FBX
2. 骑手姿态重定向 (Pose Remapping)：大腿前曲、小腿后折、双膝外展，呈紧密贴合马鞍的骑乘受力姿态 (Ride Pose)
3. 骨骼合体 (Hierarchy Parenting)：骑手根骨挂载至坐骑背脊骨 (Torso/Spine)，实现动作同步颠簸
4. 导出一体化游戏级 FBX 模型 (Mounted Unit FBX)
"""

import sys
import math

try:
    import bpy
    import mathutils
except ImportError:
    print("[WARN] Run this script inside Blender: blender -b -P combine_mount_blender.py")
    sys.exit(0)

def clean_scene():
    """清理默认场景"""
    bpy.ops.wm.read_factory_settings(use_empty=True)

def import_fbx(filepath):
    bpy.ops.import_scene.fbx(filepath=filepath)
    return bpy.context.selected_objects

def setup_rider_mount(mount_fbx, rider_fbx, output_fbx):
    clean_scene()
    print(f"[1/5] 导入坐骑: {mount_fbx}")
    mount_objs = import_fbx(mount_fbx)
    mount_armature = next((o for o in mount_objs if o.type == 'ARMATURE'), None)
    
    print(f"[2/5] 导入骑手: {rider_fbx}")
    rider_objs = import_fbx(rider_fbx)
    rider_armature = next((o for o in rider_objs if o.type == 'ARMATURE'), None)

    if not mount_armature or not rider_armature:
        print("[ERROR] 无法找到坐骑或骑手骨架!")
        return False

    # 缩放与定位于马鞍上方
    rider_armature.scale = (0.013, 0.013, 0.013)
    rider_armature.location = (0, 0.38, 0.05)
    rider_armature.rotation_euler = (math.radians(10), math.radians(180), 0)

    # 进入姿态模式调整骑姿 (Ride Pose)
    bpy.context.view_layer.objects.active = rider_armature
    bpy.ops.object.mode_set(mode='POSE')

    # 查找并重定向腿部关节
    pose_bones = rider_armature.pose.bones
    leg_l = pose_bones.get('Bone002') or pose_bones.get('Thigh_L') or pose_bones.get('LeftUpLeg')
    leg_r = pose_bones.get('Bone004') or pose_bones.get('Thigh_R') or pose_bones.get('RightUpLeg')
    knee_l = pose_bones.get('Bone007') or pose_bones.get('Calf_L') or pose_bones.get('LeftLeg')
    knee_r = pose_bones.get('Bone008') or pose_bones.get('Calf_R') or pose_bones.get('RightLeg')

    if leg_l and leg_r:
        # 大腿前倾并外展 (紧贴恐龙腹侧)
        leg_l.rotation_mode = 'XYZ'
        leg_l.rotation_euler = (math.radians(80), math.radians(12), math.radians(22))
        leg_r.rotation_mode = 'XYZ'
        leg_r.rotation_euler = (math.radians(80), math.radians(-12), math.radians(-22))

    if knee_l and knee_r:
        # 小腿后屈 (自然垂于鞍侧)
        knee_l.rotation_mode = 'XYZ'
        knee_l.rotation_euler = (math.radians(-75), 0, 0)
        knee_r.rotation_mode = 'XYZ'
        knee_r.rotation_euler = (math.radians(-75), 0, 0)

    bpy.ops.object.mode_set(mode='OBJECT')

    # 骨骼约束挂载 (Child Of Constraint)
    print("[3/5] 建立骨骼级父子约束...")
    torso_bone = "Torso" if "Torso" in mount_armature.data.bones else "Body"
    root_bone = rider_armature.pose.bones[0]

    constraint = root_bone.constraints.new(type='CHILD_OF')
    constraint.target = mount_armature
    constraint.subtarget = torso_bone

    # 导出整合 FBX
    print(f"[4/5] 导出整合模型: {output_fbx}")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.fbx(
        filepath=output_fbx,
        use_selection=True,
        bake_anim=True,
        bake_anim_use_nla_strips=False,
        bake_anim_use_all_actions=True,
        add_leaf_bones=False
    )
    print("[5/5] 工业级骑兵合体 FBX 导出成功!")
    return True

if __name__ == '__main__':
    mount = "models/dinosaurs/Dinosaur Animated Pack - Dec 2018/FBX/Velociraptor.fbx"
    rider = "models/era1/caveman_1.fbx"
    out = "models/dinosaurs/Velociraptor_Rider_Mounted.fbx"
    setup_rider_mount(mount, rider, out)
