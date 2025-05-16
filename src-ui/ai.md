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

## Interactive Control System Detailed Explanation

### Control Panel Component

The `ControlPanel` class is the core of the interactive control system, providing functionalities like:

- Creating and managing control panels
- Adding various types of controls (sliders, number inputs, checkboxes)
- Handling control value change events
- Updating control display

### Control State Management

Interactive control states are stored in `scope.context` and synchronized across multiple locations:

1. **In-memory Data Structure**: Stored in `scope.context`
2. **Scene Display Objects**: Actively displayed 3D objects, tracked by `currentSceneObject`
3. **Control Panel UI**: Sliders and input fields in the right panel

When changes occur in any of these locations, the system synchronizes the states across all other parts to ensure consistency.

### Combined Transformation Controls Implementation

A key enhancement to the system is the ability to display all applied transformations simultaneously in a single control panel. This is implemented through the `showCombinedTransformControls()` method in the `ThreeJSCommandProcessor` class.

Key aspects of this implementation:

1. **Unified Control Panel**: Instead of showing separate control panels for each transformation type, a single "Transform Controls" panel shows all applicable controls.

2. **Conditional Display**: Only transformations that have been applied to the model will have their controls displayed in the panel.

3. **State Persistence**: All transformation states are preserved in `scope.context`, allowing them to be restored when controls are regenerated.

4. **Real-Time Updates**: When any control is adjusted, changes are immediately applied to both the original object and its display representation.

### Bidirectional Binding Implementation

1. **From Blocks to Controls**:
   - After block command execution, controls are displayed based on command type
   - Control initial values are set to the actual values of the current object
   - Control panel is displayed and change event handlers are registered

2. **From Controls to Model**:
   - When user operates controls, `onChange` events are triggered
   - Event handlers get new values and apply them to:
     a. Original objects (in `currentObjects` map)
     b. Objects displayed in scene (`currentSceneObject`)
   - Scene updates in real-time to show new transformation effects

### Specific Implementation Methods

1. **Rotation Controls**:
   - Display X/Y/Z sliders based on current rotation angles
   - Angle values are shown in degrees (-180° to +180°) for user-friendliness
   - Internally converted to radians for Three.js calculations

2. **Scale Controls**:
   - Displays a single scale ratio slider
   - Range typically from 0.1 to 5.0
   - Uses `scale.set(value, value, value)` for uniform scaling

3. **Translation Controls**:
   - Displays X/Y/Z sliders based on current position
   - Range typically from -100 to +100
   - Directly modifies the `position` property

4. **Stacked Layers Controls**:
   - Material thickness slider (1mm to 5mm)
   - Number of layers slider (3 to 50)
   - Show/hide original model checkbox
   - Regenerate layers button

## Stacked Layers Generation System

The stacked layers generation system is implemented to create physical manufacturing outputs from 3D models, particularly for laser-cut assembly models.

### Key Components

1. **Layer Generation Process**:
   - Calculates model dimensions and determines layer spacing
   - Creates horizontal cutting planes through the 3D model
   - Finds intersection points between planes and model geometry
   - Generates 2D shape outlines using hull algorithm
   - Creates extruded 3D representations of each layer

2. **Transformation Integration**:
   - Automatically regenerates layers when original model is transformed
   - Uses debouncing to prevent excessive regeneration during interactive control
   - Maintains synchronization between original model and generated layers

3. **User Interface Controls**:
   - Material thickness controls to simulate different materials
   - Layer count controls for adjusting fabrication complexity
   - Visibility control for hiding/showing original model
   - Regenerate button to manually trigger regeneration

4. **SVG Export**:
   - Converts layer outlines to SVG format
   - Organizes files for direct use with laser cutting equipment
   - Includes metadata about material thickness and layer ordering

### Implementation Details

1. **Intersection Finding**:
   - Uses the `processIndices` helper function to find intersections between geometry and planes
   - Handles both indexed and non-indexed geometry

