// src-ui/blocks/ThreeJSBlocks.ts
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
  // 注册工具箱类别
  const modelCategory = addToolboxCategory("3D Model");
  const wireMeshCategory = addToolboxCategory("Wire Mesh");
  const visualizationCategory = addToolboxCategory("Visualization");
  const transformCategory = addToolboxCategory("Transforms");
  const logicCategory = addToolboxCategory("Programming");
  const wireMeshComponentsCategory = addToolboxCategory("Wire Mesh Components");
  const stackedLayersCategory = addToolboxCategory("Stacked Layers");

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

  blockDefinitions["generate_wire_mesh"].category = wireMeshCategory;
  blockDefinitions["export_wire_csv"].category = wireMeshCategory;
  blockDefinitions["initialize_wire_mesh"].category =
    wireMeshComponentsCategory;
  blockDefinitions["add_horizontal_wire"].category = wireMeshComponentsCategory;
  blockDefinitions["add_vertical_wire"].category = wireMeshComponentsCategory;
  blockDefinitions["convert_to_tubes"].category = wireMeshComponentsCategory;
  blockDefinitions["collect_wire_mesh"].category = wireMeshComponentsCategory;
  blockDefinitions["export_component_wire_csv"].category =
    wireMeshComponentsCategory;

  // 设置 Stacked Layers 块的类别
  blockDefinitions["generate_stacked_layers"].category = stackedLayersCategory;
  blockDefinitions["export_stacked_layers_svg"].category =
    stackedLayersCategory;

  // 设置 Visualization 块的类别
  blockDefinitions["show_in_viewer"].category = visualizationCategory;
  blockDefinitions["clear_scene"].category = visualizationCategory;

  // Programming 类别设置
  blockDefinitions["variable_declaration"].category = logicCategory;
  blockDefinitions["for_loop"].category = logicCategory;
  blockDefinitions["if_statement"].category = logicCategory;
  blockDefinitions["number"].category = logicCategory;
  blockDefinitions["math_operation"].category = logicCategory;
  blockDefinitions["comparison"].category = logicCategory;
  blockDefinitions["variable_get"].category = logicCategory;

  // Transform 类别设置
  blockDefinitions["rotate_model"].category = transformCategory;
  blockDefinitions["scale_model"].category = transformCategory;
  blockDefinitions["translate_model"].category = transformCategory;

    // Model 类别设置
  blockDefinitions["load_stl"].category = modelCategory;
  blockDefinitions["create_cube"].category = modelCategory;
  blockDefinitions["upload_stl"].category = modelCategory;


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
