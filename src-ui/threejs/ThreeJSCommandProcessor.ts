// src-ui/threejs/ThreeJSCommandProcessor.ts
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { hull } from "../utils/hull";
import { scope } from "../core/Scope";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ControlPanel } from "../components/ControlPanel";
import { processIndices } from "../utils/processIndices";
import {
  generateStackedLayersSVG,
  downloadSVGFiles,
} from "../utils/SVGExporter";

export class ThreeJSCommandProcessor {
  private scene: THREE.Scene;
  private currentObjects: Map<string, THREE.Object3D> = new Map();
  private glViewer: any;
  private controlPanel?: ControlPanel;
  private currentSceneObject: THREE.Object3D | null = null;
  private isStackedLayersMode: boolean = false;
  private originalModelId: string | null = null;
  private regenerateDebounceTimer: any = null;

  // 添加层叠切片相关状态
  private stackedLayers: THREE.Object3D[] = [];
  private stackedShapes: any[] = [];
  private modelDimensions: {
    width: number;
    height: number;
    depth: number;
  } | null = null;

  constructor(glViewer: any, controlPanel?: ControlPanel) {
    this.glViewer = glViewer;
    this.scene = glViewer.scene;
    this.controlPanel = controlPanel;

    console.log(
      "[ThreeJSCommandProcessor] Initialized with controlPanel:",
      !!controlPanel
    );
  }

