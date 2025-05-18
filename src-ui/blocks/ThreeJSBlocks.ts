// src-ui/blocks/ThreeJSBlocks.ts
import * as Blockly from "blockly";
import { scope } from "../core/Scope";
import { Command } from "../core/Scope";
import { FieldFileUpload } from "./FileUploadField";
import { getWireMeshBlockDefinitions } from "./WireMeshBlockDefinitions";

export function registerThreeJSBlocks(
  codeGenerator: any,
  addToolboxCategory: any
) {
  // 注册工具箱类别
  const modelCategory = addToolboxCategory("3D Model");
  const wireMeshCategory = addToolboxCategory("Wire Mesh");
  const visualizationCategory = addToolboxCategory("Visualization");
  const transformCategory = addToolboxCategory("Transforms");
  const logicCategory = addToolboxCategory("Programming");
  const wireMeshComponentsCategory = addToolboxCategory("Wire Mesh Components");

  // 添加新的层叠激光切割类别
  const stackedLayersCategory = addToolboxCategory("Stacked Layers");
const wireMeshBlocks = getWireMeshBlockDefinitions(codeGenerator);
  // 块定义
  const blockDefinitions = {
 ...wireMeshBlocks,

     
     
     
    variable_declaration: {
      category: logicCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Set Variable")
            .appendField(new Blockly.FieldTextInput("varName"), "VAR_NAME")
            .appendField("to");
          this.appendValueInput("VALUE").setCheck(null);
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(logicCategory.colour);
          this.setTooltip("Declare a variable with a specified value");
        },
      },
      generator: function (block: any) {
        const varName = block.getFieldValue("VAR_NAME");
        const value = codeGenerator.valueToCode(block, "VALUE", 0) || "0";

        const cmd = new Command(
          "variable_declaration",
          { varName, value },
          [],
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    for_loop: {
      category: logicCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("For")
            .appendField(new Blockly.FieldTextInput("i"), "VAR_NAME")
            .appendField("from")
            .appendField(new Blockly.FieldNumber(0), "FROM")
            .appendField("to")
            .appendField(new Blockly.FieldNumber(10), "TO")
            .appendField("step")
            .appendField(new Blockly.FieldNumber(1), "STEP");
          this.appendStatementInput("DO").setCheck(null).appendField("Do");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(logicCategory.colour);
          this.setTooltip(
            "Execute a block of code for a specified number of iterations"
          );
        },
      },
      generator: function (block: any) {
        const varName = block.getFieldValue("VAR_NAME");
        const from = parseFloat(block.getFieldValue("FROM"));
        const to = parseFloat(block.getFieldValue("TO"));
        const step = parseFloat(block.getFieldValue("STEP"));

        // Handle the statements inside the loop
        scope.newScope();
        codeGenerator.statementToCode(block, "DO");
        const children = scope.scopeItem.items;
        scope.popScope();

        const cmd = new Command(
          "for_loop",
          { varName, from, to, step },
          children,
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    if_statement: {
      category: logicCategory,
      definition: {
        init: function () {
          this.appendValueInput("CONDITION")
            .setCheck("Boolean")
            .appendField("If");
          this.appendStatementInput("DO").setCheck(null).appendField("Then");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(logicCategory.colour);
          this.setTooltip("Execute a block of code if the condition is true");
        },
      },
      generator: function (block: any) {
        const condition =
          codeGenerator.valueToCode(block, "CONDITION", 0) || "false";

        // Handle the statements inside the if block
        scope.newScope();
        codeGenerator.statementToCode(block, "DO");
        const children = scope.scopeItem.items;
        scope.popScope();

        const cmd = new Command("if_statement", { condition }, children, {});
        scope.push(cmd);
        return "";
      },
    },

    number: {
      category: logicCategory,
      definition: {
        init: function () {
          this.appendDummyInput().appendField(
            new Blockly.FieldNumber(0),
            "NUM"
          );
          this.setOutput(true, "Number");
          this.setColour(logicCategory.colour);
          this.setTooltip("A number value");
        },
      },
      generator: function (block: any) {
        const number = parseFloat(block.getFieldValue("NUM"));
        return [number.toString(), 0];
      },
    },

    math_operation: {
      category: logicCategory,
      definition: {
        init: function () {
          this.appendValueInput("A").setCheck("Number");
          this.appendDummyInput().appendField(
            new Blockly.FieldDropdown([
              ["+", "ADD"],
              ["-", "SUBTRACT"],
              ["×", "MULTIPLY"],
              ["÷", "DIVIDE"],
            ]),
            "OP"
          );
          this.appendValueInput("B").setCheck("Number");
          this.setOutput(true, "Number");
          this.setColour(logicCategory.colour);
          this.setTooltip("Perform a mathematical operation on two numbers");
        },
      },
      generator: function (block: any) {
        const a = codeGenerator.valueToCode(block, "A", 0) || "0";
        const b = codeGenerator.valueToCode(block, "B", 0) || "0";
        const op = block.getFieldValue("OP");

        let code = "";
        switch (op) {
          case "ADD":
            code = `(${a} + ${b})`;
            break;
          case "SUBTRACT":
            code = `(${a} - ${b})`;
            break;
          case "MULTIPLY":
            code = `(${a} * ${b})`;
            break;
          case "DIVIDE":
            code = `(${a} / ${b})`;
            break;
        }

        return [code, 0];
      },
    },

    comparison: {
      category: logicCategory,
      definition: {
        init: function () {
          this.appendValueInput("A").setCheck("Number");
          this.appendDummyInput().appendField(
            new Blockly.FieldDropdown([
              ["=", "EQ"],
              ["≠", "NEQ"],
              [">", "GT"],
              ["<", "LT"],
              ["≥", "GTE"],
              ["≤", "LTE"],
            ]),
            "OP"
          );
          this.appendValueInput("B").setCheck("Number");
          this.setOutput(true, "Boolean");
          this.setColour(logicCategory.colour);
          this.setTooltip("Compare two numbers and return a boolean result");
        },
      },
      generator: function (block: any) {
        const a = codeGenerator.valueToCode(block, "A", 0) || "0";
        const b = codeGenerator.valueToCode(block, "B", 0) || "0";
        const op = block.getFieldValue("OP");

        let code = "";
        switch (op) {
          case "EQ":
            code = `(${a} == ${b})`;
            break;
          case "NEQ":
            code = `(${a} != ${b})`;
            break;
          case "GT":
            code = `(${a} > ${b})`;
            break;
          case "LT":
            code = `(${a} < ${b})`;
            break;
          case "GTE":
            code = `(${a} >= ${b})`;
            break;
          case "LTE":
            code = `(${a} <= ${b})`;
            break;
        }

        return [code, 0];
      },
    },

    variable_get: {
      category: logicCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Get Variable")
            .appendField(new Blockly.FieldTextInput("varName"), "VAR_NAME");
          this.setOutput(true, null);
          this.setColour(logicCategory.colour);
          this.setTooltip("Get the value of a variable");
        },
      },
      generator: function (block: any) {
        const varName = block.getFieldValue("VAR_NAME");
        return [varName, 0];
      },
    },
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

   
    

    // Transform 块
    rotate_model: {
      category: transformCategory,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Rotate Model");

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

        const cmd = new Command(
          "rotate_model",
          { rotateX, rotateY, rotateZ },
          [],
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    // 添加新的层叠激光切割块
generate_stacked_layers: {
  category: stackedLayersCategory,
  definition: {
    init: function () {
      this.appendDummyInput().appendField("Generate Stacked Layers");

      this.appendDummyInput()
        .appendField("Material thickness:")
        .appendField(
          new Blockly.FieldNumber(3, 1, 5, 0.5),
          "MATERIAL_THICKNESS"
        )
        .appendField("mm");

      // 移除层数控制

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
    const materialThickness = parseFloat(
      block.getFieldValue("MATERIAL_THICKNESS")
    );
    // 不再获取层数

    // 首先处理子块（模型）
    scope.newScope();
    codeGenerator.statementToCode(block, "MODEL");
    const children = scope.scopeItem.items;
    scope.popScope();

    // 确保子命令先执行
    if (children && children.length > 0) {
      children.forEach((child) => scope.push(child));
    }

    // 然后生成层叠切片
    const cmd = new Command(
      "generate_stacked_layers",
      { materialThickness }, // 不再传递layerCount
      [],
      {}
    );
    scope.push(cmd);
    return "";
  },
},

    export_stacked_layers_svg: {
      category: stackedLayersCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Export Stacked Layers SVG")
            .appendField("filename:")
            .appendField(
              new Blockly.FieldTextInput("stacked_layer"),
              "FILENAME"
            );

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(stackedLayersCategory.colour);
          this.setTooltip(
            "Export stacked layers as SVG files for laser cutting"
          );
        },
      },
      generator: function (block: any) {
        const filename = block.getFieldValue("FILENAME");
        const cmd = new Command(
          "export_stacked_layers_svg",
          { filename },
          [],
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    scale_model: {
      category: transformCategory,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Scale Model");

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

    translate_model: {
      category: transformCategory,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Translate Model");

          this.appendDummyInput()
            .appendField("X:")
            .appendField(new Blockly.FieldNumber(0, -1000, 1000), "TRANSLATE_X")
            .appendField("Y:")
            .appendField(new Blockly.FieldNumber(0, -1000, 1000), "TRANSLATE_Y")
            .appendField("Z:")
            .appendField(
              new Blockly.FieldNumber(0, -1000, 1000),
              "TRANSLATE_Z"
            );

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(transformCategory.colour);
        },
      },
      generator: function (block: any) {
        const translateX = parseFloat(block.getFieldValue("TRANSLATE_X"));
        const translateY = parseFloat(block.getFieldValue("TRANSLATE_Y"));
        const translateZ = parseFloat(block.getFieldValue("TRANSLATE_Z"));

        const cmd = new Command(
          "translate_model",
          { translateX, translateY, translateZ },
          [],
          {}
        );
        scope.push(cmd);
        return "";
      },
    },

    // Visualization 块
    show_in_viewer: {
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
          children.forEach((child) => scope.push(child));
        }

        // 然后显示
        const cmd = new Command("show_in_viewer", {}, [], {});
        scope.push(cmd);
        return "";
      },
    },

    upload_stl: {
      category: modelCategory,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("上传 STL 文件")
            .appendField(new FieldFileUpload("选择文件"), "FILE_UPLOAD");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(modelCategory.colour);
          this.setTooltip("点击选择要上传的 STL 文件");
        },
      },
      generator: function (block: any) {
        console.log("生成 upload_stl 命令");
        const field = block.getField("FILE_UPLOAD") as FieldFileUpload;
        const file = field.getFile();

        if (file) {
          console.log("找到文件:", file.name);
          const cmd = new Command("upload_stl", { file }, [], {});
          scope.push(cmd);
        } else {
          console.log("未找到文件");
        }
        return "";
      },
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

  blockDefinitions["generate_wire_mesh"].category = wireMeshCategory;
blockDefinitions["export_wire_csv"].category = wireMeshCategory;
blockDefinitions["initialize_wire_mesh"].category = wireMeshComponentsCategory;
blockDefinitions["add_horizontal_wire"].category = wireMeshComponentsCategory;
blockDefinitions["add_vertical_wire"].category = wireMeshComponentsCategory;
blockDefinitions["convert_to_tubes"].category = wireMeshComponentsCategory;
blockDefinitions["collect_wire_mesh"].category = wireMeshComponentsCategory;
blockDefinitions["export_component_wire_csv"].category = wireMeshComponentsCategory;

  // 注册所有块
 Object.entries(blockDefinitions).forEach(
  ([blockId, { category, definition, generator }]) => {
    // 添加 null 检查
    if (category) {
      console.log(`注册块: ${blockId} 到类别: ${category.name}`);
      Blockly.Blocks[blockId] = definition;
      codeGenerator[blockId] = generator;

      // 添加到工具箱
      category.contents.push({ kind: "block", type: blockId });
    } else {
      console.warn(`警告: 块 ${blockId} 没有设置类别`);
    }
  }
);
}
