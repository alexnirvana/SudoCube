<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../../store/game';
import * as THREE from 'three';

// 定义props
const props = defineProps<{
  darkMode: boolean;
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

// 材质
let stoneMaterial: THREE.MeshPhongMaterial;
let selectedMaterial: THREE.MeshPhongMaterial;
let presetMaterial: THREE.MeshPhongMaterial;
let conflictMaterial: THREE.MeshPhongMaterial;

// 字体加载器 (暂时不使用，可能在后续版本中添加)
// let fontLoader: THREE.FontLoader;
// let font: THREE.Font;

const initThreeJS = () => {
  if (!canvasRef.value) return;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.darkMode ? 0x000033 : 0xf5f5f5);

  // 创建相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 创建光源
  const ambientLight = new THREE.AmbientLight(props.darkMode ? 0x404040 : 0x808080, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(props.darkMode ? 0xffffff : 0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // 创建射线投射器和鼠标向量
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 创建材质
  createMaterials();

  // 直接创建棋盘，暂时不使用字体
  createBoard();

  // 添加事件监听
  canvasRef.value.addEventListener('click', onCanvasClick);
  canvasRef.value.addEventListener('mousemove', onCanvasMouseMove);
  window.addEventListener('resize', onWindowResize);

  // 开始渲染循环
  animate();
};

const createMaterials = () => {
  // 石头材质
  stoneMaterial = new THREE.MeshPhongMaterial({
    color: props.darkMode ? 0x666666 : 0x888888,
    shininess: 30,
  });

  // 选中材质
  selectedMaterial = new THREE.MeshPhongMaterial({
    color: props.darkMode ? 0xff00ff : 0x6a5acd,
    shininess: 50,
    emissive: props.darkMode ? 0x220022 : 0x110044,
  });

  // 预设材质
  presetMaterial = new THREE.MeshPhongMaterial({
    color: props.darkMode ? 0x999999 : 0xaaaaaa,
    shininess: 40,
  });

  // 冲突材质
  conflictMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4444,
    shininess: 50,
    emissive: 0x330000,
  });
};

const loadFont = () => {
  // 直接创建棋盘，不依赖字体
  createBoard();
};

const createBoard = () => {
  if (boardGroup) {
    scene.remove(boardGroup);
  }

  boardGroup = new THREE.Group();
  cellMeshes = [];
  textMeshes = [];

  const size = gameStore.config.size;
  const cellSize = 0.8;
  const spacing = 0.1;
  const totalSize = size * (cellSize + spacing) - spacing;
  const startX = -totalSize / 2 + cellSize / 2;
  const startZ = -totalSize / 2 + cellSize / 2;

  // 创建格子
  for (let row = 0; row < size; row++) {
    cellMeshes[row] = [];
    textMeshes[row] = [];
    
    for (let col = 0; col < size; col++) {
      // 创建石头格子
      const geometry = new THREE.BoxGeometry(cellSize, 0.2, cellSize);
      const mesh = new THREE.Mesh(geometry, stoneMaterial);
      
      mesh.position.x = startX + col * (cellSize + spacing);
      mesh.position.y = 0;
      mesh.position.z = startZ + row * (cellSize + spacing);
      
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
  
  // 使用简单立方体表示数字
  const geometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
  const material = new THREE.MeshPhongMaterial({
    color: isCellPreset(row, col) ? 
      (props.darkMode ? 0xffffff : 0x333333) : 
      (props.darkMode ? 0xffff00 : 0x1e90ff)
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(cellMeshes[row][col].position);
  mesh.position.y = 0.15;
  
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
        mesh.material = selectedMaterial;
      } else if (isCellPreset(row, col)) {
        mesh.material = presetMaterial;
      } else if (hasCellConflict(row, col)) {
        mesh.material = conflictMaterial;
      } else {
        mesh.material = stoneMaterial;
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
  
  // 简单的相机旋转动画
  const time = Date.now() * 0.0005;
  camera.position.x = Math.cos(time) * 8;
  camera.position.z = Math.sin(time) * 8;
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

watch(() => props.darkMode, () => {
  if (scene) {
    scene.background = new THREE.Color(props.darkMode ? 0x000033 : 0xf5f5f5);
    createMaterials();
    updateBoard();
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