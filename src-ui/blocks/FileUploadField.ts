// src-ui/blocks/FileUploadField.ts
import * as Blockly from 'blockly';

// 扩展 Blockly.Field 的类型定义，让 TypeScript 编译器接受我们的实现
declare module 'blockly' {
  namespace Field {
    interface Field {
      text_?: string;
    }
  }
}

export class FieldFileUpload extends Blockly.Field {
  private file: File | null = null;
  private fileInput: HTMLInputElement;
  // 标记为可序列化
  SERIALIZABLE = true;
  
  // 使 TypeScript 满意的属性，实际上在 Blockly.Field 中可能存在
  text_?: string;
  
  constructor(text: string = '选择文件', validator?: any) {
    super(text, validator);
    
    // 创建文件输入元素
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.stl';
    this.fileInput.style.display = 'none';
    
    // 文件选择处理
    this.fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        console.log('文件选择成功:', file.name, file.size);
        this.file = file;
        this.setValue(file.name);
        
        // 触发工作区更新
        if (this.sourceBlock_ && this.sourceBlock_.workspace) {
          this.sourceBlock_.workspace.fireChangeListener(
            new Blockly.Events.BlockChange(
              this.sourceBlock_, 'field', this.name, this.text_, file.name
            )
          );
        }
      }
    };
  }
  
  // 保留为受保护方法，添加 @ts-ignore 来避免 TypeScript 错误
  // @ts-ignore
  protected initView() {
    super.initView();
    // 添加文件输入到 DOM
    if (!this.fileInput.parentNode) {
      document.body.appendChild(this.fileInput);
    }
  }
  
  // 清理
  dispose() {
    // 移除文件输入元素
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }
    super.dispose();
  }
  
  // 点击处理
  // @ts-ignore
  protected showEditor_() {
    console.log('触发文件选择对话框');
    this.fileInput.click();
  }
  
  // 获取上传的文件
  getFile(): File | null {
    console.log('获取文件:', this.file ? this.file.name : 'null');
    return this.file;
  }
  
  // 验证
  // @ts-ignore
  protected doClassValidation_(newValue: any) {
    return newValue;
  }
  
  // JSON 序列化 - 兼容两种命名方式
  toJson() {
    return {
      text: this.getValue()
    };
  }
  
  // Blockly 新版本可能使用这个名称
  toJSON() {
    return this.toJson();
  }
  
  // 从 JSON 反序列化 - 兼容两种命名方式
  static fromJson(options: any) {
    return new FieldFileUpload(options['text']);
  }
  
  // Blockly 新版本可能使用这个名称
  static fromJSON(options: any) {
    return FieldFileUpload.fromJson(options);
  }
}

// 使用 @ts-ignore 来避免 TypeScript 在注册时的错误
// @ts-ignore
Blockly.fieldRegistry.register('field_file_upload', FieldFileUpload);