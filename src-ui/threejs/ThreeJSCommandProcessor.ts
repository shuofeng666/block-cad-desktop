// src-ui/threejs/ThreeJSCommandProcessor.ts
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { hull } from "../utils/hull";
import { scope } from "../core/Scope";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ControlPanel } from "../components/ControlPanel";

export class ThreeJSCommandProcessor {
  private scene: THREE.Scene;
  private currentObjects: Map<string, THREE.Object3D> = new Map();
  private glViewer: any;
  private controlPanel?: ControlPanel; // 添加控制面板属性，使用可选类型
  private currentSceneObject: THREE.Object3D | null = null; // 跟踪当前场景中显示的对象

  constructor(glViewer: any, controlPanel?: ControlPanel) {
    this.glViewer = glViewer;
    this.scene = glViewer.scene;
    this.controlPanel = controlPanel; // 保存控制面板引用

    console.log(
      "[ThreeJSCommandProcessor] Initialized with controlPanel:",
      !!controlPanel
    );
  }

  async processCommand(cmd: any): Promise<any> {
    console.log(
      "[ThreeJSCommandProcessor] Processing command:",
      cmd.id,
      cmd.args
    );

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

        case "rotate_model":
          result = this.rotateModel(cmd);
          break;

        case "scale_model":
          result = this.scaleModel(cmd);
          break;

        case "translate_model":
          result = this.translateModel(cmd);
          break;

        default:
          console.warn("[ThreeJSCommandProcessor] Unknown command:", cmd.id);
          return null;
      }

