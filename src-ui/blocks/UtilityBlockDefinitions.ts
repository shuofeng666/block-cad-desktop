// src-ui/blocks/UtilityBlockDefinitions.ts
import * as Blockly from "blockly";
import { Command, scope } from "../core/Scope";
import { moduleAdapter } from "../utils/ModuleAdapter";

export function getUtilityBlockDefinitions(codeGenerator: any) {
  return {
    // === 几何计算块 ===
"calculate_bounds": {
  category: null,
  definition: {
    init: function () {
      this.appendDummyInput()
        .appendField("Calculate Object Bounds");
      // 使用 appendValueInput 而不是 appendStatementInput
      this.appendValueInput("OBJECT")
        .setCheck(null)
        .appendField("for object:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip("Calculate the bounding box for an object");
    },
  },
  generator: function (block: any) {
    // 使用 valueToCode 而不是 statementToCode
    const objectCode = codeGenerator.valueToCode(block, "OBJECT", 0) || "null";
    
    const cmd = new Command("calculate_bounds", { objectId: objectCode }, [], {});
    scope.push(cmd);
    return "";
  },
},

    "generate_contour": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Generate Contour");
          this.appendStatementInput("OBJECT")
            .setCheck(null)
            .appendField("for object:");
          this.appendDummyInput()
            .appendField("at height")
            .appendField(new Blockly.FieldNumber(0), "HEIGHT");
          this.appendDummyInput()
            .appendField("concavity")
            .appendField(new Blockly.FieldNumber(20, 1, 100), "CONCAVITY");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Generate a 2D contour from a 3D object at the specified height");
        },
      },
      generator: function (block: any) {
        const height = parseFloat(block.getFieldValue("HEIGHT"));
        const concavity = parseFloat(block.getFieldValue("CONCAVITY"));

        scope.newScope();
        codeGenerator.statementToCode(block, "OBJECT");
        const children = scope.scopeItem.items;
        scope.popScope();

        if (children && children.length > 0) {
          children.forEach((child) => scope.push(child));
        }

        const cmd = new Command(
          "generate_contour", 
          { height, concavity }, 
          [], 
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    "calculate_intersection": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Calculate Intersection");
          this.appendStatementInput("OBJECT")
            .setCheck(null)
            .appendField("for object:");
          this.appendDummyInput()
            .appendField("with plane at")
            .appendField(new Blockly.FieldDropdown([
              ["X", "X"],
              ["Y", "Y"],
              ["Z", "Z"],
            ]), "PLANE_AXIS")
            .appendField("=")
            .appendField(new Blockly.FieldNumber(0), "PLANE_VALUE");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Calculate intersection points between object and a plane");
        },
      },
      generator: function (block: any) {
        const planeAxis = block.getFieldValue("PLANE_AXIS");
        const planeValue = parseFloat(block.getFieldValue("PLANE_VALUE"));

        scope.newScope();
        codeGenerator.statementToCode(block, "OBJECT");
        const children = scope.scopeItem.items;
        scope.popScope();

        if (children && children.length > 0) {
          children.forEach((child) => scope.push(child));
        }

        const cmd = new Command(
          "calculate_intersection", 
          { planeAxis, planeValue }, 
          [], 
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    // === 材质块 ===
    "apply_material": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Apply Material");
          this.appendStatementInput("OBJECT")
            .setCheck(null)
            .appendField("to object:");
          this.appendDummyInput()
            .appendField("type")
            .appendField(new Blockly.FieldDropdown([
              ["Standard", "STANDARD"],
              ["Normal", "NORMAL"],
              ["Wireframe", "WIREFRAME"],
              ["Phong", "PHONG"],
            ]), "MATERIAL_TYPE");
          this.appendDummyInput()
            .appendField("color")
            .appendField(new Blockly.FieldColour("#dddddd"), "COLOR");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Apply a material to the object");
        },
      },
      generator: function (block: any) {
        const materialType = block.getFieldValue("MATERIAL_TYPE");
        const color = block.getFieldValue("COLOR");

        scope.newScope();
        codeGenerator.statementToCode(block, "OBJECT");
        const children = scope.scopeItem.items;
        scope.popScope();

        if (children && children.length > 0) {
          children.forEach((child) => scope.push(child));
        }

        const cmd = new Command(
          "apply_material", 
          { materialType, color }, 
          [], 
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    // === 可视化辅助块 ===
    "show_object_dimensions": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Show Object Dimensions");
          this.appendStatementInput("OBJECT")
            .setCheck(null)
            .appendField("for object:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Display the dimensions of an object in the control panel");
        },
      },
      generator: function (block: any) {
        scope.newScope();
        codeGenerator.statementToCode(block, "OBJECT");
        const children = scope.scopeItem.items;
        scope.popScope();

        if (children && children.length > 0) {
          children.forEach((child) => scope.push(child));
        }

        const cmd = new Command("show_object_dimensions", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },

    "add_helper_object": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Add Helper");
          this.appendStatementInput("OBJECT")
            .setCheck(null)
            .appendField("for object:");
          this.appendDummyInput()
            .appendField("type")
            .appendField(new Blockly.FieldDropdown([
              ["Bounding Box", "BOUNDING_BOX"],
              ["Grid", "GRID"],
              ["Axes", "AXES"],
              ["Edge Lines", "EDGE_LINES"],
            ]), "HELPER_TYPE");
          this.appendDummyInput()
            .appendField("color")
            .appendField(new Blockly.FieldColour("#00ff00"), "COLOR");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Add a visual helper to the object");
        },
      },
      generator: function (block: any) {
        const helperType = block.getFieldValue("HELPER_TYPE");
        const color = block.getFieldValue("COLOR");

        scope.newScope();
        codeGenerator.statementToCode(block, "OBJECT");
        const children = scope.scopeItem.items;
        scope.popScope();

        if (children && children.length > 0) {
          children.forEach((child) => scope.push(child));
        }

        const cmd = new Command(
          "add_helper_object", 
          { helperType, color }, 
          [], 
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    // === 交互控件块 ===
    "create_custom_control": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Create Custom Control");
          this.appendDummyInput()
            .appendField("label")
            .appendField(new Blockly.FieldTextInput("My Control"), "LABEL");
          this.appendDummyInput()
            .appendField("type")
            .appendField(new Blockly.FieldDropdown([
              ["Slider", "SLIDER"],
              ["Number", "NUMBER"],
              ["Checkbox", "CHECKBOX"],
            ]), "CONTROL_TYPE");
          this.appendDummyInput()
            .appendField("initial value")
            .appendField(new Blockly.FieldNumber(0), "INITIAL_VALUE");
          this.appendDummyInput()
            .appendField("variable")
            .appendField(new Blockly.FieldTextInput("control_value"), "VAR_NAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Create a custom control in the control panel");
        },
      },
      generator: function (block: any) {
        const label = block.getFieldValue("LABEL");
        const controlType = block.getFieldValue("CONTROL_TYPE");
        const initialValue = parseFloat(block.getFieldValue("INITIAL_VALUE"));
        const varName = block.getFieldValue("VAR_NAME");

        const cmd = new Command(
          "create_custom_control", 
          { label, controlType, initialValue, varName }, 
          [], 
          {}
        );
        scope.push(cmd);
        return "";
      },
    }
  };
}