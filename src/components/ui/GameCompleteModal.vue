<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../../store/game';

interface Props {
  isVisible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  newGame: [];
}>();

const gameStore = useGameStore();

// 动画控制
const showFireworks = ref(false);
const showStats = ref(false);
const showButtons = ref(false);

// 烟花粒子数组
const fireworks = ref<Array<{
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}>>([]);

// 创建烟花效果
const createFireworks = () => {
  const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#80ff00'];
  const newFireworks = [];
  
  for (let i = 0; i < 20; i++) {
    newFireworks.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2
    });
  }
  
  fireworks.value = newFireworks;
};

// 启动动画序列
const startAnimation = () => {
  if (!props.isVisible) return;
  
  // 立即显示烟花
  showFireworks.value = true;
  createFireworks();
  
  // 延迟显示统计信息
  setTimeout(() => {
    showStats.value = true;
  }, 1000);
  
  // 延迟显示按钮
  setTimeout(() => {
    showButtons.value = true;
  }, 1500);
};

// 重置动画状态
const resetAnimation = () => {
  showFireworks.value = false;
  showStats.value = false;
  showButtons.value = false;
  fireworks.value = [];
};

// 关闭模态框
const handleClose = () => {
  resetAnimation();
  emit('close');
};

// 开始新游戏
const handleNewGame = () => {
  resetAnimation();
  emit('newGame');
};

// 格式化时间
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 计算完成率（假设数据）
const completionRate = ref(95);

// 监听visible变化
let timeoutId: number | null = null;

onMounted(() => {
  if (props.isVisible) {
    timeoutId = setTimeout(startAnimation, 100);
  }
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});

// 监听props变化
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    timeoutId = setTimeout(startAnimation, 100);
  } else {
    resetAnimation();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
});
</script>

<template>
  <div 
    v-if="isVisible" 
    class="game-complete-modal"
    @click.self="handleClose"
  >
    <div class="modal-content">
      <!-- 烟花动画 -->
      <div v-if="showFireworks" class="fireworks-container">
        <div
          v-for="firework in fireworks"
          :key="firework.id"
          class="firework"
          :style="{
            left: firework.x + '%',
            top: firework.y + '%',
            backgroundColor: firework.color,
            animationDelay: firework.delay + 's'
          }"
        />
      </div>

      <!-- 主要内容 -->
      <div class="content">
        <!-- 标题 -->
        <h1 class="title">
          🎉 恭喜完成！ 🎉
        </h1>

        <!-- 统计信息 -->
        <div v-if="showStats" class="stats-container">
          <div class="stat-item">
            <div class="stat-label">用时</div>
            <div class="stat-value">{{ formatTime(gameStore.timer) }}</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-label">棋盘规模</div>
            <div class="stat-value">{{ gameStore.config.size }}×{{ gameStore.config.size }}</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-label">难度</div>
            <div class="stat-value">
              {{ gameStore.config.difficulty === 'easy' ? '简单' : 
                 gameStore.config.difficulty === 'medium' ? '中等' : '困难' }}
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-label">撤销次数</div>
            <div class="stat-value">{{ gameStore.history.length }}</div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div v-if="showButtons" class="buttons-container">
          <button class="action-btn primary" @click="handleNewGame">
            再来一局
          </button>
          
          <button class="action-btn secondary" @click="handleClose">
            继续欣赏
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-complete-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  position: relative;
  background: rgba(0, 0, 51, 0.95);
  border: 3px solid #ff00ff;
  border-radius: 30px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 
    0 0 50px rgba(255, 0, 255, 0.8),
    inset 0 0 30px rgba(255, 0, 255, 0.2);
  animation: slideIn 0.6s ease-out;
  overflow: hidden;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fireworks-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.firework {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: fireworkBurst 2s ease-out infinite;
}

@keyframes fireworkBurst {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(3);
    opacity: 0.8;
  }
  100% {
    transform: scale(6);
    opacity: 0;
  }
}

.content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.title {
  font-size: 2.5em;
  font-weight: bold;
  color: #ff00ff;
  text-shadow: 
    0 0 20px #ff00ff,
    0 0 40px #ff00ff;
  margin-bottom: 30px;
  animation: titleGlow 2s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  from {
    text-shadow: 
      0 0 20px #ff00ff,
      0 0 40px #ff00ff;
  }
  to {
    text-shadow: 
      0 0 30px #ff00ff,
      0 0 60px #ff00ff,
      0 0 80px #ff00ff;
  }
}

.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 30px 0;
  animation: statsSlideIn 0.8s ease-out;
}

@keyframes statsSlideIn {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.stat-item {
  background: rgba(255, 0, 255, 0.1);
  border: 2px solid #ff00ff;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
}

.stat-label {
  font-size: 0.9em;
  color: #ff00ff;
  margin-bottom: 5px;
  opacity: 0.8;
}

.stat-value {
  font-size: 1.4em;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff;
}

.buttons-container {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
  animation: buttonsSlideIn 0.8s ease-out;
}

@keyframes buttonsSlideIn {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.action-btn {
  padding: 15px 30px;
  border: 2px solid;
  border-radius: 25px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  min-width: 140px;
}

.action-btn.primary {
  border-color: #00ffff;
  color: #00ffff;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
}

.action-btn.primary:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 25px rgba(0, 255, 255, 0.6);
  transform: translateY(-2px);
}

.action-btn.secondary {
  border-color: #ff00ff;
  color: #ff00ff;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.4);
}

.action-btn.secondary:hover {
  background: rgba(255, 0, 255, 0.2);
  box-shadow: 0 0 25px rgba(255, 0, 255, 0.6);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .title {
    font-size: 2em;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .buttons-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .action-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8em;
  }
  
  .stat-value {
    font-size: 1.2em;
  }
  
  .action-btn {
    padding: 12px 20px;
    font-size: 1em;
  }
}
</style> 