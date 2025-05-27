<script setup lang="ts">
import GameBoard2D from './GameBoard2D.vue';
import GameBoard3D from './GameBoard3D.vue';

// 定义props
const props = defineProps<{
  darkMode: boolean;
  is3d: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  'game-complete': [];
  'conflict': [conflictType: string];
}>();

// 转发事件
const handleGameComplete = () => {
  emit('game-complete');
};

const handleConflict = (conflictType: string) => {
  emit('conflict', conflictType);
};
</script>

<template>
  <div class="game-board-wrapper">
    <GameBoard3D 
      v-if="is3d"
      :dark-mode="darkMode"
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
}
</style>