import Split from "split.js";
import { Toolbar } from "./components/Toolbar";
import { GLViewer } from "./threejs/GLViewer";
import "./styles/app.css";
import { BlocklyEditor } from "./core/BlockEditor";
import LightTheme from "./styles/theme-light";
import {
  getBlocks,
  getToolbox,
  getCodeGenerator,
  load_blocks,
  addToolboxCatogery,
} from "./blocks/blocks";
import {
  renderAction,
  initAction,
  saveAsFileAction,
  openFileAction,
  exportFile,
  saveFileAction,
  newFile,
} from "./core/actions";
import { ThreeJSCommandProcessor } from "./threejs/ThreeJSCommandProcessor";
import { registerThreeJSBlocks } from "./blocks/ThreeJSBlocks";
import { scope } from "./core/Scope";
import { statusBar } from "./components/Statusbar";

// 首先加载块定义
load_blocks();

// 创建区域和编辑器
var blockEditor = new BlocklyEditor(
  getBlocks(),
  getToolbox(),
  getCodeGenerator(),
  LightTheme,
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
          // 首先清空场景
          glViewer.clearScene();
           threeJSProcessor.clearState();
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
    } else if (cmd == "export_csv") {
      // 导出 Wire Mesh CSV
      (async () => {
        try {
          const wireMesh = scope.context["_wireMesh"];
          if (!wireMesh) {
            statusBar.setStatus("No wire mesh found. Please generate a wire mesh first.", "warn", 0);
            return;
          }

          const filename = prompt("Enter filename for CSV export:", "wire_mesh") || "wire_mesh";
          
          // 使用 ThreeJSProcessor 的导出功能
          await threeJSProcessor.processCommand({
            id: "export_wire_csv",
            args: { filename }
          });

          statusBar.setStatus(`Wire mesh exported to ${filename}_*.csv`, "info", 0);
        } catch (error) {
          console.error("Error exporting CSV:", error);
          statusBar.setStatus(`Error: ${error.message}`, "error", 0);
        }
      })();
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
                  type: "rotate_model",
                  fields: {
                    ROTATE_X: "45",
                    ROTATE_Y: "0",
                    ROTATE_Z: "0",
                  },
                  next: {
                    block: {
                      type: "scale_model",
                      fields: {
                        SCALE: "1.5",
                      },
                      next: {
                        block: {
                          type: "generate_wire_mesh",
                          fields: {
                            H_COUNT: "10",
                            V_COUNT: "10",
                            USE_TUBES: "TRUE",
                            TUBE_THICKNESS: "1",
                          },
                          next: {
                            block: {
                              type: "show_in_viewer",
                              next: {
                                block: {
                                  type: "export_wire_csv",
                                  fields: {
                                    FILENAME: "wire_mesh_example",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
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
  toolbar.addIcon(
    "export_csv",
    `<span class="material-symbols-outlined">table_view</span>`,
    "Export Wire Mesh to CSV"
  );

  // 添加 Wire Mesh 示例按钮
  toolbar.addIcon(
    "wire_mesh_example",
    `<span class="material-symbols-outlined">grid_3x3</span>`,
    "Wire Mesh Example with Transforms"
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