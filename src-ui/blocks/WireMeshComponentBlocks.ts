// 1. 创建新文件: src-ui/blocks/WireMeshComponentBlocks.ts

import * as Blockly from "blockly";
import { scope } from "../core/Scope";
import { Command } from "../core/Scope";

export function registerWireMeshComponentBlocks(
  codeGenerator: any,
  addToolboxCategory: any
) {
  // 创建 Wire Mesh 组件类别
  const wireMeshComponentsCategory = addToolboxCategory("Wire Mesh Components");
  
  // 块定义
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
  };
  
  // 注册所有块
  Object.entries(blockDefinitions).forEach(
    ([blockId, { category, definition, generator }]) => {
      Blockly.Blocks[blockId] = definition;
      codeGenerator[blockId] = generator;

      // 添加到工具箱
      category.contents.push({ kind: "block", type: blockId });
    }
  );
}