// src-ui/utils/geometry/IntersectionCalculator.ts
import * as THREE from "three";

/**
 * 交点计算器 - 处理几何体与平面相交的计算
 * 提供高效、可复用的交点计算功能
 */
export class IntersectionCalculator {
  /**
   * 计算网格与平面的交点
   * @param mesh THREE.js网格对象
   * @param plane THREE.js平面对象
   * @param worldSpace 结果是否返回世界坐标（默认true）
   * @returns 交点数组
   */
  public calculateMeshPlaneIntersection(
    mesh: THREE.Mesh,
    plane: THREE.Plane,
    worldSpace: boolean = true
  ): THREE.Vector3[] {
    const intersectionPoints: THREE.Vector3[] = [];
    
    // 获取几何体数据
    const geometry = mesh.geometry;
    const vertices = geometry.attributes.position;
    const indices = geometry.index;
    
    // 处理索引几何体
    if (indices !== null) {
      for (let i = 0; i < indices.count; i += 3) {
        const aIndex = indices.getX(i);
        const bIndex = indices.getX(i + 1);
        const cIndex = indices.getX(i + 2);
        
        const a = new THREE.Vector3().fromBufferAttribute(vertices, aIndex);
        const b = new THREE.Vector3().fromBufferAttribute(vertices, bIndex);
        const c = new THREE.Vector3().fromBufferAttribute(vertices, cIndex);
        
        // 转换到世界坐标（如需要）
        if (worldSpace) {
          a.applyMatrix4(mesh.matrixWorld);
          b.applyMatrix4(mesh.matrixWorld);
          c.applyMatrix4(mesh.matrixWorld);
        }
        
        // 计算交点
        this.calculateTrianglePlaneIntersection(a, b, c, plane, intersectionPoints);
      }
    } else {
      // 处理非索引几何体
      for (let i = 0; i < vertices.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(vertices, i);
        const b = new THREE.Vector3().fromBufferAttribute(vertices, i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(vertices, i + 2);
        
        // 转换到世界坐标（如需要）
        if (worldSpace) {
          a.applyMatrix4(mesh.matrixWorld);
          b.applyMatrix4(mesh.matrixWorld);
          c.applyMatrix4(mesh.matrixWorld);
        }
        
        // 计算交点
        this.calculateTrianglePlaneIntersection(a, b, c, plane, intersectionPoints);
      }
    }
    
    return intersectionPoints;
  }
  
  /**
   * 计算三角形与平面的交点
   * @param a 三角形顶点A
   * @param b 三角形顶点B
   * @param c 三角形顶点C
   * @param plane 平面
   * @param intersectionPoints 结果数组（将向此数组添加交点）
   */
  public calculateTrianglePlaneIntersection(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    plane: THREE.Plane,
    intersectionPoints: THREE.Vector3[]
  ): void {
    // 创建三边
    const lineAB = new THREE.Line3(a, b);
    const lineBC = new THREE.Line3(b, c);
    const lineCA = new THREE.Line3(c, a);
    
    // 计算每条边与平面的交点
    this.calculateLinePlaneIntersection(lineAB, plane, intersectionPoints);
    this.calculateLinePlaneIntersection(lineBC, plane, intersectionPoints);
    this.calculateLinePlaneIntersection(lineCA, plane, intersectionPoints);
  }
  
  /**
   * 计算线段与平面的交点
   * @param line 线段
   * @param plane 平面
   * @param intersectionPoints 结果数组（将向此数组添加交点）
   * @returns 是否有交点
   */
  public calculateLinePlaneIntersection(
    line: THREE.Line3,
    plane: THREE.Plane,
    intersectionPoints: THREE.Vector3[]
  ): boolean {
    const intersectionPoint = new THREE.Vector3();
    
    // 使用THREE.js内置方法计算交点
    if (plane.intersectsLine(line)) {
      if (plane.intersectLine(line, intersectionPoint)) {
        // 避免重复点
        if (!this.containsPoint(intersectionPoints, intersectionPoint)) {
          intersectionPoints.push(intersectionPoint.clone());
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 检查点数组中是否已包含给定点（使用小误差范围比较）
   * @param points 点数组
   * @param point 要检查的点
   * @param epsilon 误差范围（默认0.0001）
   * @returns 是否包含该点
   */
  private containsPoint(
    points: THREE.Vector3[],
    point: THREE.Vector3,
    epsilon: number = 0.0001
  ): boolean {
    for (const existingPoint of points) {
      if (existingPoint.distanceTo(point) < epsilon) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 创建水平切割平面
   * @param y Y坐标值
   * @returns 平面对象
   */
  public createHorizontalPlane(y: number): THREE.Plane {
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
  }
  
  /**
   * 创建垂直切割平面（Z方向）
   * @param z Z坐标值
   * @returns 平面对象
   */
  public createVerticalZPlane(z: number): THREE.Plane {
    return new THREE.Plane(new THREE.Vector3(0, 0, 1), -z);
  }
  
  /**
   * 创建垂直切割平面（X方向）
   * @param x X坐标值
   * @returns 平面对象
   */
  public createVerticalXPlane(x: number): THREE.Plane {
    return new THREE.Plane(new THREE.Vector3(1, 0, 0), -x);
  }
  
  /**
   * 创建任意方向的切割平面
   * @param normal 平面法向量
   * @param point 平面上的一点
   * @returns 平面对象
   */
  public createCustomPlane(normal: THREE.Vector3, point: THREE.Vector3): THREE.Plane {
    const normalizedNormal = normal.clone().normalize();
    const constant = -normalizedNormal.dot(point);
    return new THREE.Plane(normalizedNormal, constant);
  }
}

// 导出单例实例，便于在应用中直接使用
export const intersectionCalculator = new IntersectionCalculator();