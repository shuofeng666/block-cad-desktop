# CAMblock 模块化重构计划

## 概述

本文档详细描述了 CAMblock 项目的模块化重构计划。这次重构的目标是从现有代码中提取可复用的功能模块，使系统更具扩展性，但不改变现有的代码结构和功能。通过标准化常用操作，我们可以更轻松地开发新的工作流程和命令。

## 目录结构

```
src-ui/utils/
├── geometry/       # 几何操作相关模块
├── ui/             # UI交互相关模块
├── visualization/  # 可视化辅助模块
└── common/         # 通用工具函数
```

## 重构模块详情

### 1. 几何操作模块

#### 1.1 交点计算器 (IntersectionCalculator)

**文件位置**: `src-ui/utils/geometry/IntersectionCalculator.ts`

**提取自**:
- `src-ui/utils/processIndices.ts`
- `src-ui/threejs/commands/WireMeshCommands.ts` (相交点计算部分)

**功能**:
- 计算平面与三角形的交点
- 计算平面与网格的交点
- 支持各种几何体类型（索引几何体、非索引几何体）
- 优化的交点查找算法

**接口示例**:
```typescript
interface IntersectionCalculator {
  calculateMeshPlaneIntersection(
    mesh: THREE.Mesh,
    plane: THREE.Plane
  ): THREE.Vector3[];
  
  calculateTrianglePlaneIntersection(
    a: THREE.Vector3, 
    b: THREE.Vector3, 
    c: THREE.Vector3,
    plane: THREE.Plane
  ): THREE.Vector3[];
}
```

#### 1.2 轮廓生成器 (ContourGenerator)

**文件位置**: `src-ui/utils/geometry/ContourGenerator.ts`

**提取自**:
- `src-ui/utils/hull.js`
- `src-ui/threejs/commands/WireMeshCommands.ts` (轮廓生成部分)
- `src-ui/threejs/commands/StackedLayersCommands.ts` (形状生成部分)

**功能**:
- 支持凸包和凹包算法
- 从3D点集生成2D轮廓
- 轮廓优化和平滑
- 支持THREE.Shape对象的直接生成

**接口示例**:
```typescript
interface ContourGenerator {
  generateConvexHull(points: number[][]): number[][];
  generateConcaveHull(points: number[][], concavity?: number): number[][];
  createShapeFromPoints(points: number[][]): THREE.Shape;
  projectPointsToPlane(points: THREE.Vector3[], plane: THREE.Plane): number[][];
}
```

### 2. UI交互模块

#### 2.1 控件生成器 (ControlFactory)

**文件位置**: `src-ui/utils/ui/ControlFactory.ts`

**提取自**:
- `src-ui/components/ControlPanel.ts`
- `src-ui/threejs/commands/TransformCommands.ts` (UI控件创建部分)

**功能**:
- 创建各种类型的控件（滑块、数字输入、复选框等）
- 统一的控件接口
- 支持控件样式定制
- 支持控件分组和布局

**接口示例**:
```typescript
interface ControlFactory {
  createSlider(config: SliderConfig): HTMLElement;
  createNumberInput(config: NumberInputConfig): HTMLElement;
  createCheckbox(config: CheckboxConfig): HTMLElement;
  createButton(config: ButtonConfig): HTMLElement;
  createControlGroup(controls: HTMLElement[], title?: string): HTMLElement;
}
```

#### 2.2 控件事件处理器 (ControlEventHandler)

**文件位置**: `src-ui/utils/ui/ControlEventHandler.ts`

**提取自**:
- `src-ui/components/ControlPanel.ts` (事件处理部分)
- `src-ui/threejs/commands/TransformCommands.ts` (控件监听部分)

**功能**:
- 处理控件事件（输入、变化、点击等）
- 事件委托和冒泡机制
- 防抖动功能（例如滑块拖动时避免过度更新）
- 支持自定义事件类型

**接口示例**:
```typescript
interface ControlEventHandler {
  addListener(
    element: HTMLElement, 
    event: string, 
    callback: (value: any) => void
  ): void;
  
  removeListener(
    element: HTMLElement, 
    event: string
  ): void;
  
  debounce(
    callback: (value: any) => void, 
    delay: number
  ): (value: any) => void;
}
```

### 3. 可视化辅助模块

#### 3.1 材质生成器 (MaterialFactory)

**文件位置**: `src-ui/utils/visualization/MaterialFactory.ts`

**提取自**:
- `src-ui/threejs/commands/WireMeshCommands.ts` (材质创建部分)
- `src-ui/threejs/commands/ModelCommands.ts` (材质设置部分)
- `src-ui/threejs/commands/StackedLayersCommands.ts` (材质部分)

