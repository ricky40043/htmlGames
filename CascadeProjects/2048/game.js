document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let gameOver = false;
    let canMove = true;
    const gridSize = 4;
    
    // DOM elements
    const gridElement = document.querySelector('.grid');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const newGameButton = document.getElementById('new-game');
    const tryAgainButton = document.getElementById('try-again');
    const gameOverElement = document.querySelector('.game-over');
    
    // Initialize the game
    function initGame() {
        // Reset game state
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        score = 0;
        gameOver = false;
        canMove = true;
        
        // Update UI
        updateScore();
        gameOverElement.style.display = 'none';
        
        // Clear the grid
        gridElement.innerHTML = '';
        
        // Create grid cells
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            gridElement.appendChild(cell);
        }
        
        // Add initial tiles
        addRandomTile();
        addRandomTile();
        
        // Render the initial grid
        renderGrid();
    }
    
    // Add a random tile (2 or 4) to an empty cell
    function addRandomTile() {
        const emptyCells = [];
        
        // Find all empty cells
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        // If there are empty cells, add a new tile
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[row][col] = Math.random() < 0.9 ? 2 : 4;
            
            // Create and animate the new tile
            const tile = document.createElement('div');
            const gridWidth = gridElement.offsetWidth;
            const gridGap = 15; // Defined in styles.css
            const cellSize = (gridWidth - (gridGap * (gridSize - 1))) / gridSize;

            tile.className = `tile tile-${grid[row][col]}`;
            tile.textContent = grid[row][col];
            tile.style.transform = `translate(${col * (cellSize + gridGap)}px, ${row * (cellSize + gridGap)}px) scale(0)`;
            gridElement.appendChild(tile);
            
            // Animate the new tile
            setTimeout(() => {
                tile.style.transform = 'scale(1)';
            }, 10);
        }
    }
    
    // Render the grid with tiles
    function renderGrid() {
        // Remove all tiles
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        
        // Add tiles to the grid
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col] !== 0) {
                    const gridWidth = gridElement.offsetWidth;
                    const gridGap = 15; // Defined in styles.css
                    const cellSize = (gridWidth - (gridGap * (gridSize - 1))) / gridSize;

                    const tile = document.createElement('div');
                    tile.className = `tile tile-${grid[row][col]}`;
                    tile.textContent = grid[row][col];
                    tile.style.transform = `translate(${col * (cellSize + gridGap)}px, ${row * (cellSize + gridGap)}px)`;
                    gridElement.appendChild(tile);
                }
            }
        }
    }
    
    // Update the score display
    function updateScore() {
        scoreElement.textContent = score;
        bestScoreElement.textContent = bestScore;
        
        // Update best score if needed
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore);
        }
    }
    
    // Check if the game is over
    function checkGameOver() {
        // Check for any empty cells
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // Check for possible merges
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const current = grid[row][col];
                
                // Check right neighbor
                if (col < gridSize - 1 && grid[row][col + 1] === current) {
                    return false;
                }
                
                // Check bottom neighbor
                if (row < gridSize - 1 && grid[row + 1][col] === current) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Move tiles in a direction
    async function moveTiles(direction) {
        if (!canMove || gameOver) return false;
        
        let moved = false;
        const oldGrid = JSON.parse(JSON.stringify(grid));
        
        // Disable further moves until animation completes
        canMove = false;
        
        // Process the move based on direction
        switch (direction) {
            case 'up':
                moved = moveUp();
                break;
            case 'right':
                moved = moveRight();
                break;
            case 'down':
                moved = moveDown();
                break;
            case 'left':
                moved = moveLeft();
                break;
        }
        
        // If tiles moved, add a new tile and check game over
        if (moved) {
            // Wait for animations to complete
            await new Promise(resolve => setTimeout(resolve, 150));
            
            addRandomTile();
            renderGrid();
            updateScore();
            
            if (checkGameOver()) {
                gameOver = true;
                gameOverElement.style.display = 'flex';
            }
        } else if (JSON.stringify(oldGrid) !== JSON.stringify(grid)) {
            // If the grid changed but no tiles moved (only merged)
            renderGrid();
            updateScore();
        }
        
        // Re-enable movement
        canMove = true;
        return moved;
    }
    
    // Move tiles up
    function moveUp() {
        let moved = false;
        
        for (let col = 0; col < gridSize; col++) {
            // Move tiles up
            for (let row = 1; row < gridSize; row++) {
                if (grid[row][col] !== 0) {
                    let currentRow = row;
                    
                    while (currentRow > 0 && grid[currentRow - 1][col] === 0) {
                        grid[currentRow - 1][col] = grid[currentRow][col];
                        grid[currentRow][col] = 0;
                        currentRow--;
                        moved = true;
                    }
                }
            }
            
            // Merge tiles
            for (let row = 0; row < gridSize - 1; row++) {
                if (grid[row][col] !== 0 && grid[row][col] === grid[row + 1][col]) {
                    grid[row][col] *= 2;
                    score += grid[row][col];
                    grid[row + 1][col] = 0;
                    moved = true;
                    
                    // Move tiles up again after merge
                    for (let r = row + 1; r < gridSize - 1; r++) {
                        grid[r][col] = grid[r + 1][col];
                        grid[r + 1][col] = 0;
                    }
                }
            }
        }
        
        return moved;
    }
    
    // Move tiles right
    function moveRight() {
        let moved = false;
        
        for (let row = 0; row < gridSize; row++) {
            // Move tiles right
            for (let col = gridSize - 2; col >= 0; col--) {
                if (grid[row][col] !== 0) {
                    let currentCol = col;
                    
                    while (currentCol < gridSize - 1 && grid[row][currentCol + 1] === 0) {
                        grid[row][currentCol + 1] = grid[row][currentCol];
                        grid[row][currentCol] = 0;
                        currentCol++;
                        moved = true;
                    }
                }
            }
            
            // Merge tiles
            for (let col = gridSize - 1; col > 0; col--) {
                if (grid[row][col] !== 0 && grid[row][col] === grid[row][col - 1]) {
                    grid[row][col] *= 2;
                    score += grid[row][col];
                    grid[row][col - 1] = 0;
                    moved = true;
                    
                    // Move tiles right again after merge
                    for (let c = col - 1; c > 0; c--) {
                        grid[row][c] = grid[row][c - 1];
                        grid[row][c - 1] = 0;
                    }
                }
            }
        }
        
        return moved;
    }
    
    // Move tiles down
    function moveDown() {
        let moved = false;
        
        for (let col = 0; col < gridSize; col++) {
            // Move tiles down
            for (let row = gridSize - 2; row >= 0; row--) {
                if (grid[row][col] !== 0) {
                    let currentRow = row;
                    
                    while (currentRow < gridSize - 1 && grid[currentRow + 1][col] === 0) {
                        grid[currentRow + 1][col] = grid[currentRow][col];
                        grid[currentRow][col] = 0;
                        currentRow++;
                        moved = true;
                    }
                }
            }
            
            // Merge tiles
            for (let row = gridSize - 1; row > 0; row--) {
                if (grid[row][col] !== 0 && grid[row][col] === grid[row - 1][col]) {
                    grid[row][col] *= 2;
                    score += grid[row][col];
                    grid[row - 1][col] = 0;
                    moved = true;
                    
                    // Move tiles down again after merge
                    for (let r = row - 1; r > 0; r--) {
                        grid[r][col] = grid[r - 1][col];
                        grid[r - 1][col] = 0;
                    }
                }
            }
        }
        
        return moved;
    }
    
    // Move tiles left
    function moveLeft() {
        let moved = false;
        
        for (let row = 0; row < gridSize; row++) {
            // Move tiles left
            for (let col = 1; col < gridSize; col++) {
                if (grid[row][col] !== 0) {
                    let currentCol = col;
                    
                    while (currentCol > 0 && grid[row][currentCol - 1] === 0) {
                        grid[row][currentCol - 1] = grid[row][currentCol];
                        grid[row][currentCol] = 0;
                        currentCol--;
                        moved = true;
                    }
                }
            }
            
            // Merge tiles
            for (let col = 0; col < gridSize - 1; col++) {
                if (grid[row][col] !== 0 && grid[row][col] === grid[row][col + 1]) {
                    grid[row][col] *= 2;
                    score += grid[row][col];
                    grid[row][col + 1] = 0;
                    moved = true;
                    
                    // Move tiles left again after merge
                    for (let c = col + 1; c < gridSize - 1; c++) {
                        grid[row][c] = grid[row][c + 1];
                        grid[row][c + 1] = 0;
                    }
                }
            }
        }
        
        return moved;
    }
    
    // Event listeners
    document.addEventListener('keydown', async (e) => {
        if (!canMove) return;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                await moveTiles('up');
                break;
            case 'ArrowRight':
                e.preventDefault();
                await moveTiles('right');
                break;
            case 'ArrowDown':
                e.preventDefault();
                await moveTiles('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                await moveTiles('left');
                break;
        }
    });
    
    // Touch event handling for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);
    
    document.addEventListener('touchend', async (e) => {
        if (!touchStartX || !touchStartY) return;
        
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Determine the main direction of the swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                await moveTiles('right');
            } else {
                await moveTiles('left');
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                await moveTiles('down');
            } else {
                await moveTiles('up');
            }
        }
        
        // Reset touch coordinates
        touchStartX = 0;
        touchStartY = 0;
    }, false);
    
    // New game button
    newGameButton.addEventListener('click', initGame);
    tryAgainButton.addEventListener('click', initGame);
    
    // Initialize the game
    initGame();
});
