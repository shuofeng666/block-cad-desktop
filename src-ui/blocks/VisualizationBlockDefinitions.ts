// src-ui/blocks/VisualizationBlockDefinitions.ts
import * as Blockly from "blockly";
import { Command, scope } from "../core/Scope";

export function getVisualizationBlockDefinitions(codeGenerator: any) {
  return {
    // ===== 可视化块 =====
    "show_in_viewer": {
      category: null,  // 将在 ThreeJSBlocks.ts 中设置
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Show in 3D Viewer");
          this.appendStatementInput("OBJECT")
            .setCheck(null)
            .appendField("object:");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Display the selected object in the 3D viewer");
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

    "clear_scene": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Clear Scene");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Clear all objects from the 3D scene");
        },
      },
      generator: function (block: any) {
        const cmd = new Command("clear_scene", {}, [], {});
        scope.push(cmd);
        return "";
      },
    }
  };
}