import * as THREE from 'three';
import type { BoardStyle } from './index';

// 金属样式 - 金属质感
const MetalStyle: BoardStyle = {
  name: 'metal',
  description: '金属质感样式',

  createCellGeometry(cellSize: number): THREE.BufferGeometry {
    // 创建圆柱体，像金属硬币
    return new THREE.CylinderGeometry(cellSize * 0.5, cellSize * 0.5, 0.3, 16);
  },

  createMaterials(darkMode: boolean) {
    return {
      stone: new THREE.MeshStandardMaterial({
        color: darkMode ? 0x666666 : 0x999999,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1.0
      }),
      selected: new THREE.MeshStandardMaterial({
        color: darkMode ? 0x8844ff : 0x6a5acd,
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.2,
        emissive: new THREE.Color(darkMode ? 0x220044 : 0x110022),
        emissiveIntensity: 0.3
      }),
      preset: new THREE.MeshStandardMaterial({
        color: darkMode ? 0x888888 : 0xbbbbbb,
        metalness: 0.7,
        roughness: 0.3,
        envMapIntensity: 0.8
      }),
      conflict: new THREE.MeshStandardMaterial({
        color: 0xff4444,
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.2,
        emissive: new THREE.Color(0x440000),
        emissiveIntensity: 0.4
      })
    };
  },

  getCellPosition(row: number, col: number, cellSize: number, spacing: number, totalSize: number): THREE.Vector3 {
    const startX = -totalSize / 2 + cellSize / 2;
    const startZ = -totalSize / 2 + cellSize / 2;
    return new THREE.Vector3(
      startX + col * (cellSize + spacing),
      0.15, // 圆柱体的一半高度
      startZ + row * (cellSize + spacing)
    );
  },

  getTextPosition(cellPosition: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(cellPosition.x, 0.31, cellPosition.z);
  },

  getTextRotation(): THREE.Euler {
    return new THREE.Euler(-Math.PI / 2, 0, 0);
  },

  getCameraPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 16, 0);
  },

  getLights(darkMode: boolean): THREE.Light[] {
    const lights: THREE.Light[] = [];
    
    // 环境光
    const ambientLight = new THREE.AmbientLight(darkMode ? 0x404040 : 0x606060, 0.3);
    lights.push(ambientLight);
    
    // 主光源 - 强一点以突出金属反射
    const directionalLight = new THREE.DirectionalLight(darkMode ? 0xffffff : 0xffffff, 1.2);
    directionalLight.position.set(0, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    lights.push(directionalLight);
    
    // 侧面光源增强金属质感
    const sideLight1 = new THREE.DirectionalLight(darkMode ? 0x4488ff : 0xffffff, 0.4);
    sideLight1.position.set(15, 10, 0);
    lights.push(sideLight1);
    
    const sideLight2 = new THREE.DirectionalLight(darkMode ? 0xff8844 : 0xffffff, 0.4);
    sideLight2.position.set(-15, 10, 0);
    lights.push(sideLight2);
    
    // 顶部光源
    const topLight = new THREE.DirectionalLight(darkMode ? 0xffffff : 0xffffff, 0.3);
    topLight.position.set(0, 25, 0);
    lights.push(topLight);
    
    return lights;
  },

  getSceneBackground(darkMode: boolean): THREE.Color {
    return new THREE.Color(darkMode ? 0x001122 : 0xf5f5f5);
  }
};

export default MetalStyle;