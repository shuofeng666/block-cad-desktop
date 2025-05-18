// src-ui/blocks/ThreeJSBlocks.ts (修改版)
import * as Blockly from "blockly";
import { scope } from "../core/Scope";
import { Command } from "../core/Scope";
import { FieldFileUpload } from "./FileUploadField";
import { getWireMeshBlockDefinitions } from "./WireMeshBlockDefinitions";
import { getStackedLayersBlockDefinitions } from "./StackedLayersBlockDefinitions";
import { getVisualizationBlockDefinitions } from "./VisualizationBlockDefinitions";
import { getProgrammingBlockDefinitions } from "./ProgrammingBlockDefinitions";
import { getTransformBlockDefinitions } from "./TransformBlockDefinitions";
import { getModelBlockDefinitions } from "./ModelBlockDefinitions";

export function registerThreeJSBlocks(
  codeGenerator: any,
  addToolboxCategory: any
) {
  // 注册工具箱类别 - 类别会在 addToolboxCategory 中自动分配颜色
  const modelCategory = addToolboxCategory("3D Model");
  const visualizationCategory = addToolboxCategory("Visualization");
  const transformCategory = addToolboxCategory("Transforms");
  const logicCategory = addToolboxCategory("Programming");
  const stackedLayersCategory = addToolboxCategory("Stacked Layers");
  const wireMeshCategory = addToolboxCategory("Wire Mesh");

  const wireMeshBlocks = getWireMeshBlockDefinitions(codeGenerator);
  const stackedLayersBlocks = getStackedLayersBlockDefinitions(codeGenerator);
  const visualizationBlocks = getVisualizationBlockDefinitions(codeGenerator);
  const programmingBlocks = getProgrammingBlockDefinitions(codeGenerator);
  const transformBlocks = getTransformBlockDefinitions(codeGenerator);
  const modelBlocks = getModelBlockDefinitions(codeGenerator);

  // 块定义
  const blockDefinitions = {
    ...wireMeshBlocks,
    ...stackedLayersBlocks,
    ...visualizationBlocks,
    ...programmingBlocks,
    ...transformBlocks,
    ...modelBlocks,
  };

  // 设置类别和颜色
  function setBlockCategoryAndColor(blockId, category) {
    if (blockDefinitions[blockId]) {
      blockDefinitions[blockId].category = category;
      
      // 修改块的定义，添加颜色设置
      const originalInit = blockDefinitions[blockId].definition.init;
      blockDefinitions[blockId].definition.init = function() {
        originalInit.call(this);
        this.setColour(category.colour);
      };
    }
  }

  // 为每个块设置类别和颜色
  // Wire Mesh 类别
  setBlockCategoryAndColor("generate_wire_mesh", wireMeshCategory);
  setBlockCategoryAndColor("export_wire_csv", wireMeshCategory);
  
  // Wire Mesh Components 类别 - 现在合并到 Wire Mesh 类别中
  setBlockCategoryAndColor("initialize_wire_mesh", wireMeshCategory);
  setBlockCategoryAndColor("add_horizontal_wire", wireMeshCategory);
  setBlockCategoryAndColor("add_vertical_wire", wireMeshCategory);
  setBlockCategoryAndColor("convert_to_tubes", wireMeshCategory);
  setBlockCategoryAndColor("collect_wire_mesh", wireMeshCategory);
  setBlockCategoryAndColor("export_component_wire_csv", wireMeshCategory);

  // Stacked Layers 类别
  setBlockCategoryAndColor("generate_stacked_layers", stackedLayersCategory);
  setBlockCategoryAndColor("export_stacked_layers_svg", stackedLayersCategory);

  // Visualization 类别
  setBlockCategoryAndColor("show_in_viewer", visualizationCategory);
  setBlockCategoryAndColor("clear_scene", visualizationCategory);

  // Programming 类别
  setBlockCategoryAndColor("variable_declaration", logicCategory);
  setBlockCategoryAndColor("for_loop", logicCategory);
  setBlockCategoryAndColor("if_statement", logicCategory);
  setBlockCategoryAndColor("number", logicCategory);
  setBlockCategoryAndColor("math_operation", logicCategory);
  setBlockCategoryAndColor("comparison", logicCategory);
  setBlockCategoryAndColor("variable_get", logicCategory);

  // Transform 类别
  setBlockCategoryAndColor("rotate_model", transformCategory);
  setBlockCategoryAndColor("scale_model", transformCategory);
  setBlockCategoryAndColor("translate_model", transformCategory);

  // Model 类别
  setBlockCategoryAndColor("load_stl", modelCategory);
  setBlockCategoryAndColor("create_cube", modelCategory);
  setBlockCategoryAndColor("upload_stl", modelCategory);

  // 注册所有块
  Object.entries(blockDefinitions).forEach(
    ([blockId, { category, definition, generator }]) => {
      if (category) {
        console.log(`注册块: ${blockId} 到类别: ${category.name}, 颜色: ${category.colour}`);
        Blockly.Blocks[blockId] = definition;
        codeGenerator[blockId] = generator;
        category.contents.push({ kind: "block", type: blockId });
      } else {
        console.warn(`警告: 块 ${blockId} 没有设置类别`);
      }
    }
  );
}