import { useState } from "react";
import type { Theme } from "../../lib/themes";

type PieceType = "p" | "r" | "n" | "b" | "q" | "k";
type PieceColor = "w" | "b";
type Piece = { type: PieceType; color: PieceColor; moved?: boolean };
type BoardState = (Piece | null)[][];
type Difficulty = "easy" | "medium" | "hard";

const createInitialBoard = (): BoardState => [
  [
    { type: "r", color: "b" }, { type: "n", color: "b" }, { type: "b", color: "b" }, { type: "q", color: "b" },
    { type: "k", color: "b" }, { type: "b", color: "b" }, { type: "n", color: "b" }, { type: "r", color: "b" }
  ],
  Array(8).fill(null).map(() => ({ type: "p", color: "b" as PieceColor })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: "p", color: "w" as PieceColor })),
  [
    { type: "r", color: "w" }, { type: "n", color: "w" }, { type: "b", color: "w" }, { type: "q", color: "w" },
    { type: "k", color: "w" }, { type: "b", color: "w" }, { type: "n", color: "w" }, { type: "r", color: "w" }
  ],
];

const PIECE_IMAGES: Record<PieceColor, Record<PieceType, string>> = {
  w: {
    p: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
    r: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
    n: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
    b: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
    q: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
    k: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  },
  b: {
    p: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
    r: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
    n: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
    b: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
    q: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
    k: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  },
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 1000,
};

