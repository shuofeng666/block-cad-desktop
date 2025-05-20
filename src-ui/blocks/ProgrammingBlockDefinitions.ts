// src-ui/blocks/ProgrammingBlockDefinitions.ts
import * as Blockly from "blockly";
import { Command, scope } from "../core/Scope";

export function getProgrammingBlockDefinitions(codeGenerator: any) {
  return {
    // ===== 编程逻辑块 =====
    "variable_declaration": {
      category: null,  // 将在 ThreeJSBlocks.ts 中设置
      definition: {
        init: function () {
          this.appendDummyInput()
            .appendField("Set Variable")
            .appendField(new Blockly.FieldTextInput("varName"), "VAR_NAME")
            .appendField("to");
          this.appendValueInput("VALUE").setCheck(null);
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
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

    "for_loop": {
      category: null,
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

    "if_statement": {
      category: null,
      definition: {
        init: function () {
          this.appendValueInput("CONDITION")
            .setCheck("Boolean")
            .appendField("If");
          this.appendStatementInput("DO").setCheck(null).appendField("Then");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
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

    "number": {
      category: null,
      definition: {
        init: function () {
          this.appendDummyInput().appendField(
            new Blockly.FieldNumber(0),
            "NUM"
          );
          this.setOutput(true, "Number");
          this.setTooltip("A number value");
        },
      },
      generator: function (block: any) {
        const number = parseFloat(block.getFieldValue("NUM"));
        return [number.toString(), 0];
      },
    },

    "math_operation": {
      category: null,
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

    "comparison": {
      category: null,
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

"variable_get": {
  category: null,
  definition: {
    init: function () {
      this.appendDummyInput()
        .appendField("Get Variable")
        .appendField(new Blockly.FieldTextInput("varName"), "VAR_NAME");
      this.setOutput(true, null);  // 设置为输出块
      // 不应该有前置或后置连接
      // this.setPreviousStatement(true, null);
      // this.setNextStatement(true, null);
      this.setTooltip("Get the value of a variable");
    },
  },
  generator: function (block: any) {
    const varName = block.getFieldValue("VAR_NAME");
    return [varName, 0];  // 注意值块需要返回数组格式 [value, precedence]
      },
    }
  };
}