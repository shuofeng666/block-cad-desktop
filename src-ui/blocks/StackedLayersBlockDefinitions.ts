// src-ui/blocks/StackedLayersBlockDefinitions.ts
import * as Blockly from "blockly";
import { Command, scope } from "../core/Scope";

export function getStackedLayersBlockDefinitions(codeGenerator: any) {
  return {
    // ===== 层叠激光切割块 =====
    "generate_stacked_layers": {
      category: null,  // 将在 ThreeJSBlocks.ts 中设置
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

    "export_stacked_layers_svg": {
      category: null,
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
    }
  };
}