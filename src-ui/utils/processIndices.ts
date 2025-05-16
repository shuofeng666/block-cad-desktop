// src-ui/utils/processIndices.ts
import * as THREE from "three";

/**
 * 处理几何体索引和顶点获取平面交点
 * @param indices 几何体索引
 * @param vertices 几何体顶点
 * @param obj 模型对象
 * @param mathPlane 数学平面
 * @param intersectionPoints 交点数组 (结果将添加到此数组)
 */
export const processIndices = (
  indices: THREE.BufferAttribute | null,
  vertices: THREE.BufferAttribute,
  obj: THREE.Object3D,
  mathPlane: THREE.Plane,
  intersectionPoints: THREE.Vector3[]
) => {
  if (indices !== null) {
    // 索引几何体处理
    for (let j = 0; j < indices.count; j += 3) {
      const aIndex = indices.getX(j);
      const bIndex = indices.getX(j + 1);
      const cIndex = indices.getX(j + 2);

      const a = new THREE.Vector3().fromBufferAttribute(vertices, aIndex);
      const b = new THREE.Vector3().fromBufferAttribute(vertices, bIndex);
      const c = new THREE.Vector3().fromBufferAttribute(vertices, cIndex);

      obj.localToWorld(a);
      obj.localToWorld(b);
      obj.localToWorld(c);

      processTriangle(a, b, c, mathPlane, intersectionPoints);
    }
  } else {
    // 非索引几何体处理
    for (let j = 0; j < vertices.count; j += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(vertices, j);
      const b = new THREE.Vector3().fromBufferAttribute(vertices, j + 1);
      const c = new THREE.Vector3().fromBufferAttribute(vertices, j + 2);

      obj.localToWorld(a);
      obj.localToWorld(b);
      obj.localToWorld(c);

      processTriangle(a, b, c, mathPlane, intersectionPoints);
    }
  }
};

/**
 * 处理三角形与平面相交计算
 * @param a 三角形顶点a
 * @param b 三角形顶点b
 * @param c 三角形顶点c
 * @param plane 平面
 * @param intersectionPoints 交点结果数组
 */
const processTriangle = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  plane: THREE.Plane,
  intersectionPoints: THREE.Vector3[]
) => {
  const lineAB = new THREE.Line3(a, b);
  const lineBC = new THREE.Line3(b, c);
  const lineCA = new THREE.Line3(c, a);

  setPointOfIntersection(lineAB, plane, intersectionPoints);
  setPointOfIntersection(lineBC, plane, intersectionPoints);
  setPointOfIntersection(lineCA, plane, intersectionPoints);
};

/**
 * 计算线段与平面的交点
 * @param line 线段
 * @param plane 平面
 * @param intersectionPoints 交点结果数组
 */
const setPointOfIntersection = (
  line: THREE.Line3,
  plane: THREE.Plane,
  intersectionPoints: THREE.Vector3[]
) => {
  const pointOfIntersection = new THREE.Vector3();
  if (plane.intersectLine(line, pointOfIntersection)) {
    intersectionPoints.push(pointOfIntersection.clone());
  }
};