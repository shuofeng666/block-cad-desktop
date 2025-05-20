// src-ui/utils/geometry/ContourGenerator.ts
import * as THREE from "three";

/**
 * 轮廓生成器 - 从点集合生成2D轮廓
 * 提供凸包和凹包算法以及轮廓处理的各种功能
 */
export class ContourGenerator {
  /**
   * 生成凸包轮廓
   * @param points 2D点数组 [[x1,y1], [x2,y2], ...]
   * @returns 按顺序排列的凸包轮廓点
   */
  public generateConvexHull(points: number[][]): number[][] {
    if (points.length <= 3) return points;
    
    // 按x坐标排序，如果x相同则按y排序
    const sortedPoints = [...points].sort((a, b) => 
      a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]
    );
    
    // 计算上切线和下切线
    const upperHull = this.upperTangent(sortedPoints);
    const lowerHull = this.lowerTangent(sortedPoints);
    
    // 合并上下切线并闭合凸包
    const hull = lowerHull.concat(upperHull);
    if (hull.length > 0) {
      hull.push([...hull[0]]);  // 闭合轮廓
    }
    
    return hull;
  }
  
  /**
   * 生成凹包轮廓
   * @param points 2D点数组 [[x1,y1], [x2,y2], ...]
   * @param concavity 凹度参数 (默认20)，越大凹包越接近凸包
   * @returns 按顺序排列的凹包轮廓点
   */
  public generateConcaveHull(points: number[][], concavity: number = 20): number[][] {
    if (points.length < 4) {
      return this.generateConvexHull(points);
    }
    
    // 先计算凸包
    const convexHull = this.generateConvexHull(points);
    const hullPoints = convexHull.slice(0, -1);  // 移除闭合点
    
    // 递归添加点以创建凹包
    const concaveHull = this.addPointToConcaveHull(hullPoints, points, concavity);
    
    // 闭合轮廓
    if (concaveHull.length > 0) {
      concaveHull.push([...concaveHull[0]]);
    }
    
    return concaveHull;
  }
  
  /**
   * 创建THREE.js形状对象
   * @param points 2D点数组 [[x1,y1], [x2,y2], ...]
   * @returns THREE.Shape对象
   */
  public createShapeFromPoints(points: number[][]): THREE.Shape {
    if (points.length < 3) {
      throw new Error("At least 3 points are required to create a shape");
    }
    
    const shape = new THREE.Shape();
    
    // 移动到第一个点
    shape.moveTo(points[0][0], points[0][1]);
    
    // 连接其他点
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    
    // 闭合形状
    shape.closePath();
    
    return shape;
  }
  
  /**
   * 将3D点投影到指定平面上转换为2D点
   * @param points 3D点数组
   * @param plane 投影平面
   * @returns 2D点数组 [[x1,y1], [x2,y2], ...]
   */
  public projectPointsToPlane(points: THREE.Vector3[], plane: THREE.Plane): number[][] {
    // 创建投影矩阵
    const projectionMatrix = new THREE.Matrix4();
    
    // 获取平面法向量
    const normal = plane.normal;
    
    // 创建投影基础向量
    // 找出与法向量不平行的向量作为参考
    const refVector = Math.abs(normal.x) < 0.5 ? 
      new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    
    // 创建投影平面的基向量
    const xAxis = new THREE.Vector3().crossVectors(refVector, normal).normalize();
    const yAxis = new THREE.Vector3().crossVectors(normal, xAxis).normalize();
    
    // 设置投影基础
    projectionMatrix.makeBasis(xAxis, yAxis, normal);
    
    // 投影每个点
    return points.map(point => {
      const projectedPoint = point.clone().applyMatrix4(projectionMatrix);
      return [projectedPoint.x, projectedPoint.y];
    });
  }
  
  /**
   * 平滑轮廓
   * @param points 2D点数组
   * @param smoothingFactor 平滑因子 (0-1，越大越平滑)
   * @returns 平滑后的轮廓点
   */
  public smoothContour(points: number[][], smoothingFactor: number = 0.25): number[][] {
    if (points.length <= 3) return points;
    
    const result: number[][] = [];
    const originalPoints = points.slice(0, -1);  // 移除闭合点
    
    for (let i = 0; i < originalPoints.length; i++) {
      const current = originalPoints[i];
      
      // 获取前一个点和后一个点（循环）
      const prev = originalPoints[(i + originalPoints.length - 1) % originalPoints.length];
      const next = originalPoints[(i + 1) % originalPoints.length];
      
      // 计算平滑点
      const x = current[0] + smoothingFactor * ((prev[0] + next[0]) / 2 - current[0]);
      const y = current[1] + smoothingFactor * ((prev[1] + next[1]) / 2 - current[1]);
      
      result.push([x, y]);
    }
    
    // 闭合轮廓
    result.push([...result[0]]);
    
    return result;
  }
  
  /**
   * 简化轮廓（减少点数量）
   * @param points 2D点数组
   * @param tolerance 简化容差（越大简化越多）
   * @returns 简化后的轮廓点
   */
  public simplifyContour(points: number[][], tolerance: number = 1.0): number[][] {
    if (points.length <= 3) return points;
    
    // 实现Douglas-Peucker算法简化点集
    const douglasPeucker = (pts: number[][], start: number, end: number, tol: number): number[] => {
      if (end - start <= 1) return [start, end];
      
      const startPoint = pts[start];
      const endPoint = pts[end];
      
      // 找到距离线段最远的点
      let maxDistance = -1;
      let maxIndex = start;
      
      for (let i = start + 1; i < end; i++) {
        const distance = this.pointToLineDistance(pts[i], startPoint, endPoint);
        if (distance > maxDistance) {
          maxDistance = distance;
          maxIndex = i;
        }
      }
      
      // 如果最大距离大于容差，则递归处理
      if (maxDistance > tol) {
        const result1 = douglasPeucker(pts, start, maxIndex, tol);
        const result2 = douglasPeucker(pts, maxIndex, end, tol);
        
        // 合并结果（去除重复点）
        return [...result1.slice(0, -1), ...result2];
      } else {
        return [start, end];
      }
    };
    
    // 移除闭合点用于处理
    const originalPoints = points.slice(0, -1);
    const indices = douglasPeucker(originalPoints, 0, originalPoints.length - 1, tolerance);
    
    // 根据选出的索引构建简化后的点集
    const result = indices.map(index => [...originalPoints[index]]);
    
    // 闭合轮廓
    result.push([...result[0]]);
    
    return result;
  }
  
  // 私有辅助方法
  
  /**
   * 计算上切线
   * @param points 排序后的点集
   * @returns 上切线点集
   */
  private upperTangent(points: number[][]): number[][] {
    const upper: number[][] = [];
    
    for (let i = 0; i < points.length; i++) {
      while (
        upper.length >= 2 &&
        this.cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0
      ) {
        upper.pop();
      }
      upper.push(points[i]);
    }
    
    upper.pop();
    return upper;
  }
  
  /**
   * 计算下切线
   * @param points 排序后的点集
   * @returns 下切线点集
   */
  private lowerTangent(points: number[][]): number[][] {
    const reversed = points.slice().reverse();
    const lower: number[][] = [];
    
    for (let i = 0; i < reversed.length; i++) {
      while (
        lower.length >= 2 &&
        this.cross(lower[lower.length - 2], lower[lower.length - 1], reversed[i]) <= 0
      ) {
        lower.pop();
      }
      lower.push(reversed[i]);
    }
    
    lower.pop();
    return lower;
  }
  
  /**
   * 计算叉积以确定点的方向
   * @param o 原点
   * @param a 点a
   * @param b 点b
   * @returns 叉积值
   */
  private cross(o: number[], a: number[], b: number[]): number {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }
  
  /**
   * 计算点到线段的距离
   * @param p 点
   * @param a 线段起点
   * @param b 线段终点
   * @returns 距离
   */
  private pointToLineDistance(p: number[], a: number[], b: number[]): number {
    const ab = [b[0] - a[0], b[1] - a[1]];
    const ap = [p[0] - a[0], p[1] - a[1]];
    const abLen = Math.sqrt(ab[0] ** 2 + ab[1] ** 2);
    
    if (abLen === 0) return Math.sqrt(ap[0] ** 2 + ap[1] ** 2);
    
    const proj = (ap[0] * ab[0] + ap[1] * ab[1]) / abLen;
    
    if (proj < 0) return Math.sqrt(ap[0] ** 2 + ap[1] ** 2);
    if (proj > abLen) return Math.sqrt((p[0] - b[0]) ** 2 + (p[1] - b[1]) ** 2);
    
    return Math.abs(ap[0] * ab[1] - ap[1] * ab[0]) / abLen;
  }
  
  /**
   * 递归添加点创建凹包
   * @param hullPoints 当前轮廓点
   * @param allPoints 所有点
   * @param maxDist 最大距离参数
   * @returns 凹包轮廓点
   */
  private addPointToConcaveHull(hullPoints: number[][], allPoints: number[][], maxDist: number): number[][] {
    let maxDistPoint: number[] | null = null;
    let maxDistance = 0;
    let insertIndex = -1;
    
    for (let i = 0; i < hullPoints.length; i++) {
      const a = hullPoints[i];
      const b = hullPoints[(i + 1) % hullPoints.length];
      
      for (let j = 0; j < allPoints.length; j++) {
        const p = allPoints[j];
        
        // 跳过已在轮廓上的点
        if (p === a || p === b) continue;
        
        const dist = this.pointToLineDistance(p, a, b);
        
        if (dist > maxDistance && this.isPointInside(p, a, b)) {
          maxDistance = dist;
          maxDistPoint = p;
          insertIndex = i + 1;
        }
      }
    }
    
    if (maxDistance > maxDist && maxDistPoint) {
      hullPoints.splice(insertIndex, 0, maxDistPoint);
      return this.addPointToConcaveHull(hullPoints, allPoints, maxDist);
    }
    
    return hullPoints;
  }
  
  /**
   * 检查点是否在线段的有效区域内
   * @param p 点
   * @param a 线段起点
   * @param b 线段终点
   * @returns 是否在区域内
   */
  private isPointInside(p: number[], a: number[], b: number[]): boolean {
    const minX = Math.min(a[0], b[0]);
    const maxX = Math.max(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);
    
    return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
  }
}

// 导出单例实例，便于在应用中直接使用
export const contourGenerator = new ContourGenerator();