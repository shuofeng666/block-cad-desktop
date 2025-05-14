// src-ui/blocks/FileUploadField.ts
import * as Blockly from 'blockly';

export class FieldFileUpload extends Blockly.Field {
  private file: File | null = null;
  private fileInput: HTMLInputElement;
  // 标记为可序列化
  SERIALIZABLE = true;
  
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
  
  // 初始化 DOM
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
  protected doClassValidation_(newValue: any) {
    return newValue;
  }
  
  // JSON 序列化
  toJson() {
    return {
      text: this.getValue()
    };
  }
  
  // 从 JSON 反序列化
  static fromJson(options: any) {
    return new FieldFileUpload(options['text']);
  }
}

// 注册自定义字段
Blockly.fieldRegistry.register('field_file_upload', FieldFileUpload);