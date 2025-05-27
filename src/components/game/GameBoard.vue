<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useGameStore } from '../../store/game';

// 定义props
const props = defineProps<{
  darkMode: boolean;
}>();

const gameStore = useGameStore();

// 定义事件
const emit = defineEmits<{
  'game-complete': [];
  'conflict': [conflictType: string];
}>();

// 处理格子点击
const handleCellClick = (row: number, col: number) => {
  // 如果是预设格子（题目数字），则不允许选择
  if (isCellPreset(row, col)) {
    // 如果点击了预设格子，取消当前选择
    gameStore.selectedCell = null;
    return;
  }
  gameStore.selectCell(row, col);
};

// 检查数字是否会产生冲突（不修改实际数据）
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
    console.log(`在位置 (${row}, ${col}) 输入数字 ${value} 会导致 ${conflictType} 冲突`); // 调试信息
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

// 获取格子的值
const getCellValue = (row: number, col: number) => {
  if (!gameStore.board || !gameStore.board[row]) {
    return 0;
  }
  return gameStore.board[row][col] || 0;
};

// 检查格子是否被选中
const isCellSelected = (row: number, col: number) => {
  return gameStore.selectedCell?.row === row && gameStore.selectedCell?.col === col;
};

// 检查格子是否为预设（题目数字）
const isCellPreset = (row: number, col: number) => {
  if (!gameStore.preset || !gameStore.preset[row]) {
    return false;
  }
  return gameStore.preset[row][col];
};

// 格式化数字显示（大于9的数字用字母表示）
const formatCellValue = (value: number) => {
  if (value <= 9) return value.toString();
  return String.fromCharCode(65 + value - 10); // A=10, B=11, etc.
};

// 检查格子是否有冲突
const hasCellConflict = (row: number, col: number) => {
  // 确保游戏已初始化
  if (!gameStore.board || !gameStore.board.length) {
    return false;
  }
  return gameStore.hasConflictAt(row, col);
};

// 检查格子是否与当前选中格子冲突
const isConflictWithSelected = (row: number, col: number) => {
  if (!gameStore.selectedCell || !gameStore.board || !gameStore.board.length) return false;
  
  const selectedRow = gameStore.selectedCell.row;
  const selectedCol = gameStore.selectedCell.col;
  
  // 确保选中的格子索引有效
  if (!gameStore.board[selectedRow] || selectedRow < 0 || selectedRow >= gameStore.config.size || 
      selectedCol < 0 || selectedCol >= gameStore.config.size) {
    return false;
  }
  
  // 如果没有选中的格子值，则不显示冲突
  if (gameStore.board[selectedRow][selectedCol] === 0) return false;
  
  const conflicts = gameStore.getConflictCells(selectedRow, selectedCol);
  return conflicts.some(conflict => conflict.row === row && conflict.col === col);
};

// 获取格子的CSS类
const getCellClass = (row: number, col: number) => {
  const classes = ['sudoku-cell'];
  
  if (isCellSelected(row, col)) {
    classes.push('selected');
  }
  
  // 如果是预设格子，添加特殊样式
  if (isCellPreset(row, col)) {
    classes.push('preset-cell');
  }
  
  // 如果格子有冲突，添加冲突样式
  if (hasCellConflict(row, col)) {
    classes.push('conflict-cell');
  }
  
  // 如果格子与当前选中格子冲突，添加冲突高亮
  if (isConflictWithSelected(row, col)) {
    classes.push('conflict-highlight');
  }
  
  // 添加子宫格边框（动态计算）
  const subRows = gameStore.config.subRows;
  const subCols = gameStore.config.subCols;
  
  if (row % subRows === 0) classes.push('border-top');
  if (col % subCols === 0) classes.push('border-left');
  if (row % subRows === subRows - 1) classes.push('border-bottom');
  if (col % subCols === subCols - 1) classes.push('border-right');
  
  return classes.join(' ');
};

// 监听游戏完成状态
watch(() => gameStore.isComplete, (isComplete) => {
  if (isComplete) {
    emit('game-complete');
  }
});

