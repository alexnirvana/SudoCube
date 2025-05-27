import { defineStore } from 'pinia';
import type { GameState, SudokuConfig, ValidationResult } from '../types/game';

const DEFAULT_CONFIG: SudokuConfig = {
  size: 9,
  subRows: 3,
  subCols: 3,
  difficulty: 'medium'
};

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    config: DEFAULT_CONFIG,
    board: [],
    solution: [],
    preset: [],
    selectedCell: null,
    timer: 0,
    isComplete: false,
    history: []
  }),

  actions: {
    initGame(config: SudokuConfig = DEFAULT_CONFIG) {
      this.config = config;
      this.board = Array(config.size).fill(0).map(() => Array(config.size).fill(0));
      this.solution = [];
      this.preset = Array(config.size).fill(0).map(() => Array(config.size).fill(false));
      this.selectedCell = null;
      this.timer = 0;
      this.isComplete = false;
      this.history = [];
    },

    // 设置生成的数独数据
    setPuzzleData(puzzleData: { puzzle: number[][], solution: number[][], preset: boolean[][] }) {
      this.board = puzzleData.puzzle;
      this.solution = puzzleData.solution;
      this.preset = puzzleData.preset;
      this.selectedCell = null;
      this.isComplete = false;
      this.history = [];
    },

    setCell(row: number, col: number, value: number) {
      if (row < 0 || row >= this.config.size || col < 0 || col >= this.config.size) return;
      
      // 检查是否为预设格子（题目数字），如果是则不允许修改
      if (this.preset[row] && this.preset[row][col]) {
        return;
      }
      
      // 保存历史记录
      this.history.push({
        board: JSON.parse(JSON.stringify(this.board)),
        timestamp: Date.now()
      });

      this.board[row][col] = value;
      this.checkComplete();
    },

    // 检查特定位置是否有冲突
    hasConflictAt(row: number, col: number): boolean {
      // 安全检查：确保board已初始化且索引有效
      if (!this.board || !this.board[row] || row < 0 || row >= this.config.size || col < 0 || col >= this.config.size) {
        return false;
      }
      
      const value = this.board[row][col];
      if (value === 0) return false;

      // 检查行冲突
      for (let c = 0; c < this.config.size; c++) {
        if (c !== col && this.board[row][c] === value) {
          return true;
        }
      }

      // 检查列冲突
      for (let r = 0; r < this.config.size; r++) {
        if (r !== row && this.board[r][col] === value) {
          return true;
        }
      }

      // 检查子宫格冲突
      const startRow = row - (row % this.config.subRows);
      const startCol = col - (col % this.config.subCols);
      
      for (let i = 0; i < this.config.subRows; i++) {
        for (let j = 0; j < this.config.subCols; j++) {
          const r = startRow + i;
          const c = startCol + j;
          if ((r !== row || c !== col) && this.board[r][c] === value) {
            return true;
          }
        }
      }

      return false;
    },

    // 获取与指定位置冲突的格子
    getConflictCells(row: number, col: number): Array<{row: number, col: number, type: 'row' | 'column' | 'box'}> {
      // 安全检查：确保board已初始化且索引有效
      if (!this.board || !this.board[row] || row < 0 || row >= this.config.size || col < 0 || col >= this.config.size) {
        return [];
      }
      
      const value = this.board[row][col];
      if (value === 0) return [];

      const conflicts: Array<{row: number, col: number, type: 'row' | 'column' | 'box'}> = [];

      // 检查行冲突
      for (let c = 0; c < this.config.size; c++) {
        if (c !== col && this.board[row][c] === value) {
          conflicts.push({ row, col: c, type: 'row' });
        }
      }

      // 检查列冲突
      for (let r = 0; r < this.config.size; r++) {
        if (r !== row && this.board[r][col] === value) {
          conflicts.push({ row: r, col, type: 'column' });
        }
      }

      // 检查子宫格冲突
      const startRow = row - (row % this.config.subRows);
      const startCol = col - (col % this.config.subCols);
      
      for (let i = 0; i < this.config.subRows; i++) {
        for (let j = 0; j < this.config.subCols; j++) {
          const r = startRow + i;
          const c = startCol + j;
          if ((r !== row || c !== col) && this.board[r][c] === value) {
            conflicts.push({ row: r, col: c, type: 'box' });
          }
        }
      }

      return conflicts;
    },

    selectCell(row: number, col: number) {
      this.selectedCell = { row, col };
    },

    checkComplete() {
      // 检查是否所有格子都已填写
      for (let row = 0; row < this.config.size; row++) {
        for (let col = 0; col < this.config.size; col++) {
          if (this.board[row][col] === 0) {
            this.isComplete = false;
            return;
          }
        }
      }

      // 检查数独规则是否满足
      const validation = this.validateBoard();
      this.isComplete = validation.isValid;
    },

    undo() {
      const lastState = this.history.pop();
      if (lastState) {
        this.board = lastState.board;
      }
    },

    updateTimer() {
      this.timer++;
    },

    validateBoard(): ValidationResult {
      const conflicts: Array<{row: number, col: number, value: number, type: 'row' | 'column' | 'box'}> = [];

      // 检查每行
      for (let row = 0; row < this.config.size; row++) {
        const seen = new Set<number>();
        for (let col = 0; col < this.config.size; col++) {
          const value = this.board[row][col];
          if (value !== 0) {
            if (seen.has(value)) {
              conflicts.push({ row, col, value, type: 'row' });
            } else {
              seen.add(value);
            }
          }
        }
      }

      // 检查每列
      for (let col = 0; col < this.config.size; col++) {
        const seen = new Set<number>();
        for (let row = 0; row < this.config.size; row++) {
          const value = this.board[row][col];
          if (value !== 0) {
            if (seen.has(value)) {
              conflicts.push({ row, col, value, type: 'column' });
            } else {
              seen.add(value);
            }
          }
        }
      }

      // 检查每个子宫格
      for (let boxRow = 0; boxRow < this.config.size; boxRow += this.config.subRows) {
        for (let boxCol = 0; boxCol < this.config.size; boxCol += this.config.subCols) {
          const seen = new Set<number>();
          for (let i = 0; i < this.config.subRows; i++) {
            for (let j = 0; j < this.config.subCols; j++) {
              const row = boxRow + i;
              const col = boxCol + j;
              const value = this.board[row][col];
              if (value !== 0) {
                if (seen.has(value)) {
                  conflicts.push({ row, col, value, type: 'box' });
                } else {
                  seen.add(value);
                }
              }
            }
          }
        }
      }

      return {
        isValid: conflicts.length === 0,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      };
    }
  },

  getters: {
    formattedTime(): string {
      const minutes = Math.floor(this.timer / 60);
      const seconds = this.timer % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    canUndo(): boolean {
      return this.history.length > 0;
    }
  }
});