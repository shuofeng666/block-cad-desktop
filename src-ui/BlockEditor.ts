// BlockEditor.ts - 兼容版本

import DarkTheme from '@blockly/theme-dark';
import {generate_blocks} from "./openscad";
import * as Blockly from 'blockly';

var blocklyArea = null;
var blocklyDiv = null;

export class BlockHighlight {
    constructor(workspace) {
        this.workspace = workspace;
        this.highlightSvg = undefined;
        this.currentBlockId = undefined;
    }
    
    highlightBlock(blockId) {
        // 如果已经高亮这个块，就不需要重新高亮
        if (this.currentBlockId === blockId) return;
        
        // 移除旧的高亮
        this.removeHighlight();
        
        const block = this.workspace.getBlockById(blockId);
        if (!block) return;
        
        this.currentBlockId = blockId;
        
        // 获取块的边界
        const blockSvg = block.getSvgRoot();
        const bbox = blockSvg.getBBox();
        const xy = block.getRelativeToSurfaceXY();
        
        // 创建高亮矩形
        const highlightGroup = Blockly.utils.dom.createSvgElement(
            'g',
            {
                'class': 'blockHighlight',
                'transform': `translate(${xy.x}, ${xy.y})`
            },
            this.workspace.getParentSvg()
        );
        
        const rect = Blockly.utils.dom.createSvgElement(
            'rect',
            {
                'x': -5,
                'y': -5,
                'width': bbox.width + 10,
                'height': bbox.height + 10,
                'fill': 'none',
                'stroke': '#3b82f6',
                'stroke-width': '2',
                'stroke-dasharray': '5,5',
                'rx': '5',
                'ry': '5',
                'class': 'blockHighlightRect'
            },
            highlightGroup
        );
        
        // 添加动画
        const animate = Blockly.utils.dom.createSvgElement(
            'animate',
            {
                'attributeName': 'stroke-dashoffset',
                'from': '0',
                'to': '10',
                'dur': '0.5s',
                'repeatCount': 'indefinite'
            },
            rect
        );
        
        this.highlightSvg = highlightGroup;
    }
    
    removeHighlight() {
        if (this.highlightSvg) {
            this.highlightSvg.remove();
            this.highlightSvg = undefined;
            this.currentBlockId = undefined;
        }
    }
}

export class BlocklyEditor {
    constructor(blocks, toolbox, codegen, theme, blocklyArea) {
        this.blocklyArea = blocklyArea;
        this.codeGenerator = codegen;
        
        // === 在创建 workspace 之前设置全局常量 ===
        // 这些设置会让所有块变大，不会造成重叠
        
        // 基本尺寸设置
        Blockly.BlockSvg.MIN_BLOCK_Y = 35;              // 块的最小高度 (默认 25)
        Blockly.BlockSvg.FIELD_HEIGHT = 25;             // 字段高度 (默认 18)
        Blockly.BlockSvg.FIELD_Y_PADDING = 8;           // 字段垂直内边距 (默认 5)
        Blockly.BlockSvg.INLINE_PADDING_Y = 8;          // 内联内边距 (默认 5)
        
        // 文字和输入框设置
        Blockly.BlockSvg.FIELD_TEXT_FONTSIZE = 14;      // 字体大小 (默认 11)
        Blockly.BlockSvg.FIELD_TEXT_BASELINE = 23;      // 文本基线 (默认 16)
        Blockly.FieldTextInput.DEFAULT_WIDTH = 80;      // 文本输入宽度 (默认 40)
        Blockly.FieldNumber.DEFAULT_WIDTH = 80;         // 数字输入宽度 (默认 40)
        
        // 连接和圆角设置
        Blockly.BlockSvg.EDGE_RADIUS = 6;               // 圆角半径 (默认 4)
        Blockly.BlockSvg.CONNECTION_HEIGHT = 4;         // 连接高度 (默认 3)
        
        // 语句和值输入设置
        Blockly.BlockSvg.STATEMENT_INPUT_PADDING_Y = 8; // 语句输入内边距
        Blockly.BlockSvg.VALUE_INPUT_PADDING = 8;       // 值输入内边距
        
        // 下拉框设置
        Blockly.FieldDropdown.ARROW_SIZE = 15;          // 下拉箭头大小 (默认 12)
        Blockly.FieldDropdown.BORDER_RECT_DEFAULT = 6;  // 下拉框边距
        
        // === 创建 blocklyDiv ===

        // === 创建 blocklyDiv ===
        this.blocklyDiv = document.createElement("div");
        this.blocklyDiv.style.position = "absolute";
        this.blocklyDiv.style.width = "100%";
        this.blocklyDiv.style.height = "100%";
        this.blocklyDiv.style.top = "0";
        this.blocklyDiv.style.left = "0";
        this.blocklyDiv.classList.add("blocklyDiv");
        this.blocklyArea.appendChild(this.blocklyDiv);
        
        // === 配置选项 ===
        var options = {
            toolbox: toolbox,
            collapse: true,
            comments: true,
            disable: true,
            maxBlocks: Infinity,
            trashcan: false,
            horizontalLayout: false,
            toolboxPosition: 'start',
            css: true,
            media: 'https://blockly-demo.appspot.com/static/media/',
            rtl: false,
            scrollbars: true,
            sounds: false,
            oneBasedIndex: true,
            zoom: {
                controls: true,
                startScale: 1.0,    // 保持 1.0，不需要缩放
                maxScale: 3,
                minScale: 0.5,
                scaleSpeed: 1.2
            },
            theme: theme,
            grid: {
                spacing: 30,        // 增加网格间距，防止块重叠
                length: 3,
                colour: '#ccc',
                snap: true
            },
            renderer: 'geras',
            move: {
                scrollbars: true,
                drag: true,
                wheel: true
            }
        };
        
        // === 创建 workspace ===
        this.workspace = Blockly.inject(this.blocklyDiv, options);
        
        // === 初始化高亮管理器 ===
        this.blockHighlight = new BlockHighlight(this.workspace);
        
        // === 添加事件监听 ===
        this.workspace.addChangeListener((event) => {
            if (event.type === Blockly.Events.BLOCK_SELECT) {
                const selectEvent = event;
                if (selectEvent.newElementId) {
                    this.blockHighlight.highlightBlock(selectEvent.newElementId);
                } else {
                    this.blockHighlight.removeHighlight();
                }
            }
        });
    }
    
