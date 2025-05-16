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

**Example Component-Based Wire Mesh Usage (Manual Approach)**:
```
// Load or create base model
Upload STL file: [file]

// The component-based approach instead of a single "generate_wire_mesh" block
Initialize Wire Mesh
  
// Add specific horizontal wires
Add Horizontal Wire at: 10 thickness: 0.5 color: red
Add Horizontal Wire at: 20 thickness: 0.5 color: red
Add Horizontal Wire at: 30 thickness: 0.5 color: red
  
// Add specific vertical wires
Add Vertical Wire at: 15 thickness: 0.5 color: blue
Add Vertical Wire at: 30 thickness: 0.5 color: blue
  
// Convert lines to 3D tubes
Convert to Tubes thickness: 0.8
  
// Collect all wires into a single mesh
Collect Wire Mesh

// Show the result
Show in 3D Viewer
```

**Example Component-Based Wire Mesh Usage (Programmatic Approach)**:
```
// Load or create base model
Upload STL file: [file]

// Initialize variables
Set Variable "wireCount" to: 10
Set Variable "modelHeight" to: 100
Set Variable "spacing" to: modelHeight / wireCount

// The component-based approach with programming constructs
Initialize Wire Mesh
  
// Use for loop to add multiple horizontal wires with calculated positions
For i from: 0 to: wireCount step: 1
  Set Variable "position" to: i * spacing
  Add Horizontal Wire at: position thickness: 0.5 color: red
End For
  
// Use for loop to add multiple vertical wires with calculated positions
For i from: 0 to: 5 step: 1
  Set Variable "position" to: i * 20
  Add Vertical Wire at: position thickness: 0.5 color: blue
End For
  
// Convert lines to 3D tubes
Convert to Tubes thickness: 0.8
  
// Collect all wires into a single mesh
Collect Wire Mesh

// Show the result
Show in 3D Viewer
```

### Phase 2: Component-Based Approach for Other Features

**Goal**: Extend the component-based approach to other features like transformations and stacked layers.

**New Features**:
- Component-based transformation operations
- Decomposed stacked layers generation
- Fine-grained control over each aspect of the process
- More transparent and educational implementation

**Implementation Requirements**:
- Create component blocks for each feature
- Ensure compatibility with existing simple blocks
- Provide clear documentation on how components work together

### Phase 3: Advanced Programming Constructs

**Goal**: Introduce more sophisticated programming constructs for complex logic.

**New Features**:
- Complete conditional structures (if-then-else, if-elif-else)
- Advanced loops (for-each, while)
- Logical operators (AND, OR, NOT)
- Comparison operators

**Implementation Requirements**:
- Enhance scope system to handle nested contexts properly
- Implement loop execution in the command processor
- Add support for complex conditions and expressions

### Phase 4: Functions and Modularity

**Goal**: Enable code reuse and modular program design.

**New Features**:
- Function definition blocks
- Function parameter passing
- Return value handling
- Local variable scoping

**Implementation Requirements**:
- Implement function registration system
- Create function call mechanism in command processor
- Design function parameter passing
- Manage local vs. global variable scoping

### Phase 5: Advanced Geometry Operations

**Goal**: Provide more powerful geometric modeling capabilities.

**New Features**:
- Boolean operations (union, subtract, intersect)
- Parametric shape creation
- Path operations and extrusions
- Custom mesh manipulation

**Implementation Requirements**:
- Implement Three.js constructive solid geometry operations
- Create high-level geometry manipulation commands
- Design parameter systems for complex shapes

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

## Phase 1 Implementation Details: Component-Based Wire Mesh Generator

To implement the Component-Based Wire Mesh Generator, we'll need to create new blocks that break down the wire mesh creation process into basic operations while preserving the existing simple wire mesh functionality.

### New Block Categories and Types

#### 1. Wire Mesh Components Category
- **Initialize Wire Mesh Block**: Start defining a component-based wire mesh
  ```
  Initialize Wire Mesh
  ```
- **Add Horizontal Wire Block**: Add a specific horizontal wire
  ```
  Add Horizontal Wire at: [position] thickness: [thickness] color: [color]
  ```
