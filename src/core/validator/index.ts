import type { SudokuConfig, ValidationResult } from '../../types/game';

export class SudokuValidator {
  private config: SudokuConfig;

  constructor(config: SudokuConfig) {
    this.config = config;
  }

  validate(board: number[][]): ValidationResult {
    const conflicts: ValidationResult['conflicts'] = [];

    // 检查行
    for (let row = 0; row < this.config.size; row++) {
      const seen = new Set<number>();
      for (let col = 0; col < this.config.size; col++) {
        const value = board[row][col];
        if (value !== 0) {
          if (seen.has(value)) {
            conflicts.push({ row, col, value, type: 'row' });
          } else {
            seen.add(value);
          }
        }
      }
    }

    // 检查列
    for (let col = 0; col < this.config.size; col++) {
      const seen = new Set<number>();
      for (let row = 0; row < this.config.size; row++) {
        const value = board[row][col];
        if (value !== 0) {
          if (seen.has(value)) {
            conflicts.push({ row, col, value, type: 'column' });
          } else {
            seen.add(value);
          }
        }
      }
    }

    // 检查子宫格
    for (let boxRow = 0; boxRow < this.config.size; boxRow += this.config.subRows) {
      for (let boxCol = 0; boxCol < this.config.size; boxCol += this.config.subCols) {
        const seen = new Set<number>();
        for (let i = 0; i < this.config.subRows; i++) {
          for (let j = 0; j < this.config.subCols; j++) {
            const row = boxRow + i;
            const col = boxCol + j;
            const value = board[row][col];
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

  isComplete(board: number[][]): boolean {
    // 检查是否所有格子都已填写
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        if (board[row][col] === 0) {
          return false;
        }
      }
    }

    // 验证所有填写的数字是否有效
    const validation = this.validate(board);
    return validation.isValid;
  }

  isSolutionValid(board: number[][], solution: number[][]): boolean {
    // 检查解答是否与给定的解决方案匹配
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        if (board[row][col] !== 0 && board[row][col] !== solution[row][col]) {
          return false;
        }
      }
    }
    return true;
  }
}