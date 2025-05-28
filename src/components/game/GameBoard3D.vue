<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../../store/game';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { getStyle, getStyleList, type BoardStyle } from '../../core/styles';

// 定义props
const props = defineProps<{
  darkMode: boolean;
  styleName?: string;
}>();

// 定义事件
const emit = defineEmits<{
  'game-complete': [];
  'conflict': [conflictType: string];
}>();

const gameStore = useGameStore();
const canvasRef = ref<HTMLCanvasElement>();

// Three.js相关变量
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let animationId: number;

// 游戏对象
let boardGroup: THREE.Group;
let cellMeshes: THREE.Mesh[][] = [];
let textMeshes: (THREE.Mesh | null)[][] = [];

// 当前样式和材质
let currentStyle: BoardStyle;
let materials: {
  stone: THREE.Material;
  selected: THREE.Material;
  preset: THREE.Material;
  conflict: THREE.Material;
};

// 字体加载器
let fontLoader: FontLoader;
let font: any;

const initThreeJS = () => {
  if (!canvasRef.value) return;

  // 初始化样式
  initStyle();

  // 创建场景
  scene = new THREE.Scene();
  scene.background = currentStyle.getSceneBackground(props.darkMode);

  // 创建相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const cameraPos = currentStyle.getCameraPosition();
  camera.position.copy(cameraPos);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 添加光源
  const lights = currentStyle.getLights(props.darkMode);
  lights.forEach(light => scene.add(light));

  // 创建射线投射器和鼠标向量
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 创建材质
  materials = currentStyle.createMaterials(props.darkMode);

  // 加载字体并创建棋盘
  loadFont();

  // 添加事件监听
  canvasRef.value.addEventListener('click', onCanvasClick);
  canvasRef.value.addEventListener('mousemove', onCanvasMouseMove);
  window.addEventListener('resize', onWindowResize);

  // 开始渲染循环
  animate();
};

const initStyle = () => {
  // 获取样式，默认使用图片样式
  const styleName = props.styleName || 'image';
  const style = getStyle(styleName);
  if (!style) {
    console.warn(`样式 '${styleName}' 不存在，使用默认样式`);
    currentStyle = getStyle('stone')!;
  } else {
    currentStyle = style;
  }
};



const loadFont = () => {
  fontLoader = new FontLoader();
  
  // 尝试加载字体，失败则使用备用方案
  fontLoader.load(
    'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
    (loadedFont) => {
      font = loadedFont;
      console.log('字体加载成功');
      createBoard();
    },
    (progress) => {
      console.log('字体加载中...', progress);
    },
    (error) => {
      console.warn('字体加载失败，使用简单几何体:', error);
      font = null;
      createBoard();
    }
  );
};

const createBoard = () => {
  if (boardGroup) {
    scene.remove(boardGroup);
  }

  boardGroup = new THREE.Group();
  cellMeshes = [];
  textMeshes = [];

  const size = gameStore.config.size;
  const cellSize = 1.2;
  const spacing = 0.15;
  const totalSize = size * (cellSize + spacing) - spacing;

  // 创建格子
  for (let row = 0; row < size; row++) {
    cellMeshes[row] = [];
    textMeshes[row] = [];
    
    for (let col = 0; col < size; col++) {
      // 使用样式系统创建几何体
      const geometry = currentStyle.createCellGeometry(cellSize);
      const mesh = new THREE.Mesh(geometry, materials.stone);
      
      // 使用样式系统计算位置
      const position = currentStyle.getCellPosition(row, col, cellSize, spacing, totalSize);
      mesh.position.copy(position);
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { row, col };
      
      cellMeshes[row][col] = mesh;
      boardGroup.add(mesh);

      // 创建数字文本
      createNumberText(row, col);
    }
  }

  scene.add(boardGroup);
  updateBoard();
};

