// src-ui/blocks/ThreeJSBlocks.ts
import * as Blockly from 'blockly';
import { scope } from '../jscad/Scope';
import { Command } from '../jscad/Scope';

export function registerThreeJSBlocks(codeGenerator: any, addToolboxCategory: any) {
  // 注册工具箱类别
  const modelCategory = addToolboxCategory("3D Model");
  const wireMeshCategory = addToolboxCategory("Wire Mesh");
  const visualizationCategory = addToolboxCategory("Visualization");
  
  // 块定义
  const blockDefinitions = {
    // 3D Model 块
    "load_stl": {
      category: modelCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("Load STL")
              .appendField("file:")
              .appendField(new Blockly.FieldTextInput("default.stl"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(modelCategory.colour);
          this.setTooltip("Load an STL file");
        }
      },
      generator: function(block: any) {
        const filename = block.getFieldValue('FILENAME');
        const cmd = new Command('load_stl', { filename }, [], {});
        scope.push(cmd);
        return '';
      }
    },
    
    "create_cube": {
      category: modelCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("Create Cube")
              .appendField("size:")
              .appendField(new Blockly.FieldNumber(50, 1), "SIZE");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(modelCategory.colour);
        }
      },
      generator: function(block: any) {
        const size = parseFloat(block.getFieldValue('SIZE'));
        const cmd = new Command('create_cube', { size }, [], {});
        scope.push(cmd);
        return '';
      }
    },
    
    // Wire Mesh 块
    "generate_horizontal_wires": {
      category: wireMeshCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("Generate Horizontal Wires")
              .appendField("count:")
              .appendField(new Blockly.FieldNumber(10, 1, 50), "COUNT");
          this.appendStatementInput("MODEL")
              .setCheck(null)
              .appendField("for model:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshCategory.colour);
        }
      },
      generator: function(block: any) {
        const count = parseInt(block.getFieldValue('COUNT'));
        
        // 处理子块
        scope.newScope();
        codeGenerator.statementToCode(block, 'MODEL');
        const children = scope.scopeItem.items;
        scope.popScope();
        
        const cmd = new Command('generate_horizontal_wires', { count }, children, {});
        scope.push(cmd);
        return '';
      }
    },
    
    "generate_vertical_wires": {
      category: wireMeshCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("Generate Vertical Wires")
              .appendField("count:")
              .appendField(new Blockly.FieldNumber(10, 1, 50), "COUNT");
          this.appendStatementInput("MODEL")
              .setCheck(null)
              .appendField("for model:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshCategory.colour);
        }
      },
      generator: function(block: any) {
        const count = parseInt(block.getFieldValue('COUNT'));
        
        scope.newScope();
        codeGenerator.statementToCode(block, 'MODEL');
        const children = scope.scopeItem.items;
        scope.popScope();
        
        const cmd = new Command('generate_vertical_wires', { count }, children, {});
        scope.push(cmd);
        return '';
      }
    },
    
    "export_wire_csv": {
      category: wireMeshCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("Export Wire CSV")
              .appendField("filename:")
              .appendField(new Blockly.FieldTextInput("wire_mesh"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshCategory.colour);
        }
      },
      generator: function(block: any) {
        const filename = block.getFieldValue('FILENAME');
        const cmd = new Command('export_wire_csv', { filename }, [], {});
        scope.push(cmd);
        return '';
      }
    },
    
    // Visualization 块
    "show_in_viewer": {
      category: visualizationCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("Show in 3D Viewer");
          this.appendStatementInput("OBJECT")
              .setCheck(null)
              .appendField("object:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(visualizationCategory.colour);
        }
      },
      generator: function(block: any) {
        scope.newScope();
        codeGenerator.statementToCode(block, 'OBJECT');
        const children = scope.scopeItem.items;
        scope.popScope();
        
        const cmd = new Command('show_in_viewer', {}, children, {});
        scope.push(cmd);
        return '';
      }
    },
    
    "clear_scene": {
      category: visualizationCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("Clear Scene");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(visualizationCategory.colour);
        }
      },
      generator: function(block: any) {
        const cmd = new Command('clear_scene', {}, [], {});
        scope.push(cmd);
        return '';
      }
    }
  };
  
  // 注册所有块
  Object.entries(blockDefinitions).forEach(([blockId, { category, definition, generator }]) => {
    Blockly.Blocks[blockId] = definition;
    codeGenerator[blockId] = generator;
    
    // 添加到工具箱
    category.contents.push({ kind: "block", type: blockId });
  });
}