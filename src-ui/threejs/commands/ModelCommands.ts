// src-ui/threejs/commands/ModelCommands.ts
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { scope } from "../../core/Scope";
import { ThreeJSCommandProcessor } from "../ThreeJSCommandProcessor";

export class ModelCommands {
  private processor: ThreeJSCommandProcessor;

  constructor(processor: ThreeJSCommandProcessor) {
    this.processor = processor;
  }

  /**
   * 上传并加载STL文件
   */
  public async uploadSTL(file: File): Promise<string> {
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
          this.processor.addObject(id, mesh);

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

  /**
   * 创建立方体模型
   */
  public createCube(size: number): string {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);

    const id = `cube_${Date.now()}`;
    this.processor.addObject(id, cube);
    scope.setVar("_currentObjectId", id);
    return id;
  }
}