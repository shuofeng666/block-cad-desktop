// src-ui/threejs/commands/StackedLayersCommands.ts

import * as THREE from "three";
import { scope } from "../../core/Scope";
import { ThreeJSCommandProcessor } from "../ThreeJSCommandProcessor";
import { hull } from "../../utils/hull";
import { processIndices } from "../../utils/processIndices";
import { generateStackedLayersSVG, downloadSVGFiles } from "../../utils/SVGExporter";

export class StackedLayersCommands {
  private processor: ThreeJSCommandProcessor;
  private glViewer: any;
  private controlPanel?: any;
  
  // 层叠切片相关状态
  private isStackedLayersMode: boolean = false;
  private originalModelId: string | null = null;
  private stackedLayers: THREE.Object3D[] = [];
  private stackedShapes: any[] = [];
  private modelDimensions: {
    width: number;
    height: number;
    depth: number;
  } | null = null;
  private regenerateDebounceTimer: any = null;

  constructor(processor: ThreeJSCommandProcessor) {
    this.processor = processor;
    this.glViewer = processor.getGLViewer();
    this.controlPanel = processor.getControlPanel();
    console.log("[StackedLayersCommands] 初始化完成, controlPanel:", !!this.controlPanel);
  }

  /**
   * 清理状态
   */
  public clearState(): void {
    console.log("[StackedLayersCommands] 清理状态");
    // 清除层叠状态
    this.removeStackedLayers();
    this.isStackedLayersMode = false;
    this.originalModelId = null;
    this.stackedLayers = [];
    this.stackedShapes = [];
    this.modelDimensions = null;
    
    // 清除相关全局变量
    scope.setVar("_isStackedLayersMode", false);
    scope.setVar("_originalModelId", null);
    scope.setVar("_stackedLayersId", null);
    scope.setVar("_stackedLayersMaterialThickness", null);
    scope.setVar("_stackedLayersCount", null);
    scope.setVar("_needRegenerateStackedLayers", false);
    
    // 取消待执行的重生成定时器
    if (this.regenerateDebounceTimer) {
      clearTimeout(this.regenerateDebounceTimer);
      this.regenerateDebounceTimer = null;
    }
  }

  /**
   * 生成层叠切片
   */
  public async generateStackedLayers(cmd: any): Promise<string> {
    console.log("[generateStackedLayers] 开始生成层叠切片, 参数:", cmd.args);
    // 获取参数
    const materialThickness = cmd.args.materialThickness || 3;

    // 处理子命令获取模型
    let objectId = scope.context["_currentObjectId"];
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processor.processCommand(child);
        if (result) objectId = result;
      }
    }

    if (!objectId) {
      console.error("[generateStackedLayers] 未找到对象ID");
      return null;
    }

    // 记录原始模型ID，用于后续变换后重新生成层叠切片
    this.originalModelId = objectId;
    scope.setVar("_originalModelId", objectId);

    // 启用层叠模式标志
    this.isStackedLayersMode = true;
    scope.setVar("_isStackedLayersMode", true);

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

    console.log("[generateStackedLayers] 生成完成, ID:", stackedLayersId);
    return stackedLayersId;
  }

  /**
   * 导出层叠切片SVG文件
   */
  public exportStackedLayersSVG(cmd: any): void {
    console.log("[exportStackedLayersSVG] 开始导出 SVG, 参数:", cmd.args);

    const filename = cmd.args.filename || "stacked_layer";

    // 检查是否有层叠切片数据
    if (
      !this.stackedShapes ||
      this.stackedShapes.length === 0 ||
      !this.modelDimensions
    ) {
      console.error("[exportStackedLayersSVG] 未找到层叠切片数据");
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
      `[exportStackedLayersSVG] 导出了 ${svgFiles.length} 个 SVG 文件`
    );
  }

  /**
   * 检查是否需要重新生成层叠切片
   * 此方法必须在某处周期性调用，以检查标志位
   */
  public checkNeedRegenerate(): void {
    if (scope.context["_needRegenerateStackedLayers"] === true) {
      console.log("[checkNeedRegenerate] 检测到需要重新生成层叠切片");
      scope.setVar("_needRegenerateStackedLayers", false);
      this.debounceRegenerateStackedLayers();
    }
  }

  /**
   * 延迟重新生成层叠切片（防抖动）
   */
  public debounceRegenerateStackedLayers(): void {
    console.log("[debounceRegenerateStackedLayers] 准备延迟重新生成层叠切片");
    // 清除上一个定时器
    if (this.regenerateDebounceTimer) {
      clearTimeout(this.regenerateDebounceTimer);
      this.regenerateDebounceTimer = null;
    }

    // 设置新的定时器，500毫秒后执行重新生成
    this.regenerateDebounceTimer = setTimeout(() => {
      console.log("[debounceRegenerateStackedLayers] 开始执行重新生成");
      this.regenerateStackedLayers();
    }, 500);
  }

  /**
   * 重新生成层叠切片
   */
