const pieceUnicode = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

class ChessGame {
    constructor() {
        this.board = Array(64).fill(null);
        this.selectedSquare = null;
        this.currentPlayer = 'white';
        this.validMoves = [];
        this.isGameOver = false;
        this.winner = null;
        this.initializeBoard();
        this.render();
        this.setupEventListeners();
    }

    initializeBoard() {
        // Black pieces (top)
        this.board[0] = 'bR'; this.board[1] = 'bN'; this.board[2] = 'bB'; this.board[3] = 'bQ';
        this.board[4] = 'bK'; this.board[5] = 'bB'; this.board[6] = 'bN'; this.board[7] = 'bR';
        for (let i = 8; i < 16; i++) this.board[i] = 'bP';

        // White pieces (bottom)
        for (let i = 48; i < 56; i++) this.board[i] = 'wP';
        this.board[56] = 'wR'; this.board[57] = 'wN'; this.board[58] = 'wB'; this.board[59] = 'wQ';
        this.board[60] = 'wK'; this.board[61] = 'wB'; this.board[62] = 'wN'; this.board[63] = 'wR';
    }

    getCoordinates(index) {
        return { row: Math.floor(index / 8), col: index % 8 };
    }

    getIndex(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return -1;
        return row * 8 + col;
    }

    isWhite(piece) {
        return piece && piece[0] === 'w';
    }

    isBlack(piece) {
        return piece && piece[0] === 'b';
    }

