// 不再需要 Tauri 的导入
// import { save, open } from "@tauri-apps/api/dialog";
// import { invoke } from '@tauri-apps/api/tauri'

export async function saveToFile(filename: string, data: string) {
    // 创建 Blob 并下载
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function exportSaveFilePath() {
    // 返回一个默认文件名，让用户在浏览器下载时修改
    return prompt("Enter filename for export:", "model.obj");
}

export async function saveToNewFile(data: string, defaultPath?: string) {
    const filename = prompt("Save as:", defaultPath || "drawing.bcad");
    if (filename) {
        await saveToFile(filename, data);
        return filename;
    }
    return null;
}

export async function openFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.bcad';
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const text = await file.text();
                    resolve({ filepath: file.name, data: text });
                } catch (error) {
                    reject(error);
                }
            }
        };
        
        input.click();
    });
}