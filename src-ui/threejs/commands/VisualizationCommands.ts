// src-ui/threejs/commands/VisualizationCommands.ts
import * as THREE from "three";
import { scope } from "../../core/Scope";
import { ThreeJSCommandProcessor } from "../ThreeJSCommandProcessor";

export class VisualizationCommands {
  private processor: ThreeJSCommandProcessor;
  private glViewer: any;

  constructor(processor: ThreeJSCommandProcessor) {
    this.processor = processor;
    this.glViewer = processor.getGLViewer();
  }

  /**
   * 在3D查看器中显示模型
   */
// 修改 VisualizationCommands.ts 中的 showInViewer 方法
public async showInViewer(cmd: any): Promise<void> {
  console.log("[showInViewer] 开始执行");
  let objectId = scope.context["_currentObjectId"];
  console.log("[showInViewer] 当前对象 ID:", objectId);

  const object = this.processor.getObject(objectId);
  console.log("[showInViewer] 找到对象:", object ? object.type : "未找到");

  if (object) {
    // 清除之前的场景对象
    const currentSceneObject = this.processor.getCurrentSceneObject();
    if (currentSceneObject) {
      this.glViewer.scene.remove(currentSceneObject);
    }

    // 克隆并添加对象
    const clonedObject = object.clone();
    
    // 检查是否处于层叠模式 (使用原始的检查方式)
    const isStackedLayersMode = !!scope.context["_stackedLayersId"];
    if (isStackedLayersMode) {
      clonedObject.visible = false;
    }
    
    this.glViewer.scene.add(clonedObject);

    // 保存对当前场景对象的引用
    this.processor.setCurrentSceneObject(clonedObject);

    // 确保对象可见
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

    // 添加额外的灯光以更好地显示模型
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);

    this.glViewer.scene.add(ambientLight);
    this.glViewer.scene.add(directionalLight1);
    this.glViewer.scene.add(directionalLight2);

    // 直接调用变换命令模块的显示控件方法
    const transformCommands = this.processor.getTransformCommands();
    if (transformCommands) {
      // 使用原始代码中的直接调用方式
      transformCommands.showCombinedTransformControls();
    }
    
    // 如果在层叠模式，检查是否需要重新生成层叠切片
    const originalModelId = scope.context["_originalModelId"];
    if (isStackedLayersMode && originalModelId) {
      const stackedLayersCommands = this.processor.getStackedLayersCommands();
      if (stackedLayersCommands) {
        // 直接调用重新生成方法，与原代码逻辑一致
        stackedLayersCommands.debounceRegenerateStackedLayers();
      }
    }
  } else {
    console.error("[showInViewer] 未找到要显示的对象，ID:", objectId);
  }
}

  /**
   * 清除场景中的所有对象
   */
  public clearScene(): void {
    console.log("[clearScene] Clearing scene and object references");
    this.glViewer.clearScene();

    // 重置当前场景对象引用
    this.processor.setCurrentSceneObject(null);
    
    // 重置全局变量
    scope.setVar("_currentObjectId", null);
    scope.setVar("_wireMesh", null);
    
    // 重置控制面板
    const controlPanel = this.processor.getControlPanel();
    if (controlPanel) {
      controlPanel.clear();
    }
  }
}