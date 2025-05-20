// src-ui/utils/ModuleAdapter.ts
import { intersectionCalculator } from "./geometry/IntersectionCalculator";
import { contourGenerator } from "./geometry/ContourGenerator";
import { boundsCalculator } from "./geometry/BoundsCalculator";
import { materialFactory } from "./visualization/MaterialFactory";
import { helperObjectFactory } from "./visualization/HelperObjectFactory";
import { controlEventHandler } from "./ui/ControlEventHandler";

/**
 * 模块适配器 - 将新模块与现有代码集成
 * 提供统一的接口来访问所有工具模块
 */
export class ModuleAdapter {
  /**
   * 获取交点计算器
   */
  public getIntersectionCalculator() {
    return intersectionCalculator;
  }
  
  /**
   * 获取轮廓生成器
   */
  public getContourGenerator() {
    return contourGenerator;
  }
  
  /**
   * 获取边界计算器
   */
  public getBoundsCalculator() {
    return boundsCalculator;
  }
  
  /**
   * 获取材质工厂
   */
  public getMaterialFactory() {
    return materialFactory;
  }
  
  /**
   * 获取辅助对象工厂
   */
  public getHelperObjectFactory() {
    return helperObjectFactory;
  }
  
  /**
   * 获取控件事件处理器
   */
  public getControlEventHandler() {
    return controlEventHandler;
  }
}

// 导出单例实例
export const moduleAdapter = new ModuleAdapter();