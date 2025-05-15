// BlockEditor.ts - 精简版（无高亮功能）
import * as Blockly from 'blockly';

export class BlocklyEditor {
    blocklyArea: HTMLDivElement;
    blocklyDiv: HTMLDivElement;
    workspace: Blockly.WorkspaceSvg;
    codeGenerator: any;

    constructor(blocks: any, toolbox: any, codegen: any, theme: any, blocklyArea: HTMLDivElement) {
        this.blocklyArea = blocklyArea;
        this.codeGenerator = codegen;
        
        // === Blockly 尺寸设置（保持块较大不易重叠）===
        (Blockly.BlockSvg as any).MIN_BLOCK_Y = 35;
        (Blockly.BlockSvg as any).FIELD_HEIGHT = 25;
        (Blockly.BlockSvg as any).FIELD_Y_PADDING = 8;
        (Blockly.BlockSvg as any).INLINE_PADDING_Y = 8;
        (Blockly.BlockSvg as any).FIELD_TEXT_FONTSIZE = 14;
        (Blockly.BlockSvg as any).FIELD_TEXT_BASELINE = 23;
        (Blockly.FieldTextInput as any).DEFAULT_WIDTH = 80;
        (Blockly.FieldNumber as any).DEFAULT_WIDTH = 80;
        (Blockly.BlockSvg as any).EDGE_RADIUS = 6;
        (Blockly.BlockSvg as any).CONNECTION_HEIGHT = 4;
        (Blockly.BlockSvg as any).STATEMENT_INPUT_PADDING_Y = 8;
        (Blockly.BlockSvg as any).VALUE_INPUT_PADDING = 8;
        (Blockly.FieldDropdown as any).ARROW_SIZE = 15;
        (Blockly.FieldDropdown as any).BORDER_RECT_DEFAULT = 6;

        // === 创建 blocklyDiv ===
        this.blocklyDiv = document.createElement("div");
        this.blocklyDiv.style.position = "absolute";
        this.blocklyDiv.style.width = "100%";
        this.blocklyDiv.style.height = "100%";
        this.blocklyDiv.style.top = "0";
        this.blocklyDiv.style.left = "0";
        this.blocklyDiv.classList.add("blocklyDiv");
        this.blocklyArea.appendChild(this.blocklyDiv);
        
        // === Blockly 配置选项 ===
        const options: Blockly.BlocklyOptions = {
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
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.5,
                scaleSpeed: 1.2
            },
            theme: theme,
            grid: {
                spacing: 30,
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
        
        // === 初始化 workspace ===
        this.workspace = Blockly.inject(this.blocklyDiv, options);
    }
    
    // === 核心方法 ===
    resetEditor() {
        Blockly.serialization.workspaces.load({}, this.workspace);
    }
    
    getBlocklyCode() {
        return JSON.stringify(Blockly.serialization.workspaces.save(this.workspace));
    }
    
    setBlocklyCode(data: string) {
        Blockly.serialization.workspaces.load(JSON.parse(data), this.workspace);
    }
    
    generateCode() {
        return this.codeGenerator.workspaceToCode(this.workspace);
    }
    
    resizeEditor() {
        this.blocklyDiv.style.width = this.blocklyArea.offsetWidth + 'px';
        this.blocklyDiv.style.height = this.blocklyArea.offsetHeight + 'px';
        Blockly.svgResize(this.workspace);
    }
}