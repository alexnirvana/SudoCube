export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SudokuConfig {
  size: number;          // 棋盘边长 n
  subRows: number;       // 子宫格行数
  subCols: number;       // 子宫格列数
  difficulty: Difficulty;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts?: {
    row: number;
    col: number;
    value: number;
    type: 'row' | 'column' | 'box';
  }[];
}

export interface GameState {
  config: SudokuConfig;
  board: number[][];
  solution: number[][];
  preset: boolean[][]; // 标记哪些格子是题目预设的（不可修改）
  selectedCell: { row: number; col: number } | null;
  timer: number;
  isComplete: boolean;
  history: {
    board: number[][];
    timestamp: number;
  }[];
}