const createNumberText = (row: number, col: number) => {
  const value = getCellValue(row, col);
  if (value === 0) {
    if (textMeshes[row] && textMeshes[row][col]) {
      boardGroup.remove(textMeshes[row][col]);
      textMeshes[row][col] = null;
    }
    return;
  }

  // 移除旧的文本
  if (textMeshes[row] && textMeshes[row][col]) {
    boardGroup.remove(textMeshes[row][col]);
  }

  const text = formatCellValue(value);
  let geometry: THREE.BufferGeometry;
  let material: THREE.Material;
  
  // 检查当前样式是否支持手写数字材质
  if (currentStyle.createNumberMaterial) {
    // 使用手写数字材质 - 创建平面几何体作为载体
    geometry = new THREE.PlaneGeometry(0.8, 0.8);
    material = currentStyle.createNumberMaterial(text, props.darkMode);
  } else {
    // 使用传统3D文字或备用方案
    if (font) {
      // 使用3D文字几何体
      geometry = new TextGeometry(text, {
        font: font,
        size: 0.5, // 增大文字尺寸
        height: 0.03, // 稍微增加文字厚度
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.008,
        bevelOffset: 0,
        bevelSegments: 3
      });
      
      // 居中文字
      geometry.computeBoundingBox();
      const centerOffsetX = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
      const centerOffsetY = -0.5 * (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y);
      const centerOffsetZ = -0.5 * (geometry.boundingBox!.max.z - geometry.boundingBox!.min.z);
      geometry.translate(centerOffsetX, centerOffsetY, centerOffsetZ);
    } else {
      // 备用方案：使用更薄的立方体
      geometry = new THREE.BoxGeometry(0.5, 0.08, 0.5);
    }
    
    material = new THREE.MeshPhongMaterial({
      color: isCellPreset(row, col) ? 
        (props.darkMode ? 0xffffff : 0x333333) : 
        (props.darkMode ? 0xffff00 : 0x1e90ff),
      shininess: 100,
      specular: 0x222222
    });
  }
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // 使用样式系统计算文本位置和旋转
  const cellPosition = cellMeshes[row][col].position;
  const textPosition = currentStyle.getTextPosition(cellPosition);
  mesh.position.copy(textPosition);
  
  // 使用样式系统的文本旋转
  if (currentStyle.createNumberMaterial) {
    // 手写数字材质使用平面，需要不同的旋转
    const textRotation = currentStyle.getTextRotation();
    mesh.rotation.copy(textRotation);
  } else if (font) {
    const textRotation = currentStyle.getTextRotation();
    mesh.rotation.copy(textRotation);
  }
  
  mesh.castShadow = true;
  
  if (!textMeshes[row]) {
    textMeshes[row] = [];
  }
  textMeshes[row][col] = mesh;
  boardGroup.add(mesh);
};

const updateBoard = () => {
  if (!cellMeshes.length) return;

  const size = gameStore.config.size;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const mesh = cellMeshes[row][col];
      if (!mesh) continue;

      // 更新格子材质
      if (isCellSelected(row, col)) {
        mesh.material = materials.selected;
      } else if (isCellPreset(row, col)) {
        mesh.material = materials.preset;
      } else if (hasCellConflict(row, col)) {
        mesh.material = materials.conflict;
      } else {
        mesh.material = materials.stone;
      }

      // 更新数字文本
      createNumberText(row, col);
    }
  }
};

const onCanvasClick = (event: MouseEvent) => {
  event.preventDefault();
  
  const rect = canvasRef.value!.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cellMeshes.flat());

  if (intersects.length > 0) {
    const userData = intersects[0].object.userData;
    handleCellClick(userData.row, userData.col);
  }
};

const onCanvasMouseMove = (event: MouseEvent) => {
  const rect = canvasRef.value!.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cellMeshes.flat());

  // 重置所有格子的悬停状态
  cellMeshes.flat().forEach(mesh => {
    if (mesh.userData.isHovered) {
      mesh.userData.isHovered = false;
      mesh.scale.set(1, 1, 1);
    }
  });

  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh;
    mesh.userData.isHovered = true;
    mesh.scale.set(1.05, 1.2, 1.05);
    canvasRef.value!.style.cursor = 'pointer';
  } else {
    canvasRef.value!.style.cursor = 'default';
  }
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  
  // 保持相机固定位置，面向棋盘
  camera.lookAt(0, 0, 0);
  
  renderer.render(scene, camera);
};

// 游戏逻辑方法
const handleCellClick = (row: number, col: number) => {
  if (isCellPreset(row, col)) {
    gameStore.selectedCell = null;
    updateBoard();
    return;
  }
  gameStore.selectCell(row, col);
  updateBoard();
};

