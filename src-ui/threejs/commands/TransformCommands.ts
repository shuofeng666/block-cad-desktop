// src-ui/threejs/commands/TransformCommands.ts
import * as THREE from "three";
import { scope } from "../../core/Scope";
import { ThreeJSCommandProcessor } from "../ThreeJSCommandProcessor";

export class TransformCommands {
  private processor: ThreeJSCommandProcessor;
  private controlPanel?: any;

  constructor(processor: ThreeJSCommandProcessor) {
    this.processor = processor;
    this.controlPanel = processor.getControlPanel();
  }

  /**
   * 清理变换状态
   */
  public clearState(): void {
    scope.setVar("_rotateModelValues", null);
    scope.setVar("_scaleModelValue", null);
    scope.setVar("_translateModelValues", null);
  }

  /**
   * 处理模型旋转命令
   */
  public rotateModel(cmd: any): string {
    console.log("[rotateModel] Starting with args:", cmd.args);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[rotateModel] No current object ID found");
      return null;
    }

    const object = this.processor.getObject(objectId);
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

    // 检查是否处于层叠模式，通知层叠处理模块
    if (scope.context["_isStackedLayersMode"] && scope.context["_originalModelId"]) {
      // 发出需要更新层叠切片的信号
      scope.setVar("_needRegenerateStackedLayers", true);
    }

    return objectId;
  }

  /**
   * 处理模型缩放命令
   */
  public scaleModel(cmd: any): string {
    console.log("[scaleModel] Starting with args:", cmd.args);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[scaleModel] No current object ID found");
      return null;
    }

    const object = this.processor.getObject(objectId);
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
    
    // 检查是否处于层叠模式，通知层叠处理模块
    if (scope.context["_isStackedLayersMode"] && scope.context["_originalModelId"]) {
      // 发出需要更新层叠切片的信号
      scope.setVar("_needRegenerateStackedLayers", true);
    }
    
    return objectId;
  }

  /**
   * 处理模型平移命令
   */
  public translateModel(cmd: any): string {
    console.log("[translateModel] Starting with args:", cmd.args);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[translateModel] No current object ID found");
      return null;
    }

    const object = this.processor.getObject(objectId);
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
    
    // 检查是否处于层叠模式，通知层叠处理模块
    if (scope.context["_isStackedLayersMode"] && scope.context["_originalModelId"]) {
      // 发出需要更新层叠切片的信号
      scope.setVar("_needRegenerateStackedLayers", true);
    }
    
    return objectId;
  }

  /**
   * 处理旋转值变化
   */
  public onRotateValueChange(axis: string, value: number): void {
    console.log(`[onRotateValueChange] ${axis} changed to ${value}`);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[onRotateValueChange] No current object ID found");
      return;
    }

    const object = this.processor.getObject(objectId);
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
    const currentSceneObject = this.processor.getCurrentSceneObject();
    if (currentSceneObject) {
      switch (axis) {
        case "rotateX":
          currentSceneObject.rotation.x = angleRadians;
          break;
        case "rotateY":
          currentSceneObject.rotation.y = angleRadians;
          break;
        case "rotateZ":
          currentSceneObject.rotation.z = angleRadians;
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

    // 检查是否处于层叠模式，通知层叠处理模块
    if (scope.context["_isStackedLayersMode"] && scope.context["_originalModelId"]) {
      // 发出需要更新层叠切片的信号
      scope.setVar("_needRegenerateStackedLayers", true);
    }
  }

  /**
   * 处理缩放值变化
   */
  public onScaleValueChange(value: number): void {
    console.log(`[onScaleValueChange] Scale changed to ${value}`);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[onScaleValueChange] No current object ID found");
      return;
    }

    const object = this.processor.getObject(objectId);
    if (!object) {
      console.error("[onScaleValueChange] Object not found with ID:", objectId);
      return;
    }

    // 记录当前缩放
    const currentScaleX = object.scale.x;

    // 重置缩放到统一值
    object.scale.set(value, value, value);

    // 如果已经在场景中显示了对象，也更新其缩放
    const currentSceneObject = this.processor.getCurrentSceneObject();
    if (currentSceneObject) {
      currentSceneObject.scale.set(value, value, value);
    }

    console.log(
      `[onScaleValueChange] Applied new scale. Previous: ${currentScaleX}, New: ${value}`
    );

    // 检查是否处于层叠模式，通知层叠处理模块
    if (scope.context["_isStackedLayersMode"] && scope.context["_originalModelId"]) {
      // 发出需要更新层叠切片的信号
      scope.setVar("_needRegenerateStackedLayers", true);
    }
  }

  /**
   * 处理平移值变化
   */
  public onTranslateValueChange(axis: string, value: number): void {
    console.log(`[onTranslateValueChange] ${axis} changed to ${value}`);

    const objectId = scope.context["_currentObjectId"];
    if (!objectId) {
      console.error("[onTranslateValueChange] No current object ID found");
      return;
    }

    const object = this.processor.getObject(objectId);
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
    const currentSceneObject = this.processor.getCurrentSceneObject();
    if (currentSceneObject) {
      switch (axis) {
        case "translateX":
          currentSceneObject.position.x = value;
          break;
        case "translateY":
          currentSceneObject.position.y = value;
          break;
        case "translateZ":
          currentSceneObject.position.z = value;
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

    // 检查是否处于层叠模式，通知层叠处理模块
    if (scope.context["_isStackedLayersMode"] && scope.context["_originalModelId"]) {
      // 发出需要更新层叠切片的信号
      scope.setVar("_needRegenerateStackedLayers", true);
    }
  }

  /**
   * 显示组合变换控件
   */
// 修改 TransformCommands.ts 中的 showCombinedTransformControls 方法
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

  const object = this.processor.getObject(objectId);
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
}