2. **Shape Generation**:
   - Projects 3D intersection points to 2D
   - Uses concave hull algorithm to generate clean outlines
   - Creates THREE.js Shape objects for visualization and export

3. **Layer Visualization**:
   - Creates extruded mesh for each layer
   - Adds outline edges for better visualization
   - Uses consistent material appearance for fabrication preview

4. **Transformation Synchronization**:
   - Monitors rotation, scaling, and translation operations
   - Implements debouncing to optimize performance during interactive control
   - Correctly handles all transformation types (rotation, scaling, translation)

## Scene Object Management

To support bidirectional interaction, the system uses multiple types of object tracking:

1. **Model Repository**: `currentObjects` Map stores all created objects
2. **Active Display Object**: `currentSceneObject` tracks the object currently displayed in the scene
3. **Stacked Layers**: `stackedLayers` array tracks generated layer objects
4. **Original Model Reference**: `originalModelId` tracks the source model for stacked layers

When users modify properties via controls, the system updates both types of objects, ensuring state consistency. This way, when users run block code again, states can seamlessly continue.

## Notes and Best Practices

1. **State Consistency**:
   - Ensure control initial values use the actual values of current objects
   - Synchronize all related objects when operating controls
   - Reset all states when clearing the scene

2. **Angle and Radian Conversion**:
   - Controls display rotation values in degrees for user understanding
   - Internal calculations need correct conversion between degrees and radians

3. **Cloning and References**:
   - Display objects are clones of original objects, requiring separate state maintenance
   - When modifying controls, both original and display objects need updates

4. **Performance Considerations**:
   - Rapid control value changes may cause frequent rendering
   - Use debouncing mechanisms for complex models
   - Large STL files may need optimized display mechanisms

5. **Compatibility**:
   - Relies on WebGL and modern browser features
   - Control panel layout needs responsive design for mobile devices

6. **Stacked Layers Management**:
   - Always clean up previous layer objects before generating new ones
   - Keep original model reference for regeneration after transformations
   - Ensure proper resource disposal to prevent memory leaks

## Extension Development Guide

### Adding New Transformation Types

1. Define new blocks in `ThreeJSBlocks.ts`
2. Add corresponding command processing in `ThreeJSCommandProcessor.ts`
3. Design appropriate control panel interface
4. Implement bidirectional data binding logic
5. Update the `showCombinedTransformControls()` method to include the new transformation type

### Enhancing Control Panel Functionality

1. Add more control types (such as color pickers)
2. Support control grouping and collapsing
3. Add preset values and quick buttons
4. Add keyboard shortcut support
5. Implement control sections with headers for better organization of complex transformations

### Optimizing User Experience

1. Add value units and tooltips for controls
2. Implement undo/redo functionality for control values
3. Add animation transition effects
4. Develop more intuitive 3D gizmo interactive controls
5. Add ability to lock specific transformation axes

### Extending Stacked Layers Functionality

1. Add support for non-uniform layer spacing
2. Implement layer-specific material assignment
3. Add internal structure generation for stronger models
4. Implement finger joint or interlocking features
5. Add numbering and assembly guide generation
6. Support different cutting strategies (kerf compensation, tabs, etc.)

## Development Debugging Tips

1. Use browser console to view object properties and state changes
2. Monitor the relationship between control value changes and object transformations
3. Add detailed logs to track data flow and transformation processes
4. Use browser's element inspector to examine control panel DOM structure
5. Add visual debugging helpers to visualize transformation axes and origins

## Future Development Directions

1. Support more transformation types (slicing, boolean operations)
2. Implement physics-based transformation constraints and collision detection
3. Integrate material and texture editing functionality
4. Add sub-object and component support
5. Integrate VR/AR preview functionality
6. Implement more advanced wire mesh controls (density, pattern, coloring)
7. Add support for multi-object transformation and grouping
8. Enhance stacked layers system with advanced fabrication features
9. Add assembly instructions generation
10. Implement cost estimation based on material usage