  private async processCommand(cmd: any): Promise<any> {
    console.log(
      "[ThreeJSCommandProcessor] Processing command:",
      cmd.id,
      cmd.args
    );

    try {
      let result = null;

      switch (cmd.id) {
        // Wire Mesh Components commands
        case "initialize_wire_mesh":
          this.initializeWireMesh();
          result = null;
          break;

        case "add_horizontal_wire":
          // Check if position might be a variable name
          let horizontalPosition = cmd.args.position;
          if (
            typeof horizontalPosition === "string" ||
            horizontalPosition === 0
          ) {
            // If this is likely a variable reference
            const positionVar = scope.context["position"];
            if (positionVar !== undefined) {
              horizontalPosition = positionVar;
              console.log(
                `[add_horizontal_wire] Using position from variable: ${horizontalPosition}`
              );
            }
          }

          this.addHorizontalWire(
            horizontalPosition,
            cmd.args.thickness,
            cmd.args.color
          );
          result = null;
          break;

        // Override the addVerticalWire handler in processCommand method
        // In processCommand method, replace the existing add_vertical_wire case with:
        case "add_vertical_wire":
          // Check if position might be a variable name
          let verticalPosition = cmd.args.position;
          if (typeof verticalPosition === "string" || verticalPosition === 0) {
            // If this is likely a variable reference
            const positionVar = scope.context["position"];
            if (positionVar !== undefined) {
              verticalPosition = positionVar;
              console.log(
                `[add_vertical_wire] Using position from variable: ${verticalPosition}`
              );
            }
          }

          this.addVerticalWire(
            verticalPosition,
            cmd.args.thickness,
            cmd.args.color
          );
          result = null;
          break;
        case "convert_to_tubes":
          this.convertToTubes(cmd.args.thickness);
          result = null;
          break;

        case "collect_wire_mesh":
          result = this.collectWireMesh();
          break;

        // Programming Logic commands
        case "variable_declaration":
          result = this.handleVariableDeclaration(cmd);
          break;

        case "for_loop":
          result = await this.handleForLoop(cmd);
          break;

        case "if_statement":
          result = await this.handleIfStatement(cmd);
          break;

        // Existing commands
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

        case "generate_stacked_layers":
          result = await this.generateStackedLayers(cmd);
          break;

        case "export_stacked_layers_svg":
          result = this.exportStackedLayersSVG(cmd);
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

  // Logic command handlers
  // Improved variable handling for ThreeJSCommandProcessor

  // handleVariableDeclaration method update - this should replace the existing method:
  private handleVariableDeclaration(cmd: any): null {
    const { varName, value } = cmd.args;

    // Try to parse the value as a number or expression
    let parsedValue;

    try {
      // First check if it's a simple number value
      parsedValue = parseFloat(value);

      // If it's NaN, try evaluating it as an expression
      if (isNaN(parsedValue)) {
        // Handle simple expressions with variables
        if (
          value.includes("+") ||
          value.includes("-") ||
          value.includes("*") ||
          value.includes("/")
        ) {
          // Replace variable names with their values
          let processedExpression = value;
          for (const key in scope.context) {
            if (processedExpression.includes(key)) {
              processedExpression = processedExpression.replace(
                new RegExp(key, "g"),
                scope.context[key]
              );
            }
          }

          // Evaluate the expression
          parsedValue = eval(processedExpression);
        } else {
          // Not a number or expression, use as string
          parsedValue = value;
        }
      }
    } catch (e) {
      console.error(
        `[handleVariableDeclaration] Error parsing value: ${value}`,
        e
      );
      parsedValue = value; // Use original value on error
    }

    // Store the variable in the scope context
    scope.setVar(varName, parsedValue);
    console.log(
      `[handleVariableDeclaration] Set variable ${varName} = ${parsedValue} (original value: ${value})`
    );

    return null;
  }

  // forLoop method update - this should replace the existing method:
  private async handleForLoop(cmd: any): Promise<any> {
    const { varName, from, to, step } = cmd.args;
    let result = null;

    console.log(
      `[handleForLoop] Starting loop: ${varName} from ${from} to ${to} step ${step}`
    );

    // Execute the loop
    for (let i = from; i < to; i += step) {
      // Set the loop variable for each iteration
      scope.setVar(varName, i);
      console.log(`[handleForLoop] Iteration ${varName} = ${i}`);

      // Execute all child commands
      if (cmd.children && cmd.children.length > 0) {
        for (const child of cmd.children) {
          const childResult = await this.processCommand(child);
          if (childResult !== null) {
            result = childResult;
          }
        }
      }
    }

    return result;
  }

  private async handleIfStatement(cmd: any): Promise<any> {
    const { condition } = cmd.args;

    // Evaluate the condition
    let conditionMet = false;
    try {
      // This is a simplified approach - in a real environment,
      // you would need a more robust way to evaluate expressions
      conditionMet = eval(condition);
    } catch (e) {
      console.error(
        `[handleIfStatement] Error evaluating condition: ${condition}`,
        e
      );
      return null;
    }

    console.log(
      `[handleIfStatement] Condition: ${condition}, Result: ${conditionMet}`
    );

    if (conditionMet) {
      let result = null;

      // Execute all child commands
      if (cmd.children && cmd.children.length > 0) {
        for (const child of cmd.children) {
          const childResult = await this.processCommand(child);
          if (childResult !== null) {
            result = childResult;
          }
        }
      }

      return result;
    }

    return null;
  }

  /**
   * 生成层叠切片
   * @param cmd 命令参数
   */
  private async generateStackedLayers(cmd: any): Promise<string> {
    // 获取参数
    const materialThickness = cmd.args.materialThickness || 3;
    // 不再从命令参数中获取层数

    // 处理子命令获取模型
    let objectId = scope.context["_currentObjectId"];
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processCommand(child);
        if (result) objectId = result;
      }
    }

    if (!objectId) {
      console.error("[generateStackedLayers] No object ID found");
      return null;
    }

    // 记录原始模型ID，用于后续变换后重新生成层叠切片
    this.originalModelId = objectId;

    // 启用层叠模式标志
    this.isStackedLayersMode = true;

    // 先清除之前的层
    this.removeStackedLayers();

    // 存储材料厚度参数，用于后续变换后重新生成
    scope.setVar("_stackedLayersMaterialThickness", materialThickness);

    // 生成层叠切片
    const stackedLayersId = await this.generateStackedLayersFromObject(
      objectId,
      materialThickness
    );

    // 显示控制面板
    this.showStackedLayersControls(materialThickness);

    return stackedLayersId;
  }

  private removeStackedLayers(): void {
    // 从场景中移除层
    this.stackedLayers.forEach((layer) => {
      this.scene.remove(layer);
      if (layer instanceof THREE.Mesh) {
        layer.geometry.dispose();
        if (Array.isArray(layer.material)) {
          layer.material.forEach((m) => m.dispose());
        } else {
          layer.material.dispose();
        }
      }
    });

    this.stackedLayers = [];
  }

  /**
   * 从对象ID生成层叠切片
   */
  private async generateStackedLayersFromObject(
    objectId: string,
    materialThickness: number
  ): Promise<string> {
    console.log(
      "[generateStackedLayersFromObject] Starting with object ID:",
      objectId
    );

    const obj = this.currentObjects.get(objectId);
    if (!obj || !(obj instanceof THREE.Mesh)) {
      console.error("[generateStackedLayersFromObject] No valid mesh found");
      return null;
    }

    // 计算边界框和尺寸
    const boundingBox = new THREE.Box3().setFromObject(obj);
    const size = boundingBox.getSize(new THREE.Vector3());

    // 存储模型尺寸
    this.modelDimensions = {
      width: size.x,
      height: size.y,
      depth: size.z,
    };

    console.log(
      "[generateStackedLayersFromObject] Model dimensions:",
      this.modelDimensions
    );

    // 清除之前的层数据
    this.stackedShapes = [];

    // 自动计算合适的层数
    // 层数 = 模型高度 / 材料厚度
    // 至少要有3层，最多50层
    const layerCount = Math.max(
      3,
      Math.min(50, Math.floor(size.y / materialThickness))
    );

    // 存储计算出的层数
    scope.setVar("_stackedLayersCount", layerCount);

    console.log(
      `[generateStackedLayersFromObject] Auto calculated layer count: ${layerCount}`
    );

    // 计算层间距
    const layerSpacing = size.y / layerCount;

    // 生成每一层
    for (let i = 0; i < layerCount; i++) {
      // 计算当前层的Y位置
      const layerY = boundingBox.min.y + i * layerSpacing;

      // 创建平面
      const mathPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -layerY);

      // 获取交点
      const intersectionPoints: THREE.Vector3[] = [];
      const vertices = obj.geometry.attributes.position;
      const indices = obj.geometry.index;

      processIndices(indices, vertices, obj, mathPlane, intersectionPoints);

      // 处理交点
      if (intersectionPoints.length > 3) {
        // 转换为2D点
        const points2D = intersectionPoints.map((p) => [p.x, p.z]);

        // 使用凸包算法计算轮廓
        const hullPoints = hull(points2D, 30);

        if (hullPoints && hullPoints.length > 2) {
          // 创建THREE.js形状
          const shape = new THREE.Shape();

          hullPoints.forEach((point, idx) => {
            if (idx === 0) {
              shape.moveTo(point[0], point[1]);
            } else {
              shape.lineTo(point[0], point[1]);
            }
          });
          shape.closePath();

          // 保存形状数据用于SVG导出
          this.stackedShapes.push({
            shape,
            position: new THREE.Vector3(0, layerY, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            points: hullPoints,
          });

          // 创建挤出设置
          const extrudeSettings = {
            depth: materialThickness,
            bevelEnabled: false,
            curveSegments: 8,
            steps: 1,
          };

          // 创建几何体
          const extrudeGeometry = new THREE.ExtrudeGeometry(
            shape,
            extrudeSettings
          );

          // 创建材质
          const material = new THREE.MeshStandardMaterial({
            color: 0xd4b795,
            roughness: 0.7,
            metalness: 0.05,
            side: THREE.DoubleSide,
          });

          // 创建层网格
          const layer = new THREE.Mesh(extrudeGeometry, material);
          layer.position.set(0, layerY - materialThickness / 2, 0);
          layer.rotation.x = Math.PI / 2;
          layer.castShadow = true;
          layer.receiveShadow = true;

          // 添加轮廓线
          const outlineGeometry = new THREE.EdgesGeometry(layer.geometry);
          const outline = new THREE.LineSegments(
            outlineGeometry,
            new THREE.LineBasicMaterial({ color: 0x000000 })
          );
          layer.add(outline);

          // 添加到场景和层数组
          this.scene.add(layer);
          this.stackedLayers.push(layer);
        }
      }
    }

    // 保存层叠模型ID和控制参数
    const stackedLayersId = `stacked_layers_${Date.now()}`;

    return stackedLayersId;
  }

  private async regenerateStackedLayers(): Promise<void> {
    // 获取材料厚度和层数
    const materialThickness =
      scope.context["_stackedLayersMaterialThickness"] || 3;
    const layerCount = scope.context["_stackedLayersCount"] || 10;

    // 清除当前层
    this.removeStackedLayers();

    // 生成新层
    await this.generateStackedLayersFromObject(
      this.originalModelId,
      materialThickness,
      layerCount
    );
  }

  private debounceRegenerateStackedLayers(): void {
    // 清除上一个定时器
    if (this.regenerateDebounceTimer) {
      clearTimeout(this.regenerateDebounceTimer);
    }

    // 设置新的定时器，500毫秒后执行重新生成
    this.regenerateDebounceTimer = setTimeout(() => {
      this.regenerateStackedLayers();
    }, 500);
  }
  /**
   * 导出层叠切片SVG文件
   * @param cmd 命令参数
   */
  private exportStackedLayersSVG(cmd: any): void {
    console.log("[exportStackedLayersSVG] Starting with args:", cmd.args);

    const filename = cmd.args.filename || "stacked_layer";

    // 检查是否有层叠切片数据
    if (
      !this.stackedShapes ||
      this.stackedShapes.length === 0 ||
      !this.modelDimensions
    ) {
      console.error("[exportStackedLayersSVG] No stacked layers data found");
      return;
    }

    // 获取材料厚度
    const materialThickness =
      scope.context["_stackedLayersMaterialThickness"] || 3;

    // 生成SVG文件
    const svgFiles = generateStackedLayersSVG(
      this.stackedShapes,
      this.modelDimensions,
      materialThickness
    );

    // 下载SVG文件
    downloadSVGFiles(svgFiles, filename);

    console.log(
      `[exportStackedLayersSVG] Exported ${svgFiles.length} SVG files`
    );
  }

  /**
   * 显示层叠切片控制面板
   * @param materialThickness 材料厚度
   * @param layerCount 层数
   */
  private showStackedLayersControls(materialThickness: number): void {
    if (!this.controlPanel) {
      console.warn("[showStackedLayersControls] Control panel not available");
      return;
    }

    // 清除当前控制面板
    this.controlPanel.clear();

    // 设置新的控制面板
    this.controlPanel.setCommand(
      "stacked_layers_controls",
      "Stacked Layers Controls"
    );

    // 添加材料厚度控制
    this.controlPanel.addControl({
      id: "materialThickness",
      type: "slider",
      label: "Material Thickness (mm)",
      min: 1,
      max: 5,
      step: 0.5,
      value: materialThickness,
      onChange: (value) => this.onMaterialThicknessChange(value as number),
    });

    // 添加显示/隐藏原始模型选项
    this.controlPanel.addControl({
      id: "showOriginalModel",
      type: "checkbox",
      label: "Show Original Model",
      value: false, // 默认不显示原始模型
      onChange: (value) => this.onShowOriginalModelChange(value as boolean),
    });

    // 添加重新生成按钮控件
    this.controlPanel.addControl({
      id: "regenerate",
      type: "slider",
      label: "Regenerate Layers",
      min: 0,
      max: 1,
      step: 1,
      value: 0,
      onChange: (value) => {
        if (value === 1) {
          this.regenerateStackedLayers();
          // 重置滑块
          setTimeout(() => {
            this.controlPanel.updateControl("regenerate", 0);
          }, 500);
        }
      },
    });
  }
  /**
   * 处理显示/隐藏原始模型选项
   * @param show 是否显示原始模型
   */
  private onShowOriginalModelChange(show: boolean): void {
    console.log(`[onShowOriginalModelChange] Show original model: ${show}`);

    if (!this.originalModelId) return;

    const originalObject = this.currentObjects.get(this.originalModelId);
    if (!originalObject) return;

    // 在场景中找到原始模型并设置可见性
    if (this.currentSceneObject) {
      this.currentSceneObject.visible = show;

      if (this.currentSceneObject instanceof THREE.Group) {
        this.currentSceneObject.traverse((child) => {
          child.visible = show;
        });
      }
    }
  }
  /**
   * 处理材料厚度变化
   * @param value 新的厚度值
   */
  private onMaterialThicknessChange(value: number): void {
    console.log(`[onMaterialThicknessChange] Value changed to: ${value}`);

    // 更新存储的材料厚度
    scope.setVar("_stackedLayersMaterialThickness", value);

    // 立即触发重新生成
    this.debounceRegenerateStackedLayers();
  }

  /**
   * 处理层数变化
   * @param value 新的层数
   */
  private onLayerCountChange(value: number): void {
    console.log(`[onLayerCountChange] Value changed to: ${value}`);

    // 更新存储的层数
    scope.setVar("_stackedLayersCount", value);

    // 如果需要，可以添加实时更新层的代码
    // this.updateStackedLayers();
  }

  clearState() {
    // 清理存储的对象引用
    this.currentObjects.clear();
    this.stackedLayers = [];
    this.stackedShapes = [];
    this.modelDimensions = null;

    scope.setVar("_currentObjectId", null);
    scope.setVar("_wireMesh", null);
    scope.setVar("_rotateModelValues", null);
    scope.setVar("_scaleModelValue", null);
    scope.setVar("_translateModelValues", null);
    scope.setVar("_stackedLayersId", null);
    scope.setVar("_stackedLayersMaterialThickness", null);
    scope.setVar("_stackedLayersCount", null);

    // 清理控制面板（如果存在）
    if (this.controlPanel) {
      this.controlPanel.clear();
    }

    console.log(
      "[ThreeJSCommandProcessor] State cleared, including control panel"
    );
  }

  /**
   * 创建一个合并所有变换控件的方法
   */
  private showCombinedTransformControls(): void {
    if (!this.controlPanel) {
      console.warn(
        "[showCombinedTransformControls] Control panel not available"
      );
      return;
    }

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error(
        "[showCombinedTransformControls] No current object ID found"
      );
      return;
    }

    const object = this.currentObjects.get(objectId);
    if (!object) {
      console.error(
        "[showCombinedTransformControls] Object not found with ID:",
        objectId
      );
      return;
    }

    console.log(
      "[showCombinedTransformControls] Setting up combined transform controls for object:",
      object.type
    );

    // 清空当前控制面板
    this.controlPanel.clear();

    // 设置一个新的"Transform Controls"面板
    this.controlPanel.setCommand("transform_controls", "Transform Controls");

    // 添加Rotate控件（如果之前应用过Rotate）
    if (scope.context["_rotateModelValues"]) {
      const rotateValues = scope.context["_rotateModelValues"];
      console.log(
        "[showCombinedTransformControls] Adding rotation controls with values:",
        rotateValues
      );

      // X Rotate控件
      this.controlPanel.addControl({
        id: "rotateX",
        type: "slider",
        label: "Rotate X",
        min: -180,
        max: 180,
        step: 1,
        value: rotateValues.rotateX || 0,
        onChange: (value) =>
          this.onRotateValueChange("rotateX", value as number),
      });

      // Y Rotate控件
      this.controlPanel.addControl({
        id: "rotateY",
        type: "slider",
        label: "Rotate Y",
        min: -180,
        max: 180,
        step: 1,
        value: rotateValues.rotateY || 0,
        onChange: (value) =>
          this.onRotateValueChange("rotateY", value as number),
      });

      // Z Rotate控件
      this.controlPanel.addControl({
        id: "rotateZ",
        type: "slider",
        label: "Rotate Z",
        min: -180,
        max: 180,
        step: 1,
        value: rotateValues.rotateZ || 0,
        onChange: (value) =>
          this.onRotateValueChange("rotateZ", value as number),
      });
    }

    // 添加缩放控件（如果之前应用过缩放）
    if (scope.context["_scaleModelValue"]) {
      console.log(
        "[showCombinedTransformControls] Adding scale control with value:",
        scope.context["_scaleModelValue"]
      );

      // 创建缩放控件
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
    }

    // 添加Translate控件（如果之前应用过Translate）
    if (scope.context["_translateModelValues"]) {
      const translateValues = scope.context["_translateModelValues"];
      console.log(
        "[showCombinedTransformControls] Adding translation controls with values:",
        translateValues
      );

      // X Translate控件
      this.controlPanel.addControl({
        id: "translateX",
        type: "slider",
        label: "Translate X",
        min: -100,
        max: 100,
        step: 1,
        value: object.position.x, // 使用当前位置
        onChange: (value) =>
          this.onTranslateValueChange("translateX", value as number),
      });

      // Y Translate控件
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

      // Z Translate控件
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
    }
  }

