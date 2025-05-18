# CAMblock Project - AI Development Guide
----------我们交流项目用中文，但是软件里面的一切内容写英语

## Project Overview

CAMblock is a web-based 3D modeling application that uses Blockly for visual programming interface and Three.js as the 3D rendering engine. This document is designed to help AI assistants understand the project architecture to assist with future development.

## Tech Stack

- **Frontend Framework**: Pure JavaScript/TypeScript (no framework)
- **3D Engine**: Three.js
- **Visual Programming**: Blockly
- **Build Tools**: Module imports (import/export)

## Core Concepts

### Command Pattern

The project follows a command pattern design where blocks created via the Blockly interface are converted to command objects, which are then executed by a command processor to perform 3D operations.

```
Blockly Blocks → Command Objects → 3D Operations → Rendered Results
```

### Scope System

A nested scope system manages variables and command execution context, supporting command nesting and scope isolation.

### Bidirectional Interactive Control System

Through interactive controls in the right panel, users can adjust the transformation parameters (rotation, scaling, translation) of 3D models in real-time, with changes directly reflected in the 3D scene. The system implements a complete bidirectional data binding mechanism:

1. **Block Commands to Controls**: When users add transformation blocks in Blockly and run them, corresponding controls appear in the right panel
2. **Controls to Model**: Users can modify 3D models directly by adjusting controls, without modifying Blockly blocks
3. **State Synchronization**: Maintains synchronized states between blocks, controls, and 3D models, ensuring consistent user experience

## Key Files Description

### Core Engine

- `src-ui/core/Scope.ts`: Scope and command system
- `src-ui/core/BlockEditor.ts`: Blockly editor wrapper
- `src-ui/core/actions.ts`: Application action handling

### 3D Rendering

- `src-ui/threejs/GLViewer.ts`: Three.js renderer wrapper
- `src-ui/threejs/ThreeJSCommandProcessor.ts`: Command to 3D operation conversion and interactive control handling

### Block Definitions

- `src-ui/blocks/blocks.ts`: Block system initialization
- `src-ui/blocks/ThreeJSBlocks.ts`: 3D operation-related block definitions
- `src-ui/blocks/FileUploadField.ts`: File upload field implementation
- `src-ui/blocks/blocks_def.json`: Block definition JSON configuration

### UI Components

- `src-ui/components/Statusbar.ts`: Status bar component
- `src-ui/components/Toolbar.ts`: Toolbar component
- `src-ui/components/ControlPanel.ts`: Interactive control panel component
- `src-ui/components/control-panel.css`: Control panel styling

### Utilities

- `src-ui/utils/hull.js`: Convex/concave hull algorithm implementation
- `src-ui/utils/file.ts`: File operation utilities
- `src-ui/utils/processIndices.ts`: Helper functions for geometry processing
- `src-ui/utils/SVGExporter.ts`: SVG export utilities for stacked layers

## Main Data Structures

### Command Object

```typescript
{
  id: string,       // Command type identifier
  args: object,     // Command parameters
  children: array,  // Child commands
  blk_def: object   // Block definition reference
}
```

### Scope System

```typescript
Scope {
  scopeItem: ScopeItem,  // Current scope
  context: object        // Global context
}

ScopeItem {
  parent: ScopeItem,     // Parent scope
  items: Command[],      // Commands in current scope
  ctx: object            // Scope variables
}
```

### Interactive Control Configuration

```typescript
ControlConfig {
  id: string,                   // Control unique identifier
  type: "slider"|"number"|"checkbox", // Control type
  label: string,                // Control label
  min?: number,                 // Minimum value (for numeric controls)
  max?: number,                 // Maximum value (for numeric controls)
  step?: number,                // Step (for numeric controls)
  value: number|boolean,        // Current control value
  onChange: (value) => void     // Value change event handler
}
```

### 3D State Tracking

