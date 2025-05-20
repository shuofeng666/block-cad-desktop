// src-ui/utils/visualization/HelperObjectFactory.ts
import * as THREE from "three";
import { materialFactory } from "./MaterialFactory";

/**
 * 辅助对象生成器 - 创建和管理Three.js辅助对象
 * 提供各种辅助可视化对象的创建功能
 */
export class HelperObjectFactory {
  /**
   * 创建网格辅助对象
   * @param size 网格大小
   * @param divisions 网格分割数量
   * @param colorCenterLine 中心线颜色
   * @param colorGrid 网格线颜色
   * @returns 网格辅助对象
   */
  public createGrid(
    size: number = 200,
    divisions: number = 20,
    colorCenterLine: number = 0x444444,
    colorGrid: number = 0x888888
  ): THREE.GridHelper {
    const grid = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    
    // 设置网格属性
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    
    // 旋转到XZ平面
    grid.rotation.x = -Math.PI / 2;
    
    return grid;
  }
  
  /**
   * 创建坐标轴辅助对象
   * @param size 坐标轴大小
   * @returns 坐标轴辅助对象
   */
  public createAxes(size: number = 50): THREE.AxesHelper {
    return new THREE.AxesHelper(size);
  }
  
  /**
   * 创建边界框辅助对象
   * @param object 要显示边界框的对象
   * @param color 边界框颜色
   * @returns 边界框辅助对象
   */
  public createBoundingBoxHelper(
    object: THREE.Object3D,
    color: number = 0x00ff00
  ): THREE.BoxHelper {
    return new THREE.BoxHelper(object, color);
  }
  
  /**
   * 创建法线辅助对象
   * @param object 要显示法线的网格对象
   * @param size 法线长度
   * @param color 法线颜色
   * @param linewidth 线宽
   * @returns 法线辅助对象
   */
  public createNormalsHelper(
    object: THREE.Mesh,
    size: number = 10,
    color: number = 0xff0000,
    linewidth: number = 1
  ): THREE.VertexNormalsHelper {
    return new THREE.VertexNormalsHelper(object, size, color, linewidth);
  }
  
  /**
   * 创建阴影平面
   * @param size 平面大小
   * @param opacity 透明度
   * @returns 阴影平面对象
   */
  public createShadowPlane(
    size: number = 1000,
    opacity: number = 0.075
  ): THREE.Mesh {
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    const shadowMaterial = materialFactory.createShadowMaterial({ opacity });
    
    const shadowPlane = new THREE.Mesh(planeGeometry, shadowMaterial);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    
    return shadowPlane;
  }
  
  /**
   * 创建平面辅助对象
   * @param plane 平面
   * @param size 显示大小
   * @param color 颜色
   * @returns 平面辅助对象
   */
  public createPlaneHelper(
    plane: THREE.Plane,
    size: number = 100,
    color: number = 0xffff00
  ): THREE.PlaneHelper {
    return new THREE.PlaneHelper(plane, size, color);
  }
  
  /**
   * 创建照相机辅助对象
   * @param camera 照相机
   * @param size 显示大小
   * @param color 颜色
   * @returns 照相机辅助对象
   */
  public createCameraHelper(
    camera: THREE.Camera,
    color: number = 0x0000ff
  ): THREE.CameraHelper {
    const helper = new THREE.CameraHelper(camera);
    
    // 修改颜色
    if (color !== 0x0000ff) {
      helper.setColors({
        cones: color,
        points: color,
        line1: color,
        line2: color,
        line3: color
      });
    }
    
    return helper;
  }
  
  /**
   * 创建点光源辅助对象
   * @param light 点光源
   * @param sphereSize 球体大小
   * @param color 颜色（如果未指定，则使用光源颜色）
   * @returns 点光源辅助对象
   */
  public createPointLightHelper(
    light: THREE.PointLight,
    sphereSize: number = 5,
    color?: number
  ): THREE.PointLightHelper {
    return new THREE.PointLightHelper(light, sphereSize, color);
  }
  
  /**
   * 创建方向光辅助对象
   * @param light 方向光
   * @param size 显示大小
   * @param color 颜色
   * @returns 方向光辅助对象
   */
  public createDirectionalLightHelper(
    light: THREE.DirectionalLight,
    size: number = 5,
    color?: number
  ): THREE.DirectionalLightHelper {
    return new THREE.DirectionalLightHelper(light, size, color);
  }
  
  /**
   * 创建网格对象的边缘线
   * @param mesh 网格对象
   * @param thresholdAngle 阈值角度
   * @param color 线条颜色
   * @returns 边缘线对象
   */
  public createEdgesHelper(
    mesh: THREE.Mesh,
    thresholdAngle: number = 30,
    color: number = 0x000000
  ): THREE.LineSegments {
    const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
    const lineMaterial = materialFactory.createLineMaterial({ color });
    
    return new THREE.LineSegments(edgesGeometry, lineMaterial);
  }
  
  /**
   * 创建3D文本标签
   * @param text 文本内容
   * @param position 位置
   * @param options 选项
   * @returns 文本标签对象
   */
  public createTextLabel(
    text: string,
    position: THREE.Vector3,
    options: {
      size?: number;
      color?: number | string;
      backgroundColor?: number | string;
      font?: string;
    } = {}
  ): THREE.Object3D {
    // 创建HTML标签
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.color = options.color !== undefined ? 
      (typeof options.color === 'number' ? '#' + options.color.toString(16).padStart(6, '0') : options.color.toString()) : 
      'white';
    div.style.backgroundColor = options.backgroundColor !== undefined ? 
      (typeof options.backgroundColor === 'number' ? '#' + options.backgroundColor.toString(16).padStart(6, '0') : options.backgroundColor.toString()) : 
      'rgba(0,0,0,0.5)';
    div.style.padding = '6px';
    div.style.borderRadius = '4px';
    div.style.fontSize = (options.size || 12) + 'px';
    div.style.fontFamily = options.font || 'Arial, sans-serif';
    div.style.pointerEvents = 'none';
    div.style.userSelect = 'none';
    div.textContent = text;
    
    // 创建CSS2D对象
    const label = new THREE.Object3D();
    label.position.copy(position);
    
    // 添加额外信息以便后续更新
    label.userData = {
      type: 'textLabel',
      element: div,
      text: text,
      update: (camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
        const vector = position.clone();
        const canvas = renderer.domElement;
        
        // 投影到屏幕空间
        vector.project(camera);
        
        // 转换到屏幕坐标
        const x = (vector.x + 1) / 2 * canvas.width;
        const y = (-vector.y + 1) / 2 * canvas.height;
        
        // 更新标签位置
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        
        // 判断是否在摄像机前面
        div.style.display = vector.z > 1 ? 'none' : 'block';
      }
    };
    
    // 添加到DOM
    document.body.appendChild(div);
    
    return label;
  }
  
  /**
   * 更新文本标签位置
   * @param label 文本标签
   * @param camera 相机
   * @param renderer 渲染器
   */
  public updateTextLabel(
    label: THREE.Object3D,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ): void {
    if (label.userData && label.userData.type === 'textLabel') {
      label.userData.update(camera, renderer);
    }
  }
  
  /**
   * 移除文本标签
   * @param label 文本标签
   */
  public removeTextLabel(label: THREE.Object3D): void {
    if (label.userData && label.userData.type === 'textLabel') {
      document.body.removeChild(label.userData.element);
    }
  }
}

// 导出单例实例，便于在应用中直接使用
export const helperObjectFactory = new HelperObjectFactory();