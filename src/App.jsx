import React, { useRef, useEffect, useState } from 'react';
import './App.css';

const GRID_SIZE = 9;
const CELL_SIZE = 50;

function App() {
  const canvasRef = useRef(null);
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState({ x: -1, y: -1 });
  const [gameState, setGameState] = useState('solving');
  const [timer, setTimer] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [moves, setMoves] = useState([]);
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Initialize game
  useEffect(() => {
    newGame('easy');
  }, []);

  // Canvas setup and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 500 * devicePixelRatio;
    canvas.height = 600 * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const render = () => {
      drawBoard(ctx);
      requestAnimationFrame(render);
    };
    render();

    const timerInterval = setInterval(() => {
      if (gameState === 'solving') {
        setTimer(t => t + 1);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [board, selectedCell, gameState, timer]);

  // Generate new game
  const newGame = (difficulty) => {
    const newBoard = generateSudoku(difficulty);
    const newSolution = newBoard.map(row => [...row]);
    solveSudoku(newSolution);
    
    setBoard(newBoard);
    setSolution(newSolution);
    setTimer(0);
    setHintsLeft(3);
    setMoves([]);
    setGameState('solving');
    setSelectedCell({ x: -1, y: -1 });
  };

  // Sudoku generation and solving functions
  const generateSudoku = (difficulty) => {
    const base = Array(9).fill().map(() => Array(9).fill(0));
    solveSudoku(base);
    const puzzle = base.map(row => [...row]);
    const cellsToRemove = { easy: 40, medium: 50, hard: 60 }[difficulty];
    for (let i = 0; i < cellsToRemove; i++) {
      const x = Math.floor(Math.random() * 9);
      const y = Math.floor(Math.random() * 9);
      puzzle[y][x] = 0;
    }
    return puzzle;
  };

  const solveSudoku = (grid) => {
    const empty = findEmpty(grid);
    if (!empty) return true;
    const [row, col] = empty;
    
    for (let num = 1; num <= 9; num++) {
      if (isSafe(grid, row, col, num)) {
        grid[row][col] = num;
        if (solveSudoku(grid)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  };

  const findEmpty = (grid) => {
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 9; j++)
        if (grid[i][j] === 0) return [i, j];
    return null;
  };

  const isSafe = (grid, row, col, num) => {
    for (let x = 0; x < 9; x++)
      if (grid[row][x] === num || grid[x][col] === num) return false;
    
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (grid[i + startRow][j + startCol] === num) return false;
    
    return true;
  };

  // Draw board
  const drawBoard = (ctx) => {
    ctx.clearRect(0, 0, 500, 600);

    // Grid
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.strokeStyle = i % 3 === 0 ? '#ff00ff' : '#00ffff';
      ctx.lineWidth = i % 3 === 0 ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE + 25, 25);
      ctx.lineTo(i * CELL_SIZE + 25, GRID_SIZE * CELL_SIZE + 25);
      ctx.moveTo(25, i * CELL_SIZE + 25);
      ctx.lineTo(GRID_SIZE * CELL_SIZE + 25, i * CELL_SIZE + 25);
      ctx.stroke();
    }

    // Numbers
    ctx.font = '24px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const num = board[y]?.[x];
        if (num) {
          ctx.fillStyle = solution[y][x] === num ? '#00ffff' : '#ff00ff';
          ctx.fillText(num, x * CELL_SIZE + 50, y * CELL_SIZE + 50);
        }
      }
    }

    // Selected cell
    if (selectedCell.x >= 0 && selectedCell.y >= 0) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.fillRect(selectedCell.x * CELL_SIZE + 25, selectedCell.y * CELL_SIZE + 25, CELL_SIZE, CELL_SIZE);
      
      const num = board[selectedCell.y][selectedCell.x];
      if (num) {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
        for (let y = 0; y < 9; y++) {
          for (let x = 0; x < 9; x++) {
            if (board[y][x] === num && (x !== selectedCell.x || y !== selectedCell.y)) {
              ctx.fillRect(x * CELL_SIZE + 25, y * CELL_SIZE + 25, CELL_SIZE, CELL_SIZE);
            }
          }
        }
      }
    }

    // Scan line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(25, Date.now() % (GRID_SIZE * CELL_SIZE) + 25);
    ctx.lineTo(GRID_SIZE * CELL_SIZE + 25, Date.now() % (GRID_SIZE * CELL_SIZE) + 25);
    ctx.stroke();

    if (gameState === 'completed') {
      ctx.fillStyle = '#00ffff';
      ctx.font = '40px Courier New';
      ctx.fillText('VICTORY!', 250, 300);
      ctx.font = '24px Courier New';
      ctx.fillText(`Time: ${formatTime(timer)}`, 250, 340);
    }
  };

  // Game controls
  const placeNumber = (num) => {
    if (gameState !== 'solving' || selectedCell.x < 0) return;
    const { x, y } = selectedCell;
    if (solution[y][x] === board[y][x]) return;

    const newBoard = board.map(row => [...row]);
    newBoard[y][x] = num;
    setMoves([...moves, { x, y, prev: board[y][x] }]);
    setBoard(newBoard);
    checkGameState(newBoard);
  };

  const checkGameState = (currentBoard) => {
    let errors = false;
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        if (currentBoard[y][x] !== 0 && currentBoard[y][x] !== solution[y][x]) {
          errors = true;
          break;
        }
      }
    }
    if (!errors && currentBoard.every((row, y) => row.every((cell, x) => cell === solution[y][x]))) {
      setGameState('completed');
    } else {
      setGameState(errors ? 'error' : 'solving');
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0 || selectedCell.x < 0 || gameState !== 'solving') return;
    const { x, y } = selectedCell;
    if (solution[y][x] === board[y][x]) return;
    
    const newBoard = board.map(row => [...row]);
    newBoard[y][x] = solution[y][x];
    setMoves([...moves, { x, y, prev: board[y][x] }]);
    setBoard(newBoard);
    setHintsLeft(hintsLeft - 1);
    checkGameState(newBoard);
  };

  const undoMove = () => {
    if (!moves.length || gameState !== 'solving') return;
    const lastMove = moves[moves.length - 1];
    const newBoard = board.map(row => [...row]);
    newBoard[lastMove.y][lastMove.x] = lastMove.prev;
    setBoard(newBoard);
    setMoves(moves.slice(0, -1));
    checkGameState(newBoard);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Event handlers
  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width / devicePixelRatio;
    const scaleY = canvas.height / rect.height / devicePixelRatio;
    
    const clickX = (e.clientX - rect.left) * scaleX - 25;
    const clickY = (e.clientY - rect.top) * scaleY - 25;
    
    const x = Math.floor(clickX / CELL_SIZE);
    const y = Math.floor(clickY / CELL_SIZE);
    
    if (x >= 0 && x < 9 && y >= 0 && y < 9) {
      setSelectedCell({ x, y });
    } else {
      setSelectedCell({ x: -1, y: -1 });
    }
  };

  const handleKeyDown = (e) => {
    if (gameState !== 'solving') return;
    
    const moves = {
      'ArrowUp': { x: 0, y: -1 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowRight': { x: 1, y: 0 },
      'w': { x: 0, y: -1 },
      's': { x: 0, y: 1 },
      'a': { x: -1, y: 0 },
      'd': { x: 1, y: 0 }
    };
    
    if (moves[e.key]) {
      e.preventDefault();
      const move = moves[e.key];
      setSelectedCell(prev => ({
        x: Math.max(0, Math.min(8, prev.x + move.x)),
        y: Math.max(0, Math.min(8, prev.y + move.y))
      }));
    }
    
    if (/[1-9]/.test(e.key)) {
      placeNumber(parseInt(e.key));
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedCell, board, solution, moves, hintsLeft]);

  return (
    <div className="game-container">
      <canvas 
        ref={canvasRef}
        width={500}
        height={600}
        className="sudoku-canvas"
        onClick={handleClick}
      />
      <div className="controls">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num}
            className="button"
            onClick={() => placeNumber(num)}
          >
            {num}
          </button>
        ))}
        <button className="button" onClick={useHint}>
          Hint ({hintsLeft})
        </button>
        <button className="button" onClick={undoMove}>
          Undo
        </button>
        <button className="button" onClick={() => newGame('easy')}>
          New Easy
        </button>
        <button className="button" onClick={() => newGame('medium')}>
          New Med
        </button>
        <button className="button" onClick={() => newGame('hard')}>
          New Hard
        </button>
      </div>
      <div className="timer">{formatTime(timer)}</div>
      <div className="message">
        {gameState === 'error' ? 'Error detected!' : ''}
      </div>
    </div>
  );
}

export default App;
