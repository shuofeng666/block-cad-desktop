// src-ui/threejs/ThreeJSCommandProcessor.ts
import * as THREE from "three";
import { scope } from "../core/Scope";
import { ControlPanel } from "../components/ControlPanel";
import { ModelCommands } from "./commands/ModelCommands";
import { TransformCommands } from "./commands/TransformCommands";
import { WireMeshCommands } from "./commands/WireMeshCommands";
import { StackedLayersCommands } from "./commands/StackedLayersCommands";
import { ProgrammingCommands } from "./commands/ProgrammingCommands";
import { VisualizationCommands } from "./commands/VisualizationCommands";
import { UtilityCommands } from "./commands/UtilityCommands";

export class ThreeJSCommandProcessor {
  // 共享状态
  private scene: THREE.Scene;
  private currentObjects: Map<string, THREE.Object3D> = new Map();
  private glViewer: any;
  private controlPanel?: ControlPanel;
  private currentSceneObject: THREE.Object3D | null = null;
  
  // 功能模块
  private modelCommands: ModelCommands;
  private transformCommands: TransformCommands;
  private wireMeshCommands: WireMeshCommands;
  private stackedLayersCommands: StackedLayersCommands;
  private programmingCommands: ProgrammingCommands;
  private visualizationCommands: VisualizationCommands;
  private utilityCommands: UtilityCommands;

  

constructor(glViewer: any, controlPanel?: ControlPanel) {
  this.glViewer = glViewer;
  this.scene = glViewer.scene;
  this.controlPanel = controlPanel;

  // 初始化各功能模块
  this.modelCommands = new ModelCommands(this);
  this.transformCommands = new TransformCommands(this);
  this.wireMeshCommands = new WireMeshCommands(this);
  this.stackedLayersCommands = new StackedLayersCommands(this);
  this.programmingCommands = new ProgrammingCommands(this);
  this.visualizationCommands = new VisualizationCommands(this);
  this.utilityCommands = new UtilityCommands(this);
  // 将处理器引用传递给 GLViewer，以便它可以在合适的时间调用 checkStateUpdates
  if (glViewer) {
    glViewer.commandProcessor = this;
    console.log("[ThreeJSCommandProcessor] 已将处理器引用传递给 GLViewer");
  }

  console.log(
    "[ThreeJSCommandProcessor] 初始化完成，控制面板:",
    !!controlPanel
  );
}




  // 共享访问器方法
  getScene(): THREE.Scene {
    return this.scene;
  }

  getGLViewer(): any {
    return this.glViewer;
  }

  getControlPanel(): ControlPanel | undefined {
    return this.controlPanel;
  }

  getObject(id: string): THREE.Object3D | undefined {
    return this.currentObjects.get(id);
  }

  addObject(id: string, object: THREE.Object3D): void {
    this.currentObjects.set(id, object);
  }

  getCurrentSceneObject(): THREE.Object3D | null {
    return this.currentSceneObject;
  }

  setCurrentSceneObject(object: THREE.Object3D | null): void {
    this.currentSceneObject = object;
  }

  // 获取命令模块的访问器方法
public getStackedLayersCommands(): StackedLayersCommands {
  return this.stackedLayersCommands;
}

public getTransformCommands(): TransformCommands {
  return this.transformCommands;
}

public getWireMeshCommands(): WireMeshCommands {
  return this.wireMeshCommands;
}

// 添加访问器方法
  public getUtilityCommands(): UtilityCommands {
    return this.utilityCommands;
  }

  // 主命令处理方法
public async processCommand(cmd: any): Promise<any> {
  console.log(
    "[ThreeJSCommandProcessor] 处理命令:",
    cmd.id,
    cmd.args
  );

  try {
    // 根据命令类型分发到相应的处理模块
    switch (cmd.id) {
      // 模型命令
      case "upload_stl":
        return await this.modelCommands.uploadSTL(cmd.args.file);
      case "create_cube":
        return this.modelCommands.createCube(cmd.args.size);
        
      // 变换命令
      case "rotate_model":
        return this.transformCommands.rotateModel(cmd);
      case "scale_model":
        return this.transformCommands.scaleModel(cmd);
      case "translate_model":
        return this.transformCommands.translateModel(cmd);
        
      // 线框网格命令
      case "initialize_wire_mesh":
        return this.wireMeshCommands.initializeWireMesh();
      case "add_horizontal_wire":
        return this.wireMeshCommands.addHorizontalWire(
          cmd.args.position,
          cmd.args.thickness,
          cmd.args.color
        );
      case "add_vertical_wire":
        return this.wireMeshCommands.addVerticalWire(
          cmd.args.position,
          cmd.args.thickness,
          cmd.args.color
        );
      case "convert_to_tubes":
        return this.wireMeshCommands.convertToTubes(cmd.args.thickness);
      case "collect_wire_mesh":
        return this.wireMeshCommands.collectWireMesh();
      case "generate_wire_mesh":
        return await this.wireMeshCommands.generateWireMesh(cmd);
      case "export_wire_csv":
        return await this.wireMeshCommands.exportWireCSV(cmd);
        
      // 层叠切片命令
      case "generate_stacked_layers":
        return await this.stackedLayersCommands.generateStackedLayers(cmd);
      case "export_stacked_layers_svg":
        return this.stackedLayersCommands.exportStackedLayersSVG(cmd);
        
      // 编程逻辑命令
      case "variable_declaration":
        return this.programmingCommands.handleVariableDeclaration(cmd);
      case "for_loop":
        return await this.programmingCommands.handleForLoop(cmd);
      case "if_statement":
        return await this.programmingCommands.handleIfStatement(cmd);
        
      // 可视化命令
      case "show_in_viewer":
        return await this.visualizationCommands.showInViewer(cmd);
      case "clear_scene":
        return this.visualizationCommands.clearScene();

        // 工具命令
        case "calculate_bounds":
          return this.utilityCommands.calculateBounds();
        case "generate_contour":
          return this.utilityCommands.generateContour(cmd.args);
        case "calculate_intersection":
          return this.utilityCommands.calculateIntersection(cmd.args);
        case "apply_material":
          return this.utilityCommands.applyMaterial(cmd.args);
        case "show_object_dimensions":
          return this.utilityCommands.showObjectDimensions();
        case "add_helper_object":
          return this.utilityCommands.addHelperObject(cmd.args);
        case "create_custom_control":
          return this.utilityCommands.createCustomControl(cmd.args);
        
      default:
        console.warn("[ThreeJSCommandProcessor] 未知命令:", cmd.id);
        return null;
    }
  } catch (error) {
    console.error(
      "[ThreeJSCommandProcessor] 处理命令时出错:",
      cmd.id,
      error
    );
    return null;
  }
}

  // 检查是否需要执行状态更新 - 在渲染循环中调用
  public checkStateUpdates(): void {
    // 检查层叠切片是否需要重新生成
    this.stackedLayersCommands.checkNeedRegenerate();
  }

  // 清理方法
  public clearState(): void {
    // 清理存储的对象引用
    this.currentObjects.clear();
    this.currentSceneObject = null;
    
    // 调用各模块的清理方法
    this.stackedLayersCommands.clearState();
    this.wireMeshCommands.clearState();
    this.transformCommands.clearState();

    // 清理工具命令状态
    this.utilityCommands.clearState();
    
    // 清理控制面板
    if (this.controlPanel) {
      this.controlPanel.clear();
    }

    console.log(
      "[ThreeJSCommandProcessor] 状态已清理，包括控制面板"
    );
  }
}