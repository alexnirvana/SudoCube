import * as THREE from 'three';
import type { BoardStyle } from './index';

// 图片样式 - 使用纹理贴图
const ImageStyle: BoardStyle = {
  name: 'image',
  description: '图片纹理样式',

  createCellGeometry(cellSize: number): THREE.BufferGeometry {
    // 创建稍微扁平的立方体，更像图片卡片
    return new THREE.BoxGeometry(cellSize, 0.15, cellSize);
  },

  createMaterials(darkMode: boolean) {
    // 创建纹理加载器
    const textureLoader = new THREE.TextureLoader();
    
    // 创建画布纹理用于不同状态
    const createCanvasTexture = (color: string, pattern: 'solid' | 'gradient' | 'border' = 'solid') => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      if (pattern === 'gradient') {
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
      } else if (pattern === 'border') {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = darkMode ? '#ffffff' : '#000000';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 248);
        return new THREE.CanvasTexture(canvas);
      } else {
        ctx.fillStyle = color;
      }
      
      ctx.fillRect(0, 0, 256, 256);
      
      // 添加一些纹理细节
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      return new THREE.CanvasTexture(canvas);
    };
    
    // 普通状态纹理
    const stoneTexture = createCanvasTexture(darkMode ? '#666666' : '#cccccc', 'solid');
    stoneTexture.wrapS = THREE.RepeatWrapping;
    stoneTexture.wrapT = THREE.RepeatWrapping;
    
    // 选中状态纹理
    const selectedTexture = createCanvasTexture(darkMode ? '#ff00ff' : '#6a5acd', 'gradient');
    
    // 预设状态纹理
    const presetTexture = createCanvasTexture(darkMode ? '#888888' : '#dddddd', 'border');
    
    // 冲突状态纹理
    const conflictTexture = createCanvasTexture('#ff4444', 'gradient');
    
    return {
      stone: new THREE.MeshLambertMaterial({
        map: stoneTexture,
        transparent: true,
        opacity: 0.9
      }),
      selected: new THREE.MeshLambertMaterial({
        map: selectedTexture,
        transparent: true,
        opacity: 0.95,
        emissive: new THREE.Color(darkMode ? 0x330033 : 0x220044),
        emissiveIntensity: 0.3
      }),
      preset: new THREE.MeshLambertMaterial({
        map: presetTexture,
        transparent: true,
        opacity: 0.8
      }),
      conflict: new THREE.MeshLambertMaterial({
        map: conflictTexture,
        transparent: true,
        opacity: 0.95,
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
      0.075, // 更低的位置，因为卡片更薄
      startZ + row * (cellSize + spacing)
    );
  },

  getTextPosition(cellPosition: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(cellPosition.x, 0.151, cellPosition.z);
  },

  getTextRotation(): THREE.Euler {
    return new THREE.Euler(-Math.PI / 2, 0, 0);
  },

  getCameraPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 12, 0); // 稍微低一点的视角
  },

  getLights(darkMode: boolean): THREE.Light[] {
    const lights: THREE.Light[] = [];
    
    // 更柔和的环境光
    const ambientLight = new THREE.AmbientLight(darkMode ? 0x505050 : 0x909090, 0.6);
    lights.push(ambientLight);
    
    // 主光源 - 更柔和
    const directionalLight = new THREE.DirectionalLight(darkMode ? 0xffffff : 0xffffff, 0.6);
    directionalLight.position.set(0, 15, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 30;
    directionalLight.shadow.camera.left = -8;
    directionalLight.shadow.camera.right = 8;
    directionalLight.shadow.camera.top = 8;
    directionalLight.shadow.camera.bottom = -8;
    lights.push(directionalLight);
    
    // 填充光
    const fillLight = new THREE.DirectionalLight(darkMode ? 0x6666ff : 0xffffff, 0.2);
    fillLight.position.set(-5, 8, -5);
    lights.push(fillLight);
    
    return lights;
  },

  getSceneBackground(darkMode: boolean): THREE.Color {
    return new THREE.Color(darkMode ? 0x001122 : 0xf8f8f8);
  }
};

export default ImageStyle;