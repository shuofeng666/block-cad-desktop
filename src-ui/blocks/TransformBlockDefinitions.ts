// src-ui/blocks/TransformBlockDefinitions.ts
import * as Blockly from "blockly";
import { Command, scope } from "../core/Scope";

export function getTransformBlockDefinitions(codeGenerator: any) {
  return {
    // ===== 变换块 =====
    "rotate_model": {
      category: null,  // 将在 ThreeJSBlocks.ts 中设置
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
          this.setTooltip("Rotate the model around X, Y, and Z axes");
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

    "scale_model": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput().appendField("Scale Model");

          this.appendDummyInput()
            .appendField("Scale factor:")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10, 0.1), "SCALE");

          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setTooltip("Scale the model by a factor");
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
      category: null,
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
          this.setTooltip("Move the model along X, Y, and Z axes");
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
    }
  };
}