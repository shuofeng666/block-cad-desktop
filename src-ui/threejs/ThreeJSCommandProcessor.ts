// src-ui/threejs/ThreeJSCommandProcessor.ts
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { hull } from "../utils/hull";
import { scope } from "../jscad/Scope";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export class ThreeJSCommandProcessor {
  private scene: THREE.Scene;
  private currentObjects: Map<string, THREE.Object3D> = new Map();
  private glViewer: any;

  constructor(glViewer: any) {
    this.glViewer = glViewer;
    this.scene = glViewer.scene;
  }

  async processCommand(cmd: any): Promise<any> {
    console.log("Processing command:", cmd.id, cmd.args);

    try {
      let result = null;

      switch (cmd.id) {
        case "upload_stl":
          result = await this.uploadSTL(cmd.args.file);
          break;

        case "create_cube":
          result = this.createCube(cmd.args.size);
          break;

        case "generate_wire_mesh":
          result = await this.generateWireMesh(cmd);
          break;

        case "show_in_viewer":
          result = await this.showInViewer(cmd);
          break;

        case "clear_scene":
          result = this.clearScene();
          break;

        case "export_wire_csv":
          result = await this.exportWireCSV(cmd);
          break;

        default:
          console.warn("Unknown command:", cmd.id);
          return null;
      }

      console.log(`Command ${cmd.id} completed with result:`, result);
      return result;
    } catch (error) {
      console.error("Error processing command:", cmd.id, error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      return null;
    }
  }

  private async loadSTL(filename: string): Promise<string> {
    const loader = new STLLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        `/models/${filename}`,
        (geometry) => {
          // 中心化几何体
          geometry.center();
          const material = new THREE.MeshNormalMaterial({
            transparent: true,
            opacity: 0.8,
          });
          const mesh = new THREE.Mesh(geometry, material);

          const id = `stl_${Date.now()}`;
          this.currentObjects.set(id, mesh);

          // 存储到 scope 中以供其他命令使用
          scope.setVar("_currentObjectId", id);

          resolve(id);
        },
        (progress) => {
          console.log("Loading progress:", progress);
        },
        (error) => {
          console.error("Error loading STL:", error);
          reject(error);
        }
      );
    });
  }

  private createCube(size: number): string {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);

    const id = `cube_${Date.now()}`;
    this.currentObjects.set(id, cube);
    scope.setVar("_currentObjectId", id);
    return id;
  }

  // 在 ThreeJSCommandProcessor.ts 中，确保 uploadSTL 方法正确实现：

  private async uploadSTL(file: File): Promise<string> {
    console.log("开始上传 STL 文件:", file.name, file.size);
    const loader = new STLLoader();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        console.log("文件读取完成，开始解析...");
        const arrayBuffer = e.target.result as ArrayBuffer;

        try {
          // 检查 ArrayBuffer
          console.log("ArrayBuffer 大小:", arrayBuffer.byteLength);

          // 解析 STL 文件
let geometry = loader.parse(arrayBuffer);
if (!geometry.index) {
  geometry = mergeVertices(geometry);
}


          console.log(
            "几何体解析成功，顶点数:",
            geometry.attributes.position.count
          );

          geometry.center();
          geometry.computeBoundingBox();

          // 创建材质
          const material = new THREE.MeshNormalMaterial({
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
          });

          // 创建网格
          const mesh = new THREE.Mesh(geometry, material);

          // 生成唯一 ID
          const id = `stl_${Date.now()}`;
          this.currentObjects.set(id, mesh);

          // 保存当前对象 ID 供后续操作使用
          scope.setVar("_currentObjectId", id);

          console.log("STL 文件处理成功，ID:", id);
          resolve(id);
        } catch (error) {
          console.error("解析 STL 文件失败:", error);
          console.error("错误详情:", error.message);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("读取文件失败:", error);
        reject(error);
      };

      // 读取文件为 ArrayBuffer
      reader.readAsArrayBuffer(file);
    });
  }

  private async generateHorizontalWires(cmd: any): Promise<string> {
    // 获取当前对象 ID
    let objectId = scope.context["_currentObjectId"];

    // 如果有子命令，处理它们
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processCommand(child);
        if (result) objectId = result;
      }
    }

    const model = this.currentObjects.get(objectId);
    if (!model || !(model instanceof THREE.Mesh)) {
      console.error("No valid mesh found for wire generation");
      return null;
    }

    const count = parseInt(cmd.args.count) || 10;
    const wires = new THREE.Group();

    // 计算边界框
    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = boundingBox.getSize(new THREE.Vector3());

    // 生成水平线框
    for (let i = 0; i < count; i++) {
      const y = boundingBox.min.y + (i + 0.5) * (size.y / count);
      const wire = this.createHorizontalWire(model, y, boundingBox, size);
      if (wire) wires.add(wire);
    }

    const id = `h_wires_${Date.now()}`;
    this.currentObjects.set(id, wires);
    scope.setVar("_currentObjectId", id);

    // 存储线框数据供导出使用
    scope.setVar("_horizontalWires", wires);

    return id;
  }

  private createHorizontalWire(
    model: THREE.Mesh,
    y: number,
    boundingBox: THREE.Box3,
    size: THREE.Vector3
  ) {
    try {
      const intersectionPoints = [];
      const geometry = model.geometry;
      const vertices = geometry.attributes.position;
      const indices = geometry.index;

      // 创建平面
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);

      // 计算交点
      if (indices) {
        for (let i = 0; i < indices.count; i += 3) {
          const a = new THREE.Vector3().fromBufferAttribute(
            vertices,
            indices.getX(i)
          );
          const b = new THREE.Vector3().fromBufferAttribute(
            vertices,
            indices.getX(i + 1)
          );
          const c = new THREE.Vector3().fromBufferAttribute(
            vertices,
            indices.getX(i + 2)
          );

          model.localToWorld(a);
          model.localToWorld(b);
          model.localToWorld(c);

          this.addIntersectionPoints(a, b, c, plane, intersectionPoints);
        }
      }

      if (intersectionPoints.length < 3) return null;

      // 使用 hull 算法
      const points2D = intersectionPoints.map((p) => [p.x, p.z]);
      const hullPoints = hull(points2D, 20);

      if (!hullPoints || hullPoints.length < 3) return null;

      // 创建线条
      const linePoints = hullPoints.map(
        (p) => new THREE.Vector3(p[0], y, p[1])
      );
      linePoints.push(linePoints[0].clone()); // 闭合

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

      return new THREE.Line(lineGeometry, lineMaterial);
    } catch (error) {
      console.error("Error creating horizontal wire:", error);
      return null;
    }
  }

  private addIntersectionPoints(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    plane: THREE.Plane,
    points: THREE.Vector3[]
  ) {
    const line1 = new THREE.Line3(a, b);
    const line2 = new THREE.Line3(b, c);
    const line3 = new THREE.Line3(c, a);

    const target = new THREE.Vector3();

    if (plane.intersectLine(line1, target)) points.push(target.clone());
    if (plane.intersectLine(line2, target)) points.push(target.clone());
    if (plane.intersectLine(line3, target)) points.push(target.clone());
  }

  private async generateVerticalWires(cmd: any): Promise<string> {
    // 与 generateHorizontalWires 类似，但在 Z 方向
    let objectId = scope.context["_currentObjectId"];

    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processCommand(child);
        if (result) objectId = result;
      }
    }

    const model = this.currentObjects.get(objectId);
    if (!model || !(model instanceof THREE.Mesh)) {
      console.error("No valid mesh found for wire generation");
      return null;
    }

    const count = parseInt(cmd.args.count) || 10;
    const wires = new THREE.Group();

    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = boundingBox.getSize(new THREE.Vector3());

    for (let i = 0; i < count; i++) {
      const z = boundingBox.min.z + (i + 0.5) * (size.z / count);
      const wire = this.createVerticalWire(model, z, boundingBox, size);
      if (wire) wires.add(wire);
    }

    const id = `v_wires_${Date.now()}`;
    this.currentObjects.set(id, wires);
    scope.setVar("_currentObjectId", id);
    scope.setVar("_verticalWires", wires);

    return id;
  }

  private createVerticalWire(
    model: THREE.Mesh,
    z: number,
    boundingBox: THREE.Box3,
    size: THREE.Vector3
  ) {
    try {
      const intersectionPoints = [];
      const geometry = model.geometry;
      const vertices = geometry.attributes.position;
      const indices = geometry.index;

      // 创建垂直平面（沿 Z 轴）
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -z);

      // 计算交点
      if (indices) {
        for (let i = 0; i < indices.count; i += 3) {
          const a = new THREE.Vector3().fromBufferAttribute(
            vertices,
            indices.getX(i)
          );
          const b = new THREE.Vector3().fromBufferAttribute(
            vertices,
            indices.getX(i + 1)
          );
          const c = new THREE.Vector3().fromBufferAttribute(
            vertices,
            indices.getX(i + 2)
          );

          model.localToWorld(a);
          model.localToWorld(b);
          model.localToWorld(c);

          this.addIntersectionPoints(a, b, c, plane, intersectionPoints);
        }
      }

      if (intersectionPoints.length < 3) return null;

      // 使用 hull 算法（投影到 XY 平面）
      const points2D = intersectionPoints.map((p) => [p.x, p.y]);
      const hullPoints = hull(points2D, 20);

      if (!hullPoints || hullPoints.length < 3) return null;

      // 创建线条
      const linePoints = hullPoints.map(
        (p) => new THREE.Vector3(p[0], p[1], z)
      );
      linePoints.push(linePoints[0].clone()); // 闭合

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

      return new THREE.Line(lineGeometry, lineMaterial);
    } catch (error) {
      console.error("Error creating vertical wire:", error);
      return null;
    }
  }

  // 在 ThreeJSCommandProcessor.ts 中添加测试方法
  private async showInViewer(cmd: any): Promise<void> {
    console.log("ShowInViewer 开始执行");
    let objectId = scope.context["_currentObjectId"];
    console.log("当前对象 ID:", objectId);

    // 列出所有可用的对象
    console.log("所有可用对象:", Array.from(this.currentObjects.keys()));

    const object = this.currentObjects.get(objectId);
    console.log("找到对象:", object ? object.type : "未找到");

    if (object) {
      // 清空场景
      this.glViewer.clearScene();

      // 添加一些基础元素帮助调试
      // 添加坐标轴
      const axesHelper = new THREE.AxesHelper(100);
      this.glViewer.scene.add(axesHelper);

      // 添加网格
      const gridHelper = new THREE.GridHelper(200, 20);
      this.glViewer.scene.add(gridHelper);

      // 克隆并添加对象
      const clonedObject = object.clone();
      this.glViewer.scene.add(clonedObject);

      // 确保对象可见
      clonedObject.visible = true;
      if (clonedObject instanceof THREE.Group) {
        clonedObject.traverse((child) => {
          child.visible = true;
          if (child instanceof THREE.Line) {
            // 确保线条可见
            (child.material as THREE.LineBasicMaterial).visible = true;
          }
        });
      }

      // 计算边界框
      const boundingBox = new THREE.Box3().setFromObject(clonedObject);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      console.log("模型尺寸:", size);
      console.log("模型中心:", center);

      // 如果对象太小，放大它
      if (size.length() < 1) {
        const scale = 10 / size.length();
        clonedObject.scale.multiplyScalar(scale);
        console.log("模型太小，放大了", scale, "倍");
      }

      // 重新计算边界框
      boundingBox.setFromObject(clonedObject);
      const newSize = boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(newSize.x, newSize.y, newSize.z);
      const distance = maxDim * 3;

      // 设置相机
      const camera = this.glViewer.camera;
      camera.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
      );
      camera.lookAt(center);

      // 更新相机参数
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.near = 0.1;
        camera.far = distance * 10;
        camera.updateProjectionMatrix();
      }

      // 更新控制器
      this.glViewer.orbitControl.target.copy(center);
      this.glViewer.orbitControl.update();

      console.log("相机位置:", camera.position);
      console.log("相机目标:", center);
      console.log("场景中的对象数:", this.glViewer.scene.children.length);

      // 添加灯光确保能看到对象
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(1, 1, 1);
      this.glViewer.scene.add(ambientLight);
      this.glViewer.scene.add(directionalLight);


    } else {
      console.error("未找到要显示的对象，ID:", objectId);
    }
  }

  // 添加新的方法到 ThreeJSCommandProcessor 类中
  private async generateWireMesh(cmd: any): Promise<string> {
    let objectId = scope.context["_currentObjectId"];

    // 处理子命令获取模型
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processCommand(child);
        if (result) objectId = result;
      }
    }

    const model = this.currentObjects.get(objectId);
    if (!model || !(model instanceof THREE.Mesh)) {
      console.error("No valid mesh found for wire generation");
      return null;
    }

    const wireGroup = new THREE.Group();
    const hCount = cmd.args.hCount || 10;
    const vCount = cmd.args.vCount || 10;

    // 生成水平线框
    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = boundingBox.getSize(new THREE.Vector3());

    // 水平线框
    for (let i = 0; i < hCount; i++) {
      const y = boundingBox.min.y + (i + 0.5) * (size.y / hCount);
      const wire = this.createHorizontalWire(model, y, boundingBox, size);
      if (wire) wireGroup.add(wire);
    }

    // 垂直线框
    for (let i = 0; i < vCount; i++) {
      const z = boundingBox.min.z + (i + 0.5) * (size.z / vCount);
      const wire = this.createVerticalWire(model, z, boundingBox, size);
      if (wire) wireGroup.add(wire);
    }

    const id = `wire_mesh_${Date.now()}`;
    this.currentObjects.set(id, wireGroup);
    scope.setVar("_currentObjectId", id);
    scope.setVar("_wireMesh", wireGroup);

    return id;
  }

  private async exportWireCSV(cmd: any): Promise<void> {
    const filename = cmd.args.filename || "wire_mesh";

    // 导出水平线框
    const horizontalWires = scope.context["_horizontalWires"];
    if (horizontalWires instanceof THREE.Group) {
      this.exportGroupToCSV(horizontalWires, `${filename}_horizontal`);
    }

    // 导出垂直线框
    const verticalWires = scope.context["_verticalWires"];
    if (verticalWires instanceof THREE.Group) {
      this.exportGroupToCSV(verticalWires, `${filename}_vertical`);
    }
  }

  private exportGroupToCSV(group: THREE.Group, baseFilename: string) {
    group.children.forEach((child, index) => {
      if (child instanceof THREE.Line) {
        const geometry = child.geometry;
        const positions = geometry.attributes.position;

        let csvContent = "x,y,z\n";
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i).toFixed(2);
          const y = positions.getY(i).toFixed(2);
          const z = positions.getZ(i).toFixed(2);
          csvContent += `${x},${y},${z}\n`;
        }

        // 下载文件
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseFilename}_${index + 1}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  }

  private clearScene(): void {
    this.glViewer.clearScene();
    // 清理存储的对象引用
    this.currentObjects.clear();
    scope.setVar("_currentObjectId", null);
    scope.setVar("_horizontalWires", null);
    scope.setVar("_verticalWires", null);
  }
}
