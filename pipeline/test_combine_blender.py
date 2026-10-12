import bpy
import math

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_velociraptor_rider(mount_path, rider_path, output_glb):
    clean_scene()
    print("[1/6] 导入坐骑 FBX...")
    bpy.ops.import_scene.fbx(filepath=mount_path)
    mount_arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
    if not mount_arm:
        raise RuntimeError("未找到坐骑骨架")
    mount_arm.name = "Armature_Mount"

    print("[2/6] 导入骑手 FBX...")
    bpy.ops.import_scene.fbx(filepath=rider_path)
    # 找到骑手的骨架 (新导入的未命名为 Armature_Mount 的骨架)
    rider_arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o != mount_arm), None)
    if not rider_arm:
        raise RuntimeError("未找到骑手骨架")
    rider_arm.name = "Armature_Rider"

    print("[3/6] 调整骑手缩放与骑姿位置...")
    # 迅猛龙背脊高约 0.35 - 0.45 左右，骑手调整合适大小
    rider_arm.scale = (0.012, 0.012, 0.012)
    # 坐标移动到迅猛龙 Torso 上方
    rider_arm.location = (0.0, 0.05, 0.38)
    rider_arm.rotation_euler = (0, 0, math.radians(180)) # 面朝前方 (+Y)

    # 切换到 Pose Mode 调整骑乘大腿张角
    bpy.context.view_layer.objects.active = rider_arm
    bpy.ops.object.mode_set(mode='POSE')

    pose_bones = rider_arm.pose.bones
    leg_l = pose_bones.get('Bone.002')
    leg_r = pose_bones.get('Bone.004')
    calf_l = pose_bones.get('Bone.005')
    calf_r = pose_bones.get('Bone.006')

    if leg_l and leg_r:
        # 大腿前屈并向外展开 (夹紧龙背)
        leg_l.rotation_mode = 'XYZ'
        leg_l.rotation_euler = (math.radians(70), math.radians(15), math.radians(20))
        leg_r.rotation_mode = 'XYZ'
        leg_r.rotation_euler = (math.radians(70), math.radians(-15), math.radians(-20))

    if calf_l and calf_r:
        # 小腿向后向下屈
        calf_l.rotation_mode = 'XYZ'
        calf_l.rotation_euler = (math.radians(-60), 0, 0)
        calf_r.rotation_mode = 'XYZ'
        calf_r.rotation_euler = (math.radians(-60), 0, 0)

    # 上身稍前倾，双手自然微张
    spine = pose_bones.get('Bone.012')
    if spine:
        spine.rotation_mode = 'XYZ'
        spine.rotation_euler = (math.radians(-10), 0, 0)

    # 将 Pose 固化为当前骨架的 Rest Pose
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # 应用骑手骨架的变换 (Transform Apply)
    bpy.ops.object.select_all(action='DESELECT')
    rider_arm.select_set(True)
    # 也需要选中绑定到 rider_arm 的 mesh 吗？由于 armature_apply 会重设 rest pose，我们同时 apply scale/loc
    # 注意：如果直接 apply transform，有时子网格会变形，保险起见通过 Child-Of 或者合并 EditBones。
    
    print("[4/6] 合并骨架为统一 Armature (Join Armatures)...")
    bpy.ops.object.select_all(action='DESELECT')
    rider_arm.select_set(True)
    mount_arm.select_set(True)
    bpy.context.view_layer.objects.active = mount_arm
    bpy.ops.object.join()

    # 此时 mount_arm 包含了两个骨架的所有骨骼
    unified_arm = mount_arm
    unified_arm.name = "Armature"

    print("[5/6] 建立父子骨骼约束层级 (Parenting Rider to Torso)...")
    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = unified_arm.data.edit_bones

    target_parent = edit_bones.get('Torso') or edit_bones.get('Body')
    if not target_parent:
        print("[WARN] 未找到 Torso 或 Body，使用根骨骼")
        target_parent = edit_bones[0]

    rider_root_bones = ['Bone.011', 'Bone.002', 'Bone.004']
    for b_name in rider_root_bones:
        b = edit_bones.get(b_name)
        if b:
            b.parent = target_parent
            b.use_connect = False
            print(f"  成功将骑手骨骼 {b_name} 挂载到坐骑骨骼 {target_parent.name}")

    bpy.ops.object.mode_set(mode='OBJECT')

    print(f"[6/6] 导出一体化 GLB 模型: {output_glb}")
    bpy.ops.export_scene.gltf(
        filepath=output_glb,
        export_format='GLB',
        export_apply=False,
        export_animations=True,
        export_skins=True,
        export_morph=True
    )
    print("=== 导出完成！一体化模型生成成功！ ===")

if __name__ == '__main__':
    mount = "models/dinosaurs/Dinosaur Animated Pack - Dec 2018/FBX/Velociraptor.fbx"
    rider = "models/era1/caveman_1.fbx"
    out_glb = "models/era1/velociraptor_rider_mounted.glb"
    build_velociraptor_rider(mount, rider, out_glb)
