import bpy
import math
from mathutils import Vector, Euler, Matrix

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_velociraptor_rider():
    clean_scene()
    print("=== [1/6] 导入迅猛龙坐骑 ===")
    mount_fbx = "models/dinosaurs/Dinosaur Animated Pack - Dec 2018/FBX/Velociraptor.fbx"
    bpy.ops.import_scene.fbx(filepath=mount_fbx)

    mount_arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
    mount_mesh = next((o for o in bpy.context.scene.objects if o.type == 'MESH'), None)
    mount_arm.name = "Armature_Mount"

    # 将恐龙整体缩放到真实比例 (体长从 13.4m 缩放到 2.2m: 比例因子 2.2 / 13.4346 ≈ 0.1638)
    scale_factor = 2.2 / 13.4346
    print(f"  坐骑缩放因子: {scale_factor:.4f}")
    mount_arm.scale = (scale_factor, scale_factor, scale_factor)
    bpy.context.view_layer.update()

    # 应用坐骑缩放与变换，使基准变换纯正
    bpy.ops.object.select_all(action='DESELECT')
    mount_arm.select_set(True)
    if mount_mesh: mount_mesh.select_set(True)
    bpy.context.view_layer.objects.active = mount_arm
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # 获取缩放后恐龙鞍座 (Torso) 的真实世界坐标
    torso_pbone = mount_arm.pose.bones.get('Torso') or mount_arm.pose.bones.get('Body')
    torso_world_head = mount_arm.matrix_world @ torso_pbone.head
    print(f"  鞍座 Torso 世界坐标: {torso_world_head}")

    print("=== [2/6] 导入骑手穴居人 ===")
    rider_fbx = "models/era1/caveman_1.fbx"
    bpy.ops.import_scene.fbx(filepath=rider_fbx)

    rider_arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o != mount_arm), None)
    rider_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o != mount_mesh]
    rider_arm.name = "Armature_Rider"

    # 骑手缩放 (原始身高约 0.45m，缩放到 1.35m: 比例约为 3.0)
    rider_scale = 3.0
    rider_arm.scale = (rider_scale, rider_scale, rider_scale)

    # 将骑手移动到恐龙背脊鞍座位置
    # 鞍座高度大致在 torso_world_head 附近稍上方
    saddle_pos = Vector((torso_world_head.x, torso_world_head.y - 0.05, torso_world_head.z + 0.02))
    rider_arm.location = saddle_pos
    # 恐龙在原始 FBX 中朝向 +Y，骑手导入默认朝向 -Y，故旋转 180 度使其朝向前方
    rider_arm.rotation_euler = Euler((math.radians(12), 0, math.radians(180)), 'XYZ')

    bpy.context.view_layer.update()

    print("=== [3/6] 调整骑手为自然跨骑姿态 (Ride Pose) ===")
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rider_arm
    bpy.ops.object.mode_set(mode='POSE')

    pb = rider_arm.pose.bones
    leg_l = pb.get('Bone.002')
    leg_r = pb.get('Bone.004')
    calf_l = pb.get('Bone.005')
    calf_r = pb.get('Bone.006')

    if leg_l and leg_r:
        # 大腿前屈 65 度，向外开角 22 度
        leg_l.rotation_mode = 'XYZ'
        leg_l.rotation_euler = Euler((math.radians(65), math.radians(10), math.radians(22)), 'XYZ')
        leg_r.rotation_mode = 'XYZ'
        leg_r.rotation_euler = Euler((math.radians(65), math.radians(-10), math.radians(-22)), 'XYZ')

    if calf_l and calf_r:
        # 小腿向后向下屈折 65 度
        calf_l.rotation_mode = 'XYZ'
        calf_l.rotation_euler = Euler((math.radians(-65), 0, 0), 'XYZ')
        calf_r.rotation_mode = 'XYZ'
        calf_r.rotation_euler = Euler((math.radians(-65), 0, 0), 'XYZ')

    # 双臂自然前伸呈控龙姿态
    arm_l = pb.get('Bone.015')
    arm_r = pb.get('Bone.016')
    if arm_l and arm_r:
        arm_l.rotation_mode = 'XYZ'
        arm_l.rotation_euler = Euler((math.radians(-20), math.radians(30), math.radians(-25)), 'XYZ')
        arm_r.rotation_mode = 'XYZ'
        arm_r.rotation_euler = Euler((math.radians(-20), math.radians(-30), math.radians(25)), 'XYZ')

    # 躯干稍微前伏
    spine = pb.get('Bone.012')
    if spine:
        spine.rotation_mode = 'XYZ'
        spine.rotation_euler = Euler((math.radians(-12), 0, 0), 'XYZ')

    bpy.ops.object.mode_set(mode='OBJECT')

    # 将 Pose 固化为当前骨骼的 Rest Pose
    bpy.context.view_layer.objects.active = rider_arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # 应用骑手变换
    bpy.ops.object.select_all(action='DESELECT')
    rider_arm.select_set(True)
    for m in rider_meshes: m.select_set(True)
    bpy.context.view_layer.objects.active = rider_arm
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    print("=== [4/6] 骨架合并与骨骼父子级约束 ===")
    bpy.ops.object.select_all(action='DESELECT')
    rider_arm.select_set(True)
    mount_arm.select_set(True)
    bpy.context.view_layer.objects.active = mount_arm
    bpy.ops.object.join()

    unified_arm = mount_arm
    unified_arm.name = "Armature"

    # 进入编辑模式建立父子连接
    bpy.ops.object.mode_set(mode='EDIT')
    eb = unified_arm.data.edit_bones

    torso_eb = eb.get('Torso') or eb.get('Body')
    print(f"  挂载目标父骨骼: {torso_eb.name}")

    # 将骑手的核心骨骼全量父级指定给 Torso
    rider_roots = ['Bone.011', 'Bone.002', 'Bone.004']
    for r_name in rider_roots:
        bone = eb.get(r_name)
        if bone:
            bone.parent = torso_eb
            bone.use_connect = False
            print(f"  成功将 {r_name} 挂入 {torso_eb.name} 子树！")

    bpy.ops.object.mode_set(mode='OBJECT')

    print("=== [5/6] 材质与贴图规范化 ===")
    # 确保骑手身上的材质使用 shirt1.png
    shirt_img_path = "models/era1/shirt1.png"
    import os
    if os.path.exists(shirt_img_path):
        shirt_img = bpy.data.images.load(os.path.abspath(shirt_img_path), check_existing=True)
        for m in rider_meshes:
            for mat_slot in m.material_slots:
                mat = mat_slot.material
                if mat and mat.use_nodes:
                    bsdf = mat.node_tree.nodes.get("Principled BSDF")
                    if bsdf:
                        # 查找或新建 Image Texture 节点
                        tex_node = next((n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE'), None)
                        if not tex_node:
                            tex_node = mat.node_tree.nodes.new('ShaderNodeTexImage')
                            tex_node.location = (-300, 300)
                            mat.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
                        tex_node.image = shirt_img
                        print(f"  已绑定贴图 {shirt_img_path} 到材质 {mat.name}")

    print("=== [6/6] 导出单一游戏级 GLB 文件 ===")
    out_glb = "models/era1/velociraptor_rider_mounted.glb"
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        export_apply=False,
        export_animations=True,
        export_skins=True,
        export_morph=True
    )
    print(f"  导出完成: {out_glb}")

if __name__ == '__main__':
    build_velociraptor_rider()