onMounted(() => {
  // 让游戏区域获得焦点，这样键盘事件就能正常工作
  const gameBoard = document.querySelector('.game-board') as HTMLElement;
  if (gameBoard) {
    gameBoard.focus();
  }
});
</script>

<template>
  <div class="game-board" tabindex="0" @keydown="handleKeyPress">
    <!-- 星空背景 -->
    <div class="stars-background">
      <div class="star" v-for="i in 50" :key="i" 
           :style="{
             left: Math.random() * 100 + '%',
             top: Math.random() * 100 + '%',
             animationDelay: Math.random() * 3 + 's'
           }"></div>
    </div>
    
    <!-- 数独网格 -->
    <div class="sudoku-grid" :class="`size-${gameStore.config.size}`">
      <div 
        v-for="row in gameStore.config.size" 
        :key="row" 
        class="sudoku-row"
      >
        <div
          v-for="col in gameStore.config.size"
          :key="col"
          :class="getCellClass(row - 1, col - 1)"
          @click="handleCellClick(row - 1, col - 1)"
        >
          <span 
            v-if="getCellValue(row - 1, col - 1) > 0"
            class="cell-number"
            :class="{ 
              'preset-number': isCellPreset(row - 1, col - 1),
              'user-number': !isCellPreset(row - 1, col - 1)
            }"
          >
            {{ formatCellValue(getCellValue(row - 1, col - 1)) }}
          </span>
          <span 
            v-else-if="isCellSelected(row - 1, col - 1)"
            class="cell-selected-mark"
          >
            ×
          </span>
        </div>
      </div>
    </div>

    <!-- 数字输入面板 -->
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
.game-board {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background: var(--background-color);
  overflow: hidden;
  outline: none; /* 移除焦点边框 */
  transition: all 0.3s ease;
}

