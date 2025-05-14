// src-ui/threejs/ThreeJSCommandProcessor.ts
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { hull } from '../utils/hull';
import { scope } from '../jscad/Scope';

export class ThreeJSCommandProcessor {
  private scene: THREE.Scene;
  private currentObjects: Map<string, THREE.Object3D> = new Map();
  private glViewer: any;
  
  constructor(glViewer: any) {
    this.glViewer = glViewer;
    this.scene = glViewer.scene;
  }
  
  async processCommand(cmd: any): Promise<any> {
    console.log('Processing command:', cmd.id, cmd.args);
    
    try {
      switch (cmd.id) {
        case "load_stl":
          return await this.loadSTL(cmd.args.filename);
          
        case "create_cube":
          return this.createCube(cmd.args.size);
           // 添加这个新的 case
    case "generate_wire_mesh":
      return await this.generateWireMesh(cmd);
        // 添加这个新的 case
      case "upload_stl":
        return await this.uploadSTL(cmd.args.file);
          
        case "generate_horizontal_wires":
          return await this.generateHorizontalWires(cmd);
          
        case "generate_vertical_wires":
          return await this.generateVerticalWires(cmd);
          
        case "show_in_viewer":
          return await this.showInViewer(cmd);
          
        case "clear_scene":
          return this.clearScene();
          
        case "export_wire_csv":
          return await this.exportWireCSV(cmd);
          
        default:
          console.warn('Unknown command:', cmd.id);
          return null;
      }
    } catch (error) {
      console.error('Error processing command:', cmd.id, error);
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
            opacity: 0.8
          });
          const mesh = new THREE.Mesh(geometry, material);
          
          const id = `stl_${Date.now()}`;
          this.currentObjects.set(id, mesh);
          
          // 存储到 scope 中以供其他命令使用
          scope.setVar('_currentObjectId', id);
          
          resolve(id);
        },
        (progress) => {
          console.log('Loading progress:', progress);
        },
        (error) => {
          console.error('Error loading STL:', error);
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
    scope.setVar('_currentObjectId', id);
    return id;
  }
  

  private async uploadSTL(file: File): Promise<string> {
  const loader = new STLLoader();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      try {
        const geometry = loader.parse(arrayBuffer);
        geometry.center();
        
        const material = new THREE.MeshNormalMaterial({
          transparent: true,
          opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        const id = `stl_${Date.now()}`;
        this.currentObjects.set(id, mesh);
        scope.setVar('_currentObjectId', id);
        
        resolve(id);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
  private async generateHorizontalWires(cmd: any): Promise<string> {
    // 获取当前对象 ID
    let objectId = scope.context['_currentObjectId'];
    
    // 如果有子命令，处理它们
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processCommand(child);
        if (result) objectId = result;
      }
    }
    
    const model = this.currentObjects.get(objectId);
    if (!model || !(model instanceof THREE.Mesh)) {
      console.error('No valid mesh found for wire generation');
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
    scope.setVar('_currentObjectId', id);
    
    // 存储线框数据供导出使用
    scope.setVar('_horizontalWires', wires);
    
    return id;
  }
  
  private createHorizontalWire(model: THREE.Mesh, y: number, boundingBox: THREE.Box3, size: THREE.Vector3) {
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
          const a = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i));
          const b = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i + 1));
          const c = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i + 2));
          
          model.localToWorld(a);
          model.localToWorld(b);
          model.localToWorld(c);
          
          this.addIntersectionPoints(a, b, c, plane, intersectionPoints);
        }
      }
      
      if (intersectionPoints.length < 3) return null;
      
      // 使用 hull 算法
      const points2D = intersectionPoints.map(p => [p.x, p.z]);
      const hullPoints = hull(points2D, 20);
      
      if (!hullPoints || hullPoints.length < 3) return null;
      
      // 创建线条
      const linePoints = hullPoints.map(p => new THREE.Vector3(p[0], y, p[1]));
      linePoints.push(linePoints[0].clone()); // 闭合
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      
      return new THREE.Line(lineGeometry, lineMaterial);
    } catch (error) {
      console.error('Error creating horizontal wire:', error);
      return null;
    }
  }
  
  private addIntersectionPoints(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, 
                                plane: THREE.Plane, points: THREE.Vector3[]) {
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
    let objectId = scope.context['_currentObjectId'];
    
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processCommand(child);
        if (result) objectId = result;
      }
    }
    
    const model = this.currentObjects.get(objectId);
    if (!model || !(model instanceof THREE.Mesh)) {
      console.error('No valid mesh found for wire generation');
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
    scope.setVar('_currentObjectId', id);
    scope.setVar('_verticalWires', wires);
    
    return id;
  }
  
