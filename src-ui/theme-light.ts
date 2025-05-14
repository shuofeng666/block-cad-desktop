import * as Blockly from "blockly";

const LightTheme: Blockly.Theme = Blockly.Theme.defineTheme('light-mode', {
  base: Blockly.Themes.Classic,
  name: 'light-mode',
  blockStyles: {
    logic_blocks: {
      colourPrimary: '#5b8def',
      colourSecondary: '#4a7dc7',
      colourTertiary: '#396cb0'
    },
    loop_blocks: {
      colourPrimary: '#85a55a',
      colourSecondary: '#73924a',
      colourTertiary: '#5f7a3a'
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
    workspaceBackgroundColour: '#f3f4f6',
    toolboxBackgroundColour: '#ffffff',
    toolboxForegroundColour: '#4b5563',
    flyoutBackgroundColour: '#f9fafb',
    flyoutForegroundColour: '#1f2937',
    flyoutOpacity: 0.95,
    scrollbarColour: '#d1d5db',
    insertionMarkerColour: '#3b82f6',
    insertionMarkerOpacity: 0.4,
    markerColour: '#ef4444',
    cursorColour: '#3b82f6',
    selectedGlowColour: '#3b82f6',
    selectedGlowOpacity: 0.4,
    replacementGlowColour: '#f59e0b',
    replacementGlowOpacity: 0.5
  }
});

export default LightTheme;