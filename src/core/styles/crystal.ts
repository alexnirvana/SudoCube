import * as THREE from 'three';
import type { BoardStyle } from './index';

// 水晶样式 - 透明发光效果
const CrystalStyle: BoardStyle = {
  name: 'crystal',
  description: '水晶透明样式',

  createCellGeometry(cellSize: number): THREE.BufferGeometry {
    // 创建八面体几何体，更像水晶
    return new THREE.OctahedronGeometry(cellSize * 0.6, 0);
  },

  createMaterials(darkMode: boolean) {
    return {
      stone: new THREE.MeshPhysicalMaterial({
        color: darkMode ? 0x4488ff : 0x88ccff,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.3,
        ior: 1.5
      }),
      selected: new THREE.MeshPhysicalMaterial({
        color: darkMode ? 0xff44ff : 0xff88ff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transmission: 0.2,
        ior: 1.5,
        emissive: new THREE.Color(darkMode ? 0x330033 : 0x440044),
        emissiveIntensity: 0.5
      }),
      preset: new THREE.MeshPhysicalMaterial({
        color: darkMode ? 0x888888 : 0xcccccc,
        transparent: true,
        opacity: 0.6,
        roughness: 0.2,
        metalness: 0.2,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        transmission: 0.4,
        ior: 1.5
      }),
      conflict: new THREE.MeshPhysicalMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.9,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transmission: 0.1,
        ior: 1.5,
        emissive: new THREE.Color(0x440000),
        emissiveIntensity: 0.6
      })
    };
  },

  getCellPosition(row: number, col: number, cellSize: number, spacing: number, totalSize: number): THREE.Vector3 {
    const startX = -totalSize / 2 + cellSize / 2;
    const startZ = -totalSize / 2 + cellSize / 2;
    return new THREE.Vector3(
      startX + col * (cellSize + spacing),
      0.3, // 稍微高一点，让水晶悬浮
      startZ + row * (cellSize + spacing)
    );
  },

  getTextPosition(cellPosition: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(cellPosition.x, 0.8, cellPosition.z); // 文字在水晶上方
  },

  getTextRotation(): THREE.Euler {
    return new THREE.Euler(-Math.PI / 2, 0, 0);
  },

  getCameraPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 18, 0); // 更高的视角
  },

  getLights(darkMode: boolean): THREE.Light[] {
    const lights: THREE.Light[] = [];
    
    // 强环境光
    const ambientLight = new THREE.AmbientLight(darkMode ? 0x404080 : 0x8080c0, 0.8);
    lights.push(ambientLight);
    
    // 主光源
    const directionalLight = new THREE.DirectionalLight(darkMode ? 0xffffff : 0xffffff, 1.0);
    directionalLight.position.set(0, 25, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -12;
    directionalLight.shadow.camera.right = 12;
    directionalLight.shadow.camera.top = 12;
    directionalLight.shadow.camera.bottom = -12;
    lights.push(directionalLight);
    
    // 多个彩色点光源增强水晶效果
    const pointLight1 = new THREE.PointLight(0x4488ff, 0.5, 20);
    pointLight1.position.set(5, 10, 5);
    lights.push(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff4488, 0.5, 20);
    pointLight2.position.set(-5, 10, -5);
    lights.push(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0x88ff44, 0.3, 15);
    pointLight3.position.set(0, 15, 0);
    lights.push(pointLight3);
    
    return lights;
  },

  getSceneBackground(darkMode: boolean): THREE.Color {
    return new THREE.Color(darkMode ? 0x000044 : 0xf0f0ff);
  }
};

export default CrystalStyle;