      console.log(
        `[ThreeJSCommandProcessor] Command ${cmd.id} completed with result:`,
        result
      );
      return result;
    } catch (error) {
      console.error(
        "[ThreeJSCommandProcessor] Error processing command:",
        cmd.id,
        error
      );
      if (error instanceof Error) {
        console.error("[ThreeJSCommandProcessor] Error stack:", error.stack);
      }
      return null;
    }
  }

  clearState() {
    // 清理存储的对象引用
    this.currentObjects.clear();
    scope.setVar("_currentObjectId", null);
    scope.setVar("_wireMesh", null);
    scope.setVar("_rotateModelValues", null);
    scope.setVar("_scaleModelValue", null);
    scope.setVar("_translateModelValues", null);

    // 清理控制面板（如果存在）
    if (this.controlPanel) {
      this.controlPanel.clear();
    }

    console.log(
      "[ThreeJSCommandProcessor] State cleared, including control panel"
    );
  }

  // ThreeJSCommandProcessor.ts 中添加旋转控件的实现

  /**
   * 旋转模型方法实现，包含控制面板支持
   */
  private rotateModel(cmd: any): string {
    console.log("[rotateModel] Starting with args:", cmd.args);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[rotateModel] No current object ID found");
      return null;
    }

    const object = this.currentObjects.get(objectId);
    if (!object) {
      console.error("[rotateModel] Object not found with ID:", objectId);
      return null;
    }

    console.log(
      "[rotateModel] Found object:",
      object.type,
      "with ID:",
      objectId
    );

    const rotateX = (cmd.args.rotateX * Math.PI) / 180;
    const rotateY = (cmd.args.rotateY * Math.PI) / 180;
    const rotateZ = (cmd.args.rotateZ * Math.PI) / 180;

    // 存储原始值用于UI初始化
    if (!scope.context["_rotateModelValues"]) {
      scope.context["_rotateModelValues"] = {
        rotateX: cmd.args.rotateX,
        rotateY: cmd.args.rotateY,
        rotateZ: cmd.args.rotateZ,
      };
      console.log(
        "[rotateModel] Initialized rotation values:",
        scope.context["_rotateModelValues"]
      );
    } else {
      // 累积旋转值
      const values = scope.context["_rotateModelValues"];
      values.rotateX += cmd.args.rotateX;
      values.rotateY += cmd.args.rotateY;
      values.rotateZ += cmd.args.rotateZ;
      console.log("[rotateModel] Updated rotation values:", values);
    }

    // 应用旋转变换
    object.rotation.x += rotateX;
    object.rotation.y += rotateY;
    object.rotation.z += rotateZ;

    console.log("[rotateModel] Applied rotation. New rotation:", {
      x: (object.rotation.x * 180) / Math.PI,
      y: (object.rotation.y * 180) / Math.PI,
      z: (object.rotation.z * 180) / Math.PI,
    });

    // 设置控制面板
    if (this.controlPanel) {
      if (this.controlPanel.getCurrentCommandId() !== "rotate_model") {
        console.log("[rotateModel] Setting up control panel for rotation");
        this.controlPanel.setCommand("rotate_model", "Rotate Model");

        // X 旋转控件
        this.controlPanel.addControl({
          id: "rotateX",
          type: "slider",
          label: "Rotate X",
          min: -180,
          max: 180,
          step: 1,
          value: 0,
          onChange: (value) =>
            this.onRotateValueChange("rotateX", value as number),
        });

        // Y 旋转控件
        this.controlPanel.addControl({
          id: "rotateY",
          type: "slider",
          label: "Rotate Y",
          min: -180,
          max: 180,
          step: 1,
          value: 0,
          onChange: (value) =>
            this.onRotateValueChange("rotateY", value as number),
        });

        // Z 旋转控件
        this.controlPanel.addControl({
          id: "rotateZ",
          type: "slider",
          label: "Rotate Z",
          min: -180,
          max: 180,
          step: 1,
          value: 0,
          onChange: (value) =>
            this.onRotateValueChange("rotateZ", value as number),
        });
      } else {
        // 不更新控件值，让用户自己调整
        console.log("[rotateModel] Control panel already exists for rotation");
      }
    } else {
      console.warn("[rotateModel] Control panel not available");
    }

    return objectId;
  }

  /**
   * 处理旋转控件值变化
   */
  private onRotateValueChange(axis: string, value: number): void {
    console.log(`[onRotateValueChange] ${axis} changed to ${value}`);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[onRotateValueChange] No current object ID found");
      return;
    }

    const object = this.currentObjects.get(objectId);
    if (!object) {
      console.error(
        "[onRotateValueChange] Object not found with ID:",
        objectId
      );
      return;
    }

    // 将角度转换为弧度
    const angleRadians = (value * Math.PI) / 180;

    // 获取当前物体的旋转值（以弧度为单位）
    const currentRotationX = object.rotation.x;
    const currentRotationY = object.rotation.y;
    const currentRotationZ = object.rotation.z;

    // 根据轴设置新的旋转值
    switch (axis) {
      case "rotateX":
        object.rotation.x = angleRadians;
        break;
      case "rotateY":
        object.rotation.y = angleRadians;
        break;
      case "rotateZ":
        object.rotation.z = angleRadians;
        break;
    }

    // 如果已经在场景中显示了对象，也更新其旋转
    if (this.currentSceneObject) {
      switch (axis) {
        case "rotateX":
          this.currentSceneObject.rotation.x = angleRadians;
          break;
        case "rotateY":
          this.currentSceneObject.rotation.y = angleRadians;
          break;
        case "rotateZ":
          this.currentSceneObject.rotation.z = angleRadians;
          break;
      }
    }

    console.log(
      `[onRotateValueChange] Applied new rotation to ${axis}. Previous: ${
        axis === "rotateX"
          ? currentRotationX
          : axis === "rotateY"
          ? currentRotationY
          : currentRotationZ
      } rad, New: ${angleRadians} rad`
    );
  }

  // ThreeJSCommandProcessor.ts 中添加缩放控件的实现

  /**
   * 缩放模型方法实现，包含控制面板支持
   */
  private scaleModel(cmd: any): string {
    console.log("[scaleModel] Starting with args:", cmd.args);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[scaleModel] No current object ID found");
      return null;
    }

    const object = this.currentObjects.get(objectId);
    if (!object) {
      console.error("[scaleModel] Object not found with ID:", objectId);
      return null;
    }

    console.log(
      "[scaleModel] Found object:",
      object.type,
      "with ID:",
      objectId
    );

    const scale = cmd.args.scale;

    // 存储原始值用于UI初始化
    if (!scope.context["_scaleModelValue"]) {
      scope.context["_scaleModelValue"] = scale;
      console.log("[scaleModel] Initialized scale value:", scale);
    } else {
      // 累积缩放值
      scope.context["_scaleModelValue"] *= scale;
      console.log(
        "[scaleModel] Updated scale value:",
        scope.context["_scaleModelValue"]
      );
    }

    // 应用缩放
    console.log("[scaleModel] Current scale before:", object.scale.x);
    object.scale.multiplyScalar(scale);
    console.log("[scaleModel] Applied scale. New scale:", object.scale.x);

    // 设置控制面板
    // 设置控制面板
    // 设置控制面板 - 这部分需要修改
    if (this.controlPanel) {
      if (this.controlPanel.getCurrentCommandId() !== "scale_model") {
        console.log("[scaleModel] Setting up control panel for scaling");
        this.controlPanel.setCommand("scale_model", "Scale Model");

        // 创建缩放控件 - 使用当前对象的实际缩放值
        this.controlPanel.addControl({
          id: "scale",
          type: "slider",
          label: "Scale Factor",
          min: 0.1,
          max: 5.0,
          step: 0.1,
          value: object.scale.x, // 使用当前对象的实际缩放值
          onChange: (value) => this.onScaleValueChange(value as number),
        });
      } else {
        // 更新控件值为当前缩放值
        this.controlPanel.updateControl("scale", object.scale.x);
        console.log(
          "[scaleModel] Updated control panel scale value:",
          object.scale.x
        );
      }
    } else {
      console.warn("[scaleModel] Control panel not available");
    }

    return objectId;
  }

  /**
   * 处理缩放控件值变化
   */
  private onScaleValueChange(value: number): void {
    console.log(`[onScaleValueChange] Scale changed to ${value}`);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[onScaleValueChange] No current object ID found");
      return;
    }

    const object = this.currentObjects.get(objectId);
    if (!object) {
      console.error("[onScaleValueChange] Object not found with ID:", objectId);
      return;
    }

    // 记录当前缩放
    const currentScaleX = object.scale.x;

    // 重置缩放到统一值
    object.scale.set(value, value, value);

    // 如果已经在场景中显示了对象，也更新其缩放
    if (this.currentSceneObject) {
      this.currentSceneObject.scale.set(value, value, value);
    }

    console.log(
      `[onScaleValueChange] Applied new scale. Previous: ${currentScaleX}, New: ${value}`
    );
  }

  // ThreeJSCommandProcessor.ts 中添加平移控件的实现

  /**
   * 平移模型方法实现，包含控制面板支持
   */
  private translateModel(cmd: any): string {
    console.log("[translateModel] Starting with args:", cmd.args);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[translateModel] No current object ID found");
      return null;
    }

    const object = this.currentObjects.get(objectId);
    if (!object) {
      console.error("[translateModel] Object not found with ID:", objectId);
      return null;
    }

    console.log(
      "[translateModel] Found object:",
      object.type,
      "with ID:",
      objectId
    );

    // 存储原始值用于UI初始化
    if (!scope.context["_translateModelValues"]) {
      scope.context["_translateModelValues"] = {
        translateX: cmd.args.translateX,
        translateY: cmd.args.translateY,
        translateZ: cmd.args.translateZ,
      };
      console.log(
        "[translateModel] Initialized translation values:",
        scope.context["_translateModelValues"]
      );
    } else {
      // 累积平移值
      const values = scope.context["_translateModelValues"];
      values.translateX += cmd.args.translateX;
      values.translateY += cmd.args.translateY;
      values.translateZ += cmd.args.translateZ;
      console.log("[translateModel] Updated translation values:", values);
    }

    // 应用平移
    console.log("[translateModel] Current position before:", object.position);
    object.position.x += cmd.args.translateX;
    object.position.y += cmd.args.translateY;
    object.position.z += cmd.args.translateZ;
    console.log(
      "[translateModel] Applied translation. New position:",
      object.position
    );

    // 设置控制面板
    if (this.controlPanel) {
      if (this.controlPanel.getCurrentCommandId() !== "translate_model") {
        console.log(
          "[translateModel] Setting up control panel for translation"
        );
        this.controlPanel.setCommand("translate_model", "Translate Model");

        // X 平移控件
        this.controlPanel.addControl({
          id: "translateX",
          type: "slider",
          label: "Translate X",
          min: -100,
          max: 100,
          step: 1,
          value: object.position.x, // 使用当前位置作为控件的初始值
          onChange: (value) =>
            this.onTranslateValueChange("translateX", value as number),
        });

        // Y 平移控件
        this.controlPanel.addControl({
          id: "translateY",
          type: "slider",
          label: "Translate Y",
          min: -100,
          max: 100,
          step: 1,
          value: object.position.y,
          onChange: (value) =>
            this.onTranslateValueChange("translateY", value as number),
        });

        // Z 平移控件
        this.controlPanel.addControl({
          id: "translateZ",
          type: "slider",
          label: "Translate Z",
          min: -100,
          max: 100,
          step: 1,
          value: object.position.z,
          onChange: (value) =>
            this.onTranslateValueChange("translateZ", value as number),
        });
      } else {
        // 不更新控件值，让用户自己调整
        console.log(
          "[translateModel] Control panel already exists for translation"
        );
      }
    } else {
      console.warn("[translateModel] Control panel not available");
    }

    return objectId;
  }

  /**
   * 处理平移控件值变化
   */
  private onTranslateValueChange(axis: string, value: number): void {
    console.log(`[onTranslateValueChange] ${axis} changed to ${value}`);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[onTranslateValueChange] No current object ID found");
      return;
    }

    const object = this.currentObjects.get(objectId);
    if (!object) {
      console.error(
        "[onTranslateValueChange] Object not found with ID:",
        objectId
      );
      return;
    }

    // 记录当前位置
    const currentPosition = object.position.clone();

    // 根据轴设置新的位置
    switch (axis) {
      case "translateX":
        object.position.x = value;
        break;
      case "translateY":
        object.position.y = value;
        break;
      case "translateZ":
        object.position.z = value;
        break;
    }

    // 如果已经在场景中显示了对象，也更新其位置
    if (this.currentSceneObject) {
      switch (axis) {
        case "translateX":
          this.currentSceneObject.position.x = value;
          break;
        case "translateY":
          this.currentSceneObject.position.y = value;
          break;
        case "translateZ":
          this.currentSceneObject.position.z = value;
          break;
      }
    }

    console.log(
      `[onTranslateValueChange] Applied new position for ${axis}. Previous: ${
        axis === "translateX"
          ? currentPosition.x
          : axis === "translateY"
          ? currentPosition.y
          : currentPosition.z
      }, New: ${value}`
    );
  }

  private async uploadSTL(file: File): Promise<string> {
    console.log("开始上传 STL 文件:", file.name, file.size);
    const loader = new STLLoader();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        console.log("文件读取完成，开始解析...");
        const arrayBuffer = e.target.result as ArrayBuffer;

        try {
          console.log("ArrayBuffer 大小:", arrayBuffer.byteLength);

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

          const material = new THREE.MeshNormalMaterial({
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
          });

          const mesh = new THREE.Mesh(geometry, material);

          const id = `stl_${Date.now()}`;
          this.currentObjects.set(id, mesh);

          scope.setVar("_currentObjectId", id);

          console.log("STL 文件处理成功，ID:", id);
          resolve(id);
        } catch (error) {
          console.error("解析 STL 文件失败:", error);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("读取文件失败:", error);
        reject(error);
      };

      reader.readAsArrayBuffer(file);
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
    const useTubes = cmd.args.useTubes || false;
    const tubeThickness = cmd.args.tubeThickness || 0.5;

    // 生成水平线框
    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = boundingBox.getSize(new THREE.Vector3());

    // 水平线框
    for (let i = 0; i < hCount; i++) {
      const y = boundingBox.min.y + (i + 0.5) * (size.y / hCount);
      const wire = this.createHorizontalWire(
        model,
        y,
        boundingBox,
        size,
        useTubes,
        tubeThickness
      );
      if (wire) wireGroup.add(wire);
    }

    // 垂直线框
    for (let i = 0; i < vCount; i++) {
      const z = boundingBox.min.z + (i + 0.5) * (size.z / vCount);
      const wire = this.createVerticalWire(
        model,
        z,
        boundingBox,
        size,
        useTubes,
        tubeThickness
      );
      if (wire) wireGroup.add(wire);
    }

    const id = `wire_mesh_${Date.now()}`;
    this.currentObjects.set(id, wireGroup);
    scope.setVar("_currentObjectId", id);
    scope.setVar("_wireMesh", wireGroup);

    return id;
  }

  private createHorizontalWire(
    model: THREE.Mesh,
    y: number,
    boundingBox: THREE.Box3,
    size: THREE.Vector3,
    useTubes: boolean = false,
    tubeThickness: number = 0.5
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

      // 创建线条点
      const linePoints = hullPoints.map(
        (p) => new THREE.Vector3(p[0], y, p[1])
      );
      linePoints.push(linePoints[0].clone()); // 闭合

      if (useTubes) {
        // 创建 CatmullRomCurve3
        const curve = new THREE.CatmullRomCurve3(linePoints, true);
        const tubeGeometry = new THREE.TubeGeometry(
          curve,
          linePoints.length * 4,
          tubeThickness,
          8,
          true
        );
        const tubeMaterial = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          shininess: 100,
          specular: 0x222222,
        });
        return new THREE.Mesh(tubeGeometry, tubeMaterial);
      } else {
        // 创建线条
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(
          linePoints
        );
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 2,
        });
        return new THREE.Line(lineGeometry, lineMaterial);
      }
    } catch (error) {
      console.error("Error creating horizontal wire:", error);
      return null;
    }
  }

  private createVerticalWire(
    model: THREE.Mesh,
    z: number,
    boundingBox: THREE.Box3,
    size: THREE.Vector3,
    useTubes: boolean = false,
    tubeThickness: number = 0.5
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

      // 创建线条点
      const linePoints = hullPoints.map(
        (p) => new THREE.Vector3(p[0], p[1], z)
      );
      linePoints.push(linePoints[0].clone()); // 闭合

      if (useTubes) {
        // 创建 CatmullRomCurve3
        const curve = new THREE.CatmullRomCurve3(linePoints, true);
        const tubeGeometry = new THREE.TubeGeometry(
          curve,
          linePoints.length * 4,
          tubeThickness,
          8,
          true
        );
        const tubeMaterial = new THREE.MeshPhongMaterial({
          color: 0x00ff00,
          shininess: 100,
          specular: 0x222222,
        });
        return new THREE.Mesh(tubeGeometry, tubeMaterial);
      } else {
        // 创建线条
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(
          linePoints
        );
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x00ff00,
          linewidth: 2,
        });
        return new THREE.Line(lineGeometry, lineMaterial);
      }
    } catch (error) {
      console.error("Error creating vertical wire:", error);
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

  private async showInViewer(cmd: any): Promise<void> {
    console.log("[showInViewer] 开始执行");
    let objectId = scope.context["_currentObjectId"];
    console.log("[showInViewer] 当前对象 ID:", objectId);

    const object = this.currentObjects.get(objectId);
    console.log("[showInViewer] 找到对象:", object ? object.type : "未找到");

    if (object) {
      // 清除之前的场景对象
      if (this.currentSceneObject) {
        this.glViewer.scene.remove(this.currentSceneObject);
      }

      // 克隆并添加对象
      const clonedObject = object.clone();
      this.glViewer.scene.add(clonedObject);

      // 保存对当前场景对象的引用
      this.currentSceneObject = clonedObject;

      // 确保对象可见
      clonedObject.visible = true;
      if (clonedObject instanceof THREE.Group) {
        clonedObject.traverse((child) => {
          child.visible = true;
        });
      }

      // 计算边界框
      const boundingBox = new THREE.Box3().setFromObject(clonedObject);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      console.log("[showInViewer] 模型尺寸:", size);
      console.log("[showInViewer] 模型中心:", center);

      // 设置相机
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 3;

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

      // 添加额外的灯光以更好地显示管道
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight1.position.set(1, 1, 1);
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-1, -1, -1);

      this.glViewer.scene.add(ambientLight);
      this.glViewer.scene.add(directionalLight1);
      this.glViewer.scene.add(directionalLight2);
    } else {
      console.error("[showInViewer] 未找到要显示的对象，ID:", objectId);
    }
  }

  private async exportWireCSV(cmd: any): Promise<void> {
    const filename = cmd.args.filename || "wire_mesh";
    const wireMesh = scope.context["_wireMesh"];

    if (!wireMesh) {
      throw new Error(
        "No wire mesh data found. Please generate a wire mesh first."
      );
    }

    if (wireMesh instanceof THREE.Group) {
      let fileCount = 0;

      wireMesh.children.forEach((child, index) => {
        if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
          let positions;

          if (child instanceof THREE.Line) {
            const geometry = child.geometry;
            positions = geometry.attributes.position;
          } else if (child instanceof THREE.Mesh) {
            // 对于管道，我们可以获取中心线
            // 这里简化处理，实际可能需要更复杂的逻辑
            const geometry = child.geometry;
            if (geometry.attributes.position) {
              positions = geometry.attributes.position;
            }
          }

          if (positions) {
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
            a.download = `${filename}_${index + 1}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            fileCount++;
          }
        }
      });

      if (fileCount === 0) {
        throw new Error("No valid wire data found to export.");
      }

      console.log(`Exported ${fileCount} CSV files`);
    } else {
      throw new Error("Wire mesh data is not in the expected format.");
    }
  }

  private clearScene(): void {
    console.log("[clearScene] Clearing scene and object references");
    this.glViewer.clearScene();

    // 清理存储的对象引用
    this.currentObjects.clear();
    this.currentSceneObject = null; // 清除场景对象引用
    scope.setVar("_currentObjectId", null);
    scope.setVar("_wireMesh", null);
    scope.setVar("_rotateModelValues", null);
    scope.setVar("_scaleModelValue", null);
    scope.setVar("_translateModelValues", null);

    // 同时清理控制面板
    if (this.controlPanel) {
      this.controlPanel.clear();
    }
  }
}
