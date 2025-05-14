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
/*     "generate_horizontal_wires": {
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
    }, */
    
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
"upload_stl": {
  category: modelCategory,
  definition: {
    init: function() {
      const self = this;
      self.uploadedFile = null;
      
      // 创建按钮
      const button = new Blockly.FieldLabel("Choose File");
      button.EDITABLE = true;
      button.clickHandler_ = function() {
        // 触发文件选择
        if (!self.fileInput) {
          self.fileInput = document.createElement('input');
          self.fileInput.type = 'file';
          self.fileInput.accept = '.stl';
          self.fileInput.style.display = 'none';
          document.body.appendChild(self.fileInput);
          
          self.fileInput.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
              self.uploadedFile = file;
              button.setValue(file.name);
              // 触发工作区更新
              if (self.workspace) {
                self.workspace.fireChangeListener(new Blockly.Events.BlockChange(
                  self, 'field', 'FILE_UPLOAD', 'Choose File', file.name
                ));
              }
            }
          };
        }
        self.fileInput.click();
      };
      
      this.appendDummyInput()
          .appendField("Upload STL")
          .appendField(button, "FILE_UPLOAD");
      
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(modelCategory.colour);
      this.setTooltip("Click to upload an STL file");
    }
  },
  generator: function(block: any) {
    const file = block.uploadedFile;
    if (file) {
      const cmd = new Command('upload_stl', { file }, [], {});
      scope.push(cmd);
    }
    return '';
  }
},
// 在 blockDefinitions 对象中，Wire Mesh 块部分：
"generate_wire_mesh": {
  category: wireMeshCategory,
  definition: {
    init: function() {
      this.appendDummyInput()
          .appendField("Generate Wire Mesh");
      
      this.appendDummyInput()
          .appendField("Horizontal wires:")
          .appendField(new Blockly.FieldNumber(10, 1, 50), "H_COUNT")
          .appendField("Vertical wires:")
          .appendField(new Blockly.FieldNumber(10, 1, 50), "V_COUNT");
      
      this.appendStatementInput("MODEL")
          .setCheck(null)
          .appendField("for model:");
      
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(wireMeshCategory.colour);
    }
  },
  generator: function(block: any) {
    const hCount = parseInt(block.getFieldValue('H_COUNT'));
    const vCount = parseInt(block.getFieldValue('V_COUNT'));
    
    scope.newScope();
    codeGenerator.statementToCode(block, 'MODEL');
    const children = scope.scopeItem.items;
    scope.popScope();
    
    const cmd = new Command('generate_wire_mesh', { hCount, vCount }, children, {});
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