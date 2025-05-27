<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

interface Props {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  duration?: number;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 3000,
  visible: false
});

const emit = defineEmits<{
  close: [];
}>();

const showToast = ref(false);
const animationClass = ref('');

let hideTimeout: number | null = null;

const show = () => {
  showToast.value = true;
  animationClass.value = 'toast-enter';
  
  // 自动隐藏
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  
  hideTimeout = setTimeout(() => {
    hide();
  }, props.duration);
};

const hide = () => {
  animationClass.value = 'toast-leave';
  
  setTimeout(() => {
    showToast.value = false;
    emit('close');
  }, 300);
};

// 监听visible变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    show();
  } else {
    hide();
  }
});

// 手动关闭
const handleClose = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  hide();
};

onMounted(() => {
  if (props.visible) {
    show();
  }
});
</script>

<template>
  <Transition name="toast">
    <div 
      v-if="showToast" 
      class="toast"
      :class="[`toast-${type}`, animationClass]"
      @click="handleClose"
    >
      <div class="toast-content">
        <div class="toast-icon">
          <!-- 错误图标 -->
          <svg v-if="type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
          </svg>
          
          <!-- 警告图标 -->
          <svg v-else-if="type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
          
          <!-- 成功图标 -->
          <svg v-else-if="type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <polyline points="9,12 12,15 15,9" stroke="currentColor" stroke-width="2"/>
          </svg>
          
          <!-- 信息图标 -->
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="8" r="1" fill="currentColor"/>
          </svg>
        </div>
        
        <div class="toast-message">
          {{ message }}
        </div>
        
        <button class="toast-close" @click.stop="handleClose">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 3000;
  max-width: 400px;
  min-width: 300px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border: 2px solid;
  border-radius: 15px;
  background: rgba(0, 0, 51, 0.95);
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* 不同类型的样式 */
.toast-error {
  border-color: #ff4444;
  color: #ff4444;
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.4);
}

.toast-warning {
  border-color: #ffaa00;
  color: #ffaa00;
  box-shadow: 0 0 20px rgba(255, 170, 0, 0.4);
}

.toast-success {
  border-color: #00ff88;
  color: #00ff88;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
}

.toast-info {
  border-color: #00ffff;
  color: #00ffff;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toast {
    top: 80px;
    right: 10px;
    left: 10px;
    max-width: none;
    min-width: auto;
  }
  
  .toast-content {
    padding: 12px 15px;
  }
  
  .toast-message {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .toast {
    top: 70px;
  }
  
  .toast-content {
    padding: 10px 12px;
  }
  
  .toast-message {
    font-size: 12px;
  }
}
</style> 