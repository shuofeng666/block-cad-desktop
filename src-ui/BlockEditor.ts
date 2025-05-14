import DarkTheme from '@blockly/theme-dark';
import {generate_blocks} from "./openscad";
import * as Blockly from 'blockly';

var blocklyArea: HTMLDivElement|null = null;
var blocklyDiv:HTMLDivElement|null = null;

// 添加 BlockHighlight 类
export class BlockHighlight {
    private workspace: Blockly.WorkspaceSvg;
    private highlightSvg?: SVGElement;
    private currentBlockId?: string;
    
    constructor(workspace: Blockly.WorkspaceSvg) {
        this.workspace = workspace;
    }
    
    highlightBlock(blockId: string) {
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
            this.workspace.getParentSvg()  // 修改这里
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

export class BlocklyEditor{
    blocklyArea: HTMLDivElement;
    blocklyDiv:HTMLDivElement;
    workspace:Blockly.WorkspaceSvg;
    codeGenerator:Blockly.CodeGenerator;
    blockHighlight: BlockHighlight;  // 添加高亮管理器
    
    constructor(blocks,toolbox,codegen,theme,blocklyArea:HTMLDivElement){
        this.blocklyArea = blocklyArea;
        this.codeGenerator=codegen;
        this.blocklyDiv = document.createElement("div");
        this.blocklyDiv.style.position ="absolute"
        this.blocklyDiv.classList.add("blocklyDiv");
        this.blocklyArea.appendChild(this.blocklyDiv);
        
        var options:Blockly.BlocklyOptions = {
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
            //renderer: 'zelos',
            oneBasedIndex: true,
            zoom: {
                controls: true,
                startScale: 0.8,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            theme: theme
        };
        
        this.workspace = Blockly.inject(this.blocklyDiv, options);
        
        // 初始化高亮管理器
        this.blockHighlight = new BlockHighlight(this.workspace);
        
        // 添加块选择事件监听
        this.workspace.addChangeListener((event: Blockly.Events.Abstract) => {
            if (event.type === Blockly.Events.BLOCK_SELECT) {
                const selectEvent = event as Blockly.Events.BlockSelect;
                if (selectEvent.newElementId) {
                    this.blockHighlight.highlightBlock(selectEvent.newElementId);
                } else {
                    this.blockHighlight.removeHighlight();
                }
            }
        });
    }
    
    resetEditor(){
        Blockly.serialization.workspaces.load({},this.workspace);
    }
    
    getBlocklyCode(){
        return JSON.stringify(Blockly.serialization.workspaces.save(this.workspace));
    }
    
    setBlocklyCode(data:string){
        Blockly.serialization.workspaces.load(JSON.parse(data),this.workspace);
    }
    
    generateCode(){
        return this.codeGenerator.workspaceToCode(this.workspace);
    }
    
    resizeEditor(){
        var element:HTMLElement|null = this.blocklyArea;
        let x = 0;
        let y = 0;
        do {
            x += element.offsetLeft;
            y += element.offsetTop;
            element = element.offsetParent as HTMLElement;
        } while (element);
        // Position blocklyDiv over blocklyArea.
        this.blocklyDiv.style.left = x + 'px';
        this.blocklyDiv.style.top = y + 'px';
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