    resetEditor() {
        Blockly.serialization.workspaces.load({}, this.workspace);
    }
    
    getBlocklyCode() {
        return JSON.stringify(Blockly.serialization.workspaces.save(this.workspace));
    }
    
    setBlocklyCode(data) {
        Blockly.serialization.workspaces.load(JSON.parse(data), this.workspace);
    }
    
    generateCode() {
        return this.codeGenerator.workspaceToCode(this.workspace);
    }
    
     resizeEditor() {
        // 直接使用 blocklyArea 的尺寸，不需要计算偏移
        this.blocklyDiv.style.width = this.blocklyArea.offsetWidth + 'px';
        this.blocklyDiv.style.height = this.blocklyArea.offsetHeight + 'px';
        Blockly.svgResize(this.workspace);
    }
}

/*
export interface IOSCadBlockEditor{
    blocklyArea: HTMLDivElement;
    blocklyDiv:HTMLDivElement;
    workspace:WorkspaceSvg;
}
export function init(areaElement:HTMLDivElement):IOSCadBlockEditor{
    blocklyArea = areaElement;
    blocklyDiv = document.createElement("div");
    blocklyDiv.style.position ="absolute"
    blocklyDiv.classList.add("blocklyDiv");
    blocklyArea.appendChild(blocklyDiv);
   
    var openscad = generate_blocks();
    var options:BlocklyOptions = {
        toolbox: openscad.toolbox,
        collapse: true,
        comments: true,
        disable: true,
        maxBlocks: Infinity,
        trashcan: false,
        horizontalLayout: false,
        toolboxPosition: 'start',
        css: true,
        media: 'https://blockly-demo.appspot.com/static/media/',
        rtl: false,
        scrollbars: true,
        sounds: false,
         //renderer: 'zelos',
        oneBasedIndex: true,
        zoom: {
            controls: true,
            startScale: 0.8,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        theme: DarkTheme
    };
    var workspace = Blockly.inject(blocklyDiv, options);
    var result = {blocklyArea,blocklyDiv,workspace};
    return result;
}

export function resetEditor(b:IOSCadBlockEditor){
    Blockly.serialization.workspaces.load({},b.workspace);
}
export function getBlocklyCode(b:IOSCadBlockEditor){
    return Blockly.serialization.workspaces.save(b.workspace);
}

export function setBlocklyCode(b:IOSCadBlockEditor,data:string){
    Blockly.serialization.workspaces.load(JSON.parse(data),b.workspace);
}

export function resizeEditor(b:IOSCadBlockEditor){
    var element:HTMLElement|null = b.blocklyArea;
  let x = 0;
  let y = 0;
  do {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  } while (element);
  // Position blocklyDiv over blocklyArea.
  b.blocklyDiv.style.left = x + 'px';
  b.blocklyDiv.style.top = y + 'px';
  b.blocklyDiv.style.width = b.blocklyArea.offsetWidth + 'px';
  b.blocklyDiv.style.height = b.blocklyArea.offsetHeight + 'px';
  Blockly.svgResize(b.workspace);
}
*/
