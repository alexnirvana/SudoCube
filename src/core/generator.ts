import type { SudokuConfig } from '../types/game';

export interface GeneratedPuzzle {
  puzzle: number[][];
  solution: number[][];
  preset: boolean[][];
}

export class SudokuGenerator {
  private config: SudokuConfig;
  private board: number[][];

  constructor(config: SudokuConfig) {
    this.config = config;
    this.board = Array(config.size).fill(0).map(() => Array(config.size).fill(0));
  }

  // 检查在指定位置放置数字是否合法
  private isValid(board: number[][], row: number, col: number, num: number): boolean {
    // 检查行
    for (let x = 0; x < this.config.size; x++) {
      if (board[row][x] === num) return false;
    }

    // 检查列
    for (let x = 0; x < this.config.size; x++) {
      if (board[x][col] === num) return false;
    }

    // 检查子宫格
    const startRow = row - (row % this.config.subRows);
    const startCol = col - (col % this.config.subCols);
    
    for (let i = 0; i < this.config.subRows; i++) {
      for (let j = 0; j < this.config.subCols; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }

  // 使用回溯算法填充完整的数独
  private solveSudoku(board: number[][]): boolean {
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        if (board[row][col] === 0) {
          // 随机化数字顺序
          const numbers = Array.from({ length: this.config.size }, (_, i) => i + 1);
          this.shuffleArray(numbers);

          for (const num of numbers) {
            if (this.isValid(board, row, col, num)) {
              board[row][col] = num;

              if (this.solveSudoku(board)) {
                return true;
              }

              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // 数组随机化
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // 检查数独是否有唯一解
  private hasUniqueSolution(board: number[][]): boolean {
    const testBoard = board.map(row => [...row]);
    let solutionCount = 0;

    const countSolutions = (board: number[][]): void => {
      if (solutionCount > 1) return; // 提前退出

      for (let row = 0; row < this.config.size; row++) {
        for (let col = 0; col < this.config.size; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= this.config.size; num++) {
              if (this.isValid(board, row, col, num)) {
                board[row][col] = num;
                countSolutions(board);
                board[row][col] = 0;
              }
            }
            return;
          }
        }
      }
      solutionCount++;
    };

    countSolutions(testBoard);
    return solutionCount === 1;
  }

  // 生成数独题目
  public generatePuzzle(): GeneratedPuzzle {
    // 1. 生成完整的解
    const solution = Array(this.config.size).fill(0).map(() => Array(this.config.size).fill(0));
    this.solveSudoku(solution);

    // 2. 创建题目（移除一些数字）
    const puzzle = solution.map(row => [...row]);
    const preset = Array(this.config.size).fill(0).map(() => Array(this.config.size).fill(true));

    // 根据难度确定要移除的格子数量
    const totalCells = this.config.size * this.config.size;
    let cellsToRemove: number;

    switch (this.config.difficulty) {
      case 'easy':
        cellsToRemove = Math.floor(totalCells * 0.4); // 移除40%
        break;
      case 'medium':
        cellsToRemove = Math.floor(totalCells * 0.55); // 移除55%
        break;
      case 'hard':
        cellsToRemove = Math.floor(totalCells * 0.7); // 移除70%
        break;
      default:
        cellsToRemove = Math.floor(totalCells * 0.5);
    }

    // 随机移除数字，但确保仍有唯一解
    const positions = [];
    for (let row = 0; row < this.config.size; row++) {
      for (let col = 0; col < this.config.size; col++) {
        positions.push([row, col]);
      }
    }
    this.shuffleArray(positions);

    let removed = 0;
    for (const [row, col] of positions) {
      if (removed >= cellsToRemove) break;

      const originalValue = puzzle[row][col];
      puzzle[row][col] = 0;
      preset[row][col] = false;

      // 对于较小的数独或简单难度，跳过唯一解检查以提高性能
      if (this.config.size <= 9 && this.config.difficulty !== 'easy') {
        if (!this.hasUniqueSolution(puzzle)) {
          // 如果移除这个数字导致多解，则恢复
          puzzle[row][col] = originalValue;
          preset[row][col] = true;
          continue;
        }
      }

      removed++;
    }

    return {
      puzzle,
      solution,
      preset
    };
  }

  // 快速生成（用于大尺寸数独，不检查唯一解）
  public generateQuickPuzzle(): GeneratedPuzzle {
    // 生成完整解
    const solution = Array(this.config.size).fill(0).map(() => Array(this.config.size).fill(0));
    this.solveSudoku(solution);

    // 创建题目
    const puzzle = solution.map(row => [...row]);
    const preset = Array(this.config.size).fill(0).map(() => Array(this.config.size).fill(true));

    // 简单的移除策略：每个子宫格保留一定数量的数字
    const cellsPerBox = this.config.subRows * this.config.subCols;
    let keepPerBox: number;

    switch (this.config.difficulty) {
      case 'easy':
        keepPerBox = Math.ceil(cellsPerBox * 0.7);
        break;
      case 'medium':
        keepPerBox = Math.ceil(cellsPerBox * 0.5);
        break;
      case 'hard':
        keepPerBox = Math.ceil(cellsPerBox * 0.3);
        break;
      default:
        keepPerBox = Math.ceil(cellsPerBox * 0.5);
    }

    // 对每个子宫格进行处理
    for (let boxRow = 0; boxRow < this.config.size; boxRow += this.config.subRows) {
      for (let boxCol = 0; boxCol < this.config.size; boxCol += this.config.subCols) {
        const positions = [];
        
        // 收集当前子宫格的所有位置
        for (let i = 0; i < this.config.subRows; i++) {
          for (let j = 0; j < this.config.subCols; j++) {
            positions.push([boxRow + i, boxCol + j]);
          }
        }

        // 随机选择要保留的位置
        this.shuffleArray(positions);
        for (let i = keepPerBox; i < positions.length; i++) {
          const [row, col] = positions[i];
          puzzle[row][col] = 0;
          preset[row][col] = false;
        }
      }
    }

    return {
      puzzle,
      solution,
      preset
    };
  }
}

// 导出生成函数
export function generateSudoku(config: SudokuConfig): GeneratedPuzzle {
  const generator = new SudokuGenerator(config);
  
  // 对于大尺寸数独使用快速生成
  if (config.size > 9) {
    return generator.generateQuickPuzzle();
  } else {
    return generator.generatePuzzle();
  }
} 