```typescript
// State tracking in ThreeJSCommandProcessor class
private currentObjects: Map<string, THREE.Object3D> // Map of all model objects
private currentSceneObject: THREE.Object3D | null   // Tracks the current object displayed in the scene
private isStackedLayersMode: boolean = false;       // Flag indicating stacked layers mode
private originalModelId: string | null = null;      // Tracks original model ID for stacked layers
private stackedLayers: THREE.Object3D[] = [];       // Array of stacked layer objects
private stackedShapes: any[] = [];                  // Array of shape data for SVG export

// Transformation states stored in scope.context
scope.context["_rotateModelValues"]    // Stores rotation angle values
scope.context["_scaleModelValue"]      // Stores scale ratio value
scope.context["_translateModelValues"] // Stores translation distance values
scope.context["_stackedLayersMaterialThickness"] // Stores material thickness for stacked layers
scope.context["_stackedLayersCount"]   // Stores layer count for stacked layers
```

## Execution Flow

1. **Initialization**:
   - Load block definitions
   - Initialize BlocklyEditor
   - Create GLViewer
   - Register ThreeJSBlocks
   - Create ThreeJSCommandProcessor
   - Initialize control panel

2. **User Interaction**:
   - User assembles blocks in Blockly interface
   - Operates toolbar buttons
   - Clicks run to execute rendering
   - Adjusts parameters in real-time via the right control panel

3. **Rendering Execution**:
   - Clear current scene
   - Reset scope
   - BlocklyEditor generates code (creating Command objects)
   - ThreeJSCommandProcessor processes commands
   - GLViewer updates display
   - Display control panel relevant to current operations
   
## Core Features

### 1. STL Model Loading and Display

Support for loading STL model files and displaying them in a 3D environment. Implemented through the `upload_stl` command.

### 2. Basic 3D Shape Creation

Provides functionality to create basic 3D shapes, such as cubes. Implemented through the `create_cube` command.

### 3. Wire Mesh Generation

Generates wire mesh based on 3D models, useful for industrial design reference. Implemented through the `generate_wire_mesh` command.

### 4. Transformation Operations

Supports model rotation, scaling, and translation operations, with interactive controls:

- **Rotate Model**: Implemented through the `rotate_model` command, control panel provides X, Y, Z axis rotation angle control
- **Scale Model**: Implemented through the `scale_model` command, control panel provides scale ratio control
- **Translate Model**: Implemented through the `translate_model` command, control panel provides X, Y, Z axis translation distance control

### 5. Export Functionality

Supports exporting wire mesh as CSV file format. Implemented through the `export_wire_csv` command.

### 6. Stacked Layers Generation

Generates stacked layers representation for laser cutting fabrication from 3D models. Implemented through the `generate_stacked_layers` command.

- Slices 3D model into horizontal layers
- Creates extruded representations of each slice with specified material thickness
- Automatically regenerates when the original model is transformed
- Original model is hidden by default, with an option to show/hide
- Exports SVG files for use with laser cutters

## Development Roadmap

This roadmap outlines the incremental approach to enhancing CAMblock by first implementing component-based versions of existing features, then extending to more capabilities.

### Phase 1: Component-Based Wire Mesh Generator with Basic Programming Constructs

**Goal**: Create a component-based version of the Wire Mesh Generator with basic programming support while maintaining the simple version.

**Current Simple Version**:
- Single block approach with predefined parameters (horizontal/vertical wire count)
- Limited customization through a few parameters
- "Black box" implementation where internal process is hidden

**New Component-Based Version Features**:
- Break down wire mesh generation into fundamental operations
- Allow fine-grained control over each wire's position, thickness, and appearance
- Enable custom wire patterns through explicit placement or programmatic generation
- Provide greater understanding of the internal process
- Include basic programming constructs for efficient wire generation

**Implementation Requirements**:
- Keep existing simple Wire Mesh blocks
- Create new "Wire Mesh Components" category
- Create new "Logic" category for programming constructs
- Implement basic building blocks for wire mesh generation
- Implement basic programming constructs (variables, loops, etc.)
- Extend command processor to handle these component commands
- Ensure compatibility between manual and programmatic approaches

### Phase 2: Component-Based Approach for Other Features

**Goal**: Extend the component-based approach to other features like transformations and stacked layers.

**New Features**:
- Component-based transformation operations
- Decomposed stacked layers generation
- Fine-grained control over each aspect of the process
- More transparent and educational implementation

### Phase 3: Advanced Programming Constructs

**Goal**: Introduce more sophisticated programming constructs for complex logic.

