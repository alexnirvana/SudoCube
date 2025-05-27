<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../../store/game';
import { generateSudoku } from '../../core/generator';

// 定义props
const props = defineProps<{
  darkMode: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  'toggle-dark-mode': [];
}>();

const gameStore = useGameStore();

// 棋盘规模选项
const boardSizes = [
  { label: '4×4', size: 4, subRows: 2, subCols: 2 },
  { label: '6×6', size: 6, subRows: 2, subCols: 3 },
  { label: '8×8', size: 8, subRows: 2, subCols: 4 },
  { label: '9×9', size: 9, subRows: 3, subCols: 3 },
  { label: '12×12', size: 12, subRows: 3, subCols: 4 },
  { label: '16×16', size: 16, subRows: 4, subCols: 4 }
];

// 当前选择的规模
const selectedSize = ref(boardSizes[3]); // 默认9×9

// 显示规模选择器
const showSizeSelector = ref(false);

// 难度选项
const difficulties = [
  { label: '简单', value: 'easy' as const },
  { label: '中等', value: 'medium' as const },
  { label: '困难', value: 'hard' as const }
];

// 当前选择的难度
const selectedDifficulty = ref(difficulties[1]); // 默认中等

// 显示难度选择器
const showDifficultySelector = ref(false);

// 计时器
let timerInterval: number | null = null;

// 开始新游戏
const startNewGame = () => {
  gameStore.initGame({
    size: selectedSize.value.size,
    subRows: selectedSize.value.subRows,
    subCols: selectedSize.value.subCols,
    difficulty: 'medium'
  });
  
  // 生成对应尺寸的数独题目
  const puzzleData = generatePuzzleData(selectedSize.value);
  gameStore.setPuzzleData(puzzleData);
  
  startTimer();
};

// 选择棋盘规模
const selectSize = (size: typeof boardSizes[0]) => {
  selectedSize.value = size;
  showSizeSelector.value = false;
  startNewGame();
};

// 选择难度
const selectDifficulty = (difficulty: typeof difficulties[0]) => {
  selectedDifficulty.value = difficulty;
  showDifficultySelector.value = false;
  startNewGame();
};

// 重置游戏
const resetGame = () => {
  gameStore.initGame(gameStore.config);
  startTimer();
};

// 切换夜间模式
const toggleDarkMode = () => {
  emit('toggle-dark-mode');
};

// 启动计时器
const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  gameStore.timer = 0;
  timerInterval = setInterval(() => {
    gameStore.updateTimer();
  }, 1000);
};

// 停止计时器
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

// 检查答案
const checkAnswer = () => {
  const result = gameStore.validateBoard();
  if (!result.isValid && result.conflicts) {
    // TODO: 显示错误提示
  }
};

// 撤销操作
const undo = () => {
  if (gameStore.canUndo) {
    gameStore.undo();
  }
};

// 生成真正的数独题目
const generatePuzzleData = (config: typeof selectedSize.value) => {
  try {
    const sudokuConfig = {
      size: config.size,
      subRows: config.subRows,
      subCols: config.subCols,
      difficulty: selectedDifficulty.value.value
    };
    
    const result = generateSudoku(sudokuConfig);
    return {
      puzzle: result.puzzle,
      preset: result.preset,
      solution: result.solution
    };
  } catch (error) {
    console.error('数独生成失败，使用备用数据:', error);
    
    // 备用简单数据
    const board = Array(config.size).fill(0).map(() => Array(config.size).fill(0));
    const preset = Array(config.size).fill(0).map(() => Array(config.size).fill(false));
    
    // 在第一行和第一列放置一些数字
    for (let i = 0; i < Math.min(3, config.size); i++) {
      board[0][i] = i + 1;
      preset[0][i] = true;
      if (i < config.size - 1) {
        board[i + 1][0] = i + 2;
        preset[i + 1][0] = true;
      }
    }
    
    return { puzzle: board, preset, solution: board };
  }
};

