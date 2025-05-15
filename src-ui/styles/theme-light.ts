// 新建文件 src-ui/theme-large-blocks.ts

import * as Blockly from "blockly";

// 创建一个让块更大的主题
const LargeBlocksTheme: Blockly.Theme = Blockly.Theme.defineTheme('large-blocks', {
  base: Blockly.Themes.Classic,
  name: 'large-blocks',
  fontStyle: {
    family: 'Roboto, sans-serif',
    weight: '500',
    size: 14  // 增大字体
  },
  startHats: true,
  blockStyles: {
    logic_blocks: {
      colourPrimary: '#5b8def',
      colourSecondary: '#4a7dc7',
      colourTertiary: '#396cb0',
      hat: 'cap'
    },
    loop_blocks: {
      colourPrimary: '#85a55a',
      colourSecondary: '#73924a',
      colourTertiary: '#5f7a3a',
      hat: 'cap'
    },
    math_blocks: {
      colourPrimary: '#f3b034',
      colourSecondary: '#e09e1e',
      colourTertiary: '#c68c0b'
    },
    text_blocks: {
      colourPrimary: '#f38771',
      colourSecondary: '#e07560',
      colourTertiary: '#cd634f'
    },
    list_blocks: {
      colourPrimary: '#cc7ddd',
      colourSecondary: '#ba6bc9',
      colourTertiary: '#a75ab5'
    },
    colour_blocks: {
      colourPrimary: '#a1887f',
      colourSecondary: '#8d776c',
      colourTertiary: '#7a665a'
    },
    variable_blocks: {
      colourPrimary: '#e67373',
      colourSecondary: '#d45a5a',
      colourTertiary: '#c24242'
    },
    procedure_blocks: {
      colourPrimary: '#8fa55a',
      colourSecondary: '#7d924a',
      colourTertiary: '#6b7a3a'
    }
  },
  componentStyles: {
    workspaceBackgroundColour: '#1e1e1e',
    toolboxBackgroundColour: '#2a2a2a',
    toolboxForegroundColour: '#ccc',
    flyoutBackgroundColour: '#252525',
    flyoutForegroundColour: '#ccc',
    flyoutOpacity: 0.9,
    scrollbarColour: '#797979',
    insertionMarkerColour: '#fff',
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.3,
    cursorColour: '#d0d0ff' 
  }
});

export default LargeBlocksTheme;