**New Features**:
- Complete conditional structures (if-then-else, if-elif-else)
- Advanced loops (for-each, while)
- Logical operators (AND, OR, NOT)
- Comparison operators

### Phase 4: Functions and Modularity

**Goal**: Enable code reuse and modular program design.

**New Features**:
- Function definition blocks
- Function parameter passing
- Return value handling
- Local variable scoping

### Phase 5: Advanced Geometry Operations

**Goal**: Provide more powerful geometric modeling capabilities.

**New Features**:
- Boolean operations (union, subtract, intersect)
- Parametric shape creation
- Path operations and extrusions
- Custom mesh manipulation

## Critical Development Guidelines and Common Issues

### 1. Control Panel Handling

- **Always use `controlPanel.setCommand()` before adding controls**: This method sets the title and makes the panel visible
- **Ensure proper display by setting `controlPanel.container.style.display = "block"`**: The control panel is initially hidden and must be explicitly shown
- **Clear the panel before setting new controls**: Always call `controlPanel.clear()` first

### 2. CSS Structure Considerations

- **Do not modify the core CSS class definitions** in `app.css` and `control-panel.css` without thorough testing
- **Important control panel CSS properties**:
  - Position: `position: absolute`
  - Visibility: `display: none` initial state, JavaScript sets to `display: block`
  - Z-index: `z-index: 1000` to appear above 3D content
  - Positioning: `top: 20px; right: 20px` places it in top-right corner

### 3. State Management

- **Always use the scope context** for persistent state: `scope.setVar("_key", value)`
- **Transform operations must update the relevant state objects**:
  - Rotation: `scope.context["_rotateModelValues"]`
  - Scale: `scope.context["_scaleModelValue"]`
  - Translation: `scope.context["_translateModelValues"]`
- **Ensure bidirectional data binding**: Control changes must update both displayed objects and stored objects

### 4. Memory Management

- **Dispose Three.js resources properly** when removing objects:
  - Dispose geometries: `geometry.dispose()`
  - Dispose materials: `material.dispose()`
  - Remove from scene tree: `scene.remove(object)`
- **Always clean up old objects** when regenerating or replacing them

### 5. Command Processing

- **Implement command pattern consistently**: All operations should be represented as commands
- **Properly handle asynchronous operations** with async/await in ThreeJSCommandProcessor
- **Ensure command children are processed correctly** for nested operations

### 6. Stacked Layers Generation

- **Handle model transformations properly**: Regenerate layers when the model is transformed
- **Use debouncing for regeneration** to prevent excessive updates during interactive control
- **Ensure SVG export includes all necessary metadata**: Layer number, material thickness, etc.

### 7. UI/UX Considerations

- **Provide immediate visual feedback** for user actions
- **Use the status bar** for operation progress and error reporting
- **Ensure responsive design** works across different screen sizes

## Common Pitfalls to Avoid

1. **Control Panel Not Showing**: 
   - Ensure `controlPanel.setCommand()` is called before adding controls
   - Verify CSS properties for visibility are correctly set
   - Check z-index values to make sure panel isn't hidden behind other elements

2. **3D Objects Not Updating**: 
   - Remember to update both `currentObjects` and `currentSceneObject`
   - Apply transformations to actual object properties (position, rotation, scale)

3. **State Synchronization Issues**: 
   - Always update scope context when state changes
   - Ensure bi-directional binding between UI controls and object properties
   - Handle unit conversions (e.g., degrees to radians) consistently

4. **Memory Leaks**: 
   - Always dispose Three.js resources properly
   - Remove old objects before creating new ones
   - Clear unused references to allow garbage collection

5. **Transformation Problems**:
   - Handle all three transformation types consistently (rotation, scale, translation)
   - Remember rotations are in degrees in UI but radians in Three.js
   - Apply transformations in the correct order

6. **Error Handling**:
   - Always check for null/undefined objects before accessing properties
   - Add proper error handling for file operations and async processes
   - Display meaningful error messages to users

## Extension Guidelines

When extending the project with new features:

1. **Follow established patterns**: Use the command pattern, scope system, and UI conventions
2. **Maintain bidirectional data binding**: Ensure UI controls, scope variables, and 3D objects stay in sync
3. **Implement proper cleanup**: Dispose resources and remove references to prevent memory leaks
4. **Add comprehensive documentation**: Document new commands, blocks, and UI elements
5. **Test thoroughly**: Ensure new features work with existing functionality