onMounted(() => {
  // 初始化默认9x9棋盘
  const puzzleData = generatePuzzleData(selectedSize.value);
  gameStore.setPuzzleData(puzzleData);
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <div class="game-controls">
    <div class="control-bar">
      <!-- 新游戏按钮 -->
      <button class="control-btn" @click="startNewGame">
        新游戏
      </button>
      
      <!-- 重置按钮 -->
      <button class="control-btn" @click="resetGame">
        重置
      </button>
      
      <!-- 棋盘规模选择 -->
      <div class="size-selector">
        <button class="control-btn" @click="showSizeSelector = !showSizeSelector">
          {{ selectedSize.label }}
        </button>
        <div v-if="showSizeSelector" class="size-dropdown">
          <button
            v-for="size in boardSizes"
            :key="size.label"
            class="size-option"
            :class="{ active: size.label === selectedSize.label }"
            @click="selectSize(size)"
          >
            {{ size.label }}
          </button>
        </div>
      </div>

      <!-- 难度选择 -->
      <div class="difficulty-selector">
        <button class="control-btn" @click="showDifficultySelector = !showDifficultySelector">
          {{ selectedDifficulty.label }}
        </button>
        <div v-if="showDifficultySelector" class="difficulty-dropdown">
          <button
            v-for="difficulty in difficulties"
            :key="difficulty.value"
            class="difficulty-option"
            :class="{ active: difficulty.value === selectedDifficulty.value }"
            @click="selectDifficulty(difficulty)"
          >
            {{ difficulty.label }}
          </button>
        </div>
      </div>

      <!-- 计时器 -->
      <div class="timer-display">
        {{ gameStore.formattedTime }}
      </div>
      
      <!-- 夜间模式切换 -->
      <button class="control-btn mode-btn" @click="toggleDarkMode">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            v-if="darkMode"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          />
          <circle 
            v-else
            cx="12" 
            cy="12" 
            r="5" 
            stroke="currentColor" 
            stroke-width="2"
          />
          <g v-if="!darkMode" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </g>
        </svg>
      </button>
    </div>


  </div>
</template>

<style scoped>
.game-controls {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--control-bg);
  padding: 15px 30px;
  border-radius: 50px;
  border: 2px solid var(--control-border);
  box-shadow: 
    0 0 20px rgba(153, 68, 255, 0.5),
    inset 0 0 20px rgba(153, 68, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.control-btn {
  padding: 12px 24px;
  background: var(--button-bg);
  border: 2px solid var(--button-border);
  border-radius: 25px;
  color: var(--button-text);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 0 10px var(--button-text);
  box-shadow: 0 0 15px rgba(153, 68, 255, 0.3);
  min-width: 80px;
}

.control-btn:hover {
  background: rgba(153, 68, 255, 0.2);
  box-shadow: 
    0 0 25px rgba(153, 68, 255, 0.6),
    inset 0 0 15px rgba(153, 68, 255, 0.2);
  transform: translateY(-2px);
}

.control-btn:active {
  transform: translateY(0);
}

.mode-btn {
  min-width: 50px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-selector,
.difficulty-selector {
  position: relative;
}

.size-dropdown,
.difficulty-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 10px;
  background: rgba(0, 0, 51, 0.95);
  border: 2px solid #ff00ff;
  border-radius: 15px;
  padding: 10px;
  box-shadow: 
    0 0 20px rgba(255, 0, 255, 0.5),
    inset 0 0 20px rgba(255, 0, 255, 0.1);
  backdrop-filter: blur(10px);
  z-index: 1000;
  min-width: 120px;
}

.size-option,
.difficulty-option {
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #ff00ff;
  border-radius: 10px;
  color: #ff00ff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 5px;
  text-align: center;
}

.size-option:last-child,
.difficulty-option:last-child {
  margin-bottom: 0;
}

.size-option:hover,
.difficulty-option:hover {
  background: rgba(255, 0, 255, 0.2);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.4);
}

.size-option.active,
.difficulty-option.active {
  background: rgba(255, 0, 255, 0.3);
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.6);
}

.timer-display {
  padding: 12px 24px;
  background: var(--button-bg);
  border: 2px solid var(--button-border);
  border-radius: 25px;
  color: var(--button-text);
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px var(--button-text);
  box-shadow: 0 0 15px rgba(153, 68, 255, 0.3);
  min-width: 80px;
  text-align: center;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-bar {
    gap: 15px;
    padding: 12px 20px;
  }
  
  .control-btn {
    padding: 10px 18px;
    font-size: 14px;
    min-width: 60px;
  }
  
  .timer-display {
    padding: 10px 18px;
    font-size: 16px;
    min-width: 60px;
  }
  
  .mode-btn {
    padding: 10px;
    min-width: 40px;
  }
  
  .mode-btn svg {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 480px) {
  .control-bar {
    gap: 10px;
    padding: 10px 15px;
  }
  
  .control-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 50px;
  }
  
  .timer-display {
    padding: 8px 12px;
    font-size: 14px;
    min-width: 50px;
  }
  
  .mode-btn {
    padding: 8px;
    min-width: 35px;
  }
  
  .mode-btn svg {
    width: 18px;
    height: 18px;
  }
}


</style>