export default function ChessScreen({
  theme,
  onBack,
  onScore,
}: {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [turn, setTurn] = useState<PieceColor>("w");
  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [statusMessage, setStatusMessage] = useState("Sıra sizde (Beyaz)");
  const [gameOver, setGameOver] = useState(false);

  const getBasicMoves = (r: number, c: number, currentBoard: BoardState): [number, number][] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];
    const moves: [number, number][] = [];

    const isEnemy = (tr: number, tc: number) => {
      const target = currentBoard[tr][tc];
      return target !== null && target.color !== piece.color;
    };

    const isEmpty = (tr: number, tc: number) => {
      return currentBoard[tr][tc] === null;
    };

    if (piece.type === "p") {
      const dir = piece.color === "w" ? -1 : 1;
      const startRow = piece.color === "w" ? 6 : 1;

      if (r + dir >= 0 && r + dir <= 7 && isEmpty(r + dir, c)) {
        moves.push([r + dir, c]);
        if (r === startRow && isEmpty(r + dir * 2, c)) {
          moves.push([r + dir * 2, c]);
        }
      }
      for (const dc of [-1, 1]) {
        if (r + dir >= 0 && r + dir <= 7 && c + dc >= 0 && c + dc <= 7) {
          if (isEnemy(r + dir, c + dc)) {
            moves.push([r + dir, c + dc]);
          }
        }
      }
    } else if (piece.type === "n") {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightOffsets) {
        const tr = r + dr;
        const tc = c + dc;
        if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
          if (isEmpty(tr, tc) || isEnemy(tr, tc)) {
            moves.push([tr, tc]);
          }
        }
      }
    } else if (piece.type === "r" || piece.type === "b" || piece.type === "q") {
      const dirs: [number, number][] = [];
      if (piece.type === "r" || piece.type === "q") dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (piece.type === "b" || piece.type === "q") dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

      for (const [dr, dc] of dirs) {
        let tr = r + dr;
        let tc = c + dc;
        while (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
          if (isEmpty(tr, tc)) {
            moves.push([tr, tc]);
          } else {
            if (isEnemy(tr, tc)) moves.push([tr, tc]);
            break;
          }
          tr += dr;
          tc += dc;
        }
      }
    } else if (piece.type === "k") {
      const kingOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of kingOffsets) {
        const tr = r + dr;
        const tc = c + dc;
        if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
          if (isEmpty(tr, tc) || isEnemy(tr, tc)) {
            moves.push([tr, tc]);
          }
        }
      }

      if (!piece.moved) {
        const rK = currentBoard[r][7];
        if (rK && rK.type === "r" && !rK.moved && isEmpty(r, 5) && isEmpty(r, 6)) {
          moves.push([r, 6]);
        }
        const rQ = currentBoard[r][0];
        if (rQ && rQ.type === "r" && !rQ.moved && isEmpty(r, 1) && isEmpty(r, 2) && isEmpty(r, 3)) {
          moves.push([r, 2]);
        }
      }
    }

    return moves;
  };

  const isKingCheck = (color: PieceColor, currentBoard: BoardState): boolean => {
    let kR = -1, kC = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = currentBoard[r][c];
        if (p && p.type === "k" && p.color === color) {
          kR = r; kC = c;
          break;
        }
      }
    }
    if (kR === -1) return false;

    const enemyColor = color === "w" ? "b" : "w";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = currentBoard[r][c];
        if (p && p.color === enemyColor) {
          const enemyMoves = getBasicMoves(r, c, currentBoard);
          if (enemyMoves.some(([tr, tc]) => tr === kR && tc === kC)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const getLegalMoves = (r: number, c: number, currentBoard: BoardState): [number, number][] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];

    const basicMoves = getBasicMoves(r, c, currentBoard);
    const safeMoves: [number, number][] = [];

    for (const [tr, tc] of basicMoves) {
      const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
      tempBoard[tr][tc] = tempBoard[r][c];
      tempBoard[r][c] = null;

      if (!isKingCheck(piece.color, tempBoard)) {
        safeMoves.push([tr, tc]);
      }
    }

    return safeMoves;
  };

  // Pozisyon Puanlama Fonksiyonu
  const evaluateBoard = (b: BoardState): number => {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p) {
          let val = PIECE_VALUES[p.type];
          // Merkeze hakimiyet bonusu
          if ((r === 3 || r === 4) && (c === 3 || c === 4)) val += 3;
          if (p.color === "b") {
            score += val;
          } else {
            score -= val;
          }
        }
      }
    }
    return score;
  };

  // Minimax Derin Arama Algoritması
  const minimax = (
    b: BoardState,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number
  ): number => {
    if (depth === 0) return evaluateBoard(b);

    const activeColor = isMaximizing ? "b" : "w";
    const movesList: { from: [number, number]; to: [number, number] }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.color === activeColor) {
          const valid = getLegalMoves(r, c, b);
          valid.forEach(([tr, tc]) => movesList.push({ from: [r, c], to: [tr, tc] }));
        }
      }
    }

    if (movesList.length === 0) return evaluateBoard(b);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of movesList) {
        const tempBoard = b.map(row => row.map(cell => cell ? { ...cell } : null));
        tempBoard[m.to[0]][m.to[1]] = tempBoard[m.from[0]][m.from[1]];
        tempBoard[m.from[0]][m.from[1]] = null;

        const evalScore = minimax(tempBoard, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of movesList) {
        const tempBoard = b.map(row => row.map(cell => cell ? { ...cell } : null));
        tempBoard[m.to[0]][m.to[1]] = tempBoard[m.from[0]][m.from[1]];
        tempBoard[m.from[0]][m.from[1]] = null;

        const evalScore = minimax(tempBoard, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const handleSquareClick = (r: number, c: number) => {
    if (gameOver || turn !== "w") return;

    if (selectedCoord) {
      const [sr, sc] = selectedCoord;
      const isLegal = validMoves.some(([vr, vc]) => vr === r && vc === c);

      if (isLegal) {
        const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
        const movingPiece = newBoard[sr][sc];

        if (movingPiece) movingPiece.moved = true;

        if (movingPiece?.type === "k" && Math.abs(c - sc) === 2) {
          if (c === 6) {
            newBoard[r][5] = newBoard[r][7];
            newBoard[r][7] = null;
          } else if (c === 2) {
            newBoard[r][3] = newBoard[r][0];
            newBoard[r][0] = null;
          }
        }

        if (movingPiece?.type === "p" && (r === 0 || r === 7)) {
          movingPiece.type = "q";
        }

        newBoard[r][c] = movingPiece;
        newBoard[sr][sc] = null;

        setBoard(newBoard);
        setSelectedCoord(null);
        setValidMoves([]);

        const botInCheck = isKingCheck("b", newBoard);
        setTurn("b");
        setStatusMessage(botInCheck ? "ŞAH ÇEKTİNİZ! Bot düşünüyor..." : "Bot düşünüyor...");

        setTimeout(() => makeBotMove(newBoard), 200);
      } else {
        selectPiece(r, c);
      }
    } else {
      selectPiece(r, c);
    }
  };

  const selectPiece = (r: number, c: number) => {
    const piece = board[r][c];
    if (piece && piece.color === turn) {
      setSelectedCoord([r, c]);
      setValidMoves(getLegalMoves(r, c, board));
    } else {
      setSelectedCoord(null);
      setValidMoves([]);
    }
  };

  const makeBotMove = (currentBoard: BoardState) => {
    const allMoves: { from: [number, number]; to: [number, number] }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c]?.color === "b") {
          const moves = getLegalMoves(r, c, currentBoard);
          moves.forEach(([tr, tc]) => allMoves.push({ from: [r, c], to: [tr, tc] }));
        }
      }
    }

    if (allMoves.length === 0) {
      setGameOver(true);
      if (isKingCheck("b", currentBoard)) {
        setStatusMessage("ŞAH MAT! Tebrikler, Kazandınız! 🎉");
        onScore(200);
      } else {
        setStatusMessage("PATA! Berabere Bitti.");
      }
      return;
    }

    // Derinlik Ayarları (Kolay: 1, Orta: 2, Zor: 3 hamle derinlik)
    const searchDepth = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;

    let bestMove = allMoves[0];
    let bestValue = -Infinity;

    for (const move of allMoves) {
      const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
      tempBoard[move.to[0]][move.to[1]] = tempBoard[move.from[0]][move.from[1]];
      tempBoard[move.from[0]][move.from[1]] = null;

      const boardValue = minimax(tempBoard, searchDepth - 1, false, -Infinity, Infinity);
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }

    const newBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
    const movingPiece = newBoard[bestMove.from[0]][bestMove.from[1]];

    if (movingPiece) movingPiece.moved = true;

    if (movingPiece?.type === "k" && Math.abs(bestMove.to[1] - bestMove.from[1]) === 2) {
      const r = bestMove.from[0];
      if (bestMove.to[1] === 6) {
        newBoard[r][5] = newBoard[r][7];
        newBoard[r][7] = null;
      } else if (bestMove.to[1] === 2) {
        newBoard[r][3] = newBoard[r][0];
        newBoard[r][0] = null;
      }
    }

    if (movingPiece?.type === "p" && (bestMove.to[0] === 0 || bestMove.to[0] === 7)) {
      movingPiece.type = "q";
    }

    newBoard[bestMove.to[0]][bestMove.to[1]] = movingPiece;
    newBoard[bestMove.from[0]][bestMove.from[1]] = null;

    setBoard(newBoard);
    setTurn("w");

    const playerInCheck = isKingCheck("w", newBoard);
    setStatusMessage(playerInCheck ? "ŞAH! Sıra sizde (Beyaz)" : "Sıra sizde (Beyaz)");
  };

  const restartGame = () => {
    setBoard(createInitialBoard());
    setTurn("w");
    setSelectedCoord(null);
    setValidMoves([]);
    setGameOver(false);
    setStatusMessage("Sıra sizde (Beyaz)");
  };

  return (
    <div
      style={{
        background: theme.bgColor,
        minHeight: "100vh",
        color: theme.textColor,
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      {/* Üst Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 12,
            padding: "10px 16px",
            color: theme.textColor,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          ← Geri
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>
          ♟️ Satranç (Bot)
        </h2>
        <button
          onClick={restartGame}
          style={{
            background: theme.accent,
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Yeniden
        </button>
      </div>

      {/* Zorluk Seviyesi Seçici (Sadeleştirilmiş) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          background: "rgba(0,0,0,0.2)",
          padding: 6,
          borderRadius: 14,
        }}
      >
        {[
          { id: "easy", label: "🟢 Kolay" },
          { id: "medium", label: "🟡 Orta" },
          { id: "hard", label: "🔴 Zor" },
        ].map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => {
              setDifficulty(lvl.id as Difficulty);
              restartGame();
            }}
            style={{
              background: difficulty === lvl.id ? theme.accent : "transparent",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 18px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: theme.headerBg,
          padding: "10px 20px",
          borderRadius: 12,
          marginBottom: 16,
          fontWeight: 700,
          fontSize: 16,
          textAlign: "center",
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
        }}
      >
        {statusMessage}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          aspectRatio: "1 / 1",
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          border: `4px solid ${theme.accent}`,
        }}
      >
        {board.map((row, r) =>
          row.map((piece, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selectedCoord && selectedCoord[0] === r && selectedCoord[1] === c;
            const isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                style={{
                  background: isSelected
                    ? "#baca24"
                    : isValidMove
                    ? "#a8d672"
                    : isDark
                    ? "#b58863"
                    : "#f0d9b5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  userSelect: "none",
                  position: "relative",
                  transition: "background 0.15s",
                }}
              >
                {piece ? (
                  <img
                    src={PIECE_IMAGES[piece.color][piece.type]}
                    alt={`${piece.color} ${piece.type}`}
                    style={{
                      width: "82%",
                      height: "82%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.3))",
                    }}
                  />
                ) : isValidMove ? (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "rgba(0, 0, 0, 0.25)",
                    }}
                  />
                ) : (
                  ""
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}