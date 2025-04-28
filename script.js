const chessboard = document.getElementById('chessboard');
const statusDisplay = document.createElement('div');
statusDisplay.id = 'status';
document.body.appendChild(statusDisplay);

const tipsDisplay = document.createElement('div');
tipsDisplay.id = 'tips';
tipsDisplay.style.marginTop = '10px';
tipsDisplay.style.fontSize = '16px';
tipsDisplay.style.color = '#333';
tipsDisplay.style.minHeight = '24px';
document.body.appendChild(tipsDisplay);

const initialBoard = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

// Unicode chess pieces
const pieceUnicode = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙',
};

let board = JSON.parse(JSON.stringify(initialBoard));
let selectedSquare = null;
let currentPlayer = 'white';

// Track if kings and rooks have moved for castling rights
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookAMoved = false; // a1 rook
let whiteRookHMoved = false; // h1 rook
let blackRookAMoved = false; // a8 rook
let blackRookHMoved = false; // h8 rook

function renderBoard() {
  chessboard.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;
      const piece = board[row][col];
      if (piece) {
        square.textContent = pieceUnicode[piece];
      }
      square.addEventListener('click', () => onSquareClick(row, col));
      chessboard.appendChild(square);
    }
  }
  updateStatus();
  updateTips();
}

function onSquareClick(row, col) {
  const piece = board[row][col];
  if (selectedSquare) {
    // Try to move piece
    if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
      animateMove(selectedSquare.row, selectedSquare.col, row, col);
      currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    }
    selectedSquare = null;
    renderBoard();
  } else {
    // Select piece if it belongs to current player
    if (piece && isCurrentPlayerPiece(piece)) {
      selectedSquare = {row, col};
      highlightSelected(row, col);
      highlightValidMoves(row, col);
    }
  }
}

function highlightValidMoves(row, col) {
  const validMoves = getValidMoves(row, col);
  const squares = document.querySelectorAll('.square');
  squares.forEach(sq => {
    sq.classList.remove('valid-move');
  });
  validMoves.forEach(move => {
    const selector = `.square[data-row='${move.row}'][data-col='${move.col}']`;
    const square = document.querySelector(selector);
    if (square) {
      square.classList.add('valid-move');
    }
  });
}

function getValidMoves(row, col) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(row, col, r, c)) {
        moves.push({row: r, col: c});
      }
    }
  }
  return moves;
}

function isCurrentPlayerPiece(piece) {
  if (currentPlayer === 'white') {
    return piece === piece.toUpperCase();
  } else {
    return piece === piece.toLowerCase();
  }
}

function highlightSelected(row, col) {
  renderBoard();
  const squares = document.querySelectorAll('.square');
  squares.forEach(sq => {
    if (parseInt(sq.dataset.row) === row && parseInt(sq.dataset.col) === col) {
      sq.classList.add('highlight');
    }
  });
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
  const movingPiece = board[fromRow][fromCol];
  const targetPiece = board[toRow][toCol];

  // Cannot move to a square with a piece of the same color
  if (targetPiece && isSameColor(movingPiece, targetPiece)) {
    return false;
  }

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;

  const pieceType = movingPiece.toLowerCase();

  switch (pieceType) {
    case 'p': // Pawn
      return isValidPawnMove(fromRow, fromCol, toRow, toCol, movingPiece, targetPiece, rowDiff, colDiff);
    case 'r': // Rook
      return isValidRookMove(fromRow, fromCol, toRow, toCol);
    case 'n': // Knight
      return isValidKnightMove(rowDiff, colDiff);
    case 'b': // Bishop
      return isValidBishopMove(fromRow, fromCol, toRow, toCol);
    case 'q': // Queen
      return isValidQueenMove(fromRow, fromCol, toRow, toCol);
    case 'k': // King
      return isValidKingMove(fromRow, fromCol, toRow, toCol);
    default:
      return false;
  }
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, movingPiece, targetPiece, rowDiff, colDiff) {
  const direction = movingPiece === movingPiece.toUpperCase() ? -1 : 1; // White moves up (-1), black down (+1)
  const startRow = movingPiece === movingPiece.toUpperCase() ? 6 : 1;

  // Move forward
  if (colDiff === 0) {
    // One step forward
    if (rowDiff === direction && !targetPiece) {
      return true;
    }
    // Two steps forward from start position
    if (fromRow === startRow && rowDiff === 2 * direction && !targetPiece && !board[fromRow + direction][fromCol]) {
      return true;
    }
  }
  // Capture diagonally
  if (Math.abs(colDiff) === 1 && rowDiff === direction && targetPiece && !isSameColor(movingPiece, targetPiece)) {
    return true;
  }
  // TODO: en passant
  return false;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
  if (fromRow !== toRow && fromCol !== toCol) return false;
  return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidKnightMove(rowDiff, colDiff) {
  return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
  if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
  return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
  if (fromRow === toRow || fromCol === toCol) {
    return isPathClear(fromRow, fromCol, toRow, toCol);
  }
  if (Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) {
    return isPathClear(fromRow, fromCol, toRow, toCol);
  }
  return false;
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // Normal king move (one square any direction)
  if (rowDiff <= 1 && colDiff <= 1) {
    return true;
  }

  // Castling
  if (rowDiff === 0 && colDiff === 2) {
    if (canCastle(fromRow, fromCol, toRow, toCol)) {
      return true;
    }
  }

  return false;
}

function canCastle(fromRow, fromCol, toRow, toCol) {
  const isWhite = currentPlayer === 'white';
  if (isWhite && fromRow !== 7) return false;
  if (!isWhite && fromRow !== 0) return false;

  // King side or queen side
  if (toCol === 6) {
    // King side castling
    if (isWhite) {
      if (whiteKingMoved || whiteRookHMoved) return false;
      if (board[7][5] || board[7][6]) return false;
      if (isSquareAttacked(7, 4, !isWhite) || isSquareAttacked(7, 5, !isWhite) || isSquareAttacked(7, 6, !isWhite)) return false;
      return true;
    } else {
      if (blackKingMoved || blackRookHMoved) return false;
      if (board[0][5] || board[0][6]) return false;
      if (isSquareAttacked(0, 4, !isWhite) || isSquareAttacked(0, 5, !isWhite) || isSquareAttacked(0, 6, !isWhite)) return false;
      return true;
    }
  } else if (toCol === 2) {
    // Queen side castling
    if (isWhite) {
      if (whiteKingMoved || whiteRookAMoved) return false;
      if (board[7][1] || board[7][2] || board[7][3]) return false;
      if (isSquareAttacked(7, 4, !isWhite) || isSquareAttacked(7, 3, !isWhite) || isSquareAttacked(7, 2, !isWhite)) return false;
      return true;
    } else {
      if (blackKingMoved || blackRookAMoved) return false;
      if (board[0][1] || board[0][2] || board[0][3]) return false;
      if (isSquareAttacked(0, 4, !isWhite) || isSquareAttacked(0, 3, !isWhite) || isSquareAttacked(0, 2, !isWhite)) return false;
      return true;
    }
  }
  return false;
}

// Placeholder for checking if a square is attacked by opponent
function isSquareAttacked(row, col, byWhite) {
  // For now, return false (no check detection implemented yet)
  return false;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
  const rowStep = toRow > fromRow ? 1 : (toRow < fromRow ? -1 : 0);
  const colStep = toCol > fromCol ? 1 : (toCol < fromCol ? -1 : 0);

  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol]) {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  return true;
}

