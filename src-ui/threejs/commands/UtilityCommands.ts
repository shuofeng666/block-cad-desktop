// src-ui/threejs/commands/UtilityCommands.ts
import * as THREE from "three";
import { scope } from "../../core/Scope";
import { ThreeJSCommandProcessor } from "../ThreeJSCommandProcessor";
import { moduleAdapter } from "../../utils/ModuleAdapter";

export class UtilityCommands {
  private processor: ThreeJSCommandProcessor;
  private scene: THREE.Scene;
  private controlPanel?: any;
  
  // 存储辅助对象
  private helperObjects: Map<string, THREE.Object3D> = new Map();

  constructor(processor: ThreeJSCommandProcessor) {
    this.processor = processor;
    this.scene = processor.getScene();
    this.controlPanel = processor.getControlPanel();
  }

  /**
   * 清理状态
   */
  public clearState(): void {
    // 移除所有辅助对象
    this.helperObjects.forEach((object) => {
      this.scene.remove(object);
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    
    this.helperObjects.clear();
  }

  /**
   * 计算对象边界
   */
  public calculateBounds(): void {
    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[calculateBounds] No current object ID found");
      return;
    }

    const object = this.processor.getObject(objectId);
    if (!object) {
      console.error("[calculateBounds] Object not found with ID:", objectId);
      return;
    }

    // 使用BoundsCalculator计算边界
    const boundingBox = moduleAdapter.getBoundsCalculator().calculateBoundingBox(object);
    const dimensions = moduleAdapter.getBoundsCalculator().calculateDimensions(object);
    
    // 存储结果到上下文
    scope.setVar("_objectBounds", {
      min: {
        x: boundingBox.min.x,
        y: boundingBox.min.y,
        z: boundingBox.min.z
      },
      max: {
        x: boundingBox.max.x,
        y: boundingBox.max.y,
        z: boundingBox.max.z
      },
      dimensions: dimensions
    });
    
    console.log("[calculateBounds] Calculated dimensions:", dimensions);
  }

  /**
   * 生成轮廓
   */
  public generateContour(params: { height: number, concavity: number }): string {
    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[generateContour] No current object ID found");
      return null;
    }

    const object = this.processor.getObject(objectId);
    if (!object || !(object instanceof THREE.Mesh)) {
      console.error("[generateContour] No valid mesh found with ID:", objectId);
      return null;
    }

    try {
      // 创建切割平面
      const plane = moduleAdapter.getIntersectionCalculator().createHorizontalPlane(params.height);
      
      // 计算平面交点
      const intersectionPoints = moduleAdapter.getIntersectionCalculator().calculateMeshPlaneIntersection(
        object as THREE.Mesh,
        plane
      );
      
      if (intersectionPoints.length < 3) {
        console.warn("[generateContour] Not enough intersection points for contour");
        return null;
      }
      
      // 将3D点投影到2D
      const points2D = moduleAdapter.getContourGenerator().projectPointsToPlane(
        intersectionPoints,
        plane
      );
      
      // 生成凹包
      const hullPoints = moduleAdapter.getContourGenerator().generateConcaveHull(
        points2D,
        params.concavity
      );
      
      // 创建THREE.Shape
      const shape = moduleAdapter.getContourGenerator().createShapeFromPoints(hullPoints);
      
      // 创建轮廓线可视化
      const contourGeometry = new THREE.ShapeGeometry(shape);
      const contourMaterial = moduleAdapter.getMaterialFactory().createLineMaterial({
        color: 0x00ff00,
        linewidth: 2
      });
      
      // 调整轮廓位置和旋转
      const contourMesh = new THREE.Mesh(contourGeometry, contourMaterial);
      contourMesh.position.y = params.height;
      contourMesh.rotation.x = -Math.PI / 2;
      
      // 添加到场景和存储
      this.scene.add(contourMesh);
      
      const contourId = `contour_${Date.now()}`;
      this.processor.addObject(contourId, contourMesh);
      this.helperObjects.set(contourId, contourMesh);
      
      // 存储轮廓数据
      scope.setVar("_contourData", {
        shape: shape,
        points: hullPoints,
        height: params.height
      });
      
      scope.setVar("_currentObjectId", contourId);
      return contourId;
    } catch (error) {
      console.error("[generateContour] Error generating contour:", error);
      return null;
    }
  }

  /**
   * 计算交点
   */
  public calculateIntersection(params: { planeAxis: string, planeValue: number }): void {
    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[calculateIntersection] No current object ID found");
      return;
    }

    const object = this.processor.getObject(objectId);
    if (!object || !(object instanceof THREE.Mesh)) {
      console.error("[calculateIntersection] No valid mesh found with ID:", objectId);
      return;
    }

