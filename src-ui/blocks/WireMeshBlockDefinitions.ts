// src-ui/blocks/WireMeshBlockDefinitions.ts
import * as Blockly from "blockly";
import { Command, scope } from "../core/Scope";

export function getWireMeshBlockDefinitions(codeGenerator: any) {
  return {
    // ===== 基本 Wire Mesh 块 =====
    "generate_wire_mesh": {
      category: null,  // 将在 ThreeJSBlocks.ts 中设置
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Generate Wire Mesh");
          this.appendDummyInput()
            .appendField("Horizontal wires:")
            .appendField(new Blockly.FieldNumber(10, 1, 50), "H_COUNT")
            .appendField("Vertical wires:")
            .appendField(new Blockly.FieldNumber(10, 1, 50), "V_COUNT");
          this.appendDummyInput()
            .appendField("Display as tubes:")
            .appendField(new Blockly.FieldCheckbox("FALSE"), "USE_TUBES")
            .appendField("Tube thickness:")
            .appendField(
              new Blockly.FieldNumber(0.5, 0.1, 5, 0.1),
              "TUBE_THICKNESS"
            );
          this.appendStatementInput("MODEL")
            .setCheck(null)
            .appendField("for model:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
      },
      generator: function (block: any) {
        const hCount = parseInt(block.getFieldValue("H_COUNT"));
        const vCount = parseInt(block.getFieldValue("V_COUNT"));
        const useTubes = block.getFieldValue("USE_TUBES") === "TRUE";
        const tubeThickness = parseFloat(block.getFieldValue("TUBE_THICKNESS"));

        // 首先处理子块（模型）
        scope.newScope();
        codeGenerator.statementToCode(block, "MODEL");
        const children = scope.scopeItem.items;
        scope.popScope();

        // 确保子命令先执行
        if (children && children.length > 0) {
          children.forEach((child) => scope.push(child));
        }

        // 然后生成 wire mesh
        const cmd = new Command(
          "generate_wire_mesh",
          { hCount, vCount, useTubes, tubeThickness },
          [],
          {}
        );
        scope.push(cmd);
        return "";
      },
    },
    
    "export_wire_csv": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Export Wire CSV")
            .appendField("filename:")
            .appendField(new Blockly.FieldTextInput("wire_mesh"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
      },
      generator: function (block: any) {
        const filename = block.getFieldValue("FILENAME");
        const cmd = new Command("export_wire_csv", { filename }, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    // ===== Wire Mesh Components 块 =====
    "initialize_wire_mesh": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Initialize Wire Mesh");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
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
      category: null,
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
      category: null,
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
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Convert to Tubes");
          this.appendDummyInput()
            .appendField("thickness:")
            .appendField(new Blockly.FieldNumber(0.5, 0.1, 5, 0.1), "THICKNESS");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
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
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Collect Wire Mesh");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
      },
      generator: function (block: any) {
        const cmd = new Command("collect_wire_mesh", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },
    
    "export_component_wire_csv": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Export Wire Mesh CSV");
          this.appendDummyInput()
            .appendField("filename:")
            .appendField(new Blockly.FieldTextInput("component_wire_mesh"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Export the wire mesh data to CSV file");
        },
      },
      generator: function (block: any) {
        const filename = block.getFieldValue("FILENAME");
        
        const cmd = new Command("export_wire_csv", { filename }, [], {});
        scope.push(cmd);
        return "";
      },
    }
  };
}