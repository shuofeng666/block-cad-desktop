import * as Blockly from "blockly";

const LightTheme: Blockly.Theme = Blockly.Theme.defineTheme('light-mode', {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#f9f9f9',
    toolboxBackgroundColour: '#ffffff',
    toolboxForegroundColour: '#333',
    flyoutBackgroundColour: '#ffffff',
    flyoutForegroundColour: '#111',
    flyoutOpacity: 1,
    scrollbarColour: '#ccc',
    insertionMarkerColour: '#4CAF50',
    insertionMarkerOpacity: 0.3,
    markerColour: '#ff4081',
    cursorColour: '#ff4081',
  }
});

export default LightTheme;
