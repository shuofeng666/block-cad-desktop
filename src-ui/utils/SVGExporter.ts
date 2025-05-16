// src-ui/utils/SVGExporter.ts
import * as THREE from "three";

/**
 * 生成层叠切片的SVG内容
 * @param shapes 形状数组，每个形状包含轮廓点
 * @param modelDimensions 模型尺寸信息
 * @param materialThickness 材料厚度
 * @returns SVG字符串数组
 */
export const generateStackedLayersSVG = (
  shapes: any[],
  modelDimensions: { width: number; height: number; depth: number },
  materialThickness: number
): string[] => {
  const svgFiles: string[] = [];

  // 为每个形状生成SVG
  shapes.forEach((shape, index) => {
    const svgNamespace = "http://www.w3.org/2000/svg";
    
    // 创建SVG元素
    const svgElement = document.createElementNS(svgNamespace, "svg");
    svgElement.setAttribute("width", "200mm");
    svgElement.setAttribute("height", "200mm");
    svgElement.setAttribute("viewBox", "0 0 200 200");
    
    // 创建标题和说明
    const titleElement = document.createElementNS(svgNamespace, "title");
    titleElement.textContent = `Layer ${index + 1} - Material Thickness: ${materialThickness}mm`;
    svgElement.appendChild(titleElement);
    
    const descElement = document.createElementNS(svgNamespace, "desc");
    descElement.textContent = `Stacked layer for laser cutting. Model dimensions: Width=${modelDimensions.width.toFixed(1)}mm, Height=${modelDimensions.height.toFixed(1)}mm, Depth=${modelDimensions.depth.toFixed(1)}mm`;
    svgElement.appendChild(descElement);
    
    // 创建外轮廓路径
    if (shape.points && shape.points.length > 0) {
      const pathElement = document.createElementNS(svgNamespace, "path");
      
      // 计算轮廓路径
      let pathData = "";
      shape.points.forEach((point: number[], i: number) => {
        if (i === 0) {
          pathData += `M ${point[0] + 100},${point[1] + 100}`; // 居中显示
        } else {
          pathData += ` L ${point[0] + 100},${point[1] + 100}`;
        }
      });
      pathData += " Z"; // 闭合路径
      
      pathElement.setAttribute("d", pathData);
      pathElement.setAttribute("stroke", "black");
      pathElement.setAttribute("fill", "none");
      pathElement.setAttribute("stroke-width", "0.5");
      
      svgElement.appendChild(pathElement);
    }
    
    // 添加元数据标签
    const metadataGroup = document.createElementNS(svgNamespace, "g");
    metadataGroup.setAttribute("id", "metadata");
    
    // 添加层号标签
    const layerText = document.createElementNS(svgNamespace, "text");
    layerText.setAttribute("x", "10");
    layerText.setAttribute("y", "10");
    layerText.setAttribute("font-family", "sans-serif");
    layerText.setAttribute("font-size", "4");
    layerText.textContent = `Layer: ${index + 1}`;
    metadataGroup.appendChild(layerText);
    
    // 添加材料信息
    const materialText = document.createElementNS(svgNamespace, "text");
    materialText.setAttribute("x", "10");
    materialText.setAttribute("y", "16");
    materialText.setAttribute("font-family", "sans-serif");
    materialText.setAttribute("font-size", "3");
    materialText.textContent = `Material thickness: ${materialThickness}mm`;
    metadataGroup.appendChild(materialText);
    
    svgElement.appendChild(metadataGroup);
    
    // 转换为SVG字符串
    const svgString = new XMLSerializer().serializeToString(svgElement);
    svgFiles.push(svgString);
  });
  
  return svgFiles;
};

/**
 * 下载SVG文件
 * @param svgStrings SVG字符串数组
 * @param baseFilename 基本文件名
 */
export const downloadSVGFiles = (svgStrings: string[], baseFilename: string = "stacked_layer"): void => {
  svgStrings.forEach((svgString, index) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${baseFilename}_${index + 1}.svg`;
    
    // 触发下载
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // 释放URL
    URL.revokeObjectURL(url);
  });
};