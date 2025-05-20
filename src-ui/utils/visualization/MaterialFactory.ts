// src-ui/utils/visualization/MaterialFactory.ts
import * as THREE from "three";

/**
 * 材质生成器 - 创建和管理Three.js材质
 * 提供各种预设材质和自定义材质的创建功能
 */
export class MaterialFactory {
  // 材质缓存，避免重复创建相同材质
  private materialCache: Map<string, THREE.Material> = new Map();
  
  /**
   * 创建标准材质
   * @param options 材质选项
   * @returns 标准材质对象
   */
  public createStandardMaterial(options: {
    color?: number | string;
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
    flatShading?: boolean;
  } = {}): THREE.MeshStandardMaterial {
    const config = {
      color: options.color !== undefined ? options.color : 0xdddddd,
      roughness: options.roughness !== undefined ? options.roughness : 0.7,
      metalness: options.metalness !== undefined ? options.metalness : 0.0,
      transparent: options.transparent !== undefined ? options.transparent : false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      side: options.side !== undefined ? options.side : THREE.FrontSide,
      flatShading: options.flatShading !== undefined ? options.flatShading : false
    };
    
    // 生成缓存键
    const cacheKey = `standard_${config.color}_${config.roughness}_${config.metalness}_${config.transparent}_${config.opacity}_${config.side}_${config.flatShading}`;
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.MeshStandardMaterial;
    }
    
    // 创建新材质
    const material = new THREE.MeshStandardMaterial(config);
    
    // 添加到缓存
    this.materialCache.set(cacheKey, material);
    