  /**
   * Rotate模型方法实现
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
      // 累积Rotate值
      const values = scope.context["_rotateModelValues"];
      values.rotateX += cmd.args.rotateX;
      values.rotateY += cmd.args.rotateY;
      values.rotateZ += cmd.args.rotateZ;
      console.log("[rotateModel] Updated rotation values:", values);
    }

    // 应用Rotate变换
    object.rotation.x += rotateX;
    object.rotation.y += rotateY;
    object.rotation.z += rotateZ;

    console.log("[rotateModel] Applied rotation. New rotation:", {
      x: (object.rotation.x * 180) / Math.PI,
      y: (object.rotation.y * 180) / Math.PI,
      z: (object.rotation.z * 180) / Math.PI,
    });

    // 显示所有变换控件
    this.showCombinedTransformControls();

    // 如果处于层叠模式，变换后重新生成层叠切片
    if (this.isStackedLayersMode && this.originalModelId) {
      this.debounceRegenerateStackedLayers();
    }

    return objectId;
  }

  /**
   * 处理Rotate控件值变化
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

    // 获取当前物体的Rotate值（以弧度为单位）
    const currentRotationX = object.rotation.x;
    const currentRotationY = object.rotation.y;
    const currentRotationZ = object.rotation.z;

    // 根据轴设置新的Rotate值
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

    // 如果已经在场景中显示了对象，也更新其Rotate
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

    // 添加这段代码：如果处于层叠模式，重新生成层叠切片
    if (this.isStackedLayersMode && this.originalModelId) {
      this.debounceRegenerateStackedLayers();
    }
  }

  /**
   * 缩放模型方法实现
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

    // 显示所有变换控件
    this.showCombinedTransformControls();
    // 如果处于层叠模式，变换后重新生成层叠切片
    if (this.isStackedLayersMode && this.originalModelId) {
      this.debounceRegenerateStackedLayers();
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

    if (this.isStackedLayersMode && this.originalModelId) {
      this.debounceRegenerateStackedLayers();
    }
  }

  /**
   * Translate模型方法实现
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
      // 累积Translate值
      const values = scope.context["_translateModelValues"];
      values.translateX += cmd.args.translateX;
      values.translateY += cmd.args.translateY;
      values.translateZ += cmd.args.translateZ;
      console.log("[translateModel] Updated translation values:", values);
    }

    // 应用Translate
    console.log("[translateModel] Current position before:", object.position);
    object.position.x += cmd.args.translateX;
    object.position.y += cmd.args.translateY;
    object.position.z += cmd.args.translateZ;
    console.log(
      "[translateModel] Applied translation. New position:",
      object.position
    );

    // 显示所有变换控件
    this.showCombinedTransformControls();
    // 如果处于层叠模式，变换后重新生成层叠切片
    if (this.isStackedLayersMode && this.originalModelId) {
      this.debounceRegenerateStackedLayers();
    }
    return objectId;
  }

  // 在 ThreeJSCommandProcessor 类中添加

  // 添加 Wire Mesh 上下文
  private wireMeshContext: {
    isGenerating: boolean;
    wires: {
      type: "horizontal" | "vertical";
      position: number;
      thickness: number;
      color: string;
      points?: THREE.Vector3[];
      isLine: boolean;
    }[];
    currentWireId: number;
  } = {
    isGenerating: false,
    wires: [],
    currentWireId: 0,
  };

  // 处理初始化 Wire Mesh 命令
  private initializeWireMesh(): void {
    this.wireMeshContext.isGenerating = true;
    this.wireMeshContext.wires = [];
    this.wireMeshContext.currentWireId = 0;
    console.log("[initializeWireMesh] Started new wire mesh definition");
  }

  // 添加水平线
  private addHorizontalWire(
    position: number,
    thickness: number,
    color: string
  ): void {
    if (!this.wireMeshContext.isGenerating) {
      console.error("[addHorizontalWire] No active wire mesh generation");
      return;
    }

    // 获取当前模型
    const objectId = scope.context["_currentObjectId"];
    const model = this.currentObjects.get(objectId);

    if (!model || !(model instanceof THREE.Mesh)) {
      console.error("[addHorizontalWire] No valid model found");
      return;
    }

    // 计算边界盒和实际Y位置
    const boundingBox = new THREE.Box3().setFromObject(model);
    const yPosition = boundingBox.min.y + position;

    // 查找与模型的交点
    const intersectionPoints = this.findHorizontalIntersectionPoints(
      model,
      yPosition
    );

    if (intersectionPoints.length < 3) {
      console.error("[addHorizontalWire] Not enough intersection points found");
      return;
    }

    // 存储线信息 - 默认为线(非管)
    const wireId = this.wireMeshContext.currentWireId++;
    this.wireMeshContext.wires.push({
      type: "horizontal",
      position,
      thickness,
      color,
      points: intersectionPoints,
      isLine: true, // 默认为线，可以后续转换为管
    });

    // 创建预览线
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(
      intersectionPoints
    );
    const lineMaterial = new THREE.LineBasicMaterial({
      color: parseInt(color.replace("#", "0x")),
      linewidth: 1,
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);

    // 存储为临时对象
    const id = `wire_component_${wireId}`;
    this.currentObjects.set(id, line);

    console.log(
      `[addHorizontalWire] Added at position=${position} with thickness=${thickness}, ID=${id}`
    );
  }

  // 添加垂直线
  private addVerticalWire(
    position: number,
    thickness: number,
    color: string
  ): void {
    if (!this.wireMeshContext.isGenerating) {
      console.error("[addVerticalWire] No active wire mesh generation");
      return;
    }

    // 类似于添加水平线
    const objectId = scope.context["_currentObjectId"];
    const model = this.currentObjects.get(objectId);

    if (!model || !(model instanceof THREE.Mesh)) {
      console.error("[addVerticalWire] No valid model found");
      return;
    }

    // 计算边界盒和实际Z位置
    const boundingBox = new THREE.Box3().setFromObject(model);
    const zPosition = boundingBox.min.z + position;

    // 查找与模型的交点
    const intersectionPoints = this.findVerticalIntersectionPoints(
      model,
      zPosition
    );

    if (intersectionPoints.length < 3) {
      console.error("[addVerticalWire] Not enough intersection points found");
      return;
    }

    // 存储线信息
    const wireId = this.wireMeshContext.currentWireId++;
    this.wireMeshContext.wires.push({
      type: "vertical",
      position,
      thickness,
      color,
      points: intersectionPoints,
      isLine: true,
    });

    // 创建预览线
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(
      intersectionPoints
    );
    const lineMaterial = new THREE.LineBasicMaterial({
      color: parseInt(color.replace("#", "0x")),
      linewidth: 1,
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);

    // 存储为临时对象
    const id = `wire_component_${wireId}`;
    this.currentObjects.set(id, line);

    console.log(
      `[addVerticalWire] Added at position=${position} with thickness=${thickness}, ID=${id}`
    );
  }

  // 找水平交点的辅助函数
  private findHorizontalIntersectionPoints(
    model: THREE.Mesh,
    yPosition: number
  ): THREE.Vector3[] {
    const intersectionPoints: THREE.Vector3[] = [];

    // 创建一个水平平面
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yPosition);

    // 处理模型几何体查找交点
    const geometry = model.geometry;
    const vertices = geometry.attributes.position;
    const indices = geometry.index;

    // 使用现有的交点查找逻辑
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

        this.addTrianglePlaneIntersections(a, b, c, plane, intersectionPoints);
      }
    } else {
      // 处理非索引几何体
      for (let i = 0; i < vertices.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(vertices, i);
        const b = new THREE.Vector3().fromBufferAttribute(vertices, i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(vertices, i + 2);

        model.localToWorld(a);
        model.localToWorld(b);
        model.localToWorld(c);

        this.addTrianglePlaneIntersections(a, b, c, plane, intersectionPoints);
      }
    }

    // 如果有足够的点，生成凸包
    if (intersectionPoints.length >= 3) {
      // 转换为2D点进行凸包计算
      const points2D = intersectionPoints.map((p) => [p.x, p.z]);
      const hullPoints = hull(points2D, 20);

      if (hullPoints && hullPoints.length >= 3) {
        // 将凸包点转回3D
        return hullPoints.map((p) => new THREE.Vector3(p[0], yPosition, p[1]));
      }
    }

    return intersectionPoints;
  }

  // 找垂直交点的辅助函数
  private findVerticalIntersectionPoints(
    model: THREE.Mesh,
    zPosition: number
  ): THREE.Vector3[] {
    // 实现类似findHorizontalIntersectionPoints的逻辑，但使用垂直平面
    const intersectionPoints: THREE.Vector3[] = [];

    // 创建一个垂直平面
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -zPosition);

    // 处理模型几何体查找交点
    const geometry = model.geometry;
    const vertices = geometry.attributes.position;
    const indices = geometry.index;

    // 使用现有的交点查找逻辑
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

        this.addTrianglePlaneIntersections(a, b, c, plane, intersectionPoints);
      }
    } else {
      // 处理非索引几何体
      for (let i = 0; i < vertices.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(vertices, i);
        const b = new THREE.Vector3().fromBufferAttribute(vertices, i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(vertices, i + 2);

        model.localToWorld(a);
        model.localToWorld(b);
        model.localToWorld(c);

        this.addTrianglePlaneIntersections(a, b, c, plane, intersectionPoints);
      }
    }

    // 如果有足够的点，生成凸包
    if (intersectionPoints.length >= 3) {
      // 转换为2D点进行凸包计算 (投影到XY平面)
      const points2D = intersectionPoints.map((p) => [p.x, p.y]);
      const hullPoints = hull(points2D, 20);

      if (hullPoints && hullPoints.length >= 3) {
        // 将凸包点转回3D
        return hullPoints.map((p) => new THREE.Vector3(p[0], p[1], zPosition));
      }
    }

    return intersectionPoints;
  }

  // 转换为管
  private convertToTubes(tubeThickness: number): void {
    if (!this.wireMeshContext.isGenerating) {
      console.error("[convertToTubes] No active wire mesh generation");
      return;
    }

    console.log(
      `[convertToTubes] Converting wires to tubes with thickness=${tubeThickness}`
    );

    // 更新所有线为管
    for (const wire of this.wireMeshContext.wires) {
      wire.isLine = false;
      wire.thickness = tubeThickness;

      // 移除线表示并创建管
      if (wire.points && wire.points.length > 0) {
        // 查找线对象
        const wireId = this.wireMeshContext.wires.indexOf(wire);
        const lineId = `wire_component_${wireId}`;
        const line = this.currentObjects.get(lineId);

        if (line) {
          // 创建曲线
          const curve = new THREE.CatmullRomCurve3(wire.points, true);
          const tubeGeometry = new THREE.TubeGeometry(
            curve,
            wire.points.length * 4, // 段数
            wire.thickness,
            8, // 径向段数
            true // 闭合
          );

          const tubeMaterial = new THREE.MeshPhongMaterial({
            color: parseInt(wire.color.replace("#", "0x")),
            shininess: 100,
            specular: 0x222222,
          });

          const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

          // 用管替换线
          this.currentObjects.set(lineId, tube);
        }
      }
    }
  }

  // 收集为一个整体
  private collectWireMesh(): string {
    if (!this.wireMeshContext.isGenerating) {
      console.error("[collectWireMesh] No active wire mesh generation");
      return null;
    }

    // 创建一个组来保存所有线
    const wireGroup = new THREE.Group();

    // 添加所有线对象到组
    for (let i = 0; i < this.wireMeshContext.wires.length; i++) {
      const wireId = `wire_component_${i}`;
      const wireObject = this.currentObjects.get(wireId);

      if (wireObject) {
        wireGroup.add(wireObject.clone());
      }
    }

    // 重置上下文
    this.wireMeshContext.isGenerating = false;

    // 保存并返回结果
    const id = `component_wire_mesh_${Date.now()}`;
    this.currentObjects.set(id, wireGroup);
    scope.setVar("_currentObjectId", id);
    scope.setVar("_wireMesh", wireGroup);

    console.log(
      `[collectWireMesh] Collected ${this.wireMeshContext.wires.length} wires into mesh ID=${id}`
    );

    return id;
  }

  /**
   * 处理Translate控件值变化
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
      if (this.isStackedLayersMode) {
        clonedObject.visible = false;
      }
      this.glViewer.scene.add(clonedObject);

      // 保存对当前场景对象的引用
      this.currentSceneObject = clonedObject;

      // 确保对象可见
      //clonedObject.visible = true;
      if (clonedObject instanceof THREE.Group) {
        clonedObject.traverse((child) => {
          child.visible = true;
        });
      }

      // 在onRotateValueChange、onScaleValueChange、onTranslateValueChange方法结尾添加
      // 更新后，如果处于层叠模式，重新生成层叠切片
      if (this.isStackedLayersMode && this.originalModelId) {
        this.debounceRegenerateStackedLayers();
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

      // 显示所有应用的变换控件
      this.showCombinedTransformControls();
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
  private addTrianglePlaneIntersections(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    plane: THREE.Plane,
    points: THREE.Vector3[]
  ): void {
    const line1 = new THREE.Line3(a, b);
    const line2 = new THREE.Line3(b, c);
    const line3 = new THREE.Line3(c, a);

    const target = new THREE.Vector3();

    if (plane.intersectLine(line1, target)) points.push(target.clone());
    if (plane.intersectLine(line2, target)) points.push(target.clone());
    if (plane.intersectLine(line3, target)) points.push(target.clone());
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
