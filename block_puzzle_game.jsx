import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Utilities ---
const GRID_SIZE = 8;
const emptyGrid = () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

// Expanded block shapes
const SHAPES = [
  { color: "#ff6b6b", shape: [[1, 1], [1, 1]] },               // Square
  { color: "#4dabf7", shape: [[1, 1, 1]] },                    // Line 3
  { color: "#51cf66", shape: [[1, 0], [1, 1]] },               // L
  { color: "#ffa94d", shape: [[1, 1, 1, 1]] },                // Line 4
  { color: "#845ef7", shape: [[1, 1, 0], [0, 1, 1]] },        // Z
  { color: "#f06595", shape: [[1, 1, 1], [0, 1, 0]] },        // T
  { color: "#20c997", shape: [[1], [1], [1]] },               // Vertical line
  { color: "#ffd43b", shape: [[1, 1, 1], [1, 0, 0]] },        // L2
];

const getRandomBlock = () => SHAPES[Math.floor(Math.random() * SHAPES.length)];

export default function BlockPuzzleGame() {
  const [grid, setGrid] = useState(emptyGrid());
  const [queue, setQueue] = useState([getRandomBlock(), getRandomBlock(), getRandomBlock()]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [explosions, setExplosions] = useState([]);

  // --- POP FX (tight, small) ---
  const triggerExplosion = (cells) => {
    setExplosions((prev) => [
      ...prev,
      ...cells.map(([r, c]) => ({ id: `${r}-${c}-${Date.now()}`, r, c }))
    ]);

    // clear after POP animation finishes
    setTimeout(() => setExplosions([]), 300);
  };

  const placeBlock = (r, c, block) => {
    const shape = block.shape;
    const newGrid = grid.map(row => [...row]);

    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] === 1) {
          if (r + i >= GRID_SIZE || c + j >= GRID_SIZE || newGrid[r + i][c + j] !== null) {
            return false;
          }
        }
      }
    }

    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] === 1) newGrid[r + i][c + j] = block.color;
      }
    }

    setGrid(newGrid);
    handleClears(newGrid);
    updateQueue();
    return true;
  };

  const updateQueue = () => {
    setQueue((q) => [...q.slice(1), getRandomBlock()]);
    setSelected(null);
  };

  const handleClears = (grid) => {
    const rowsToClear = [];
    const colsToClear = [];

    for (let r = 0; r < GRID_SIZE; r++) if (grid[r].every((cell) => cell !== null)) rowsToClear.push(r);
    for (let c = 0; c < GRID_SIZE; c++) if (grid.every((row) => row[c] !== null)) colsToClear.push(c);

    if (!rowsToClear.length && !colsToClear.length) return;

    const explosionCells = [];
    rowsToClear.forEach((r) => grid[r].forEach((_, c) => explosionCells.push([r, c])));
    colsToClear.forEach((c) => grid.forEach((_, r) => explosionCells.push([r, c])));
    triggerExplosion(explosionCells);

    const newGrid = grid.map((row) => [...row]);
    rowsToClear.forEach((r) => newGrid[r].fill(null));
    colsToClear.forEach((c) => newGrid.forEach((row) => (row[c] = null)));

    setGrid(newGrid);
    setScore((s) => s + (rowsToClear.length + colsToClear.length) * 200);
  };

  return (
    <div className="p-4 flex flex-col items-center gap-6 select-none max-w-screen-sm mx-auto">
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-lg">
        Block Puzzle
      </h1>

      <p className="text-2xl font-bold text-gray-800">Poäng: {score}</p>

      {/* GRID */}
      <div
        className="relative grid gap-1 bg-gray-300 p-3 rounded-3xl shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(30px, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <motion.div
              key={`${r}-${c}`}
              className="aspect-square border rounded-xl bg-white flex items-center justify-center cursor-pointer"
              onClick={() => selected && placeBlock(r, c, selected)}
              whileHover={{ scale: 1.05 }}
            >
              {cell && (
                <motion.div
                  layout
                  className="w-4/5 h-4/5 rounded-xl shadow-lg"
                  style={{ background: cell }}
                  initial={{ scale: 0.6, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                />
              )}
            </motion.div>
          ))
        )}

        {/* POP EFFECT */}
        <AnimatePresence>
          {explosions.map((ex) => (
            <motion.div
              key={ex.id}
              // keep as grid child (no absolute) so gridRow/gridColumn work
              className="flex items-center justify-center"
              style={{
                gridRow: ex.r + 1,
                gridColumn: ex.c + 1,
                pointerEvents: "none",
              }}
              initial={{ scale: 0.2, opacity: 0.95 }}
              animate={{ scale: 1.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <motion.div
                className="w-3/4 h-3/4 rounded-full bg-yellow-300"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* BLOCK QUEUE */}
      <div className="flex gap-4 mt-4">
        {queue.map((b, i) => (
          <motion.div
            key={i}
            className={`p-4 rounded-3xl border shadow-xl cursor-pointer transition-all ${
              selected === b ? "bg-gray-300 scale-110" : "bg-white"
            }`}
            onClick={() => setSelected(b)}
            whileHover={{ scale: 1.08 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {b.shape.map((row, r) => (
              <div key={r} className="flex justify-center">
                {row.map((cell, c) => (
                  <motion.div
                    key={c}
                    className="w-5 h-5 m-0.5 rounded"
                    style={{ background: cell ? b.color : "transparent", border: cell ? "none" : "1px dashed #bbb" }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: r * 0.03 + c * 0.01, type: "spring", stiffness: 300, damping: 20 }}
                  />
                ))}
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
