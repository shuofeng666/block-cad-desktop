// src-ui/threejs/commands/WireMeshCommands.ts
import * as THREE from "three";
import { scope } from "../../core/Scope";
import { ThreeJSCommandProcessor } from "../ThreeJSCommandProcessor";
import { hull } from "../../utils/hull";

export class WireMeshCommands {
  private processor: ThreeJSCommandProcessor;
  
  // 线框网格上下文
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

  constructor(processor: ThreeJSCommandProcessor) {
    this.processor = processor;
  }

  /**
   * 清理状态
   */
  public clearState(): void {
    // 重置线框网格上下文
    this.wireMeshContext = {
      isGenerating: false,
      wires: [],
      currentWireId: 0,
    };
    
    // 清除相关全局变量
    scope.setVar("_wireMesh", null);
  }

  /**
   * 初始化线框网格
   */
  public initializeWireMesh(): void {
    this.wireMeshContext.isGenerating = true;
    this.wireMeshContext.wires = [];
    this.wireMeshContext.currentWireId = 0;
    console.log("[initializeWireMesh] Started new wire mesh definition");
  }



/**
 * 添加水平线
 */
public addHorizontalWire(
  position: any, // 修改为any类型，以接受变量名或数值
  thickness: number,
  color: string
): void {
  if (!this.wireMeshContext.isGenerating) {
    console.error("[addHorizontalWire] No active wire mesh generation");
    return;
  }

  // 获取当前模型
  const objectId = scope.context["_currentObjectId"];
  const model = this.processor.getObject(objectId);

  if (!model || !(model instanceof THREE.Mesh)) {
    console.error("[addHorizontalWire] No valid model found");
    return;
  }

  // 处理position参数，支持变量和表达式
  let positionValue: number;
  
  if (typeof position === 'string') {
    // 检查是否是变量引用
    if (scope.context[position] !== undefined) {
      // 是变量名，从scope中获取值
      positionValue = scope.context[position];
      console.log(`[addHorizontalWire] Using variable ${position} = ${positionValue}`);
    } else {
      // 尝试作为表达式求值
      try {
        // 安全地求值表达式（可能需要更复杂的实现）
        positionValue = eval(position);
        console.log(`[addHorizontalWire] Evaluated expression ${position} = ${positionValue}`);
      } catch (e) {
        console.error(`[addHorizontalWire] Failed to evaluate position: ${position}`, e);
        positionValue = 0; // 默认值
      }
    }
  } else {
    // 直接数值
    positionValue = parseFloat(position);
    console.log(`[addHorizontalWire] Using direct position value: ${positionValue}`);
  }

  // 计算边界盒和实际Y位置
  const boundingBox = new THREE.Box3().setFromObject(model);
  const yPosition = boundingBox.min.y + positionValue;

  // 其余代码保持不变...
  // 查找与模型的交点
  const intersectionPoints = this.findHorizontalIntersectionPoints(
    model,
    yPosition
  );

  if (intersectionPoints.length < 3) {
    console.warn("[addHorizontalWire] Not enough intersection points found");
    return;
  }

  // 存储线信息
  const wireId = this.wireMeshContext.currentWireId++;
  this.wireMeshContext.wires.push({
    type: "horizontal",
    position: positionValue, // 使用解析后的值
    thickness,
    color,
    points: intersectionPoints,
    isLine: true,
  });

  // 创建线预览
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
  this.processor.addObject(id, line);

  console.log(
    `[addHorizontalWire] Added at position=${positionValue} with thickness=${thickness}, ID=${id}`
  );
}

/**
 * 添加垂直线
 */
public addVerticalWire(
  position: any, // 修改为any类型，以接受变量名或数值
  thickness: number,
  color: string
): void {
  if (!this.wireMeshContext.isGenerating) {
    console.error("[addVerticalWire] No active wire mesh generation");
    return;
  }

  // 获取当前模型
  const objectId = scope.context["_currentObjectId"];
  const model = this.processor.getObject(objectId);

  if (!model || !(model instanceof THREE.Mesh)) {
    console.error("[addVerticalWire] No valid model found");
    return;
  }

  // 处理position参数，支持变量和表达式
  let positionValue: number;
  
  if (typeof position === 'string') {
    // 检查是否是变量引用
    if (scope.context[position] !== undefined) {
      // 是变量名，从scope中获取值
      positionValue = scope.context[position];
      console.log(`[addVerticalWire] Using variable ${position} = ${positionValue}`);
    } else {
      // 尝试作为表达式求值
      try {
        // 安全地求值表达式（可能需要更复杂的实现）
        positionValue = eval(position);
        console.log(`[addVerticalWire] Evaluated expression ${position} = ${positionValue}`);
      } catch (e) {
        console.error(`[addVerticalWire] Failed to evaluate position: ${position}`, e);
        positionValue = 0; // 默认值
      }
    }
  } else {
    // 直接数值
    positionValue = parseFloat(position);
    console.log(`[addVerticalWire] Using direct position value: ${positionValue}`);
  }

  // 计算边界盒和实际Z位置
  const boundingBox = new THREE.Box3().setFromObject(model);
  const zPosition = boundingBox.min.z + positionValue;

  // 查找与模型的交点
  const intersectionPoints = this.findVerticalIntersectionPoints(
    model,
    zPosition
  );

  if (intersectionPoints.length < 3) {
    console.warn("[addVerticalWire] Not enough intersection points found");
    return;
  }

  // 存储线信息
  const wireId = this.wireMeshContext.currentWireId++;
  this.wireMeshContext.wires.push({
    type: "vertical",
    position: positionValue, // 使用解析后的值
    thickness,
    color,
    points: intersectionPoints,
    isLine: true,
  });

  // 创建线预览
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
  this.processor.addObject(id, line);

  console.log(
    `[addVerticalWire] Added at position=${positionValue} with thickness=${thickness}, ID=${id}`
  );
}

