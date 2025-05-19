// src-ui/threejs/commands/ProgrammingCommands.ts
import { scope } from "../../core/Scope";
import { ThreeJSCommandProcessor } from "../ThreeJSCommandProcessor";

export class ProgrammingCommands {
  private processor: ThreeJSCommandProcessor;

  constructor(processor: ThreeJSCommandProcessor) {
    this.processor = processor;
  }

  /**
   * 处理变量声明命令
   */
  public handleVariableDeclaration(cmd: any): null {
    const { varName, value } = cmd.args;

    // 尝试解析值（数字、表达式或字符串）
    let parsedValue;

    try {
      // 先检查是否是简单数字
      parsedValue = parseFloat(value);

      // 如果是NaN，尝试将其作为表达式计算
      if (isNaN(parsedValue)) {
        // 处理包含变量的简单表达式
        if (
          value.includes("+") ||
          value.includes("-") ||
          value.includes("*") ||
          value.includes("/")
        ) {
          // 用变量值替换表达式中的变量名
          let processedExpression = value;
          for (const key in scope.context) {
            if (processedExpression.includes(key)) {
              processedExpression = processedExpression.replace(
                new RegExp(key, "g"),
                scope.context[key]
              );
            }
          }

          // 计算表达式
          parsedValue = eval(processedExpression);
        } else {
          // 不是数字或表达式，作为字符串使用
          parsedValue = value;
        }
      }
    } catch (e) {
      console.error(
        `[handleVariableDeclaration] Error parsing value: ${value}`,
        e
      );
      parsedValue = value; // 出错时使用原始值
    }

    // 将变量存储在作用域上下文中
    scope.setVar(varName, parsedValue);
    console.log(
      `[handleVariableDeclaration] Set variable ${varName} = ${parsedValue} (original value: ${value})`
    );

    return null;
  }

  /**
   * 处理for循环命令
   */
  public async handleForLoop(cmd: any): Promise<any> {
    const { varName, from, to, step } = cmd.args;
    let result = null;

    console.log(
      `[handleForLoop] Starting loop: ${varName} from ${from} to ${to} step ${step}`
    );

    // 执行循环
    for (let i = from; i < to; i += step) {
      // 为每次迭代设置循环变量
      scope.setVar(varName, i);
      console.log(`[handleForLoop] Iteration ${varName} = ${i}`);

      // 执行所有子命令
      if (cmd.children && cmd.children.length > 0) {
        for (const child of cmd.children) {
          const childResult = await this.processor.processCommand(child);
          if (childResult !== null) {
            result = childResult;
          }
        }
      }
    }

    return result;
  }

  /**
   * 处理if条件语句命令
   */
  public async handleIfStatement(cmd: any): Promise<any> {
    const { condition } = cmd.args;

    // 评估条件
    let conditionMet = false;
    try {
      // 这是一个简化的方法 - 在实际环境中，
      // 你可能需要一个更健壮的方式来评估表达式
      conditionMet = eval(condition);
    } catch (e) {
      console.error(
        `[handleIfStatement] Error evaluating condition: ${condition}`,
        e
      );
      return null;
    }

    console.log(
      `[handleIfStatement] Condition: ${condition}, Result: ${conditionMet}`
    );

    if (conditionMet) {
      let result = null;

      // 执行所有子命令
      if (cmd.children && cmd.children.length > 0) {
        for (const child of cmd.children) {
          const childResult = await this.processor.processCommand(child);
          if (childResult !== null) {
            result = childResult;
          }
        }
      }

      return result;
    }

    return null;
  }
}