# Block CAD 项目 - AI 开发助手指南

## 项目概述

Block CAD 是一个基于 Web 的 3D 建模应用程序，使用 Blockly 作为可视化编程界面，Three.js 作为 3D 渲染引擎。本文档旨在帮助 AI 助手理解项目架构，以便协助后续开发。

## 技术栈

- **前端框架**：纯 JavaScript/TypeScript (无框架)
- **3D 引擎**：Three.js
- **可视化编程**：Blockly
- **构建工具**：使用模块化导入 (import/export)

## 核心概念

### 命令模式

项目采用命令模式设计，用户通过 Blockly 界面创建的块被转换为命令对象，然后由命令处理器执行转换为 3D 操作。

```
Blockly 块 → Command 对象 → 3D 操作 → 渲染结果
```

### 作用域系统

使用嵌套作用域管理变量和命令执行上下文，支持命令的嵌套和作用域隔离。

### 双向交互式控件系统

通过右侧面板中的交互式控件，用户可以实时调整 3D 模型的变换参数（如旋转、缩放、平移），并且这些调整会直接反映在 3D 场景中。系统实现了完整的双向数据绑定机制：

1. **块命令到控件**：当用户在 Blockly 中添加变换块并运行时，对应的控件会显示在右侧面板中
2. **控件到模型**：用户可通过拖动控件直接修改 3D 模型，无需修改 Blockly 块
3. **状态同步**：保持块、控件和 3D 模型的状态同步，确保一致的用户体验

## 关键文件说明

### 核心引擎

- `src-ui/core/Scope.ts`: 作用域和命令系统
- `src-ui/core/BlockEditor.ts`: Blockly 编辑器封装
- `src-ui/core/actions.ts`: 应用程序动作处理

### 3D 渲染

- `src-ui/threejs/GLViewer.ts`: Three.js 渲染器封装
- `src-ui/threejs/ThreeJSCommandProcessor.ts`: 命令到 3D 操作的转换以及交互式控件处理

### 块定义

- `src-ui/blocks/blocks.ts`: 块系统初始化
- `src-ui/blocks/ThreeJSBlocks.ts`: 3D 操作相关块定义
- `src-ui/blocks/FileUploadField.ts`: 文件上传字段实现
- `src-ui/blocks/blocks_def.json`: 块定义 JSON 配置

### UI 组件

- `src-ui/components/Statusbar.ts`: 状态栏组件
- `src-ui/components/Toolbar.ts`: 工具栏组件
- `src-ui/components/ControlPanel.ts`: 交互式控制面板组件
- `src-ui/components/control-panel.css`: 控制面板样式

### 工具和实用函数

- `src-ui/utils/hull.js`: 凸包/凹包算法实现
- `src-ui/utils/file.ts`: 文件操作工具

## 主要数据结构

### Command 对象

```typescript
{
  id: string,       // 命令类型标识符
  args: object,     // 命令参数
  children: array,  // 子命令
  blk_def: object   // 块定义引用
}
```

### 作用域系统

```typescript
Scope {
  scopeItem: ScopeItem,  // 当前作用域
  context: object        // 全局上下文
}

ScopeItem {
  parent: ScopeItem,     // 父作用域
  items: Command[],      // 当前作用域中的命令
  ctx: object            // 作用域变量
}
```

### 交互式控件配置

```typescript
ControlConfig {
  id: string,                   // 控件唯一标识符
  type: "slider"|"number"|"checkbox", // 控件类型
  label: string,                // 控件标签
  min?: number,                 // 最小值（适用于数值型控件）
  max?: number,                 // 最大值（适用于数值型控件）
  step?: number,                // 步长（适用于数值型控件）
  value: number|boolean,        // 控件当前值
  onChange: (value) => void     // 值变化事件处理函数
}
```

### 3D 状态跟踪

```typescript
// ThreeJSCommandProcessor 类中的状态跟踪
private currentObjects: Map<string, THREE.Object3D> // 存储所有模型对象的映射
private currentSceneObject: THREE.Object3D | null   // 跟踪当前显示在场景中的对象

// 变换状态存储在 scope.context 中
scope.context["_rotateModelValues"]    // 存储旋转角度值
scope.context["_scaleModelValue"]      // 存储缩放比例值
scope.context["_translateModelValues"] // 存储平移距离值
```

## 执行流程

1. **初始化**：
   - 加载块定义
   - 初始化 BlocklyEditor
   - 创建 GLViewer
   - 注册 ThreeJSBlocks
   - 创建 ThreeJSCommandProcessor
   - 初始化控制面板

2. **用户交互**：
   - 用户在 Blockly 界面上组装块
   - 操作工具栏按钮
   - 点击运行执行渲染
   - 通过右侧控制面板实时调整参数

3. **渲染执行**：
   - 清空当前场景
   - 重置作用域
   - BlocklyEditor 生成代码（生成 Command 对象）
   - ThreeJSCommandProcessor 处理命令
   - GLViewer 更新显示
   - 显示与当前操作相关的控制面板
   
## 核心功能

### 1. STL 模型加载和显示

支持加载 STL 模型文件并在 3D 环境中显示。通过 `upload_stl` 命令实现。