  /**
   * 转换为管
   */
  public convertToTubes(tubeThickness: number): void {
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
        const line = this.processor.getObject(lineId);

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
          this.processor.addObject(lineId, tube);
        }
      }
    }
  }

  /**
   * 收集为一个整体
   */
  public collectWireMesh(): string {
    if (!this.wireMeshContext.isGenerating) {
      console.error("[collectWireMesh] No active wire mesh generation");
      return null;
    }

    // 创建一个组来保存所有线
    const wireGroup = new THREE.Group();

    // 添加所有线对象到组
    for (let i = 0; i < this.wireMeshContext.wires.length; i++) {
      const wireId = `wire_component_${i}`;
      const wireObject = this.processor.getObject(wireId);

      if (wireObject) {
        wireGroup.add(wireObject.clone());
      }
    }

    // 重置上下文
    this.wireMeshContext.isGenerating = false;

    // 保存并返回结果
    const id = `component_wire_mesh_${Date.now()}`;
    this.processor.addObject(id, wireGroup);
    scope.setVar("_currentObjectId", id);
    scope.setVar("_wireMesh", wireGroup);

    console.log(
      `[collectWireMesh] Collected ${this.wireMeshContext.wires.length} wires into mesh ID=${id}`
    );

    return id;
  }

  /**
   * 生成线框网格
   */
  public async generateWireMesh(cmd: any): Promise<string> {
    let objectId = scope.context["_currentObjectId"];

    // 处理子命令获取模型
    if (cmd.children && cmd.children.length > 0) {
      for (const child of cmd.children) {
        const result = await this.processor.processCommand(child);
        if (result) objectId = result;
      }
    }

    const model = this.processor.getObject(objectId);
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
    this.processor.addObject(id, wireGroup);
    scope.setVar("_currentObjectId", id);
    scope.setVar("_wireMesh", wireGroup);

    return id;
  }

  /**
   * 导出线框网格为CSV
   */
  public async exportWireCSV(cmd: any): Promise<void> {
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

  // 辅助方法

  /**
   * 创建水平线框线
   */
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

  /**
   * 创建垂直线框线
   */
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

  /**
   * 查找水平交点
   */
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

    // 使用交点查找逻辑
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
    } else {
      // 处理非索引几何体
      for (let i = 0; i < vertices.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(vertices, i);
        const b = new THREE.Vector3().fromBufferAttribute(vertices, i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(vertices, i + 2);

        model.localToWorld(a);
        model.localToWorld(b);
        model.localToWorld(c);

        this.addIntersectionPoints(a, b, c, plane, intersectionPoints);
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

  /**
   * 查找垂直交点
   */
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

    // 使用交点查找逻辑
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
    } else {
      // 处理非索引几何体
      for (let i = 0; i < vertices.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(vertices, i);
        const b = new THREE.Vector3().fromBufferAttribute(vertices, i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(vertices, i + 2);

        model.localToWorld(a);
        model.localToWorld(b);
        model.localToWorld(c);

        this.addIntersectionPoints(a, b, c, plane, intersectionPoints);
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

  /**
   * 添加交点
   */
  private addIntersectionPoints(
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

  /**
   * 添加三角形与平面的交点
   */
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
}