**功能**:
- 创建预设材质（法线材质、线框、标准材质等）
- 自定义材质参数
- 材质克隆和修改
- 支持材质库

**接口示例**:
```typescript
interface MaterialFactory {
  createNormalMaterial(options?: NormalMaterialOptions): THREE.MeshNormalMaterial;
  createLineMaterial(color?: number, width?: number): THREE.LineBasicMaterial;
  createStandardMaterial(options?: StandardMaterialOptions): THREE.MeshStandardMaterial;
  createWireMaterial(color?: number): THREE.MeshBasicMaterial;
}
```

#### 3.2 辅助对象生成器 (HelperObjectFactory)

**文件位置**: `src-ui/utils/visualization/HelperObjectFactory.ts`

**提取自**:
- `src-ui/threejs/GLViewer.ts` (网格和坐标轴创建部分)

**功能**:
- 创建网格线、坐标轴等辅助对象
- 创建边界框可视化
- 创建各种辅助指示器
- 自定义辅助对象的颜色和样式

**接口示例**:
```typescript
interface HelperObjectFactory {
  createGrid(size?: number, divisions?: number, color1?: number, color2?: number): THREE.GridHelper;
  createAxes(size?: number): THREE.AxesHelper;
  createBoundingBoxHelper(object: THREE.Object3D, color?: number): THREE.BoxHelper;
  createShadowPlane(size?: number, opacity?: number): THREE.Mesh;
}
```

#### 3.3 边界计算器 (BoundsCalculator)

**文件位置**: `src-ui/utils/geometry/BoundsCalculator.ts`

**提取自**:
- `src-ui/threejs/commands/VisualizationCommands.ts` (边界框计算部分)
- `src-ui/threejs/commands/StackedLayersCommands.ts` (尺寸计算部分)

**功能**:
- 计算对象的边界框
- 计算对象中心
- 计算最大尺寸和最小尺寸
- 自动计算相机位置和视角

**接口示例**:
```typescript
interface BoundsCalculator {
  calculateBoundingBox(object: THREE.Object3D): THREE.Box3;
  calculateCenter(object: THREE.Object3D): THREE.Vector3;
  calculateDimensions(object: THREE.Object3D): {width: number, height: number, depth: number};
  calculateOptimalCameraPosition(object: THREE.Object3D, camera: THREE.Camera): {position: THREE.Vector3, target: THREE.Vector3};
}
```

## 实施计划

### 阶段一：基础设施准备 (第1周)

1. 创建新的目录结构
2. 设计和定义接口
3. 创建单元测试框架
4. 建立文档规范

### 阶段二：几何模块实现 (第2-3周)

1. 实现交点计算器
2. 实现轮廓生成器
3. 编写单元测试
4. 开发示例使用场景

### 阶段三：可视化模块实现 (第4-5周)

1. 实现边界计算器
2. 实现材质生成器
3. 实现辅助对象生成器
4. 编写单元测试和集成测试

### 阶段四：UI交互模块实现 (第6-7周)

1. 实现控件生成器
2. 实现控件事件处理器
3. 创建示例控件和使用场景
4. 编写集成测试

### 阶段五：集成和优化 (第8周)

1. 创建适配层接口
2. 优化性能和内存使用
3. 全面集成测试
4. 完成文档和示例

## 技术规范

1. 所有新模块必须使用TypeScript编写
2. 每个模块需有明确的接口定义
3. 单元测试覆盖率应达到80%以上
4. 所有公共方法必须有JSDoc文档
5. 避免直接修改现有代码，应通过适配层集成

## 未来扩展

通过此次重构，我们将为以下未来功能奠定基础：

1. 命令历史和撤销/重做功能
2. 更多几何创建和编辑功能
3. 更高级的材质和渲染选项
4. 更丰富的UI交互方式
5. 支持构建自定义工作流程的工具集

## 附录：相关文件列表

### 几何操作模块相关文件
- `src-ui/utils/processIndices.ts`
- `src-ui/utils/hull.js`
- `src-ui/threejs/commands/WireMeshCommands.ts`
- `src-ui/threejs/commands/StackedLayersCommands.ts`

### UI交互模块相关文件
- `src-ui/components/ControlPanel.ts`
- `src-ui/components/control-panel.css`
- `src-ui/threejs/commands/TransformCommands.ts`

### 可视化辅助模块相关文件
- `src-ui/threejs/GLViewer.ts`
- `src-ui/threejs/commands/VisualizationCommands.ts`
- `src-ui/threejs/commands/ModelCommands.ts`