// src-ui/components/ControlPanel.ts
export type ControlConfig = {
  id: string;
  type: "slider" | "number" | "checkbox";
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number | boolean;
  onChange: (value: number | boolean) => void;
};

export class ControlPanel {
  public container: HTMLElement;
  private controls: Map<string, HTMLElement> = new Map();
  private controlGroups: Map<string, HTMLElement> = new Map();
  private currentCommandIds: Set<string> = new Set();

  constructor(containerElement: HTMLElement) {
    this.container = containerElement;
    if (!containerElement.classList.contains("control-panel")) {
      containerElement.classList.add("control-panel");
    }
    this.clear();
  }

  clear(): void {
    this.container.innerHTML = "";
    this.controls.clear();
    this.controlGroups.clear();
    this.currentCommandIds.clear();
    this.container.style.display = "none";
  }

  // 修改setCommand方法以支持多个命令
  setCommand(commandId: string, title: string): void {
    // 检查命令是否已存在
    if (this.currentCommandIds.has(commandId)) {
      return; // 如果已存在，不做任何事情
    }
    
    // 如果是第一个命令，显示面板
    if (this.currentCommandIds.size === 0) {
      this.container.style.display = "block";
    }
    
    // 添加命令ID到集合
    this.currentCommandIds.add(commandId);
    
    // 创建新的控件组
    const groupElement = document.createElement("div");
    groupElement.className = "control-group";
    groupElement.dataset.commandId = commandId;
    
    // 创建标题
    const titleElement = document.createElement("div");
    titleElement.className = "control-panel-title";
    titleElement.textContent = title;
    groupElement.appendChild(titleElement);
    
    // 添加到面板和映射
    this.container.appendChild(groupElement);
    this.controlGroups.set(commandId, groupElement);
  }

  // 修改addControl以支持命令ID
  addControl(config: ControlConfig, commandId?: string): void {
    // 如果没有指定commandId，使用最后一个
    if (!commandId) {
      if (this.currentCommandIds.size === 0) {
        console.error("No active command for adding control");
        return;
      }
      commandId = Array.from(this.currentCommandIds).pop() as string;
    }
    
    // 获取对应的控件组
    const groupElement = this.controlGroups.get(commandId);
    if (!groupElement) {
      console.error(`Control group for command ${commandId} not found`);
      return;
    }
    
    const controlContainer = document.createElement("div");
    controlContainer.className = "control-container";
    
    const labelElement = document.createElement("label");
    labelElement.textContent = config.label;
    labelElement.htmlFor = config.id;
    controlContainer.appendChild(labelElement);
    
    let inputElement: HTMLInputElement;
    
    switch (config.type) {
      case "slider":
        // 创建滑块和数值显示的容器
        const sliderContainer = document.createElement("div");
        sliderContainer.className = "slider-container";
        
        // 滑块
        inputElement = document.createElement("input");
        inputElement.type = "range";
        inputElement.id = config.id;
        inputElement.min = config.min?.toString() || "0";
        inputElement.max = config.max?.toString() || "100";
        inputElement.step = config.step?.toString() || "1";
        inputElement.value = config.value.toString();
        sliderContainer.appendChild(inputElement);
        
        // 数值显示
        const valueDisplay = document.createElement("span");
        valueDisplay.className = "value-display";
        valueDisplay.textContent = config.value.toString();
        sliderContainer.appendChild(valueDisplay);
        
        controlContainer.appendChild(sliderContainer);
        
        // 事件处理
        inputElement.addEventListener("input", () => {
          const value = parseFloat(inputElement.value);
          valueDisplay.textContent = value.toString();
          config.onChange(value);
        });
        break;
        
      case "number":
        inputElement = document.createElement("input");
        inputElement.type = "number";
        inputElement.id = config.id;
        inputElement.min = config.min?.toString() || "0";
        inputElement.max = config.max?.toString() || "100";
        inputElement.step = config.step?.toString() || "1";
        inputElement.value = config.value.toString();
        controlContainer.appendChild(inputElement);
        
        // 事件处理
        inputElement.addEventListener("change", () => {
          const value = parseFloat(inputElement.value);
          config.onChange(value);
        });
        break;
        
      case "checkbox":
        inputElement = document.createElement("input");
        inputElement.type = "checkbox";
        inputElement.id = config.id;
        inputElement.checked = config.value as boolean;
        controlContainer.appendChild(inputElement);
        
        // 事件处理
        inputElement.addEventListener("change", () => {
          config.onChange(inputElement.checked);
        });
        break;
    }
    
    groupElement.appendChild(controlContainer);
    this.controls.set(config.id, inputElement);
  }
  
  updateControl(id: string, value: number | boolean): void {
    const control = this.controls.get(id);
    if (control && control instanceof HTMLInputElement) {
      if (control.type === "checkbox") {
        control.checked = value as boolean;
      } else {
        control.value = value.toString();
        
        // 更新滑块旁边的数值显示（如果存在）
        const container = control.parentElement;
        if (container && container.className === "slider-container") {
          const valueDisplay = container.querySelector(".value-display");
          if (valueDisplay) {
            valueDisplay.textContent = value.toString();
          }
        }
      }
    }
  }
  
  // 移除特定命令的控件组
  removeCommand(commandId: string): void {
    const groupElement = this.controlGroups.get(commandId);
    if (groupElement) {
      // 移除该组的所有控件
      const controlIds = Array.from(this.controls.entries())
        .filter(([_, control]) => groupElement.contains(control))
        .map(([id, _]) => id);
      
      controlIds.forEach(id => this.controls.delete(id));
      
      // 从DOM中移除
      this.container.removeChild(groupElement);
      
      // 从映射中移除
      this.controlGroups.delete(commandId);
      this.currentCommandIds.delete(commandId);
      
      // 如果没有剩余控件组，隐藏面板
      if (this.currentCommandIds.size === 0) {
        this.container.style.display = "none";
      }
    }
  }
  
  getCurrentCommandIds(): Set<string> {
    return new Set(this.currentCommandIds);
  }
}