### 2. 基本 3D 形状创建

提供创建基本 3D 形状的功能，如立方体。通过 `create_cube` 命令实现。

### 3. 线框网格生成

基于 3D 模型生成线框网格，可用于工业设计参考。通过 `generate_wire_mesh` 命令实现。

### 4. 变换操作

支持模型的旋转、缩放和平移操作，并提供交互式控件：

- **旋转模型**：通过 `rotate_model` 命令实现，控制面板提供 X、Y、Z 轴旋转角度控制
- **缩放模型**：通过 `scale_model` 命令实现，控制面板提供缩放比例控制
- **平移模型**：通过 `translate_model` 命令实现，控制面板提供 X、Y、Z 轴平移距离控制

### 5. 导出功能

支持导出线框网格为 CSV 文件格式。通过 `export_wire_csv` 命令实现。

## 交互式控件系统详解

### 控制面板组件

`ControlPanel` 类是交互式控件系统的核心，提供以下功能：

- 创建和管理控制面板
- 添加各种类型的控件（滑块、数字输入框、复选框）
- 处理控件值变化事件
- 更新控件显示

### 控件状态管理

交互式控件状态通过 `scope.context` 存储，并在多个位置同步：

1. **内存数据结构**：存储在 `scope.context` 中
2. **场景显示对象**：活动显示的 3D 对象，由 `currentSceneObject` 跟踪
3. **控制面板 UI**：右侧面板中的滑块和输入框

当任何一处发生变化时，系统会同步更新其它部分的状态，确保一致性。

### 双向绑定实现

1. **从块到控件**：
   - 块命令执行后，会根据命令类型显示相应控件
   - 控件初始值设为当前对象的实际值（如当前旋转角度）
   - 显示控件面板并注册变更事件处理函数

2. **从控件到模型**：
   - 用户操作控件时，触发 `onChange` 事件
   - 事件处理函数获取新值，并将其应用到：
     a. 原始对象 (`currentObjects` 中的对象)
     b. 场景中显示的对象 (`currentSceneObject`)
   - 场景实时更新显示新的变换效果

### 具体实现方法

1. **旋转控件**：
   - 基于当前旋转角度显示 X/Y/Z 三个滑块
   - 角度值以度为单位(-180°到+180°)显示给用户
   - 内部转换为弧度进行 Three.js 计算

2. **缩放控件**：
   - 显示单一缩放比例滑块
   - 范围通常为 0.1 到 5.0
   - 使用 `scale.set(value, value, value)` 实现均匀缩放

3. **平移控件**：
   - 基于当前位置显示 X/Y/Z 三个滑块
   - 范围通常为 -100 到 +100
   - 直接修改 `position` 属性

## 场景对象管理

为了支持双向交互，系统使用了两类对象跟踪：

1. **模型存储库**：`currentObjects` Map 存储所有已创建对象
2. **活动显示对象**：`currentSceneObject` 跟踪当前显示在场景中的对象

当用户通过控件修改属性时，系统同时更新两种对象，确保状态一致性。这样，当用户再次运行块代码时，状态能够无缝衔接。

## 注意事项与最佳实践

1. **状态一致性**：
   - 确保控件初始值使用当前对象的实际值
   - 控件操作时同步更新所有相关对象
   - 在清除场景时重置所有状态

2. **角度与弧度转换**：
   - 控件以度为单位显示旋转值，便于用户理解
   - 内部计算需要在度与弧度之间正确转换

3. **克隆与引用**：
   - 显示对象是原始对象的克隆，需要单独维护状态
   - 修改控件时需要同时更新原始对象和显示对象

4. **性能考虑**：
   - 控件值快速变化时可能引起频繁渲染
   - 复杂模型时可考虑添加去抖动（debounce）机制
   - 大型 STL 文件可能需要优化显示机制

5. **兼容性**：
   - 依赖 WebGL 和现代浏览器功能
   - 移动设备上控制面板布局需要响应式设计

## 扩展开发指南

### 添加新的变换类型

1. 在 `ThreeJSBlocks.ts` 中定义新块
2. 在 `ThreeJSCommandProcessor.ts` 中添加对应命令处理
3. 设计适当的控制面板交互界面
4. 实现双向数据绑定逻辑

### 增强控制面板功能

1. 添加更多控件类型（如颜色选择器）
2. 支持控件分组和折叠
3. 添加预设值和快捷按钮
4. 加入键盘快捷键支持

### 优化用户体验

1. 为控件添加数值单位和提示
2. 实现控件值的撤销/重做功能
3. 添加动画过渡效果
4. 开发更直观的3D gizmo交互控件

## 开发调试技巧

1. 使用浏览器控制台查看对象属性和状态变化
2. 监控控件值变化与对象变换的关联关系
3. 添加详细日志以跟踪数据流向和转换过程
4. 使用浏览器的元素检查器检查控制面板DOM结构

## 未来发展方向

1. 支持更多变换类型（如切片、boolean 操作）
2. 实现基于物理的变换约束和碰撞检测
3. 集成材质和纹理编辑功能
4. 添加子对象和组件化支持
5. 集成 VR/AR 预览功能