## Debugging Tips

- Use browser console logging extensively, especially in key methods
- Check object references and state variables in the console
- Inspect DOM elements to verify correct CSS properties
- Add temporary visual aids (e.g., distinctive colors) to help identify issues
- Use the status bar for displaying operation progress and error states



代码组织----2025/5/17
最近，我们对代码进行了重构，将原本集中在 ThreeJSBlocks.ts 文件中的块定义分离到多个专门的文件中，提高了代码的模块化和可维护性。
文件结构
src-ui/blocks/
├── FileUploadField.ts          - 文件上传字段组件
├── ModelBlockDefinitions.ts    - 3D 模型相关块定义
├── ProgrammingBlockDefinitions.ts - 编程逻辑块定义
├── StackedLayersBlockDefinitions.ts - 层叠激光切割块定义
├── ThreeJSBlocks.ts            - 主块注册和组织文件
├── TransformBlockDefinitions.ts - 模型变换块定义
├── VisualizationBlockDefinitions.ts - 可视化块定义
├── WireMeshBlockDefinitions.ts - 线框网格块定义
├── blocks.ts                   - 块系统核心功能
└── blocks_def.json             - 块基本定义数据
模块化设计
每个模块文件（如 ModelBlockDefinitions.ts）都导出一个函数，该函数返回该类别的所有块定义。例如：
typescript// src-ui/blocks/ModelBlockDefinitions.ts
export function getModelBlockDefinitions(codeGenerator: any) {
  return {
    "load_stl": { ... },
    "create_cube": { ... },
    "upload_stl": { ... }
  };
}
主注册流程
ThreeJSBlocks.ts 文件负责：

创建工具箱类别
引入各个模块的块定义
将块分配到对应的类别
注册所有块到 Blockly 系统

typescript// src-ui/blocks/ThreeJSBlocks.ts
export function registerThreeJSBlocks(codeGenerator: any, addToolboxCategory: any) {
  // 创建工具箱类别
  const modelCategory = addToolboxCategory("3D Model");
  // ... 其他类别
  
  // 获取各模块块定义
  const modelBlocks = getModelBlockDefinitions(codeGenerator);
  // ... 其他模块
  
  // 合并所有块定义
  const blockDefinitions = {
    ...modelBlocks,
    // ... 其他模块
  };
  
  // 设置块类别
  blockDefinitions["load_stl"].category = modelCategory;
  // ... 其他块
  
  // 注册所有块
  Object.entries(blockDefinitions).forEach(
    ([blockId, { category, definition, generator }]) => {
      if (category) {
        Blockly.Blocks[blockId] = definition;
        codeGenerator[blockId] = generator;
        category.contents.push({ kind: "block", type: blockId });
      }
    }
  );
}
支持的功能块
3D 模型块

加载 STL 文件
上传 STL 文件
创建立方体

变换块

旋转模型
缩放模型
平移模型

可视化块

在 3D 查看器中显示
清除场景

编程逻辑块

变量声明和获取
数字和数学运算
比较操作
for 循环
if 条件语句

线框网格块

生成线框网格
导出线框 CSV
各种线框组件操作

层叠激光切割块

生成层叠图层
导出层叠 SVG

扩展指南
如果需要添加新的块类别或类型，请按照以下步骤：

创建新的块定义文件，如 NewFeatureBlockDefinitions.ts
实现 getNewFeatureBlockDefinitions 函数，返回新块的定义
在 ThreeJSBlocks.ts 中：

导入新模块
创建相应的工具箱类别
获取新模块的块定义
设置块类别
块定义会自动被注册



开发注意事项

所有块定义文件应遵循相同的结构，以保持一致性
每个块的 category 属性初始设置为 null，在 ThreeJSBlocks.ts 中统一分配
使用 Command 对象来表示块的执行操作
确保每个块都有适当的前置和后置连接点配置
添加有意义的提示信息，帮助用户理解块的功能

后续计划

添加更多的 3D 模型类型
改进线框网格生成算法
优化层叠激光切割功能
添加更多的变换和编辑操作
实现模型的导入/导出功能