- **Add Vertical Wire Block**: Add a specific vertical wire
  ```
  Add Vertical Wire at: [position] thickness: [thickness] color: [color]
  ```
- **Convert to Tubes Block**: Convert wire lines to 3D tube structures
  ```
  Convert to Tubes thickness: [thickness]
  ```
- **Collect Mesh Block**: Collect all wires into a single mesh group
  ```
  Collect Wire Mesh
  ```
- **Export Wire CSV Block**: Export wire data to CSV format
  ```
  Export Wire CSV filename: [filename]
  ```

### Command Processing Extensions

The `ThreeJSCommandProcessor` class will need the following extensions:

1. **Wire Mesh Context Management**:
```typescript
// New properties for ThreeJSCommandProcessor
private wireMeshContext: {
  isGenerating: boolean;
  wires: {
    type: 'horizontal' | 'vertical';
    position: number;
    thickness: number;
    color: string;
    points?: THREE.Vector3[]; // Store points for each wire
    isLine: boolean; // Flag to indicate if it's a line or tube
  }[];
  currentWireId: number; // For tracking wires
};

// Initialize in constructor
this.wireMeshContext = {
  isGenerating: false,
  wires: [],
  currentWireId: 0
};
```

2. **Wire Mesh Component Commands**:
```typescript
private initializeWireMesh(): void {
  this.wireMeshContext.isGenerating = true;
  this.wireMeshContext.wires = [];
  this.wireMeshContext.currentWireId = 0;
  console.log("[initializeWireMesh] Started new wire mesh definition");
}

private addHorizontalWire(position: number, thickness: number, color: string): void {
  if (!this.wireMeshContext.isGenerating) {
    console.error("[addHorizontalWire] No active wire mesh generation");
    return;
  }
  
  // Get current model
  const objectId = scope.context["_currentObjectId"];
  const model = this.currentObjects.get(objectId);
  
  if (!model || !(model instanceof THREE.Mesh)) {
    console.error("[addHorizontalWire] No valid model found");
    return;
  }
  
  // Calculate actual Y position based on model height
  const boundingBox = new THREE.Box3().setFromObject(model);
  const yPosition = boundingBox.min.y + position;
  
  // Find intersection points with the model
  const intersectionPoints = this.findHorizontalIntersectionPoints(model, yPosition);
  
  if (intersectionPoints.length < 3) {
    console.error("[addHorizontalWire] Not enough intersection points found");
    return;
  }
  
  // Calculate wire thickness (used only if converted to tube)
  const scaledThickness = thickness;
  
  // Store wire info - default as line (not tube)
  const wireId = this.wireMeshContext.currentWireId++;
  this.wireMeshContext.wires.push({
    type: 'horizontal',
    position,
    thickness: scaledThickness,
    color,
    points: intersectionPoints,
    isLine: true // Default to line, can be converted to tube later
  });
  
  // Create visual line representation for preview
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(intersectionPoints);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: parseInt(color.replace('#', '0x')),
    linewidth: 1
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  
  // Store in temporary object for later collection
  const id = `wire_component_${wireId}`;
  this.currentObjects.set(id, line);
  
  console.log(`[addHorizontalWire] Added at position=${position} with thickness=${thickness}, ID=${id}`);
}

private addVerticalWire(position: number, thickness: number, color: string): void {
  if (!this.wireMeshContext.isGenerating) {
    console.error("[addVerticalWire] No active wire mesh generation");
    return;
  }
  
  // Similar to addHorizontalWire but for vertical orientation
  // Get current model
  const objectId = scope.context["_currentObjectId"];
  const model = this.currentObjects.get(objectId);
  
  if (!model || !(model instanceof THREE.Mesh)) {
    console.error("[addVerticalWire] No valid model found");
    return;
  }
  
  // Calculate actual Z position based on model depth
  const boundingBox = new THREE.Box3().setFromObject(model);
  const zPosition = boundingBox.min.z + position;
  
  // Find intersection points with the model
  const intersectionPoints = this.findVerticalIntersectionPoints(model, zPosition);
  
  if (intersectionPoints.length < 3) {
    console.error("[addVerticalWire] Not enough intersection points found");
    return;
  }
  
  // Calculate wire thickness (used only if converted to tube)
  const scaledThickness = thickness;
  
  // Store wire info - default as line (not tube)
  const wireId = this.wireMeshContext.currentWireId++;
  this.wireMeshContext.wires.push({
    type: 'vertical',
    position,
    thickness: scaledThickness,
    color,
    points: intersectionPoints,
    isLine: true // Default to line, can be converted to tube later
  });
  
  // Create visual line representation for preview
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(intersectionPoints);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: parseInt(color.replace('#', '0x')),
    linewidth: 1
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  
  // Store in temporary object for later collection
  const id = `wire_component_${wireId}`;
  this.currentObjects.set(id, line);
  
  console.log(`[addVerticalWire] Added at position=${position} with thickness=${thickness}, ID=${id}`);
}

private convertToTubes(tubeThickness: number): void {
  if (!this.wireMeshContext.isGenerating) {
    console.error("[convertToTubes] No active wire mesh generation");
    return;
  }
  
  console.log(`[convertToTubes] Converting wires to tubes with thickness=${tubeThickness}`);
  
  // Update all wires to be tubes instead of lines
  for (const wire of this.wireMeshContext.wires) {
    wire.isLine = false;
    wire.thickness = tubeThickness;
    
    // Remove the line representation and create tube instead
    if (wire.points && wire.points.length > 0) {
      // Find the line object by ID
      const wireId = this.wireMeshContext.wires.indexOf(wire);
      const lineId = `wire_component_${wireId}`;
      const line = this.currentObjects.get(lineId);
      
      if (line) {
        // Create a path from points
        const curve = new THREE.CatmullRomCurve3(wire.points, true);
        const tubeGeometry = new THREE.TubeGeometry(
          curve,
          wire.points.length * 4, // segments
          wire.thickness,
          8, // radial segments
          true // closed
        );
        
        const tubeMaterial = new THREE.MeshPhongMaterial({
          color: parseInt(wire.color.replace('#', '0x')),
          shininess: 100,
          specular: 0x222222,
        });
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // Replace line with tube
        this.currentObjects.set(lineId, tube);
      }
    }
  }
}

private collectWireMesh(): string {
  if (!this.wireMeshContext.isGenerating) {
    console.error("[collectWireMesh] No active wire mesh generation");
    return null;
  }
  
  // Create a group to hold all wires
  const wireGroup = new THREE.Group();
  
  // Add all wire objects to the group
  for (let i = 0; i < this.wireMeshContext.wires.length; i++) {
    const wireId = `wire_component_${i}`;
    const wireObject = this.currentObjects.get(wireId);
    
    if (wireObject) {
      wireGroup.add(wireObject.clone());
    }
  }
  
  // Reset context
  this.wireMeshContext.isGenerating = false;
  
  // Save and return result
  const id = `component_wire_mesh_${Date.now()}`;
  this.currentObjects.set(id, wireGroup);
  scope.setVar("_currentObjectId", id);
  scope.setVar("_wireMesh", wireGroup);
  
  console.log(`[collectWireMesh] Collected ${this.wireMeshContext.wires.length} wires into mesh ID=${id}`);
  
  return id;
}

private exportWireCSV(filename: string): void {
  if (!this.wireMeshContext.wires || this.wireMeshContext.wires.length === 0) {
    console.error("[exportWireCSV] No wire data available");
    return;
  }
  
  console.log(`[exportWireCSV] Exporting wires to ${filename}.csv`);
  
  // Generate CSV content
  let csvContent = "wire_type,position,x,y,z\n";
  
  for (const wire of this.wireMeshContext.wires) {
    if (wire.points) {
      for (const point of wire.points) {
        csvContent += `${wire.type},${wire.position},${point.x.toFixed(2)},${point.y.toFixed(2)},${point.z.toFixed(2)}\n`;
      }
    }
  }
  
  // Create download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

3. **Helper Methods for Intersection Points**:
```typescript
private findHorizontalIntersectionPoints(model: THREE.Mesh, yPosition: number): THREE.Vector3[] {
  const intersectionPoints: THREE.Vector3[] = [];
  
  // Create a horizontal plane at the specified Y position
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yPosition);
  
  // Process model geometry to find intersection points
  const geometry = model.geometry;
  const vertices = geometry.attributes.position;
  const indices = geometry.index;
  
  // Use existing intersection finding logic similar to current implementation
  // but adapted for component approach
  
  // Find intersection points between plane and model triangles
  if (indices) {
    for (let i = 0; i < indices.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i));
      const b = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i + 1));
      const c = new THREE.Vector3().fromBufferAttribute(vertices, indices.getX(i + 2));
      
      model.localToWorld(a);
      model.localToWorld(b);
      model.localToWorld(c);
      
      this.addTrianglePlaneIntersections(a, b, c, plane, intersectionPoints);
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < vertices.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(vertices, i);
      const b = new THREE.Vector3().fromBufferAttribute(vertices, i + 1);
      const c = new THREE.Vector3().fromBufferAttribute(vertices, i + 2);
      
      model.localToWorld(a);
      model.localToWorld(b);
      model.localToWorld(c);
      
      this.addTrianglePlaneIntersections(a, b, c, plane, intersectionPoints);
    }
  }
  
  // If enough points, generate hull
  if (intersectionPoints.length >= 3) {
    // Use hull algorithm to generate clean 2D outline
    const points2D = intersectionPoints.map(p => [p.x, p.z]);
    const hullPoints = hull(points2D, 20);
    
    if (hullPoints && hullPoints.length >= 3) {
      // Convert hull points back to 3D
      return hullPoints.map(p => new THREE.Vector3(p[0], yPosition, p[1]));
    }
  }
  
  return intersectionPoints;
}