    try {
      // 创建切割平面
      let plane: THREE.Plane;
      switch (params.planeAxis) {
        case "X":
          plane = moduleAdapter.getIntersectionCalculator().createVerticalXPlane(params.planeValue);
          break;
        case "Y":
          plane = moduleAdapter.getIntersectionCalculator().createHorizontalPlane(params.planeValue);
          break;
        case "Z":
          plane = moduleAdapter.getIntersectionCalculator().createVerticalZPlane(params.planeValue);
          break;
        default:
          console.error("[calculateIntersection] Invalid plane axis:", params.planeAxis);
          return;
      }
      
      // 计算交点
      const intersectionPoints = moduleAdapter.getIntersectionCalculator().calculateMeshPlaneIntersection(
        object as THREE.Mesh,
        plane
      );
      
      // 存储交点数据
      scope.setVar("_intersectionPoints", intersectionPoints);
      
      console.log(`[calculateIntersection] Found ${intersectionPoints.length} intersection points`);
      
      // 可视化交点（可选）
      const pointsGeometry = new THREE.BufferGeometry().setFromPoints(intersectionPoints);
      const pointsMaterial = moduleAdapter.getMaterialFactory().createPointsMaterial({
        color: 0xff0000,
        size: 2,
        sizeAttenuation: false
      });
      
      const pointsObject = new THREE.Points(pointsGeometry, pointsMaterial);
      
      // 添加到场景和存储
      this.scene.add(pointsObject);
      
      const pointsId = `intersection_points_${Date.now()}`;
      this.helperObjects.set(pointsId, pointsObject);
      
      // 如果有控制面板，显示交点统计
      if (this.controlPanel) {
        this.controlPanel.setCommand("intersection_info", "Intersection Points");
        
        this.controlPanel.addControl({
          id: "intersection_count",
          type: "number",
          label: "Point Count",
          value: intersectionPoints.length,
          onChange: () => {} // 只读显示
        });
        
        // 显示平面信息
        this.controlPanel.addControl({
          id: "plane_info",
          type: "number",
          label: `Plane ${params.planeAxis}`,
          value: params.planeValue,
          onChange: () => {} // 只读显示
        });
      }
    } catch (error) {
      console.error("[calculateIntersection] Error calculating intersection:", error);
    }
  }

  /**
   * 应用材质
   */
  public applyMaterial(params: { materialType: string, color: string }): string {
    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[applyMaterial] No current object ID found");
      return null;
    }

    const object = this.processor.getObject(objectId);
    if (!object || !(object instanceof THREE.Mesh)) {
      console.error("[applyMaterial] No valid mesh found with ID:", objectId);
      return null;
    }

    try {
      // 将颜色字符串转换为数值
      const colorValue = parseInt(params.color.replace("#", "0x"), 16);
      
      // 根据类型创建材质
      let material: THREE.Material;
      
      switch (params.materialType) {
        case "STANDARD":
          material = moduleAdapter.getMaterialFactory().createStandardMaterial({
            color: colorValue,
            roughness: 0.7,
            metalness: 0.2
          });
          break;
        case "NORMAL":
          material = moduleAdapter.getMaterialFactory().createNormalMaterial();
          break;
        case "WIREFRAME":
          material = moduleAdapter.getMaterialFactory().createWireframeMaterial({
            color: colorValue
          });
          break;
        case "PHONG":
          material = moduleAdapter.getMaterialFactory().createPhongMaterial({
            color: colorValue,
            specular: 0x111111,
            shininess: 30
          });
          break;
        default:
          console.error("[applyMaterial] Invalid material type:", params.materialType);
          return null;
      }
      
      // 应用新材质
      const mesh = object as THREE.Mesh;
      
      // 保存原始材质以便恢复
      if (!mesh.userData._originalMaterial) {
        mesh.userData._originalMaterial = mesh.material;
      }
      
      // 应用新材质
      mesh.material = material;
      
      console.log(`[applyMaterial] Applied ${params.materialType} material with color ${params.color}`);
      
      return objectId;
    } catch (error) {
      console.error("[applyMaterial] Error applying material:", error);
      return null;
    }
  }

  /**
   * 显示对象尺寸
   */
  public showObjectDimensions(): void {
    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[showObjectDimensions] No current object ID found");
      return;
    }

    const object = this.processor.getObject(objectId);
    if (!object) {
      console.error("[showObjectDimensions] Object not found with ID:", objectId);
      return;
    }

    // 计算尺寸
    const boundingBox = moduleAdapter.getBoundsCalculator().calculateBoundingBox(object);
    const dimensions = moduleAdapter.getBoundsCalculator().calculateDimensions(object);
    const center = moduleAdapter.getBoundsCalculator().calculateCenter(object);
    
    // 显示边界框
    const boundingBoxHelper = moduleAdapter.getHelperObjectFactory().createBoundingBoxHelper(object, 0x00ff00);
    this.scene.add(boundingBoxHelper);
    
    // 保存引用
    const helperId = `bounding_box_${Date.now()}`;
    this.helperObjects.set(helperId, boundingBoxHelper);
    
    // 显示信息面板
    if (this.controlPanel) {
      this.controlPanel.setCommand("object_dimensions", "Object Dimensions");
      
      this.controlPanel.addControl({
        id: "dimensions_width",
        type: "number",
        label: "Width",
        value: dimensions.width,
        onChange: () => {} // 只读显示
      });
      
      this.controlPanel.addControl({
        id: "dimensions_height",
        type: "number",
        label: "Height",
        value: dimensions.height,
        onChange: () => {} // 只读显示
      });
      
      this.controlPanel.addControl({
        id: "dimensions_depth",
        type: "number",
        label: "Depth",
        value: dimensions.depth,
        onChange: () => {} // 只读显示
      });
      
      this.controlPanel.addControl({
        id: "dimensions_volume",
        type: "number",
        label: "Volume",
        value: dimensions.width * dimensions.height * dimensions.depth,
        onChange: () => {} // 只读显示
      });
      
      this.controlPanel.addControl({
        id: "center_position",
        type: "number",
        label: "Center",
        value: `${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`,
        onChange: () => {} // 只读显示
      });
    }
    
    console.log("[showObjectDimensions] Displayed object dimensions", dimensions);
  }

  /**
   * 添加辅助对象
   */
  public addHelperObject(params: { helperType: string, color: string }): void {
    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[addHelperObject] No current object ID found");
      return;
    }

    const object = this.processor.getObject(objectId);
    if (!object) {
      console.error("[addHelperObject] Object not found with ID:", objectId);
      return;
    }

    try {
      // 将颜色字符串转换为数值
      const colorValue = parseInt(params.color.replace("#", "0x"), 16);
      
      // 根据类型创建辅助对象
      let helperObject: THREE.Object3D;
      
      switch (params.helperType) {
        case "BOUNDING_BOX":
          helperObject = moduleAdapter.getHelperObjectFactory().createBoundingBoxHelper(object, colorValue);
          break;
        case "GRID":
          helperObject = moduleAdapter.getHelperObjectFactory().createGrid(200, 20, colorValue, 0x888888);
          break;
        case "AXES":
          helperObject = moduleAdapter.getHelperObjectFactory().createAxes(100);
          break;
        case "EDGE_LINES":
          if (object instanceof THREE.Mesh) {
            helperObject = moduleAdapter.getHelperObjectFactory().createEdgesHelper(object, 30, colorValue);
          } else {
            console.error("[addHelperObject] Edge lines require a mesh object");
            return;
          }
          break;
        default:
          console.error("[addHelperObject] Invalid helper type:", params.helperType);
          return;
      }
      
      // 添加到场景
      this.scene.add(helperObject);
      
      // 保存引用
      const helperId = `helper_${params.helperType.toLowerCase()}_${Date.now()}`;
      this.helperObjects.set(helperId, helperObject);
      
      console.log(`[addHelperObject] Added ${params.helperType} helper with color ${params.color}`);
    } catch (error) {
      console.error("[addHelperObject] Error adding helper object:", error);
    }
  }

  /**
   * 创建自定义控件
   */
  public createCustomControl(params: { 
    label: string, 
    controlType: string, 
    initialValue: number, 
    varName: string 
  }): void {
    if (!this.controlPanel) {
      console.error("[createCustomControl] Control panel not available");
      return;
    }

    try {
      // 设置控制面板
      this.controlPanel.setCommand("custom_control", "Custom Controls");
      
      // 确定控件类型
      let controlType: "slider" | "number" | "checkbox";
      switch (params.controlType) {
        case "SLIDER":
          controlType = "slider";
          break;
        case "NUMBER":
          controlType = "number";
          break;
        case "CHECKBOX":
          controlType = "checkbox";
          break;
        default:
          console.error("[createCustomControl] Invalid control type:", params.controlType);
          return;
      }
      
      // 初始值
      const initialValue = controlType === "checkbox" ? 
        (params.initialValue !== 0) : 
        params.initialValue;
      
      // 存储初始值到变量
      scope.setVar(params.varName, initialValue);
      
      // 创建控件
      this.controlPanel.addControl({
        id: params.varName,
        type: controlType,
        label: params.label,
        min: 0,
        max: 100,
        step: 1,
        value: initialValue,
        onChange: (value: any) => {
          // 更新变量值
          scope.setVar(params.varName, value);
          console.log(`[createCustomControl] Updated ${params.varName} to ${value}`);
        }
      });
      
      console.log(`[createCustomControl] Created ${controlType} control with label "${params.label}"`);
    } catch (error) {
      console.error("[createCustomControl] Error creating custom control:", error);
    }
  }
}