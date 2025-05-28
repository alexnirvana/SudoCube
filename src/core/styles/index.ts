// 3D棋盘样式系统
import * as THREE from 'three';

// 样式接口定义
export interface BoardStyle {
  name: string;
  description: string;
  createCellGeometry: (cellSize: number) => THREE.BufferGeometry;
  createMaterials: (darkMode: boolean) => {
    stone: THREE.Material;
    selected: THREE.Material;
    preset: THREE.Material;
    conflict: THREE.Material;
  };
  getCellPosition: (row: number, col: number, cellSize: number, spacing: number, totalSize: number) => THREE.Vector3;
  getTextPosition: (cellPosition: THREE.Vector3) => THREE.Vector3;
  getTextRotation: () => THREE.Euler;
  getCameraPosition: () => THREE.Vector3;
  getLights: (darkMode: boolean) => THREE.Light[];
  getSceneBackground: (darkMode: boolean) => THREE.Color;
  // 可选的数字材质创建方法
  createNumberMaterial?: (number: string, darkMode: boolean) => THREE.Material;
}

// 导入所有样式
import StoneStyle from './stone';
import ImageStyle from './image';
import CrystalStyle from './crystal';
import MetalStyle from './metal';

// 导出所有样式
export { StoneStyle, ImageStyle, CrystalStyle, MetalStyle };

// 样式注册表
export const BOARD_STYLES: Record<string, BoardStyle> = {
  [StoneStyle.name]: StoneStyle,
  [ImageStyle.name]: ImageStyle,
  [CrystalStyle.name]: CrystalStyle,
  [MetalStyle.name]: MetalStyle
};

// 注册样式
export function registerStyle(style: BoardStyle) {
  BOARD_STYLES[style.name] = style;
}

// 获取样式
export function getStyle(name: string): BoardStyle | null {
  return BOARD_STYLES[name] || null;
}

// 获取所有样式名称
export function getStyleNames(): string[] {
  return Object.keys(BOARD_STYLES);
}

// 获取样式列表（包含描述）
export function getStyleList(): Array<{ name: string; description: string }> {
  return Object.values(BOARD_STYLES).map(style => ({
    name: style.name,
    description: style.description
  }));
}