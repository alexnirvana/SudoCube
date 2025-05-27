<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useGameStore } from './store/game';
import GameBoard from './components/game/GameBoard.vue';
import GameControls from './components/ui/GameControls.vue';
import GameCompleteModal from './components/ui/GameCompleteModal.vue';
import Toast from './components/ui/Toast.vue';

const gameStore = useGameStore();

// 控制结算模态框显示
const showCompleteModal = ref(false);

// Toast控制
const toastMessage = ref('');
const toastType = ref<'error' | 'warning' | 'success' | 'info'>('info');
const showToast = ref(false);

// 夜间模式控制
const isDarkMode = ref(true); // 默认为夜间模式（现在的霓虹灯风格）

// 3D模式控制
const is3DMode = ref(false); // 默认为2D模式

onMounted(() => {
  // 初始化游戏
  gameStore.initGame();
});

// 处理游戏完成
const handleGameComplete = () => {
  showCompleteModal.value = true;
};

// 关闭模态框
const handleCloseModal = () => {
  showCompleteModal.value = false;
};

// 开始新游戏（从模态框触发）
const handleNewGameFromModal = () => {
  showCompleteModal.value = false;
  // 这里可以触发新游戏逻辑，或者让GameControls组件处理
  gameStore.initGame();
};

// 显示Toast消息
const showToastMessage = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

// 关闭Toast
const handleToastClose = () => {
  showToast.value = false;
};

// 处理数字冲突
const handleConflict = (conflictType: string) => {
  console.log('冲突检测到:', conflictType); // 调试信息
  
  const messages = {
    row: '同一行不能有重复数字！',
    column: '同一列不能有重复数字！',
    box: '同一宫格不能有重复数字！'
  };
  
  const message = messages[conflictType as keyof typeof messages] || '数字冲突！';
  console.log('显示消息:', message); // 调试信息
  
  showToastMessage(message, 'error');
};

// 切换夜间模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
};

// 切换3D模式
const toggle3DMode = () => {
  is3DMode.value = !is3DMode.value;
};
</script>

<template>
  <div class="app" :class="{ 'light-mode': !isDarkMode }">
    <div class="game-container">
      <GameBoard 
        :dark-mode="isDarkMode"
        :is-3d="is3DMode"
        @game-complete="handleGameComplete"
        @conflict="handleConflict"
      />
      <GameControls 
        :dark-mode="isDarkMode"
        :is-3d="is3DMode"
        @toggle-dark-mode="toggleDarkMode"
        @toggle-3d-mode="toggle3DMode"
      />
    </div>
    
    <!-- 游戏完成模态框 -->
    <GameCompleteModal
      :is-visible="showCompleteModal || gameStore.isComplete"
      @close="handleCloseModal"
      @new-game="handleNewGameFromModal"
    />
    
    <!-- Toast消息 -->
    <Toast
      :message="toastMessage"
      :type="toastType"
      :visible="showToast"
      @close="handleToastClose"
    />
  </div>
</template>

<style>
:root {
  /* 夜间模式（霓虹灯风格） */
  --primary-color: #ff00ff;
  --background-color: #000033;
  --text-color: #ffffff;
  --grid-color: #00ffff;
  --cell-bg: rgba(0, 0, 51, 0.6);
  --board-bg: rgba(0, 0, 51, 0.8);
  --hover-bg: rgba(0, 255, 255, 0.1);
  --selected-bg: rgba(255, 0, 255, 0.2);
  --conflict-bg: rgba(255, 0, 0, 0.2);
  --preset-bg: rgba(255, 255, 255, 0.05);
  --control-bg: rgba(0, 0, 51, 0.9);
  --control-border: #9944ff;
  --preset-text: #ffffff;
  --user-text: #ffff00;
  --button-text: #9944ff;
  --button-bg: transparent;
  --button-border: #9944ff;
}

/* 浅色模式 */
.app.light-mode {
  --primary-color: #6a5acd;
  --background-color: #f5f5f5;
  --text-color: #333333;
  --grid-color: #4169e1;
  --cell-bg: #ffffff;
  --board-bg: #ffffff;
  --hover-bg: rgba(65, 105, 225, 0.1);
  --selected-bg: rgba(106, 90, 205, 0.2);
  --conflict-bg: rgba(255, 0, 0, 0.1);
  --preset-bg: #f0f0f0;
  --control-bg: #ffffff;
  --control-border: #6a5acd;
  --preset-text: #333333;
  --user-text: #1e90ff;
  --button-text: #6a5acd;
  --button-bg: #ffffff;
  --button-border: #6a5acd;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: Arial, sans-serif;
  transition: all 0.3s ease;
}

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.game-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
</style>
