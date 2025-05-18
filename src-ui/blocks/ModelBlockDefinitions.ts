// src-ui/blocks/ModelBlockDefinitions.ts
import * as Blockly from "blockly";
import { Command, scope } from "../core/Scope";
import { FieldFileUpload } from "./FileUploadField";

export function getModelBlockDefinitions(codeGenerator: any) {
  return {
    // ===== 3D 模型块 =====
    "load_stl": {
      category: null,  // 将在 ThreeJSBlocks.ts 中设置
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Load STL")
            .appendField("file:")
            .appendField(new Blockly.FieldTextInput("default.stl"), "FILENAME");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
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

    "create_cube": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Create Cube")
            .appendField("size:")
            .appendField(new Blockly.FieldNumber(50, 1), "SIZE");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Create a cube with specified size");
        },
      },
      generator: function (block: any) {
        const size = parseFloat(block.getFieldValue("SIZE"));
        const cmd = new Command("create_cube", { size }, [], {});
        scope.push(cmd);
        return "";
      },
    },

    "upload_stl": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("上传 STL 文件")
            .appendField(new FieldFileUpload("选择文件"), "FILE_UPLOAD");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
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
    }
  };
}