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
  private container: HTMLElement;
  private controls: Map<string, HTMLElement> = new Map();
  private currentCommandId: string | null = null;

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
    this.currentCommandId = null;
    this.container.style.display = "none";
  }

  setCommand(commandId: string, title: string): void {
    this.clear();
    this.currentCommandId = commandId;
    
    // 创建标题
    const titleElement = document.createElement("div");
    titleElement.className = "control-panel-title";
    titleElement.textContent = title;
    this.container.appendChild(titleElement);
    
    this.container.style.display = "block";
  }

  addControl(config: ControlConfig): void {
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
    
    this.container.appendChild(controlContainer);
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
  
  getCurrentCommandId(): string | null {
    return this.currentCommandId;
  }
}