// Similar implementation for findVerticalIntersectionPoints

private addTrianglePlaneIntersections(
  a: THREE.Vector3, 
  b: THREE.Vector3, 
  c: THREE.Vector3, 
  plane: THREE.Plane, 
  points: THREE.Vector3[]
): void {
  const line1 = new THREE.Line3(a, b);
  const line2 = new THREE.Line3(b, c);
  const line3 = new THREE.Line3(c, a);
  
  const target = new THREE.Vector3();
  
  if (plane.intersectLine(line1, target)) points.push(target.clone());
  if (plane.intersectLine(line2, target)) points.push(target.clone());
  if (plane.intersectLine(line3, target)) points.push(target.clone());
}
```

### Implementation Steps

1. **Update Block Definitions**:
   - Create new block definitions in a file like `WireMeshComponentBlocks.ts`
   - Register these blocks with Blockly

2. **Extend Command Processor**:
   - Add wire mesh context and component commands in `ThreeJSCommandProcessor.ts`
   - Implement intersection finding and wire creation methods

3. **Ensure Compatibility**:
   - Make sure the component approach can achieve the same results as the simple approach
   - Ensure that collected wire meshes can be transformed like regular meshes

4. **Update User Interface**:
   - Add "Wire Mesh Components" toolbox category
   - Design intuitive block appearances

### Example Implementation of Wire Mesh Component Blocks

Here's a preview of the implementation for the Wire Mesh Component blocks:

```typescript
// WireMeshComponentBlocks.ts
export function registerWireMeshComponentBlocks(
  codeGenerator: any,
  addToolboxCategory: any
) {
  // Create the wire mesh components category
  const wireMeshComponentsCategory = addToolboxCategory("Wire Mesh Components");
  
  // Block definitions
  const blockDefinitions = {
    "initialize_wire_mesh": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Initialize Wire Mesh");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
          this.setTooltip("Start defining a component-based wire mesh");
        },
      },
      generator: function (block: any) {
        const cmd = new Command("initialize_wire_mesh", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    "add_horizontal_wire": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Add Horizontal Wire");
          this.appendDummyInput()
            .appendField("at:")
            .appendField(new Blockly.FieldNumber(0), "POSITION")
            .appendField("thickness:")
            .appendField(new Blockly.FieldNumber(0.5, 0.1, 5, 0.1), "THICKNESS")
            .appendField("color:")
            .appendField(new Blockly.FieldColour("#ff0000"), "COLOR");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
        },
      },
      generator: function (block: any) {
        const position = parseFloat(block.getFieldValue("POSITION"));
        const thickness = parseFloat(block.getFieldValue("THICKNESS"));
        const color = block.getFieldValue("COLOR");
        
        const cmd = new Command("add_horizontal_wire", { position, thickness, color }, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    "add_vertical_wire": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Add Vertical Wire");
          this.appendDummyInput()
            .appendField("at:")
            .appendField(new Blockly.FieldNumber(0), "POSITION")
            .appendField("thickness:")
            .appendField(new Blockly.FieldNumber(0.5, 0.1, 5, 0.1), "THICKNESS")
            .appendField("color:")
            .appendField(new Blockly.FieldColour("#00ff00"), "COLOR");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
        },
      },
      generator: function (block: any) {
        const position = parseFloat(block.getFieldValue("POSITION"));
        const thickness = parseFloat(block.getFieldValue("THICKNESS"));
        const color = block.getFieldValue("COLOR");
        
        const cmd = new Command("add_vertical_wire", { position, thickness, color }, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    "convert_to_tubes": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Convert to Tubes");
          this.appendDummyInput()
            .appendField("thickness:")
            .appendField(new Blockly.FieldNumber(0.5, 0.1, 5, 0.1), "THICKNESS");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
        },
      },
      generator: function (block: any) {
        const thickness = parseFloat(block.getFieldValue("THICKNESS"));
        
        const cmd = new Command("convert_to_tubes", { thickness }, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    "collect_wire_mesh": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Collect Wire Mesh");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
        },
      },
      generator: function (block: any) {
        const cmd = new Command("collect_wire_mesh", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    "export_wire_csv": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Export Wire CSV");
          this.appendDummyInput()
            .appendField("filename:")
            .appendField(new Blockly.FieldTextInput("wire_mesh"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
        },
      },
      generator: function (block: any) {
        const filename = block.getFieldValue("FILENAME");
        
        const cmd = new Command("export_wire_csv", { filename }, [], {});
        scope.push(cmd);
        return "";
      },
    },
  };
  
  // Register all blocks
  Object.entries(blockDefinitions).forEach(
    ([blockId, { category, definition, generator }]) => {
      Blockly.Blocks[blockId] = definition;
      codeGenerator[blockId] = generator;

      // Add to toolbox
      category.contents.push({ kind: "block", type: blockId });
    }
  );
}("Start defining a component-based wire mesh");
        },
      },
      generator: function (block: any) {
        const cmd = new Command("initialize_wire_mesh", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    "add_horizontal_wire": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Add Horizontal Wire");
          this.appendDummyInput()
            .appendField("at:")
            .appendField(new Blockly.FieldNumber(0), "POSITION")
            .appendField("thickness:")
            .appendField(new Blockly.FieldNumber(0.5, 0.1, 5, 0.1), "THICKNESS")
            .appendField("color:")
            .appendField(new Blockly.FieldColour("#ff0000"), "COLOR");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
        },
      },
      generator: function (block: any) {
        const position = parseFloat(block.getFieldValue("POSITION"));
        const thickness = parseFloat(block.getFieldValue("THICKNESS"));
        const color = block.getFieldValue("COLOR");
        
        const cmd = new Command("add_horizontal_wire", { position, thickness, color }, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    // Similar definitions for other component blocks...
    
    "finalize_wire_mesh": {
      category: wireMeshComponentsCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Finalize Wire Mesh");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshComponentsCategory.colour);
          this.setTooltip("Complete wire mesh generation");
        },
      },
      generator: function (block: any) {
        const cmd = new Command("finalize_wire_mesh", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },
  };
  
  // Register all blocks
  Object.entries(blockDefinitions).forEach(
    ([blockId, { category, definition, generator }]) => {
      Blockly.Blocks[blockId] = definition;
      codeGenerator[blockId] = generator;

      // Add to toolbox
      category.contents.push({ kind: "block", type: blockId });
    }
  );
}

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