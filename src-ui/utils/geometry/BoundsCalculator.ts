// src-ui/utils/geometry/BoundsCalculator.ts
import * as THREE from "three";

export class BoundsCalculator {
  /**
   * 计算对象的边界框
   */
  public calculateBoundingBox(object: THREE.Object3D): THREE.Box3 {
    const boundingBox = new THREE.Box3().setFromObject(object);
    return boundingBox;
  }

  /**
   * 计算对象中心
   */
  public calculateCenter(object: THREE.Object3D): THREE.Vector3 {
    const boundingBox = this.calculateBoundingBox(object);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    return center;
  }

  /**
   * 计算对象尺寸
   */
  public calculateDimensions(object: THREE.Object3D): {width: number, height: number, depth: number} {
    const boundingBox = this.calculateBoundingBox(object);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    return {
      width: size.x,
      height: size.y,
      depth: size.z
    };
  }

  /**
   * 计算最佳相机位置
   */
  public calculateOptimalCameraPosition(object: THREE.Object3D, camera: THREE.Camera): {
    position: THREE.Vector3, 
    target: THREE.Vector3
  } {
    const boundingBox = this.calculateBoundingBox(object);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov * (Math.PI / 180) : 45 * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
    
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const position = center.clone().add(direction.multiplyScalar(cameraZ));
    
    return {
      position: position,
      target: center
    };
  }
}

export const boundsCalculator = new BoundsCalculator();