    return material;
  }
  
  /**
   * 创建法线材质
   * @param options 材质选项
   * @returns 法线材质对象
   */
  public createNormalMaterial(options: {
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
    wireframe?: boolean;
  } = {}): THREE.MeshNormalMaterial {
    const config = {
      transparent: options.transparent !== undefined ? options.transparent : false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      side: options.side !== undefined ? options.side : THREE.FrontSide,
      wireframe: options.wireframe !== undefined ? options.wireframe : false
    };
    
    // 生成缓存键
    const cacheKey = `normal_${config.transparent}_${config.opacity}_${config.side}_${config.wireframe}`;
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.MeshNormalMaterial;
    }
    
    // 创建新材质
    const material = new THREE.MeshNormalMaterial(config);
    
    // 添加到缓存
    this.materialCache.set(cacheKey, material);
    
    return material;
  }
  
  /**
   * 创建线框材质
   * @param options 材质选项
   * @returns 线框材质对象
   */
  public createWireframeMaterial(options: {
    color?: number | string;
    linewidth?: number;
    transparent?: boolean;
    opacity?: number;
  } = {}): THREE.MeshBasicMaterial {
    const config = {
      color: options.color !== undefined ? options.color : 0x000000,
      wireframe: true,
      transparent: options.transparent !== undefined ? options.transparent : false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0
    };
    
    // 生成缓存键
    const cacheKey = `wireframe_${config.color}_${config.transparent}_${config.opacity}`;
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.MeshBasicMaterial;
    }
    
    // 创建新材质
    const material = new THREE.MeshBasicMaterial(config);
    
    // 添加到缓存
    this.materialCache.set(cacheKey, material);
    
    return material;
  }
  
  /**
   * 创建线条材质
   * @param options 材质选项
   * @returns 线条材质对象
   */
  public createLineMaterial(options: {
    color?: number | string;
    linewidth?: number;
    dashed?: boolean;
    dashSize?: number;
    gapSize?: number;
  } = {}): THREE.LineBasicMaterial | THREE.LineDashedMaterial {
    const isDashed = options.dashed !== undefined ? options.dashed : false;
    
    const config = {
      color: options.color !== undefined ? options.color : 0x000000,
      linewidth: options.linewidth !== undefined ? options.linewidth : 1
    };
    
    // 如果是虚线，使用虚线材质
    if (isDashed) {
      const dashedConfig = {
        ...config,
        dashSize: options.dashSize !== undefined ? options.dashSize : 3,
        gapSize: options.gapSize !== undefined ? options.gapSize : 1
      };
      
      // 生成缓存键
      const cacheKey = `dashed_line_${config.color}_${config.linewidth}_${dashedConfig.dashSize}_${dashedConfig.gapSize}`;
      
      // 检查缓存
      if (this.materialCache.has(cacheKey)) {
        return this.materialCache.get(cacheKey) as THREE.LineDashedMaterial;
      }
      
      // 创建新材质
      const material = new THREE.LineDashedMaterial(dashedConfig);
      
      // 添加到缓存
      this.materialCache.set(cacheKey, material);
      
      return material;
    } else {
      // 生成缓存键
      const cacheKey = `line_${config.color}_${config.linewidth}`;
      
      // 检查缓存
      if (this.materialCache.has(cacheKey)) {
        return this.materialCache.get(cacheKey) as THREE.LineBasicMaterial;
      }
      
      // 创建新材质
      const material = new THREE.LineBasicMaterial(config);
      
      // 添加到缓存
      this.materialCache.set(cacheKey, material);
      
      return material;
    }
  }
  
  /**
   * 创建点材质
   * @param options 材质选项
   * @returns 点材质对象
   */
  public createPointsMaterial(options: {
    color?: number | string;
    size?: number;
    sizeAttenuation?: boolean;
    transparent?: boolean;
    opacity?: number;
  } = {}): THREE.PointsMaterial {
    const config = {
      color: options.color !== undefined ? options.color : 0xffffff,
      size: options.size !== undefined ? options.size : 1,
      sizeAttenuation: options.sizeAttenuation !== undefined ? options.sizeAttenuation : true,
      transparent: options.transparent !== undefined ? options.transparent : false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0
    };
    
    // 生成缓存键
    const cacheKey = `points_${config.color}_${config.size}_${config.sizeAttenuation}_${config.transparent}_${config.opacity}`;
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.PointsMaterial;
    }
    
    // 创建新材质
    const material = new THREE.PointsMaterial(config);
    
    // 添加到缓存
    this.materialCache.set(cacheKey, material);
    
    return material;
  }
  
  /**
   * 创建层叠切片材质
   * @param options 材质选项
   * @returns 材质对象
   */
  public createStackedLayerMaterial(options: {
    color?: number | string;
    roughness?: number;
    metalness?: number;
  } = {}): THREE.MeshStandardMaterial {
    const config = {
      color: options.color !== undefined ? options.color : 0xd4b795,
      roughness: options.roughness !== undefined ? options.roughness : 0.7,
      metalness: options.metalness !== undefined ? options.metalness : 0.05,
      side: THREE.DoubleSide
    };
    
    // 生成缓存键
    const cacheKey = `stacked_layer_${config.color}_${config.roughness}_${config.metalness}`;
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.MeshStandardMaterial;
    }
    
    // 创建新材质
    const material = new THREE.MeshStandardMaterial(config);
    
    // 添加到缓存
    this.materialCache.set(cacheKey, material);
    
    return material;
  }
  
  /**
   * 创建阴影平面材质
   * @param options 材质选项
   * @returns 阴影材质对象
   */
  public createShadowMaterial(options: {
    opacity?: number;
    side?: THREE.Side;
  } = {}): THREE.ShadowMaterial {
    const config = {
      transparent: true,
      opacity: options.opacity !== undefined ? options.opacity : 0.075,
      side: options.side !== undefined ? options.side : THREE.DoubleSide
    };
    
    // 生成缓存键
    const cacheKey = `shadow_${config.opacity}_${config.side}`;
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.ShadowMaterial;
    }
    
    // 创建新材质
    const material = new THREE.ShadowMaterial(config);
    
    // 添加到缓存
    this.materialCache.set(cacheKey, material);
    
    return material;
  }
  
  /**
   * 创建PhongMaterial
   * @param options 材质选项
   * @returns Phong材质对象
   */
  public createPhongMaterial(options: {
    color?: number | string;
    specular?: number | string;
    shininess?: number;
    transparent?: boolean;
    opacity?: number;
    wireframe?: boolean;
    side?: THREE.Side;
  } = {}): THREE.MeshPhongMaterial {
    const config = {
      color: options.color !== undefined ? options.color : 0xdddddd,
      specular: options.specular !== undefined ? options.specular : 0x111111,
      shininess: options.shininess !== undefined ? options.shininess : 30,
      transparent: options.transparent !== undefined ? options.transparent : false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      wireframe: options.wireframe !== undefined ? options.wireframe : false,
      side: options.side !== undefined ? options.side : THREE.FrontSide
    };
    
    // 生成缓存键
    const cacheKey = `phong_${config.color}_${config.specular}_${config.shininess}_${config.transparent}_${config.opacity}_${config.wireframe}_${config.side}`;
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.MeshPhongMaterial;
    }
    
    // 创建新材质
    const material = new THREE.MeshPhongMaterial(config);
    
    // 添加到缓存
    this.materialCache.set(cacheKey, material);
    
    return material;
  }
  
  /**
   * 清除材质缓存
   */
  public clearCache(): void {
    this.materialCache.clear();
  }
  
  /**
   * 释放特定材质资源
   * @param material 要释放的材质
   */
  public disposeMaterial(material: THREE.Material): void {
    material.dispose();
    
    // 从缓存中移除
    for (const [key, cachedMaterial] of this.materialCache.entries()) {
      if (cachedMaterial === material) {
        this.materialCache.delete(key);
        break;
      }
    }
  }
}

// 导出单例实例，便于在应用中直接使用
export const materialFactory = new MaterialFactory();