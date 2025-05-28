<script setup lang="ts">
import { ref } from 'vue';
import GameBoard2D from './GameBoard2D.vue';
import GameBoard3D from './GameBoard3D.vue';
import { getStyleList } from '../../core/styles';

// 定义props
const props = defineProps<{
  darkMode: boolean;
  is3d: boolean;
}>();
// 定义事件
const emit = defineEmits<{
  'game-complete': [];
  'conflict': [conflictType: string];
  'style-change': [styleName: string];
}>();

// 3D棋盘引用
const gameBoard3DRef = ref<InstanceType<typeof GameBoard3D>>();

// 当前样式
const currentStyle = ref('image');

// 获取可用样式
const availableStyles = getStyleList();

// 转发事件
const handleGameComplete = () => {
  emit('game-complete');
};

const handleConflict = (conflictType: string) => {
  emit('conflict', conflictType);
};

// 样式切换
const handleStyleChange = (styleName: string) => {
  currentStyle.value = styleName;
  emit('style-change', styleName);
  if (gameBoard3DRef.value) {
    gameBoard3DRef.value.changeStyle(styleName);
  }
};
</script>

<template>
  <div class="game-board-wrapper">
    <!-- 3D模式下的样式选择器 -->
    <div v-if="is3d" class="style-selector">
      <label class="style-label">3D样式:</label>
      <select 
        v-model="currentStyle" 
        @change="handleStyleChange(currentStyle)"
        class="style-select"
      >
        <option 
          v-for="style in availableStyles" 
          :key="style.name" 
          :value="style.name"
        >
          {{ style.description }}
        </option>
      </select>
    </div>
    
    <GameBoard3D 
      v-if="is3d"
      ref="gameBoard3DRef"
      :dark-mode="darkMode"
      :style-name="currentStyle"
      @game-complete="handleGameComplete"
      @conflict="handleConflict"
    />
    <GameBoard2D 
      v-else
      :dark-mode="darkMode"
      @game-complete="handleGameComplete"
      @conflict="handleConflict"
    />
  </div>
</template>

<style scoped>
.game-board-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.style-selector {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--control-bg, rgba(0, 0, 0, 0.7));
  padding: 10px 15px;
  border-radius: 10px;
  border: 2px solid var(--grid-color, #00ffff);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.style-label {
  color: var(--grid-color, #00ffff);
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 5px var(--grid-color, #00ffff);
  white-space: nowrap;
}

.style-select {
  background: var(--button-bg, rgba(0, 255, 255, 0.1));
  border: 1px solid var(--grid-color, #00ffff);
  border-radius: 5px;
  color: var(--grid-color, #00ffff);
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.style-select:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.style-select:focus {
  outline: none;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
}

.style-select option {
  background: var(--control-bg, #1a1a1a);
  color: var(--grid-color, #00ffff);
  padding: 5px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .style-selector {
    top: 10px;
    right: 10px;
    padding: 8px 12px;
    gap: 8px;
  }
  
  .style-label {
    font-size: 12px;
  }
  
  .style-select {
    font-size: 11px;
    padding: 4px 8px;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .style-selector {
    position: fixed;
    top: 5px;
    right: 5px;
    padding: 6px 10px;
    gap: 6px;
  }
  
  .style-label {
    display: none; /* 在小屏幕上隐藏标签 */
  }
  
  .style-select {
    font-size: 10px;
    padding: 3px 6px;
    min-width: 80px;
  }
}
</style>