    getValidMoves(index) {
        const piece = this.board[index];
        if (!piece) return [];

        const { row, col } = this.getCoordinates(index);
        let moves = [];

        const addMove = (r, c) => {
            const newIndex = this.getIndex(r, c);
            if (newIndex !== -1) {
                const target = this.board[newIndex];
                if (!target || 
                    (this.isWhite(piece) && this.isBlack(target)) || 
                    (this.isBlack(piece) && this.isWhite(target))) {
                    moves.push(newIndex);
                }
            }
        };

        const addMultipleMoves = (directions) => {
            for (let [dr, dc] of directions) {
                for (let i = 1; i < 8; i++) {
                    const newIndex = this.getIndex(row + dr * i, col + dc * i);
                    if (newIndex === -1) break;
                    const target = this.board[newIndex];
                    if (!target) {
                        moves.push(newIndex);
                    } else {
                        if ((this.isWhite(piece) && this.isBlack(target)) || 
                            (this.isBlack(piece) && this.isWhite(target))) {
                            moves.push(newIndex);
                        }
                        break;
                    }
                }
            }
        };

        const type = piece[1];

        if (type === 'P') { // Pawn
            const dir = this.isWhite(piece) ? -1 : 1;
            const startRow = this.isWhite(piece) ? 6 : 1;
            
            const fwdIndex = this.getIndex(row + dir, col);
            if (fwdIndex !== -1 && !this.board[fwdIndex]) {
                moves.push(fwdIndex);
                
                if (row === startRow) {
                    const fwd2Index = this.getIndex(row + 2 * dir, col);
                    if (!this.board[fwd2Index]) moves.push(fwd2Index);
                }
            }
            
            for (let dc of [-1, 1]) {
                const captureIndex = this.getIndex(row + dir, col + dc);
                if (captureIndex !== -1 && this.board[captureIndex]) {
                    const target = this.board[captureIndex];
                    if ((this.isWhite(piece) && this.isBlack(target)) || 
                        (this.isBlack(piece) && this.isWhite(target))) {
                        moves.push(captureIndex);
                    }
                }
            }
        } else if (type === 'N') { // Knight
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            knightMoves.forEach(([dr, dc]) => addMove(row + dr, col + dc));
        } else if (type === 'B') { // Bishop
            addMultipleMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
        } else if (type === 'R') { // Rook
            addMultipleMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]);
        } else if (type === 'Q') { // Queen
            addMultipleMoves([
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ]);
        } else if (type === 'K') { // King
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) addMove(row + dr, col + dc);
                }
            }
        }

        return moves;
    }

    selectSquare(index) {
        if (this.isGameOver) return;

        const piece = this.board[index];
        
        if (this.selectedSquare === null) {
            if (!piece || 
                (this.currentPlayer === 'white' && !this.isWhite(piece)) ||
                (this.currentPlayer === 'black' && !this.isBlack(piece))) {
                this.setMessage('Invalid selection!');
                return;
            }
            this.selectedSquare = index;
            this.validMoves = this.getValidMoves(index);
        } else {
            if (index === this.selectedSquare) {
                this.selectedSquare = null;
                this.validMoves = [];
            } else if (this.validMoves.includes(index)) {
                this.movePiece(this.selectedSquare, index);
                this.selectedSquare = null;
                this.validMoves = [];
            } else {
                this.selectedSquare = index;
                this.validMoves = this.getValidMoves(index);
            }
        }
        this.render();
    }

    movePiece(from, to) {
        const piece = this.board[from];
        this.board[to] = piece;
        this.board[from] = null;
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check for checkmate
        if (this.isCheckmate(this.currentPlayer)) {
            this.isGameOver = true;
            this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
            this.setMessage(`Checkmate! ${this.winner.toUpperCase()} wins!`);
        } else if (this.isInCheck(this.currentPlayer)) {
            this.setMessage(`Check! ${this.currentPlayer}'s turn`);
        } else {
            this.setMessage(`${this.currentPlayer}'s turn`);
        }
    }

    findKing(color) {
        const kingPiece = color === 'white' ? 'wK' : 'bK';
        return this.board.indexOf(kingPiece);
    }

    isSquareAttackedBy(squareIndex, byColor) {
        for (let i = 0; i < 64; i++) {
            const piece = this.board[i];
            if (!piece) continue;

            const isOwnPiece = (byColor === 'white' && this.isWhite(piece)) ||
                               (byColor === 'black' && this.isBlack(piece));
            if (!isOwnPiece) continue;

            const attackingPiece = piece[1];
            const { row: fromRow, col: fromCol } = this.getCoordinates(i);
            const { row: toRow, col: toCol } = this.getCoordinates(squareIndex);

            if (attackingPiece === 'P') {
                const dir = this.isWhite(piece) ? -1 : 1;
                if (toRow === fromRow + dir && Math.abs(toCol - fromCol) === 1) return true;
            } else if (attackingPiece === 'N') {
                const dr = Math.abs(toRow - fromRow);
                const dc = Math.abs(toCol - fromCol);
                if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) return true;
            } else if (attackingPiece === 'B') {
                if (Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) {
                    if (this.isPathClear(i, squareIndex)) return true;
                }
            } else if (attackingPiece === 'R') {
                if (toRow === fromRow || toCol === fromCol) {
                    if (this.isPathClear(i, squareIndex)) return true;
                }
            } else if (attackingPiece === 'Q') {
                if (toRow === fromRow || toCol === fromCol || 
                    Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) {
                    if (this.isPathClear(i, squareIndex)) return true;
                }
            } else if (attackingPiece === 'K') {
                if (Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1) {
                    return true;
                }
            }
        }
        return false;
    }

    isPathClear(from, to) {
        const { row: fromRow, col: fromCol } = this.getCoordinates(from);
        const { row: toRow, col: toCol } = this.getCoordinates(to);

        const dr = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
        const dc = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);

        let r = fromRow + dr;
        let c = fromCol + dc;

        while (r !== toRow || c !== toCol) {
            if (this.board[this.getIndex(r, c)] !== null) return false;
            r += dr;
            c += dc;
        }
        return true;
    }

    isInCheck(color) {
        const kingIndex = this.findKing(color);
        if (kingIndex === -1) return false;

        const enemyColor = color === 'white' ? 'black' : 'white';
        return this.isSquareAttackedBy(kingIndex, enemyColor);
    }

    hasLegalMoves(color) {
        for (let i = 0; i < 64; i++) {
            const piece = this.board[i];
            if (!piece) continue;

            const isOwnPiece = (color === 'white' && this.isWhite(piece)) ||
                               (color === 'black' && this.isBlack(piece));
            if (!isOwnPiece) continue;

            const moves = this.getValidMoves(i);
            for (let targetIndex of moves) {
                // Simulate the move
                const originalPiece = this.board[targetIndex];
                this.board[targetIndex] = piece;
                this.board[i] = null;

                // Check if king is still in check
                const stillInCheck = this.isInCheck(color);

                // Undo the move
                this.board[i] = piece;
                this.board[targetIndex] = originalPiece;

                if (!stillInCheck) return true;
            }
        }
        return false;
    }

    isCheckmate(color) {
        return this.isInCheck(color) && !this.hasLegalMoves(color);
    }

    setMessage(msg) {
        document.getElementById('message').textContent = msg;
    }

    render() {
        const boardDiv = document.getElementById('board');
        boardDiv.innerHTML = '';

        for (let i = 0; i < 64; i++) {
            const square = document.createElement('div');
            const { row, col } = this.getCoordinates(i);
            const isWhiteSquare = (row + col) % 2 === 0;

            square.className = `square ${isWhiteSquare ? 'white' : 'black'}`;
            
            if (i === this.selectedSquare) square.classList.add('selected');
            if (this.validMoves.includes(i)) square.classList.add('valid-move');

            const piece = this.board[i];
            if (piece) {
                const pieceSpan = document.createElement('span');
                pieceSpan.className = 'piece';
                pieceSpan.textContent = pieceUnicode[piece];
                square.appendChild(pieceSpan);
            }

            square.addEventListener('click', () => this.selectSquare(i));
            boardDiv.appendChild(square);
        }

        document.getElementById('currentPlayer').textContent = 
            this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
    }

    setupEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.board = Array(64).fill(null);
            this.selectedSquare = null;
            this.currentPlayer = 'white';
            this.validMoves = [];
            this.isGameOver = false;
            this.winner = null;
            this.initializeBoard();
            this.setMessage('');
            this.render();
        });
    }
}

// Initialize game on page load
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
