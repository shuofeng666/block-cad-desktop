// src-ui/index.ts
import Split from "split.js";
import { ControlPanel } from "./components/ControlPanel";
import "./components/control-panel.css";
import { Toolbar } from "./components/Toolbar";
import { GLViewer } from "./threejs/GLViewer";
import "./styles/app.css";
import { BlocklyEditor } from "./core/BlockEditor";
import LightTheme from "./styles/theme-light";
//import { registerWireMeshComponentBlocks } from "./blocks/WireMeshComponentBlocks";
//import { registerLogicBlocks } from "./blocks/LogicBlocks";
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
// 替换现有的 Split 配置
Split([".left", ".right"], {
  sizes: [40, 60],
  gutterSize: 5,
  minSize: [200, 300], // 添加最小尺寸限制
  onDrag: function () {
    // 延迟调用 resizeAll，防止过于频繁导致性能问题
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeAll, 100);
  },
});

let resizeTimeout: any = null;

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
            statusBar.setStatus(
              "No wire mesh found. Please generate a wire mesh first.",
              "warn",
              0
            );
            return;
          }

          const filename =
            prompt("Enter filename for CSV export:", "wire_mesh") ||
            "wire_mesh";

          // 使用 ThreeJSProcessor 的导出功能
          await threeJSProcessor.processCommand({
            id: "export_wire_csv",
            args: { filename },
          });

          statusBar.setStatus(
            `Wire mesh exported to ${filename}_*.csv`,
            "info",
            0
          );
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
    } else if (cmd == "component_wire_mesh_example") {
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
                  type: "initialize_wire_mesh",
                  next: {
                    block: {
                      type: "add_horizontal_wire",
                      fields: {
                        POSITION: "10",
                        THICKNESS: "0.5",
                        COLOR: "#ff0000",
                      },
                      next: {
                        block: {
                          type: "add_horizontal_wire",
                          fields: {
                            POSITION: "20",
                            THICKNESS: "0.5",
                            COLOR: "#ff0000",
                          },
                          next: {
                            block: {
                              type: "add_vertical_wire",
                              fields: {
                                POSITION: "15",
                                THICKNESS: "0.5",
                                COLOR: "#00ff00",
                              },
                              next: {
                                block: {
                                  type: "convert_to_tubes",
                                  fields: {
                                    THICKNESS: "0.8",
                                  },
                                  next: {
                                    block: {
                                      type: "collect_wire_mesh",
                                      next: {
                                        block: {
                                          type: "show_in_viewer",
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
                },
              },
            },
          ],
        },
      };
      blockEditor.setBlocklyCode(JSON.stringify(exampleCode));
    }
    // 添加层叠切片示例
    else if (cmd == "stacked_layers_example") {
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
                    ROTATE_X: "0",
                    ROTATE_Y: "0",
                    ROTATE_Z: "0",
                  },
                  next: {
                    block: {
                      type: "generate_stacked_layers",
                      fields: {
                        MATERIAL_THICKNESS: "3",
                        // 移除 LAYER_COUNT 字段
                      },
                      inputs: {
                        MODEL: {
                          block: {
                            type: "create_cube",
                            fields: {
                              SIZE: "50",
                            },
                          },
                        },
                      },
                      next: {
                        block: {
                          type: "show_in_viewer",
                          next: {
                            block: {
                              type: "export_stacked_layers_svg",
                              fields: {
                                FILENAME: "stacked_layer_example",
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
      statusBar.setStatus(
        `Loaded Stacked Layers example. Click "Render" to see the result.`,
        "info",
        0
      );
    } else if (cmd == "programmatic_wire_mesh_example") {
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
                  type: "variable_declaration",
                  fields: {
                    VAR_NAME: "horizWireCount",
                  },
                  inputs: {
                    VALUE: {
                      block: {
                        type: "number",
                        fields: {
                          NUM: 10,
                        },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: "variable_declaration",
                      fields: {
                        VAR_NAME: "vertWireCount",
                      },
                      inputs: {
                        VALUE: {
                          block: {
                            type: "number",
                            fields: {
                              NUM: 8,
                            },
                          },
                        },
                      },
                      next: {
                        block: {
                          type: "variable_declaration",
                          fields: {
                            VAR_NAME: "modelHeight",
                          },
                          inputs: {
                            VALUE: {
                              block: {
                                type: "number",
                                fields: {
                                  NUM: 100,
                                },
                              },
                            },
                          },
                          next: {
                            block: {
                              type: "variable_declaration",
                              fields: {
                                VAR_NAME: "modelWidth",
                              },
                              inputs: {
                                VALUE: {
                                  block: {
                                    type: "number",
                                    fields: {
                                      NUM: 100,
                                    },
                                  },
                                },
                              },
                              next: {
                                block: {
                                  type: "variable_declaration",
                                  fields: {
                                    VAR_NAME: "horizSpacing",
                                  },
                                  inputs: {
                                    VALUE: {
                                      block: {
                                        type: "math_operation",
                                        fields: {
                                          OP: "DIVIDE",
                                        },
                                        inputs: {
                                          A: {
                                            block: {
                                              type: "variable_get",
                                              fields: {
                                                VAR_NAME: "modelHeight",
                                              },
                                            },
                                          },
                                          B: {
                                            block: {
                                              type: "math_operation",
                                              fields: {
                                                OP: "SUBTRACT",
                                              },
                                              inputs: {
                                                A: {
                                                  block: {
                                                    type: "variable_get",
                                                    fields: {
                                                      VAR_NAME:
                                                        "horizWireCount",
                                                    },
                                                  },
                                                },
                                                B: {
                                                  block: {
                                                    type: "number",
                                                    fields: {
                                                      NUM: 1,
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
                                  next: {
                                    block: {
                                      type: "variable_declaration",
                                      fields: {
                                        VAR_NAME: "vertSpacing",
                                      },
                                      inputs: {
                                        VALUE: {
                                          block: {
                                            type: "math_operation",
                                            fields: {
                                              OP: "DIVIDE",
                                            },
                                            inputs: {
                                              A: {
                                                block: {
                                                  type: "variable_get",
                                                  fields: {
                                                    VAR_NAME: "modelWidth",
                                                  },
                                                },
                                              },
                                              B: {
                                                block: {
                                                  type: "math_operation",
                                                  fields: {
                                                    OP: "SUBTRACT",
                                                  },
                                                  inputs: {
                                                    A: {
                                                      block: {
                                                        type: "variable_get",
                                                        fields: {
                                                          VAR_NAME:
                                                            "vertWireCount",
                                                        },
                                                      },
                                                    },
                                                    B: {
                                                      block: {
                                                        type: "number",
                                                        fields: {
                                                          NUM: 1,
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
                                      next: {
                                        block: {
                                          type: "initialize_wire_mesh",
                                          next: {
                                            block: {
                                              type: "for_loop",
                                              fields: {
                                                VAR_NAME: "i",
                                                FROM: 0,
                                                TO: 10, // 使用horizWireCount变量
                                                STEP: 1,
                                              },
                                              inputs: {
                                                DO: {
                                                  block: {
                                                    type: "variable_declaration",
                                                    fields: {
                                                      VAR_NAME: "wirePos",
                                                    },
                                                    inputs: {
                                                      VALUE: {
                                                        block: {
                                                          type: "math_operation",
                                                          fields: {
                                                            OP: "MULTIPLY",
                                                          },
                                                          inputs: {
                                                            A: {
                                                              block: {
                                                                type: "variable_get",
                                                                fields: {
                                                                  VAR_NAME: "i",
                                                                },
                                                              },
                                                            },
                                                            B: {
                                                              block: {
                                                                type: "variable_get",
                                                                fields: {
                                                                  VAR_NAME:
                                                                    "horizSpacing",
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                    next: {
                                                      block: {
                                                        type: "add_horizontal_wire",
                                                        // 不再设置固定POSITION字段
                                                        fields: {
                                                          THICKNESS: 0.5,
                                                          COLOR: "#ff0000",
                                                        },
                                                        inputs: {
                                                          // 连接wirePos变量到POSITION输入
                                                          POSITION: {
                                                            block: {
                                                              type: "variable_get",
                                                              fields: {
                                                                VAR_NAME:
                                                                  "wirePos",
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                              next: {
                                                block: {
                                                  type: "for_loop",
                                                  fields: {
                                                    VAR_NAME: "j",
                                                    FROM: 0,
                                                    TO: 8, // 使用vertWireCount变量
                                                    STEP: 1,
                                                  },
                                                  inputs: {
                                                    DO: {
                                                      block: {
                                                        type: "variable_declaration",
                                                        fields: {
                                                          VAR_NAME: "wirePos",
                                                        },
                                                        inputs: {
                                                          VALUE: {
                                                            block: {
                                                              type: "math_operation",
                                                              fields: {
                                                                OP: "MULTIPLY",
                                                              },
                                                              inputs: {
                                                                A: {
                                                                  block: {
                                                                    type: "variable_get",
                                                                    fields: {
                                                                      VAR_NAME:
                                                                        "j",
                                                                    },
                                                                  },
                                                                },
                                                                B: {
                                                                  block: {
                                                                    type: "variable_get",
                                                                    fields: {
                                                                      VAR_NAME:
                                                                        "vertSpacing",
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                        next: {
                                                          block: {
                                                            type: "add_vertical_wire",
                                                            // 不再设置固定POSITION字段
                                                            fields: {
                                                              THICKNESS: 0.5,
                                                              COLOR: "#00ff00",
                                                            },
                                                            inputs: {
                                                              // 连接wirePos变量到POSITION输入
                                                              POSITION: {
                                                                block: {
                                                                  type: "variable_get",
                                                                  fields: {
                                                                    VAR_NAME:
                                                                      "wirePos",
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                  next: {
                                                    block: {
                                                      type: "convert_to_tubes",
                                                      fields: {
                                                        THICKNESS: 0.8,
                                                      },
                                                      next: {
                                                        block: {
                                                          type: "collect_wire_mesh",
                                                          next: {
                                                            block: {
                                                              type: "show_in_viewer",
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
            },
          ],
        },
      };
      blockEditor.setBlocklyCode(JSON.stringify(exampleCode));
      statusBar.setStatus(
        `Loaded Programmatic Wire Mesh example. Click "Render" to see the result.`,
        "info",
        0
      );
    } else if (cmd == "utility_example") {
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
              type: "show_object_dimensions",
              inputs: {
                OBJECT: {
                  block: {
                    type: "load_stl",
                    fields: {
                      FILENAME: "default.stl",
                    },
                  },
                },
              },
              next: {
                block: {
                  type: "calculate_bounds",
                  inputs: {
                    OBJECT: {
                      block: {
                        type: "variable_get",
                        fields: {
                          VAR_NAME: "_currentObjectId",
                        },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: "add_helper_object",
                      fields: {
                        HELPER_TYPE: "BOUNDING_BOX",
                        COLOR: "#00ff00",
                      },
                      inputs: {
                        OBJECT: {
                          block: {
                            type: "variable_get",
                            fields: {
                              VAR_NAME: "_currentObjectId",
                            },
                          },
                        },
                      },
                      next: {
                        block: {
                          type: "create_custom_control",
                          fields: {
                            LABEL: "Model Visibility",
                            CONTROL_TYPE: "CHECKBOX",
                            INITIAL_VALUE: 1,
                            VAR_NAME: "model_visible",
                          },
                          next: {
                            block: {
                              type: "show_in_viewer"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  };
  blockEditor.setBlocklyCode(JSON.stringify(exampleCode));
  statusBar.setStatus(
    `Loaded Utility Tools example. Click "Render" to see the result.`,
    "info",
    0
  );
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

  // 添加 Wire Mesh 示例按钮
  toolbar.addIcon(
    "wire_mesh_example",
    `<span class="material-symbols-outlined">grid_3x3</span>`,
    "Wire Mesh Example with Transforms"
  );

  toolbar.addIcon(
    "component_wire_mesh_example",
    `<span class="material-symbols-outlined">grid_4x4</span>`,
    "Component Wire Mesh Example"
  );

  toolbar.addIcon(
    "programmatic_wire_mesh_example",
    `<span class="material-symbols-outlined">code</span>`,
    "Programmatic Wire Mesh Example"
  );

  // 添加层叠切片示例按钮
  toolbar.addIcon(
    "stacked_layers_example",
    `<span class="material-symbols-outlined">layers</span>`,
    "Stacked Layers Example"
  );

  toolbar.addIcon(
    "utility_example",
    `<span class="material-symbols-outlined">build</span>`,
    "Utility Tools Example"
  );
}

// 创建 3D 查看器
var t2 = document.getElementById("viewer") as HTMLDivElement;
var glViewer: GLViewer;
if (t2) {
  glViewer = new GLViewer(t2);
}

var controlPanelElement = document.getElementById(
  "control-panel"
) as HTMLDivElement;
var controlPanel: ControlPanel;
if (controlPanelElement) {
  controlPanel = new ControlPanel(controlPanelElement);
} else {
  console.warn("Control panel container element not found in DOM");
  // 创建一个临时控制面板容器
  controlPanelElement = document.createElement("div");
  controlPanelElement.id = "control-panel";

  // 添加到右侧面板
  const rightPanel = document.querySelector(".right");
  if (rightPanel) {
    rightPanel.appendChild(controlPanelElement);
    controlPanel = new ControlPanel(controlPanelElement);
  } else {
    console.error("Right panel not found, control panel will not be available");
  }
}

// 注册所有块定义 - 先注册到 Blockly
registerThreeJSBlocks(getCodeGenerator(), addToolboxCatogery);

// 创建 Three.js 处理器（必须在 GLViewer 之后创建）
const threeJSProcessor = new ThreeJSCommandProcessor(glViewer, controlPanel);

// 窗口调整大小处理
function resizeAll() {
  // 获取当前视图宽高
  const leftPanel = document.querySelector(".left") as HTMLElement;
  const rightPanel = document.querySelector(".right") as HTMLElement;

  if (!leftPanel || !rightPanel) return;

  // 确保两边都有合理的尺寸
  const leftWidth = leftPanel.offsetWidth;
  const leftHeight = leftPanel.offsetHeight;
  const rightWidth = rightPanel.offsetWidth;
  const rightHeight = rightPanel.offsetHeight;

  console.log(
    `Resizing: Left(${leftWidth}x${leftHeight}), Right(${rightWidth}x${rightHeight})`
  );

  // 调整 BlocklyEditor
  if (blockEditor && leftWidth > 0 && leftHeight > 0) {
    try {
      blockEditor.resizeEditor();
    } catch (e) {
      console.error("Error resizing BlocklyEditor:", e);
    }
  }

  // 调整 GLViewer
  if (glViewer && rightWidth > 0 && rightHeight > 0) {
    try {
      glViewer.resize();
    } catch (e) {
      console.error("Error resizing GLViewer:", e);
    }
  }
}

// 改进窗口调整大小事件处理
window.addEventListener(
  "resize",
  function () {
    // 清除之前的延迟调用
    if (resizeTimeout) clearTimeout(resizeTimeout);
    // 设置新的延迟调用
    resizeTimeout = setTimeout(resizeAll, 200);
  },
  false
);

// 初始调整大小
setTimeout(resizeAll, 500);
window.addEventListener("resize", resizeAll, false);
resizeAll();

// 初始化动作
initAction(blockEditor, glViewer);