private createVerticalWire(model: THREE.Mesh, z: number, boundingBox: THREE.Box3, size: THREE.Vector3) {
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
        const a = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i));
        const b = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i + 1));
        const c = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i + 2));
        
        model.localToWorld(a);
        model.localToWorld(b);
        model.localToWorld(c);
        
        this.addIntersectionPoints(a, b, c, plane, intersectionPoints);
      }
    }
    
    if (intersectionPoints.length < 3) return null;
    
    // 使用 hull 算法（投影到 XY 平面）
    const points2D = intersectionPoints.map(p => [p.x, p.y]);
    const hullPoints = hull(points2D, 20);
    
    if (!hullPoints || hullPoints.length < 3) return null;
    
    // 创建线条
    const linePoints = hullPoints.map(p => new THREE.Vector3(p[0], p[1], z));
    linePoints.push(linePoints[0].clone()); // 闭合
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    
    return new THREE.Line(lineGeometry, lineMaterial);
  } catch (error) {
    console.error('Error creating vertical wire:', error);
    return null;
  }
}
  
  private async showInViewer(cmd: any): Promise<void> {
    let objectId = scope.context['_currentObjectId'];
    
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processCommand(child);
        if (result) objectId = result;
      }
    }
    
    const object = this.currentObjects.get(objectId);
    
    if (object) {
      this.glViewer.clearScene();
      this.glViewer.scene.add(object.clone());
      
      // 调整相机位置
      const boundingBox = new THREE.Box3().setFromObject(object);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      const camera = this.glViewer.camera;
      camera.position.set(center.x + maxDim, center.y + maxDim, center.z + maxDim);
      camera.lookAt(center);
      
      this.glViewer.orbitControl.target.copy(center);
      this.glViewer.orbitControl.update();
    }
  }

  // 添加新的方法到 ThreeJSCommandProcessor 类中
private async generateWireMesh(cmd: any): Promise<string> {
  let objectId = scope.context['_currentObjectId'];
  
  // 处理子命令获取模型
  if (cmd.children && cmd.children.length > 0) {
    for (const child of cmd.children) {
      const result = await this.processCommand(child);
      if (result) objectId = result;
    }
  }
  
  const model = this.currentObjects.get(objectId);
  if (!model || !(model instanceof THREE.Mesh)) {
    console.error('No valid mesh found for wire generation');
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
  scope.setVar('_currentObjectId', id);
  scope.setVar('_wireMesh', wireGroup);
  
  return id;
}
  
  private async exportWireCSV(cmd: any): Promise<void> {
    const filename = cmd.args.filename || 'wire_mesh';
    
    // 导出水平线框
    const horizontalWires = scope.context['_horizontalWires'];
    if (horizontalWires instanceof THREE.Group) {
      this.exportGroupToCSV(horizontalWires, `${filename}_horizontal`);
    }
    
    // 导出垂直线框
    const verticalWires = scope.context['_verticalWires'];
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
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
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
    scope.setVar('_currentObjectId', null);
    scope.setVar('_horizontalWires', null);
    scope.setVar('_verticalWires', null);
  }
}