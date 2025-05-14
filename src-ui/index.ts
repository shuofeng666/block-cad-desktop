import Split from "split.js";
import { Toolbar } from "./widgets/Toolbar";
import { GLViewer } from "./gl/GLViewer";
import "./app.css";
import { BlocklyEditor } from "./BlockEditor";
import DarkTheme from "@blockly/theme-dark";
import {
  getBlocks,
  getToolbox,
  getCodeGenerator,
  load_blocks,
  addToolboxCatogery,
} from "./jscad/blocks";
import {
  renderAction,
  initAction,
  saveAsFileAction,
  openFileAction,
  exportFile,
  saveFileAction,
  newFile,
} from "./actions";
import { ThreeJSCommandProcessor } from "./threejs/ThreeJSCommandProcessor";
import { registerThreeJSBlocks } from "./blocks/ThreeJSBlocks";
import { scope } from "./jscad/Scope"; // 需要添加这个导入
import { statusBar } from "./widgets/Statusbar"; // 需要添加这个导入

// 首先加载块定义
load_blocks();

// 创建区域和编辑器
var blockEditor = new BlocklyEditor(
  getBlocks(),
  getToolbox(),
  getCodeGenerator(),
  DarkTheme,
  document.getElementById("block-area") as HTMLDivElement
);

// 分割面板
Split([".left", ".right"], {
  sizes: [50, 50],
  gutterSize: 3,
  onDrag: function (sizes) {
    resizeAll();
  },
});

// 创建工具栏
var t1 = document.getElementById("toolbar");
var toolbar: Toolbar;
if (t1) {
  toolbar = new Toolbar(t1, function handleAction(cmd) {
    console.log(cmd);

    if (cmd == "render") {
      // 使用新的渲染逻辑
      (async () => {
        try {
          scope.reset();
          blockEditor.generateCode();

          for (const command of scope.scopeItem.items) {
            await threeJSProcessor.processCommand(command);
          }

          statusBar.setStatus(`Render completed`, "info", 0);
        } catch (error) {
          console.error("Error during rendering:", error);
          statusBar.setStatus(`Error: ${error.message}`, "error", 0);
        }
      })();
    } else if (cmd == "saveas") {
      saveAsFileAction(blockEditor.getBlocklyCode());
    } else if (cmd == "open") {
      openFileAction(function (code) {
        blockEditor.setBlocklyCode(code);
      });
    } else if (cmd == "new") {
      blockEditor.resetEditor();
      newFile();
    } else if (cmd == "export") {
      exportFile();
    } else if (cmd == "save") {
      saveFileAction(blockEditor.getBlocklyCode());
    } else if (cmd == "wire_mesh_example") {
      const exampleCode = {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: "upload_stl",
              fields: {
                FILE_UPLOAD: "default.stl",
              },
              next: {
                block: {
                  type: "generate_wire_mesh",
                  fields: {
                    H_COUNT: "10",
                    V_COUNT: "10",
                  },
                  next: {
                    block: {
                      type: "show_in_viewer",
                    },
                  },
                },
              },
            },
          ],
        },
      };
      blockEditor.setBlocklyCode(JSON.stringify(exampleCode));
    }
  });

  // 添加工具栏按钮
  toolbar.addIcon(
    "new",
    `<span class="material-symbols-outlined">note_add</span>`,
    "New Drawing"
  );
  toolbar.addIcon(
    "open",
    `<span class="material-symbols-outlined">folder_open</span>`,
    "Open Drawing"
  );
  toolbar.addIcon(
    "save",
    `<span class="material-symbols-outlined">save</span>`,
    "Save Drawing"
  );
  toolbar.addIcon(
    "saveas",
    `<span class="material-symbols-outlined">save_as</span>`,
    "Save As Drawing"
  );
  toolbar.addIcon(
    "render",
    `<span class="material-symbols-outlined">play_arrow</span>`,
    "Render Drawing"
  );
  toolbar.addIcon(
    "export",
    `<span class="material-symbols-outlined">upgrade</span>`,
    "Export to STL or OBJ"
  );

  // 添加 Wire Mesh 示例按钮
  toolbar.addIcon(
    "wire_mesh_example",
    `<span class="material-symbols-outlined">grid_3x3</span>`,
    "Wire Mesh Example"
  );
}

// 创建 3D 查看器
var t2 = document.getElementById("viewer") as HTMLDivElement;
var glViewer: GLViewer;
if (t2) {
  glViewer = new GLViewer(t2);
}

// 注册 Three.js 块（在创建 GLViewer 之后）
registerThreeJSBlocks(getCodeGenerator(), addToolboxCatogery);

// 创建 Three.js 处理器（必须在 GLViewer 之后创建）
const threeJSProcessor = new ThreeJSCommandProcessor(glViewer);

// 窗口调整大小处理
function resizeAll() {
  if (glViewer) glViewer.resize();
  if (blockEditor) blockEditor.resizeEditor();
}
window.addEventListener("resize", resizeAll, false);
resizeAll();

// 初始化动作
initAction(blockEditor, glViewer);