const getCellValue = (row: number, col: number) => {
  if (!gameStore.board || !gameStore.board[row]) {
    return 0;
  }
  return gameStore.board[row][col] || 0;
};

const isCellSelected = (row: number, col: number) => {
  return gameStore.selectedCell?.row === row && gameStore.selectedCell?.col === col;
};

const isCellPreset = (row: number, col: number) => {
  if (!gameStore.preset || !gameStore.preset[row]) {
    return false;
  }
  return gameStore.preset[row][col];
};

const hasCellConflict = (row: number, col: number) => {
  if (!gameStore.board || !gameStore.board.length) {
    return false;
  }
  return gameStore.hasConflictAt(row, col);
};

const formatCellValue = (value: number) => {
  if (value <= 9) return value.toString();
  return String.fromCharCode(65 + value - 10);
};

// 检查数字是否会产生冲突
const wouldCauseConflict = (row: number, col: number, value: number): string | null => {
  if (!gameStore.board || value === 0) return null;
  
  // 检查行冲突
  for (let c = 0; c < gameStore.config.size; c++) {
    if (c !== col && gameStore.board[row][c] === value) {
      return 'row';
    }
  }

  // 检查列冲突
  for (let r = 0; r < gameStore.config.size; r++) {
    if (r !== row && gameStore.board[r][col] === value) {
      return 'column';
    }
  }

  // 检查子宫格冲突
  const startRow = row - (row % gameStore.config.subRows);
  const startCol = col - (col % gameStore.config.subCols);
  
  for (let i = 0; i < gameStore.config.subRows; i++) {
    for (let j = 0; j < gameStore.config.subCols; j++) {
      const r = startRow + i;
      const c = startCol + j;
      if ((r !== row || c !== col) && gameStore.board[r][c] === value) {
        return 'box';
      }
    }
  }

  return null;
};

// 处理数字面板点击
const handleNumberClick = (value: number) => {
  if (!gameStore.selectedCell) return;
  
  const { row, col } = gameStore.selectedCell;
  
  // 如果是删除操作（value = 0），直接执行
  if (value === 0) {
    gameStore.setCell(row, col, value);
    return;
  }
  
  // 检查是否会产生冲突
  const conflictType = wouldCauseConflict(row, col, value);
  if (conflictType) {
    emit('conflict', conflictType);
    return;
  }
  
  // 没有冲突，正常设置
  gameStore.setCell(row, col, value);
};

// 生成数字面板选项
const getNumberOptions = () => {
  const options = [];
  for (let i = 1; i <= gameStore.config.size; i++) {
    options.push({
      value: i,
      display: formatCellValue(i)
    });
  }
  return options;
};

// 处理键盘输入
const handleKeyPress = (event: KeyboardEvent) => {
  if (!gameStore.selectedCell) return;
  
  // 如果当前选中的是预设格子，不允许键盘输入
  if (isCellPreset(gameStore.selectedCell.row, gameStore.selectedCell.col)) {
    return;
  }
  
  const key = event.key;
  const maxValue = gameStore.config.size;
  
  // 处理数字键 1-9
  if (key >= '1' && key <= '9') {
    const value = parseInt(key);
    if (value <= maxValue) {
      handleNumberClick(value);
    }
  }
  // 处理字母键 A-F (对应10-15)
  else if (key >= 'A' && key <= 'F') {
    const value = key.charCodeAt(0) - 65 + 10; // A=10, B=11, etc.
    if (value <= maxValue) {
      handleNumberClick(value);
    }
  }
  else if (key >= 'a' && key <= 'f') {
    const value = key.charCodeAt(0) - 97 + 10; // a=10, b=11, etc.
    if (value <= maxValue) {
      handleNumberClick(value);
    }
  }
  // 删除
  else if (key === 'Delete' || key === 'Backspace' || key === '0') {
    handleNumberClick(0);
  }
};

// 监听游戏状态变化
watch(() => gameStore.board, () => {
  updateBoard();
}, { deep: true });

watch(() => gameStore.selectedCell, () => {
  updateBoard();
});

watch(() => gameStore.isComplete, (isComplete) => {
  if (isComplete) {
    emit('game-complete');
  }
});

