// src-ui/utils/ui/ControlEventHandler.ts
/**
 * 事件监听器
 */
interface EventListener {
  element: HTMLElement;
  event: string;
  callback: (value: any) => void;
  handler: (event: any) => void;
}

/**
 * 控件事件处理器 - 处理UI控件的事件
 * 提供事件添加、移除、委托和防抖功能
 */
export class ControlEventHandler {
  private listeners: EventListener[] = [];
  private debouncers: Map<string, any> = new Map();
  
  /**
   * 添加事件监听器
   * @param element DOM元素
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 事件ID
   */
  public addListener(
    element: HTMLElement,
    event: string,
    callback: (value: any) => void
  ): string {
    // 生成唯一ID
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // 创建事件处理函数
    const handler = (e: any) => {
      // 根据元素类型和事件类型确定值
      let value;
      
      if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox') {
          value = element.checked;
        } else if (element.type === 'number' || element.type === 'range') {
          value = parseFloat(element.value);
        } else {
          value = element.value;
        }
      } else if (element instanceof HTMLSelectElement) {
        value = element.value;
      } else if (element instanceof HTMLButtonElement) {
        value = true;
      } else {
        // 对于其他元素，使用事件本身
        value = e;
      }
      
      // 调用回调
      callback(value);
    };
    
    // 添加到监听器列表
    this.listeners.push({
      element,
      event,
      callback,
      handler
    });
    
    // 添加DOM事件监听器
    element.addEventListener(event, handler);
    
    return id;
  }
  
  /**
   * 移除事件监听器
   * @param element DOM元素
   * @param event 事件名称
   * @returns 是否成功移除
   */
  public removeListener(
    element: HTMLElement,
    event: string
  ): boolean {
    const index = this.listeners.findIndex(
      listener => listener.element === element && listener.event === event
    );
    
    if (index !== -1) {
      const listener = this.listeners[index];
      
      // 移除DOM事件监听器
      listener.element.removeEventListener(listener.event, listener.handler);
      
      // 从列表中移除
      this.listeners.splice(index, 1);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 移除所有事件监听器
   */
  public removeAllListeners(): void {
    this.listeners.forEach(listener => {
      listener.element.removeEventListener(listener.event, listener.handler);
    });
    
    this.listeners = [];
  }
  
  /**
   * 防抖处理
   * @param callback 回调函数
   * @param delay 延迟时间（毫秒）
   * @returns 防抖处理后的函数
   */
  public debounce(
    callback: (value: any) => void,
    delay: number = 300
  ): (value: any) => void {
    // 生成唯一ID
    const id = `debounce-${callback.toString().slice(0, 100)}-${delay}`;
    
    // 返回防抖函数
    return (value: any) => {
      // 清除先前的定时器
      if (this.debouncers.has(id)) {
        clearTimeout(this.debouncers.get(id));
      }
      
      // 设置新的定时器
      const timerId = setTimeout(() => {
        callback(value);
        this.debouncers.delete(id);
      }, delay);
      
      // 存储定时器ID
      this.debouncers.set(id, timerId);
    };
  }
  
  /**
   * 节流处理
   * @param callback 回调函数
   * @param limit 时间限制（毫秒）
   * @returns 节流处理后的函数
   */
  public throttle(
    callback: (value: any) => void,
    limit: number = 100
  ): (value: any) => void {
    let waiting = false;
    let lastValue: any = null;
    
    return (value: any) => {
      if (!waiting) {
        callback(value);
        waiting = true;
        lastValue = null;
        
        setTimeout(() => {
          waiting = false;
          
          // 如果在等待期间有新值，则立即调用一次
          if (lastValue !== null) {
            callback(lastValue);
            lastValue = null;
          }
        }, limit);
      } else {
        lastValue = value;
      }
    };
  }
  
  /**
   * 事件委托
   * @param container 容器元素
   * @param selector 选择器
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 事件ID
   */
  public delegate(
    container: HTMLElement,
    selector: string,
    event: string,
    callback: (event: any, element: HTMLElement) => void
  ): string {
    const handler = (e: Event) => {
      // 找到所有匹配选择器的元素
      const elements = container.querySelectorAll(selector);
      
      // 检查事件目标是否是或者包含在匹配的元素中
      let targetElement: HTMLElement | null = e.target as HTMLElement;
      
      while (targetElement && targetElement !== container) {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i] === targetElement) {
            // 调用回调，传递事件和目标元素
            callback(e, targetElement);
            return;
          }
        }
        
        targetElement = targetElement.parentElement;
      }
    };
    
    // 添加到监听器列表
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    this.listeners.push({
      element: container,
      event,
      callback: () => {}, // 不使用标准回调
      handler
    });
    
    // 添加DOM事件监听器
    container.addEventListener(event, handler);
    
    return id;
  }
  
  /**
   * 获取表单元素值
   * @param element 表单元素
   * @returns 元素值
   */
  public getElementValue(element: HTMLElement): any {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        return element.checked;
      } else if (element.type === 'number' || element.type === 'range') {
        return parseFloat(element.value);
      } else {
        return element.value;
      }
    } else if (element instanceof HTMLSelectElement) {
      return element.value;
    } else if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    
    return null;
  }
  
  /**
   * 设置表单元素值
   * @param element 表单元素
   * @param value 要设置的值
   */
  public setElementValue(element: HTMLElement, value: any): void {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        element.checked = !!value;
      } else {
        element.value = value.toString();
      }
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      element.dispatchEvent(event);
      
      // 对于滑块，还要触发input事件
      if (element.type === 'range') {
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
      }
    } else if (element instanceof HTMLSelectElement) {
      element.value = value.toString();
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      element.dispatchEvent(event);
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = value.toString();
      
      // 触发change事件
      const event = new Event('change', { bubbles: true });
      element.dispatchEvent(event);
    }
  }
  
  /**
   * 批量更新多个控件值
   * @param updates 控件ID和值的键值对
   */
  public batchUpdate(updates: { [id: string]: any }): void {
    for (const id in updates) {
      const element = document.getElementById(id);
      if (element) {
        this.setElementValue(element, updates[id]);
      }
    }
  }
  
  /**
   * 添加拖拽功能到元素
   * @param element 要拖拽的元素
   * @param onDrag 拖拽回调
   * @param dragHandle 拖拽手柄（可选），默认为整个元素
   */
  public makeDraggable(
    element: HTMLElement,
    onDrag?: (deltaX: number, deltaY: number) => void,
    dragHandle?: HTMLElement
  ): void {
    const handle = dragHandle || element;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      
      // 防止文本选择
      e.preventDefault();
      
      // 添加临时事件处理
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      
      // 更新位置
      if (!onDrag) {
        element.style.left = `${(element.offsetLeft + deltaX)}px`;
        element.style.top = `${(element.offsetTop + deltaY)}px`;
      } else {
        onDrag(deltaX, deltaY);
      }
      
      lastX = e.clientX;
      lastY = e.clientY;
    };
    
    const onMouseUp = () => {
      isDragging = false;
      
      // 移除临时事件处理
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    // 添加拖拽处理
    handle.addEventListener('mousedown', onMouseDown);
    
    // 存储处理函数以便清理
    element.dataset.draggableHandlers = JSON.stringify({
      handle: handle === element ? 'self' : 'custom',
      mousedown: true
    });
  }
  
  /**
   * 移除元素的拖拽功能
   * @param element 元素
   */
  public removeDraggable(element: HTMLElement): void {
    if (element.dataset.draggableHandlers) {
      try {
        const handlers = JSON.parse(element.dataset.draggableHandlers);
        const handle = handlers.handle === 'self' ? element : element.querySelector('.drag-handle');
        
        if (handle && handlers.mousedown) {
          // 移除事件监听器（因为我们无法访问到原始函数引用，所以这不太理想）
          handle.replaceWith(handle.cloneNode(true));
        }
        
        delete element.dataset.draggableHandlers;
      } catch (e) {
        console.error("Error removing draggable", e);
      }
    }
  }
}

// 导出单例实例，便于在应用中直接使用
export const controlEventHandler = new ControlEventHandler();