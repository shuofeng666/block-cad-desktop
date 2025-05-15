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

## 关键文件说明

### 核心引擎

- `src-ui/core/Scope.ts`: 作用域和命令系统
- `src-ui/core/BlockEditor.ts`: Blockly 编辑器封装
- `src-ui/core/actions.ts`: 应用程序动作处理

### 3D 渲染

- `src-ui/threejs/GLViewer.ts`: Three.js 渲染器封装
- `src-ui/threejs/ThreeJSCommandProcessor.ts`: 命令到 3D 操作的转换

### 块定义

- `src-ui/blocks/blocks.ts`: 块系统初始化
- `src-ui/blocks/ThreeJSBlocks.ts`: 3D 操作相关块定义
- `src-ui/blocks/FileUploadField.ts`: 文件上传字段实现
- `src-ui/blocks/blocks_def.json`: 块定义 JSON 配置

### UI 组件

- `src-ui/components/Statusbar.ts`: 状态栏组件
- `src-ui/components/Toolbar.ts`: 工具栏组件

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

## 执行流程

1. **初始化**：
   - 加载块定义
   - 初始化 BlocklyEditor
   - 创建 GLViewer
   - 注册 ThreeJSBlocks
   - 创建 ThreeJSCommandProcessor

2. **用户交互**：
   - 用户在 Blockly 界面上组装块
   - 操作工具栏按钮
   - 点击运行执行渲染

3. **渲染执行**：
   - 清空当前场景
   - 重置作用域
   - BlocklyEditor 生成代码 (生成 Command 对象)
   - ThreeJSCommandProcessor 处理命令
   - GLViewer 更新显示
   
## 核心功能

### 1. STL 模型加载和显示

支持加载 STL 模型文件并在 3D 环境中显示。通过 `upload_stl` 命令实现。

### 2. 基本 3D 形状创建

提供创建基本 3D 形状的功能，如立方体。通过 `create_cube` 命令实现。

### 3. 线框网格生成

基于 3D 模型生成线框网格，可用于工业设计参考。通过 `generate_wire_mesh` 命令实现。

### 4. 变换操作

支持模型的旋转、缩放和平移操作。通过 `rotate_model`、`scale_model` 和 `translate_model` 命令实现。

### 5. 导出功能

支持导出线框网格为 CSV 文件格式。通过 `export_wire_csv` 命令实现。

## 扩展开发指南

### 添加新的块

1. 在 `ThreeJSBlocks.ts` 或创建新的块定义文件中定义块
2. 为块添加配置项，包括 UI 定义和代码生成部分
3. 在 `ThreeJSCommandProcessor.ts` 中添加对应的命令处理函数

### 添加新的 3D 功能

1. 在 `ThreeJSCommandProcessor` 类中添加新的方法
2. 实现 Three.js 相关的渲染逻辑
3. 添加对应的块定义指向这个命令

## 常见开发任务

### 样式修改

UI 样式定义在以下文件中：
- `src-ui/styles/app.css`
- `src-ui/components/status.css`
- `src-ui/components/toolbar.css`

### 块行为修改

要修改块的行为，需查看以下文件：
- 块的定义 (ThreeJSBlocks.ts)
- 命令处理逻辑 (ThreeJSCommandProcessor.ts)

### 渲染质量调整

3D 渲染相关设置位于：
- GLViewer.ts (相机、光照设置)
- ThreeJSCommandProcessor.ts (材质、几何体处理)

## 开发注意事项

1. **性能考虑**:
   - 大型 STL 文件处理可能导致性能问题
   - 复杂线框生成计算密集

2. **兼容性**:
   - 应用依赖 WebGL 功能，在较旧设备上可能存在兼容性问题

3. **内存管理**:
   - 3D 对象创建需及时清理以防内存泄漏
   - `clearScene` 方法中已实现适当的清理逻辑

4. **扩展性考虑**:
   - 命令模式设计使添加新功能相对简单
   - 块分类系统可以轻松扩展新类别

## 目前存在的问题与优化方向

1. 错误处理可以更加健壮，特别是在文件处理和 3D 渲染部分
2. 线框网格生成算法在某些复杂模型上可能不够稳定
3. UI 交互可以进一步优化，提高用户体验
4. 可以考虑添加撤销/重做功能
5. 块编辑器的性能在复杂项目中可能需要优化

## AI 开发协助建议

在使用 AI 协助开发时，特别留意：

1. 代码添加应符合现有架构，特别是命令模式和作用域系统
2. Three.js 相关代码需要特别关注内存管理和性能优化
3. 块定义需保持与 Blockly 规范一致
4. UI 组件应遵循现有的设计风格
5. TypeScript 类型定义应尽可能完整以提高代码质量

当需要修改或添加功能时，请首先了解现有实现，然后按照类似模式进行扩展，保持代码风格和架构一致性。