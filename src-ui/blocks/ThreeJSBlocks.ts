// src-ui/blocks/ThreeJSBlocks.ts
import * as Blockly from "blockly";
import { scope } from "../core/Scope";
import { Command } from "../core/Scope";
import { FieldFileUpload } from './FileUploadField';

export function registerThreeJSBlocks(
  codeGenerator: any,
  addToolboxCategory: any
) {
  // 注册工具箱类别
  const modelCategory = addToolboxCategory("3D Model");
  const wireMeshCategory = addToolboxCategory("Wire Mesh");
  const visualizationCategory = addToolboxCategory("Visualization");
  const transformCategory = addToolboxCategory("Transforms");

    // 添加新的层叠激光切割类别
  const stackedLayersCategory = addToolboxCategory("Stacked Layers");

  // 块定义
  const blockDefinitions = {
    // 3D Model 块
    load_stl: {
      category: modelCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Load STL")
            .appendField("file:")
            .appendField(new Blockly.FieldTextInput("default.stl"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(modelCategory.colour);
          this.setTooltip("Load an STL file");
        },
      },
      generator: function (block: any) {
        const filename = block.getFieldValue("FILENAME");
        const cmd = new Command("load_stl", { filename }, [], {});
        scope.push(cmd);
        return "";
      },
    },

    create_cube: {
      category: modelCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Create Cube")
            .appendField("size:")
            .appendField(new Blockly.FieldNumber(50, 1), "SIZE");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(modelCategory.colour);
        },
      },
      generator: function (block: any) {
        const size = parseFloat(block.getFieldValue("SIZE"));
        const cmd = new Command("create_cube", { size }, [], {});
        scope.push(cmd);
        return "";
      },
    },

    // Wire Mesh 块
    "generate_wire_mesh": {
      category: wireMeshCategory,
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
            .appendField(new Blockly.FieldNumber(0.5, 0.1, 5, 0.1), "TUBE_THICKNESS");

          this.appendStatementInput("MODEL")
            .setCheck(null)
            .appendField("for model:");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshCategory.colour);
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
          children.forEach(child => scope.push(child));
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

    export_wire_csv: {
      category: wireMeshCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Export Wire CSV")
            .appendField("filename:")
            .appendField(new Blockly.FieldTextInput("wire_mesh"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(wireMeshCategory.colour);
        },
      },
      generator: function (block: any) {
        const filename = block.getFieldValue("FILENAME");
        const cmd = new Command("export_wire_csv", { filename }, [], {});
        scope.push(cmd);
        return "";
      },
    },

    // Transform 块
    "rotate_model": {
      category: transformCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Rotate Model");
          
          this.appendDummyInput()
            .appendField("X:")
            .appendField(new Blockly.FieldNumber(0, -360, 360), "ROTATE_X")
            .appendField("Y:")
            .appendField(new Blockly.FieldNumber(0, -360, 360), "ROTATE_Y")
            .appendField("Z:")
            .appendField(new Blockly.FieldNumber(0, -360, 360), "ROTATE_Z");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(transformCategory.colour);
        },
      },
      generator: function (block: any) {
        const rotateX = parseFloat(block.getFieldValue("ROTATE_X"));
        const rotateY = parseFloat(block.getFieldValue("ROTATE_Y"));
        const rotateZ = parseFloat(block.getFieldValue("ROTATE_Z"));
        
        const cmd = new Command("rotate_model", { rotateX, rotateY, rotateZ }, [], {});
        scope.push(cmd);
        return "";
      },
    },

        // 添加新的层叠激光切割块
    "generate_stacked_layers": {
      category: stackedLayersCategory,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Generate Stacked Layers");

          this.appendDummyInput()
            .appendField("Material thickness:")
            .appendField(new Blockly.FieldNumber(3, 1, 5, 0.5), "MATERIAL_THICKNESS")
            .appendField("mm");
          
          this.appendDummyInput()
            .appendField("Number of layers:")
            .appendField(new Blockly.FieldNumber(10, 3, 50), "LAYER_COUNT");

          this.appendStatementInput("MODEL")
            .setCheck(null)
            .appendField("for model:");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(stackedLayersCategory.colour);
          this.setTooltip("Generate layers for stacked laser cutting");
        },
      },
      generator: function (block: any) {
        const materialThickness = parseFloat(block.getFieldValue("MATERIAL_THICKNESS"));
        const layerCount = parseInt(block.getFieldValue("LAYER_COUNT"));

        // 首先处理子块（模型）
        scope.newScope();
        codeGenerator.statementToCode(block, "MODEL");
        const children = scope.scopeItem.items;
        scope.popScope();
        
        // 确保子命令先执行
        if (children && children.length > 0) {
          children.forEach(child => scope.push(child));
        }

        // 然后生成层叠切片
        const cmd = new Command(
          "generate_stacked_layers",
          { materialThickness, layerCount },
          [],
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    "export_stacked_layers_svg": {
      category: stackedLayersCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Export Stacked Layers SVG")
            .appendField("filename:")
            .appendField(new Blockly.FieldTextInput("stacked_layer"), "FILENAME");
          
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(stackedLayersCategory.colour);
          this.setTooltip("Export stacked layers as SVG files for laser cutting");
        },
      },
      generator: function (block: any) {
        const filename = block.getFieldValue("FILENAME");
        const cmd = new Command("export_stacked_layers_svg", { filename }, [], {});
        scope.push(cmd);
        return "";
      },
    },

    "scale_model": {
      category: transformCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Scale Model");
          
          this.appendDummyInput()
            .appendField("Scale factor:")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10, 0.1), "SCALE");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(transformCategory.colour);
        },
      },
      generator: function (block: any) {
        const scale = parseFloat(block.getFieldValue("SCALE"));
        
        const cmd = new Command("scale_model", { scale }, [], {});
        scope.push(cmd);
        return "";
      },
    },

    "translate_model": {
      category: transformCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Translate Model");
          
          this.appendDummyInput()
            .appendField("X:")
            .appendField(new Blockly.FieldNumber(0, -1000, 1000), "TRANSLATE_X")
            .appendField("Y:")
            .appendField(new Blockly.FieldNumber(0, -1000, 1000), "TRANSLATE_Y")
            .appendField("Z:")
            .appendField(new Blockly.FieldNumber(0, -1000, 1000), "TRANSLATE_Z");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(transformCategory.colour);
        },
      },
      generator: function (block: any) {
        const translateX = parseFloat(block.getFieldValue("TRANSLATE_X"));
        const translateY = parseFloat(block.getFieldValue("TRANSLATE_Y"));
        const translateZ = parseFloat(block.getFieldValue("TRANSLATE_Z"));
        
        const cmd = new Command("translate_model", { translateX, translateY, translateZ }, [], {});
        scope.push(cmd);
        return "";
      },
    },

    // Visualization 块
    "show_in_viewer": {
      category: visualizationCategory,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Show in 3D Viewer");
          this.appendStatementInput("OBJECT")
            .setCheck(null)
            .appendField("object:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(visualizationCategory.colour);
        },
      },
      generator: function (block: any) {
        // 首先处理子块
        scope.newScope();
        codeGenerator.statementToCode(block, "OBJECT");
        const children = scope.scopeItem.items;
        scope.popScope();
        
        // 确保子命令先执行
        if (children && children.length > 0) {
          children.forEach(child => scope.push(child));
        }

        // 然后显示
        const cmd = new Command("show_in_viewer", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },

    "upload_stl": {
      category: modelCategory,
      definition: {
        init: function() {
          this.appendDummyInput()
              .appendField("上传 STL 文件")
              .appendField(new FieldFileUpload("选择文件"), "FILE_UPLOAD");
          
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(modelCategory.colour);
          this.setTooltip("点击选择要上传的 STL 文件");
        }
      },
      generator: function(block: any) {
        console.log('生成 upload_stl 命令');
        const field = block.getField('FILE_UPLOAD') as FieldFileUpload;
        const file = field.getFile();
        
        if (file) {
          console.log('找到文件:', file.name);
          const cmd = new Command('upload_stl', { file }, [], {});
          scope.push(cmd);
        } else {
          console.log('未找到文件');
        }
        return '';
      }
    },

    clear_scene: {
      category: visualizationCategory,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Clear Scene");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(visualizationCategory.colour);
        },
      },
      generator: function (block: any) {
        const cmd = new Command("clear_scene", {}, [], {});
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