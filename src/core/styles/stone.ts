import * as THREE from 'three';
import type { BoardStyle } from './index';

// 创建手写风格数字纹理
function createHandwrittenNumberTexture(number: string, darkMode: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // 背景
  const bgColor = darkMode ? '#2a2a2a' : '#e8e8e8';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // 添加纸张纹理
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = Math.random() * 0.1;
    ctx.fillStyle = darkMode ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }
  
  // 数字颜色 - 类似图片中的深色
  ctx.fillStyle = darkMode ? '#1a1a1a' : '#2d2d2d';
  ctx.font = 'bold 180px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 添加手写效果 - 多次绘制略微偏移的文字
  const centerX = size / 2;
  const centerY = size / 2;
  
  // 主要文字
  ctx.fillText(number, centerX, centerY);
  
  // 添加纹理效果
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 5; i++) {
    const offsetX = (Math.random() - 0.5) * 2;
    const offsetY = (Math.random() - 0.5) * 2;
    ctx.fillStyle = darkMode ? '#0a0a0a' : '#1a1a1a';
    ctx.fillText(number, centerX + offsetX, centerY + offsetY);
  }
  
  // 添加边缘磨损效果
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 石头样式 - 手写数字效果
const StoneStyle: BoardStyle = {
  name: 'stone',
  description: '手写数字石头材质',

  createCellGeometry(cellSize: number): THREE.BufferGeometry {
    return new THREE.BoxGeometry(cellSize, 0.15, cellSize);
  },

  createMaterials(darkMode: boolean) {
    // 创建基础材质
    const baseMaterial = {
      transparent: true,
      opacity: 0.9
    };
    
    return {
      stone: new THREE.MeshLambertMaterial({
        ...baseMaterial,
        color: darkMode ? 0x3a3a3a : 0xd0d0d0,
      }),
      selected: new THREE.MeshLambertMaterial({
        ...baseMaterial,
        color: darkMode ? 0x4a4a6a : 0x9090b0,
        emissive: darkMode ? 0x1a1a2a : 0x2a2a4a,
      }),
      preset: new THREE.MeshLambertMaterial({
        ...baseMaterial,
        color: darkMode ? 0x4a4a4a : 0xc0c0c0,
      }),
      conflict: new THREE.MeshLambertMaterial({
        ...baseMaterial,
        color: 0x6a3a3a,
        emissive: 0x2a1a1a,
      })
    };
  },

  // 创建数字材质的新方法
  createNumberMaterial(number: string, darkMode: boolean): THREE.MeshBasicMaterial {
    const texture = createHandwrittenNumberTexture(number, darkMode);
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1
    });
  },

  getCellPosition(row: number, col: number, cellSize: number, spacing: number, totalSize: number): THREE.Vector3 {
    const startX = -totalSize / 2 + cellSize / 2;
    const startZ = -totalSize / 2 + cellSize / 2;
    return new THREE.Vector3(
      startX + col * (cellSize + spacing),
      0.075, // 适配更薄的几何体
      startZ + row * (cellSize + spacing)
    );
  },

  getTextPosition(cellPosition: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(cellPosition.x, 0.151, cellPosition.z); // 适配新高度
  },

  getTextRotation(): THREE.Euler {
    return new THREE.Euler(-Math.PI / 2, 0, 0);
  },

  getCameraPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 12, 0); // 降低相机高度
  },

  getLights(darkMode: boolean): THREE.Light[] {
    const lights: THREE.Light[] = [];
    
    // 环境光 - 增强以突出手写纹理
    const ambientLight = new THREE.AmbientLight(darkMode ? 0x505050 : 0x909090, 0.7);
    lights.push(ambientLight);
    
    // 主光源 - 柔和光照
    const directionalLight = new THREE.DirectionalLight(darkMode ? 0xffffff : 0xffffff, 0.5);
    directionalLight.position.set(0, 15, 8);
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
    
    // 填充光 - 减少阴影对比度
    const fillLight = new THREE.DirectionalLight(darkMode ? 0x6666aa : 0xaaaaff, 0.2);
    fillLight.position.set(-5, 8, -5);
    lights.push(fillLight);
    
    return lights;
  },

  getSceneBackground(darkMode: boolean): THREE.Color {
    return new THREE.Color(darkMode ? 0x1a1a1a : 0xf0f0f0); // 调整背景色调
  }
};

export default StoneStyle;