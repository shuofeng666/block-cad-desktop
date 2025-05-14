// src-ui/blocks/FileUploadField.ts
import * as Blockly from 'blockly';

export class FieldFileUpload extends Blockly.Field {
  private fileInput: HTMLInputElement;
  private file: File | null = null;
  
  constructor(text: string = 'Choose File', validator?: any) {
    super(text, validator);
    
    // 创建文件输入元素
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.stl';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);
    
    // 文件选择处理
    this.fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.file = file;
        this.setValue(file.name);
      }
    };
  }
  
  showEditor_() {
    // 当字段被点击时，触发文件选择
    this.fileInput.click();
  }
  
  getFile(): File | null {
    return this.file;
  }
  
  doClassValidation_(newValue: any) {
    return newValue;
  }
  
  fromJson(options: any) {
    this.setValue(options['text']);
  }
  
  static fromJson(options: any) {
    return new FieldFileUpload(options['text']);
  }
}

// 注册自定义字段
Blockly.fieldRegistry.register('field_file_upload', FieldFileUpload);

// 在 ThreeJSBlocks.ts 中使用
// 首先导入
// import { FieldFileUpload } from './FileUploadField';

// 然后在 upload_stl 块定义中使用：
"upload_stl": {
  category: modelCategory,
  definition: {
    init: function() {
      this.appendDummyInput()
          .appendField("Upload STL")
          .appendField(new FieldFileUpload("Choose File"), "FILE_UPLOAD");
      
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(modelCategory.colour);
      this.setTooltip("Upload an STL file from local");
    }
  },
  generator: function(block: any) {
    const field = block.getField('FILE_UPLOAD') as FieldFileUpload;
    const file = field.getFile();
    
    if (file) {
      const cmd = new Command('upload_stl', { file }, [], {});
      scope.push(cmd);
    }
    return '';
  }
}