/* 星空背景 */
.stars-background {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #00ffff;
  border-radius: 50%;
  animation: twinkle 3s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* 数独网格 */
.sudoku-grid {
  display: flex;
  flex-direction: column;
  border: 2px solid var(--grid-color);
  border-radius: 8px;
  background: var(--board-bg);
  box-shadow: 
    0 0 20px var(--grid-color),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.sudoku-row {
  display: flex;
}

.sudoku-cell {
  width: 50px;
  height: 50px;
  border: 1px solid var(--grid-color);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background: var(--cell-bg);
  transition: all 0.3s ease;
  position: relative;
}

.sudoku-cell:hover {
  background: var(--hover-bg);
  box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.3);
}

.sudoku-cell.selected {
  background: var(--selected-bg);
  box-shadow: 
    0 0 15px var(--primary-color),
    inset 0 0 15px rgba(255, 0, 255, 0.3);
}

.sudoku-cell.preset-cell {
  background: var(--preset-bg);
  cursor: not-allowed;
}

.sudoku-cell.preset-cell:hover {
  background: var(--preset-bg); /* 悬停时保持相同背景 */
  box-shadow: none; /* 移除悬停效果 */
}

/* 冲突格子样式 */
.sudoku-cell.conflict-cell {
  background: var(--conflict-bg);
  border-color: #ff0000;
  animation: conflictPulse 1.5s ease-in-out infinite;
}

.sudoku-cell.conflict-cell .cell-number {
  color: #ff4444 !important;
  text-shadow: 0 0 15px #ff4444;
}

/* 与选中格子冲突的高亮 */
.sudoku-cell.conflict-highlight {
  background: rgba(255, 100, 100, 0.3);
  box-shadow: 
    0 0 15px rgba(255, 100, 100, 0.6),
    inset 0 0 10px rgba(255, 100, 100, 0.3);
}

/* 冲突脉搏动画 */
@keyframes conflictPulse {
  0%, 100% {
    box-shadow: 
      0 0 10px rgba(255, 0, 0, 0.5),
      inset 0 0 10px rgba(255, 0, 0, 0.2);
  }
  50% {
    box-shadow: 
      0 0 20px rgba(255, 0, 0, 0.8),
      inset 0 0 15px rgba(255, 0, 0, 0.4);
  }
}

/* 子宫格边框 */
.sudoku-cell.border-top {
  border-top: 3px solid #00ffff;
}

.sudoku-cell.border-left {
  border-left: 3px solid #00ffff;
}

.sudoku-cell.border-bottom {
  border-bottom: 3px solid #00ffff;
}

.sudoku-cell.border-right {
  border-right: 3px solid #00ffff;
}

/* 数字样式 */
.cell-number {
  font-size: 24px;
  font-weight: bold;
  user-select: none;
  transition: all 0.3s ease;
}

/* 题目预设数字（白色） */
.cell-number.preset-number {
  color: var(--preset-text);
  text-shadow: 0 0 10px var(--preset-text);
}

/* 用户输入数字（黄色） */
.cell-number.user-number {
  color: #ffff00;
  text-shadow: 0 0 10px #ffff00;
}

/* 选中标记 */
.cell-selected-mark {
  font-size: 30px;
  font-weight: bold;
  color: #ff0000;
  text-shadow: 0 0 15px #ff0000;
  user-select: none;
}

/* 不同尺寸的棋盘样式 */
.sudoku-grid.size-4 .sudoku-cell {
  width: 60px;
  height: 60px;
}

.sudoku-grid.size-6 .sudoku-cell {
  width: 55px;
  height: 55px;
}

.sudoku-grid.size-8 .sudoku-cell {
  width: 45px;
  height: 45px;
}

.sudoku-grid.size-9 .sudoku-cell {
  width: 50px;
  height: 50px;
}

.sudoku-grid.size-12 .sudoku-cell {
  width: 35px;
  height: 35px;
}

.sudoku-grid.size-12 .cell-number {
  font-size: 18px;
}

.sudoku-grid.size-16 .sudoku-cell {
  width: 28px;
  height: 28px;
}

.sudoku-grid.size-16 .cell-number {
  font-size: 14px;
}

.sudoku-grid.size-16 .cell-selected-mark {
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sudoku-cell {
    width: 35px !important;
    height: 35px !important;
  }
  
  .cell-number {
    font-size: 18px !important;
  }
  
  .cell-selected-mark {
    font-size: 22px !important;
  }
  
  .sudoku-grid.size-12 .sudoku-cell,
  .sudoku-grid.size-16 .sudoku-cell {
    width: 25px !important;
    height: 25px !important;
  }
  
  .sudoku-grid.size-12 .cell-number,
  .sudoku-grid.size-16 .cell-number {
    font-size: 12px !important;
  }
}

@media (max-width: 480px) {
  .sudoku-cell {
    width: 30px !important;
    height: 30px !important;
  }
  
  .cell-number {
    font-size: 16px !important;
  }
  
  .cell-selected-mark {
    font-size: 20px !important;
  }
  
  .sudoku-grid.size-12 .sudoku-cell,
  .sudoku-grid.size-16 .sudoku-cell {
    width: 20px !important;
    height: 20px !important;
  }
  
  .sudoku-grid.size-12 .cell-number,
  .sudoku-grid.size-16 .cell-number {
    font-size: 10px !important;
  }
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
  background: rgba(0, 0, 51, 0.95);
  padding: 20px;
  border-radius: 15px;
  border: 2px solid #00ffff;
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.5),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  max-width: 90vw;
}

.number-btn {
  width: 50px;
  height: 50px;
  background: transparent;
  border: 2px solid #00ffff;
  border-radius: 10px;
  color: #00ffff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 0 10px #00ffff;
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

/* 根据棋盘尺寸调整数字面板 */
.sudoku-grid.size-4 + .number-panel .number-grid {
  grid-template-columns: repeat(5, 1fr);
}

.sudoku-grid.size-6 + .number-panel .number-grid {
  grid-template-columns: repeat(7, 1fr);
}

.sudoku-grid.size-8 + .number-panel .number-grid {
  grid-template-columns: repeat(9, 1fr);
}

.sudoku-grid.size-9 + .number-panel .number-grid {
  grid-template-columns: repeat(10, 1fr);
}

.sudoku-grid.size-12 + .number-panel .number-grid {
  grid-template-columns: repeat(7, 1fr);
}

.sudoku-grid.size-16 + .number-panel .number-grid {
  grid-template-columns: repeat(9, 1fr);
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