function isSameColor(piece1, piece2) {
  return (piece1 === piece1.toUpperCase()) === (piece2 === piece2.toUpperCase());
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const movingPiece = board[fromRow][fromCol];
  board[toRow][toCol] = movingPiece;
  board[fromRow][fromCol] = '';

  // Update castling rights if king or rook moved
  if (movingPiece.toLowerCase() === 'k') {
    if (movingPiece === 'K') whiteKingMoved = true;
    else blackKingMoved = true;
  }
  if (movingPiece.toLowerCase() === 'r') {
    if (fromRow === 7 && fromCol === 0) whiteRookAMoved = true;
    if (fromRow === 7 && fromCol === 7) whiteRookHMoved = true;
    if (fromRow === 0 && fromCol === 0) blackRookAMoved = true;
    if (fromRow === 0 && fromCol === 7) blackRookHMoved = true;
  }

  // Handle castling move: move rook as well
  if (movingPiece.toLowerCase() === 'k' && Math.abs(toCol - fromCol) === 2) {
    if (toCol === 6) {
      // King side castling
      const rookFromCol = 7;
      const rookToCol = 5;
      board[toRow][rookToCol] = board[toRow][rookFromCol];
      board[toRow][rookFromCol] = '';
      if (movingPiece === 'K') {
        whiteRookHMoved = true;
      } else {
        blackRookHMoved = true;
      }
    } else if (toCol === 2) {
      // Queen side castling
      const rookFromCol = 0;
      const rookToCol = 3;
      board[toRow][rookToCol] = board[toRow][rookFromCol];
      board[toRow][rookFromCol] = '';
      if (movingPiece === 'K') {
        whiteRookAMoved = true;
      } else {
        blackRookAMoved = true;
      }
    }
  }
}

function animateMove(fromRow, fromCol, toRow, toCol) {
  const fromSquare = document.querySelector(`.square[data-row='${fromRow}'][data-col='${fromCol}']`);
  const toSquare = document.querySelector(`.square[data-row='${toRow}'][data-col='${toCol}']`);
  if (!fromSquare || !toSquare) return;

  const piece = fromSquare.textContent;

  // Create floating piece element
  const floatingPiece = document.createElement('div');
  floatingPiece.textContent = piece;
  floatingPiece.style.position = 'fixed';
  floatingPiece.style.fontSize = '36px';
  floatingPiece.style.width = fromSquare.offsetWidth + 'px';
  floatingPiece.style.height = fromSquare.offsetHeight + 'px';
  floatingPiece.style.lineHeight = fromSquare.offsetHeight + 'px';
  floatingPiece.style.textAlign = 'center';
  floatingPiece.style.pointerEvents = 'none';
  floatingPiece.style.transition = 'transform 0.4s ease';
  floatingPiece.style.zIndex = '1000';

  // Get positions relative to viewport
  const fromRect = fromSquare.getBoundingClientRect();
  const toRect = toSquare.getBoundingClientRect();

  // Set initial position
  floatingPiece.style.left = fromRect.left + 'px';
  floatingPiece.style.top = fromRect.top + 'px';

  document.body.appendChild(floatingPiece);

  // Hide piece on fromSquare during animation
  fromSquare.textContent = '';

  // Calculate translation
  const deltaX = toRect.left - fromRect.left;
  const deltaY = toRect.top - fromRect.top;

  // Trigger animation
  requestAnimationFrame(() => {
    floatingPiece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });

  floatingPiece.addEventListener('transitionend', () => {
    // Remove floating piece and update board
    document.body.removeChild(floatingPiece);
    movePiece(fromRow, fromCol, toRow, toCol);
    renderBoard();
  });
}

function updateStatus() {
  statusDisplay.textContent = `Current turn: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}`;
}

renderBoard();