public async regenerateStackedLayers(): Promise<void> {
  console.log("[regenerateStackedLayers] 开始重新生成层叠切片");
  
  // 获取材料厚度
  const materialThickness = scope.context["_stackedLayersMaterialThickness"] || 3;
  
  // 不使用之前存储的层数，让 generateStackedLayersFromObject 方法自动计算
  // const layerCount = scope.context["_stackedLayersCount"] || 10;
  
  console.log("[regenerateStackedLayers] 使用材料厚度:", materialThickness);

  // 清除当前层
  this.removeStackedLayers();

  // 生成新层 - 不传递 layerCount 参数，让方法根据当前模型状态重新计算
  if (this.originalModelId) {
    console.log("[regenerateStackedLayers] 使用原始模型ID:", this.originalModelId);
    await this.generateStackedLayersFromObject(
      this.originalModelId,
      materialThickness
      // 不传递 layerCount，让方法自动计算
    );
    console.log("[regenerateStackedLayers] 重新生成完成");
  } else {
    console.error("[regenerateStackedLayers] 找不到原始模型ID");
  }
}

  /**
   * 从对象ID生成层叠切片
   * 修复方法签名，添加 layerCount 可选参数
   */
  private async generateStackedLayersFromObject(
    objectId: string,
    materialThickness: number,
    layerCount?: number
  ): Promise<string> {
    console.log(
      "[generateStackedLayersFromObject] 开始从对象生成层叠切片, 对象ID:",
      objectId,
      "材料厚度:",
      materialThickness,
      "层数:",
      layerCount
    );

    const obj = this.processor.getObject(objectId);
    if (!obj || !(obj instanceof THREE.Mesh)) {
      console.error("[generateStackedLayersFromObject] 找不到有效的网格对象");
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
      "[generateStackedLayersFromObject] 模型尺寸:",
      this.modelDimensions
    );

    // 清除之前的层数据
    this.stackedShapes = [];
    
    // 自动计算合适的层数，如果未提供的话
    if (layerCount === undefined) {
      // 层数 = 模型高度 / 材料厚度
      // 至少要有3层，最多50层
      layerCount = Math.max(
        3,
        Math.min(50, Math.floor(size.y / materialThickness))
      );
    }

    // 存储计算出的层数
    scope.setVar("_stackedLayersCount", layerCount);

    console.log(
      `[generateStackedLayersFromObject] 使用层数: ${layerCount}`
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
          this.glViewer.scene.add(layer);
          this.stackedLayers.push(layer);
        }
      }
    }

    // 保存层叠模型ID和控制参数
    const stackedLayersId = `stacked_layers_${Date.now()}`;
    scope.setVar("_stackedLayersId", stackedLayersId);
    
    console.log("[generateStackedLayersFromObject] 生成完成, 创建了", this.stackedLayers.length, "层");

    return stackedLayersId;
  }

  /**
   * 移除层叠切片
   */
  private removeStackedLayers(): void {
    console.log("[removeStackedLayers] 移除", this.stackedLayers.length, "个层叠切片");
    
    // 从场景中移除层
    this.stackedLayers.forEach((layer) => {
      this.glViewer.scene.remove(layer);
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
   * 显示层叠切片控制面板
   */
  private showStackedLayersControls(materialThickness: number): void {
    if (!this.controlPanel) {
      console.warn("[showStackedLayersControls] 控制面板不可用");
      return;
    }

    console.log("[showStackedLayersControls] 设置控制面板，材料厚度:", materialThickness);

    // 清除当前控制面板
    this.controlPanel.clear();

    // 设置新的控制面板
    this.controlPanel.setCommand(
      "stacked_layers_controls",
      "层叠切片控制面板"
    );

    // 添加材料厚度控制
    this.controlPanel.addControl({
      id: "materialThickness",
      type: "slider",
      label: "材料厚度 (mm)",
      min: 0.5,
      max: 10,
      step: 0.5,
      value: materialThickness,
      onChange: (value) => this.onMaterialThicknessChange(value as number),
    });

    // 添加显示/隐藏原始模型选项
    this.controlPanel.addControl({
      id: "showOriginalModel",
      type: "checkbox",
      label: "显示原始模型",
      value: false, // 默认不显示原始模型
      onChange: (value) => this.onShowOriginalModelChange(value as boolean),
    });

    // 添加重新生成按钮控件
    this.controlPanel.addControl({
      id: "regenerate",
      type: "slider",
      label: "重新生成层",
      min: 0,
      max: 1,
      step: 1,
      value: 0,
      onChange: (value) => {
        if (value === 1) {
          console.log("[showStackedLayersControls] 手动触发重新生成");
          this.regenerateStackedLayers();
          // 重置滑块
          setTimeout(() => {
            this.controlPanel.updateControl("regenerate", 0);
          }, 500);
        }
      },
    });
    
    console.log("[showStackedLayersControls] 控制面板设置完成");
  }

  /**
   * 处理材料厚度变化
   */
  private onMaterialThicknessChange(value: number): void {
    console.log(`[onMaterialThicknessChange] 材料厚度变更为: ${value}`);

    // 更新存储的材料厚度
    scope.setVar("_stackedLayersMaterialThickness", value);

    // 立即触发重新生成
    this.debounceRegenerateStackedLayers();
  }

  /**
   * 处理显示/隐藏原始模型选项
   */
  private onShowOriginalModelChange(show: boolean): void {
    console.log(`[onShowOriginalModelChange] 显示原始模型: ${show}`);

    if (!this.originalModelId) return;

    // 在场景中找到原始模型并设置可见性
    const currentSceneObject = this.processor.getCurrentSceneObject();
    if (currentSceneObject) {
      currentSceneObject.visible = show;

      if (currentSceneObject instanceof THREE.Group) {
        currentSceneObject.traverse((child) => {
          child.visible = show;
        });
      }
    }
  }
}