// 样式切换功能
const changeStyle = (styleName: string) => {
  const style = getStyle(styleName);
  if (!style) {
    console.warn(`样式 '${styleName}' 不存在`);
    return;
  }
  
  currentStyle = style;
  
  if (scene) {
    // 清除旧的光源
    const lightsToRemove = scene.children.filter(child => child instanceof THREE.Light);
    lightsToRemove.forEach(light => scene.remove(light));
    
    // 添加新的光源
    const lights = currentStyle.getLights(props.darkMode);
    lights.forEach(light => scene.add(light));
    
    // 更新场景背景
    scene.background = currentStyle.getSceneBackground(props.darkMode);
    
    // 更新相机位置
    const cameraPos = currentStyle.getCameraPosition();
    camera.position.copy(cameraPos);
    
    // 重新创建材质
    materials = currentStyle.createMaterials(props.darkMode);
    
    // 重新创建棋盘
    createBoard();
  }
};

// 获取可用样式列表
const getAvailableStyles = () => {
  return getStyleList();
};

watch(() => props.darkMode, () => {
  if (scene && currentStyle) {
    // 清除旧的光源
    const lightsToRemove = scene.children.filter(child => child instanceof THREE.Light);
    lightsToRemove.forEach(light => scene.remove(light));
    
    // 添加新的光源
    const lights = currentStyle.getLights(props.darkMode);
    lights.forEach(light => scene.add(light));
    
    // 更新场景背景
    scene.background = currentStyle.getSceneBackground(props.darkMode);
    
    // 重新创建材质
    materials = currentStyle.createMaterials(props.darkMode);
    
    updateBoard();
  }
});

watch(() => props.styleName, (newStyleName) => {
  if (newStyleName) {
    changeStyle(newStyleName);
  }
});

onMounted(() => {
  initThreeJS();
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('click', onCanvasClick);
    canvasRef.value.removeEventListener('mousemove', onCanvasMouseMove);
  }
  window.removeEventListener('resize', onWindowResize);
  document.removeEventListener('keydown', handleKeyPress);
  if (renderer) {
    renderer.dispose();
  }
});

// 暴露给父组件的方法
defineExpose({
  changeStyle,
  getAvailableStyles
});
</script>

<template>
  <div class="game-board-3d">
    <canvas ref="canvasRef"></canvas>
    
    <!-- 数字输入面板 (3D模式也需要) -->
    <div v-if="gameStore.selectedCell && !isCellPreset(gameStore.selectedCell.row, gameStore.selectedCell.col)" class="number-panel">
      <div class="number-grid">
        <button
          v-for="option in getNumberOptions()"
          :key="option.value"
          class="number-btn"
          @click="handleNumberClick(option.value)"
        >
          {{ option.display }}
        </button>
        <button
          class="number-btn delete-btn"
          @click="handleNumberClick(0)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-board-3d {
  width: 100%;
  height: 100%;
  position: relative;
}

.game-board-3d canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* 数字输入面板 */
.number-panel {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 10px;
  background: var(--control-bg);
  padding: 20px;
  border-radius: 15px;
  border: 2px solid var(--grid-color);
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.5),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  max-width: 90vw;
}

.number-btn {
  width: 50px;
  height: 50px;
  background: var(--button-bg);
  border: 2px solid var(--grid-color);
  border-radius: 10px;
  color: var(--grid-color);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 0 10px var(--grid-color);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-btn:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.6),
    inset 0 0 15px rgba(0, 255, 255, 0.2);
  transform: translateY(-2px);
}

.number-btn:active {
  transform: translateY(0);
}

.delete-btn {
  background: rgba(255, 0, 0, 0.1);
  border-color: #ff0000;
  color: #ff0000;
  text-shadow: 0 0 10px #ff0000;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
}

.delete-btn:hover {
  background: rgba(255, 0, 0, 0.2);
  box-shadow: 
    0 0 20px rgba(255, 0, 0, 0.6),
    inset 0 0 15px rgba(255, 0, 0, 0.2);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .number-panel {
    bottom: 10px;
  }
  
  .number-grid {
    padding: 15px;
    gap: 8px;
    grid-template-columns: repeat(auto-fit, minmax(40px, 1fr)) !important;
  }
  
  .number-btn {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .number-grid {
    padding: 10px;
    gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(35px, 1fr)) !important;
  }
  
  .number-btn {
    width: 35px;
    height: 35px;
    font-size: 12px;
  }
}
</style>