import { BlocklyEditor } from "./BlockEditor";
import { saveToFile, saveToNewFile, openFile, exportSaveFilePath } from "../utils/file";
// 注释掉未使用的导入
// import { objSerializer, stlSerializer } from "@jscad/io"

import { statusBar } from "../components/Statusbar";
import { GLViewer } from "../threejs/GLViewer";
import { scope } from "./Scope";

var current_filename: string | null = null;

var blockEditor: BlocklyEditor;
var glViewer: GLViewer;

function printScope() {
    scope.scopeItem.items.map(si => {
        console.log(si.toJSON ? si.toJSON() : si);
    });
}

export function initAction(be: BlocklyEditor, gv: GLViewer) {
    glViewer = gv;
    blockEditor = be;
}

export function saveFileAction(code: string) {
    if (current_filename) {
        saveToFile(current_filename, code).then(function () {
            statusBar.setStatus(`${current_filename} saved`, "info", 0);
        }).catch(function (e) {
            statusBar.setStatus(`Error while saving file`, "error", 0);
        });
    } else {
        saveToNewFile(code, current_filename).then(function (filename) {
            if (filename) {
                current_filename = filename;
                statusBar.setStatus(`${current_filename} saved`, "info", 0);
            }
        }).catch(function (e) {
            statusBar.setStatus(`Error while saving file ${current_filename}`, "error", 0);
        });
    }
}

export function saveAsFileAction(code: string) {
    saveToNewFile(code, current_filename).then(function (filename) {
        if (filename) {
            current_filename = filename;
            statusBar.setStatus(`${current_filename} saved`, "info", 0);
        }
    }).catch(function (e) {
        statusBar.setStatus(`Error while saving file ${current_filename}`, "error", 0);
    });
}

// 定义返回类型接口
interface FileData {
    filepath: string;
    data: string;
}

export function openFileAction(callback: (data: string) => void) {
    openFile().then(function (result) {
        if (result) {
            // 使用类型断言让TypeScript知道结果的结构
            const fileData = result as FileData;
            current_filename = fileData.filepath;
            callback(fileData.data);
        }
    }).catch(function (e) {
        console.error(e);
        statusBar.setStatus(`Error opening file`, "error", 0);
    });
}

// 注释掉这些未使用的功能
/*
async function convertToSTL() {
    blockEditor.generateCode();
    var jscadObjs = [];
    for (var i = 0; i < scope.scopeItem.items.length; i++) {
        var si = scope.scopeItem.items[i];
        const jscadObj = await convertToJSCAD(si);
        if (jscadObj != null) {
            jscadObjs.push(jscadObj);
        }
    }
    return stlSerializer.serialize({ binary: false }, ...jscadObjs).join("\n");
}

async function convertToOBJ() {
    blockEditor.generateCode();
    var jscadObjs = [];
    for (var i = 0; i < scope.scopeItem.items.length; i++) {
        var si = scope.scopeItem.items[i];
        const jscadObj = await convertToJSCAD(si);
        if (jscadObj != null) {
            jscadObjs.push(jscadObj);
        }
    }
    return objSerializer.serialize({ triangulate: true }, ...jscadObjs)[0];
}

export async function exportFile() {
    try {
        printScope();
        var filepath = await exportSaveFilePath();
        if (filepath) {
            if (filepath.endsWith(".obj")) {
                var code = await convertToOBJ();
                saveToFile(filepath, code);
                statusBar.setStatus(`Model exported to ${filepath}`, "info", 0);
            } else if (filepath.endsWith(".stl")) {
                var code = await convertToSTL();
                saveToFile(filepath, code);
                statusBar.setStatus(`Model exported to ${filepath}`, "info", 0);
            }
        }
    } catch (e) {
        statusBar.setStatus(`Error while exporting to file ${filepath} : ${e}`, "error", 0);
    };
}
*/

// 简化的导出功能
export async function exportFile() {
    try {
        printScope();
        const filepath = await exportSaveFilePath();
        if (filepath) {
            // 直接使用当前场景数据导出
            const data = blockEditor.getBlocklyCode();
            await saveToFile(filepath, data);
            statusBar.setStatus(`Model exported to ${filepath}`, "info", 0);
        }
    } catch (e) {
        statusBar.setStatus(`Error while exporting to file: ${e}`, "error", 0);
    }
}

export async function renderAction() {
    try {
        statusBar.setStatus(`render started`, "info", 10);
        scope.reset();
        glViewer.clearScene();
        blockEditor.generateCode();
        
        // 使用ThreeJSCommandProcessor而不是convertToOBJ
        // 这个方法需要在外部调用中处理
        statusBar.setStatus(`render completed`, "info", 0);
    } catch (e) {
        console.log(e);
        statusBar.logError(e);
    }
}

export async function newFile() {
    current_filename = null;
}