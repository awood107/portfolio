/**
 * Cooperative Pixel Canvas Sandbox Script
 * Implements interactive grid drawing, flood-fill algorithm,
 * real-time stats analytics, and asynchronous r/place cooperative simulations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Config
  const GRID_SIZE = 40;
  const CELL_SIZE = 14; // pixels per cell on canvas
  
  // State
  let grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  let selectedColor = '#ff4500'; // Default Orange-Red (r/place Red)
  let activeTool = 'pencil'; // pencil, bucket, eraser
  let isDrawing = false;
  let simIntervalId = null;
  let simulatedUsersCount = 6;
  let simSpeedMs = 700; // Medium

  // Color Palette definition (Reddit r/place 16-color palette)
  const colors = [
    { name: 'Red', hex: '#ff4500' },
    { name: 'Orange', hex: '#ff8700' },
    { name: 'Yellow', hex: '#ffd635' },
    { name: 'Dark Green', hex: '#00a368' },
    { name: 'Light Green', hex: '#7eed56' },
    { name: 'Dark Blue', hex: '#2450a4' },
    { name: 'Blue', hex: '#3690ea' },
    { name: 'Light Blue', hex: '#51e9f4' },
    { name: 'Dark Purple', hex: '#811e9f' },
    { name: 'Magenta', hex: '#b44ac0' },
    { name: 'Pink', hex: '#ff99aa' },
    { name: 'Brown', hex: '#9c6926' },
    { name: 'Black', hex: '#000000' },
    { name: 'Gray', hex: '#898d90' },
    { name: 'Light Gray', hex: '#d4d7d9' },
    { name: 'White', hex: '#ffffff' }
  ];

  // Simulated bot usernames for cooperative mode
  const botNames = [
    'BroadStreetPainter', 'SpartanPixel', 'FinanceQuant', 'GridBuilder', 
    'PlaceExplorer', 'ColorBot', 'NodeCoder', 'YieldMaster', 'MergerStrategist',
    'SQLSlicer', 'M2Moneypit', 'CapRateCrusader', 'LBO_Monte', 'BufferBull', 'AlphaChaser'
  ];

  // Faction template coordinate offsets relative to a center point
  const SPARTAN_HELMET = [
    // Plume (Green: #00a368)
    { dx: 0, dy: -5, color: '#00a368' },
    { dx: -1, dy: -5, color: '#00a368' },
    { dx: 1, dy: -5, color: '#00a368' },
    { dx: -2, dy: -4, color: '#00a368' },
    { dx: -1, dy: -4, color: '#00a368' },
    { dx: 0, dy: -4, color: '#00a368' },
    { dx: 1, dy: -4, color: '#00a368' },
    { dx: 2, dy: -4, color: '#00a368' },
    { dx: -3, dy: -3, color: '#00a368' },
    { dx: -2, dy: -3, color: '#00a368' },
    { dx: -1, dy: -3, color: '#00a368' },
    { dx: 0, dy: -3, color: '#00a368' },
    { dx: 1, dy: -3, color: '#00a368' },
    { dx: 2, dy: -3, color: '#00a368' },
    { dx: 3, dy: -3, color: '#00a368' },
    
    // Helmet Body (White: #ffffff)
    { dx: -2, dy: -2, color: '#ffffff' },
    { dx: -1, dy: -2, color: '#ffffff' },
    { dx: 0, dy: -2, color: '#ffffff' },
    { dx: 1, dy: -2, color: '#ffffff' },
    { dx: 2, dy: -2, color: '#ffffff' },
    
    { dx: -3, dy: -1, color: '#ffffff' },
    { dx: -2, dy: -1, color: '#ffffff' },
    { dx: -1, dy: -1, color: '#ffffff' },
    { dx: 0, dy: -1, color: '#ffffff' },
    { dx: 1, dy: -1, color: '#ffffff' },
    { dx: 2, dy: -1, color: '#ffffff' },
    { dx: 3, dy: -1, color: '#ffffff' },
    
    { dx: -3, dy: 0, color: '#ffffff' },
    { dx: -2, dy: 0, color: '#ffffff' }, // eye slot (dx -1 is empty)
    { dx: 0, dy: 0, color: '#ffffff' },  // nose guard
    { dx: 2, dy: 0, color: '#ffffff' },  // eye slot (dx 1 is empty)
    { dx: 3, dy: 0, color: '#ffffff' },
    
    { dx: -3, dy: 1, color: '#ffffff' },
    { dx: -2, dy: 1, color: '#ffffff' },
    { dx: 0, dy: 1, color: '#ffffff' },  // nose guard
    { dx: 2, dy: 1, color: '#ffffff' },
    { dx: 3, dy: 1, color: '#ffffff' },
    
    { dx: -3, dy: 2, color: '#ffffff' },
    { dx: 0, dy: 2, color: '#ffffff' },  // nose guard
    { dx: 3, dy: 2, color: '#ffffff' }
  ];

  const VOID_TEMPLATE = [
    // Core (Black #000000)
    { dx: 0, dy: 0, color: '#000000' },
    { dx: 1, dy: 0, color: '#000000' },
    { dx: -1, dy: 0, color: '#000000' },
    { dx: 0, dy: 1, color: '#000000' },
    { dx: 0, dy: -1, color: '#000000' },
    { dx: 1, dy: 1, color: '#000000' },
    { dx: -1, dy: 1, color: '#000000' },
    { dx: 1, dy: -1, color: '#000000' },
    { dx: -1, dy: -1, color: '#000000' },
    
    // Outer glow (Purple #811e9f)
    { dx: 2, dy: 0, color: '#811e9f' },
    { dx: -2, dy: 0, color: '#811e9f' },
    { dx: 0, dy: 2, color: '#811e9f' },
    { dx: 0, dy: -2, color: '#811e9f' },
    { dx: 2, dy: 1, color: '#811e9f' },
    { dx: -2, dy: 1, color: '#811e9f' },
    { dx: 2, dy: -1, color: '#811e9f' },
    { dx: -2, dy: -1, color: '#811e9f' },
    { dx: 1, dy: 2, color: '#811e9f' },
    { dx: 1, dy: -2, color: '#811e9f' },
    { dx: -1, dy: 2, color: '#811e9f' },
    { dx: -1, dy: -2, color: '#811e9f' }
  ];

  const GOLD_FLAG = [
    // Flag pole (Brown #9c6926)
    { dx: -3, dy: -2, color: '#9c6926' },
    { dx: -3, dy: -1, color: '#9c6926' },
    { dx: -3, dy: 0, color: '#9c6926' },
    { dx: -3, dy: 1, color: '#9c6926' },
    { dx: -3, dy: 2, color: '#9c6926' },
    { dx: -3, dy: 3, color: '#9c6926' },
    { dx: -3, dy: 4, color: '#9c6926' },
    
    // Flag fabric (Yellow/Gold #ffd635 and White emblem #ffffff)
    { dx: -2, dy: -2, color: '#ffd635' },
    { dx: -1, dy: -2, color: '#ffd635' },
    { dx: 0, dy: -2, color: '#ffd635' },
    { dx: 1, dy: -2, color: '#ffd635' },
    { dx: 2, dy: -2, color: '#ffd635' },
    
    { dx: -2, dy: -1, color: '#ffd635' },
    { dx: -1, dy: -1, color: '#ffffff' }, // Emblem
    { dx: 0, dy: -1, color: '#ffffff' },  // Emblem
    { dx: 1, dy: -1, color: '#ffd635' },
    { dx: 2, dy: -1, color: '#ffd635' },
    
    { dx: -2, dy: 0, color: '#ffd635' },
    { dx: -1, dy: 0, color: '#ffd635' },
    { dx: 0, dy: 0, color: '#ffd635' },
    { dx: 1, dy: 0, color: '#ffd635' },
    { dx: 2, dy: 0, color: '#ffd635' }
  ];

  const AMERICAN_FLAG = [
    // Blue Canton (#2450a4) with stars (#ffffff)
    { dx: -5, dy: -3, color: '#2450a4' },
    { dx: -4, dy: -3, color: '#ffffff' }, // Star
    { dx: -3, dy: -3, color: '#2450a4' },
    { dx: -2, dy: -3, color: '#2450a4' },
    
    { dx: -5, dy: -2, color: '#2450a4' },
    { dx: -4, dy: -2, color: '#2450a4' },
    { dx: -3, dy: -2, color: '#ffffff' }, // Star
    { dx: -2, dy: -2, color: '#2450a4' },
    
    { dx: -5, dy: -1, color: '#2450a4' },
    { dx: -4, dy: -1, color: '#ffffff' }, // Star
    { dx: -3, dy: -1, color: '#2450a4' },
    { dx: -2, dy: -1, color: '#2450a4' },
    
    // Stripe 1 (Red #ff4500)
    { dx: -1, dy: -3, color: '#ff4500' },
    { dx: 0, dy: -3, color: '#ff4500' },
    { dx: 1, dy: -3, color: '#ff4500' },
    { dx: 2, dy: -3, color: '#ff4500' },
    { dx: 3, dy: -3, color: '#ff4500' },
    { dx: 4, dy: -3, color: '#ff4500' },
    
    // Stripe 2 (White #ffffff)
    { dx: -1, dy: -2, color: '#ffffff' },
    { dx: 0, dy: -2, color: '#ffffff' },
    { dx: 1, dy: -2, color: '#ffffff' },
    { dx: 2, dy: -2, color: '#ffffff' },
    { dx: 3, dy: -2, color: '#ffffff' },
    { dx: 4, dy: -2, color: '#ffffff' },
    
    // Stripe 3 (Red #ff4500)
    { dx: -1, dy: -1, color: '#ff4500' },
    { dx: 0, dy: -1, color: '#ff4500' },
    { dx: 1, dy: -1, color: '#ff4500' },
    { dx: 2, dy: -1, color: '#ff4500' },
    { dx: 3, dy: -1, color: '#ff4500' },
    { dx: 4, dy: -1, color: '#ff4500' },
    
    // Stripe 4 (White #ffffff)
    { dx: -5, dy: 0, color: '#ffffff' },
    { dx: -4, dy: 0, color: '#ffffff' },
    { dx: -3, dy: 0, color: '#ffffff' },
    { dx: -2, dy: 0, color: '#ffffff' },
    { dx: -1, dy: 0, color: '#ffffff' },
    { dx: 0, dy: 0, color: '#ffffff' },
    { dx: 1, dy: 0, color: '#ffffff' },
    { dx: 2, dy: 0, color: '#ffffff' },
    { dx: 3, dy: 0, color: '#ffffff' },
    { dx: 4, dy: 0, color: '#ffffff' },
    
    // Stripe 5 (Red #ff4500)
    { dx: -5, dy: 1, color: '#ff4500' },
    { dx: -4, dy: 1, color: '#ff4500' },
    { dx: -3, dy: 1, color: '#ff4500' },
    { dx: -2, dy: 1, color: '#ff4500' },
    { dx: -1, dy: 1, color: '#ff4500' },
    { dx: 0, dy: 1, color: '#ff4500' },
    { dx: 1, dy: 1, color: '#ff4500' },
    { dx: 2, dy: 1, color: '#ff4500' },
    { dx: 3, dy: 1, color: '#ff4500' },
    { dx: 4, dy: 1, color: '#ff4500' },
    
    // Stripe 6 (White #ffffff)
    { dx: -5, dy: 2, color: '#ffffff' },
    { dx: -4, dy: 2, color: '#ffffff' },
    { dx: -3, dy: 2, color: '#ffffff' },
    { dx: -2, dy: 2, color: '#ffffff' },
    { dx: -1, dy: 2, color: '#ffffff' },
    { dx: 0, dy: 2, color: '#ffffff' },
    { dx: 1, dy: 2, color: '#ffffff' },
    { dx: 2, dy: 2, color: '#ffffff' },
    { dx: 3, dy: 2, color: '#ffffff' },
    { dx: 4, dy: 2, color: '#ffffff' },
    
    // Stripe 7 (Red #ff4500)
    { dx: -5, dy: 3, color: '#ff4500' },
    { dx: -4, dy: 3, color: '#ff4500' },
    { dx: -3, dy: 3, color: '#ff4500' },
    { dx: -2, dy: 3, color: '#ff4500' },
    { dx: -1, dy: 3, color: '#ff4500' },
    { dx: 0, dy: 3, color: '#ff4500' },
    { dx: 1, dy: 3, color: '#ff4500' },
    { dx: 2, dy: 3, color: '#ff4500' },
    { dx: 3, dy: 3, color: '#ff4500' },
    { dx: 4, dy: 3, color: '#ff4500' }
  ];

  // DOM Elements
  const canvas = document.getElementById('pixel-canvas');
  const ctx = canvas.getContext('2d');
  const coordinateVal = document.getElementById('coordinate-val');
  const paletteGrid = document.getElementById('palette-grid');
  const toolPencil = document.getElementById('tool-pencil');
  const toolBucket = document.getElementById('tool-bucket');
  const toolEraser = document.getElementById('tool-eraser');
  const btnClear = document.getElementById('btn-clear-canvas');
  const btnRandomize = document.getElementById('btn-randomize-canvas');
  const btnExport = document.getElementById('btn-export-canvas');
  const statActivePixels = document.getElementById('stat-active-pixels');
  const statGridDensity = document.getElementById('stat-grid-density');
  const colorDistributionsList = document.getElementById('color-distributions-list');
  const simToggle = document.getElementById('sim-toggle');
  const slideSimSpeed = document.getElementById('slide-sim-speed');
  const valSimSpeed = document.getElementById('val-sim-speed');
  const slideSimUsers = document.getElementById('slide-sim-users');
  const valSimUsers = document.getElementById('val-sim-users');
  const simTicker = document.getElementById('sim-ticker');

  // Set canvas dimensions
  canvas.width = GRID_SIZE * CELL_SIZE;
  canvas.height = GRID_SIZE * CELL_SIZE;

  // Initialize
  initPalette();
  loadCanvasState();
  initEventListeners();
  drawGrid();
  updateAnalytics();

  /**
   * Initialize color swatches palette
   */
  function initPalette() {
    paletteGrid.innerHTML = '';
    colors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.backgroundColor = color.hex;
      swatch.title = color.name;
      if (color.hex === selectedColor) {
        swatch.classList.add('selected');
      }
      
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedColor = color.hex;
        
        // If eraser tool was selected, automatically toggle back to pencil
        if (activeTool === 'eraser') {
          setActiveTool('pencil');
        }
      });
      
      paletteGrid.appendChild(swatch);
    });
  }

  /**
   * Set the active drawing tool
   */
  function setActiveTool(tool) {
    activeTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tool === 'pencil') toolPencil.classList.add('active');
    else if (tool === 'bucket') toolBucket.classList.add('active');
    else if (tool === 'eraser') toolEraser.classList.add('active');
  }

  /**
   * Initialize event handlers
   */
  function initEventListeners() {
    // Tool buttons
    toolPencil.addEventListener('click', () => setActiveTool('pencil'));
    toolBucket.addEventListener('click', () => setActiveTool('bucket'));
    toolEraser.addEventListener('click', () => setActiveTool('eraser'));

    // Grid Actions
    btnClear.addEventListener('click', clearCanvas);
    btnRandomize.addEventListener('click', randomizeCanvas);
    btnExport.addEventListener('click', exportCanvasPNG);

    // Canvas drawing interactions
    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      handleCanvasClickOrDraw(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      // Show coordinate tracking
      const coords = getGridCoords(e);
      if (coords) {
        coordinateVal.textContent = `X: ${coords.x}, Y: ${coords.y}`;
        // Redraw grid with hover highlight overlay
        drawGrid(coords);
      } else {
        coordinateVal.textContent = 'X: --, Y: --';
        drawGrid();
      }

      if (isDrawing) {
        handleCanvasClickOrDraw(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDrawing) {
        isDrawing = false;
        saveCanvasState();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      coordinateVal.textContent = 'X: --, Y: --';
      drawGrid();
    });

    // Simulation settings
    simToggle.addEventListener('change', toggleCooperativeMode);
    slideSimSpeed.addEventListener('input', updateSimSpeed);
    slideSimUsers.addEventListener('input', updateSimUsers);
  }

  /**
   * Calculate grid coordinate indexes from client mouse event
   */
  function getGridCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x, y };
    }
    return null;
  }

  /**
   * Process mouse clicks or drags on the grid
   */
  function handleCanvasClickOrDraw(e) {
    const coords = getGridCoords(e);
    if (!coords) return;

    const { x, y } = coords;

    if (activeTool === 'pencil') {
      grid[x][y] = selectedColor;
      drawGrid(coords);
      updateAnalytics();
    } else if (activeTool === 'eraser') {
      grid[x][y] = null;
      drawGrid(coords);
      updateAnalytics();
    } else if (activeTool === 'bucket' && e.type === 'mousedown') {
      // Bucket fill triggers BFS flood fill on single click
      floodFill(x, y, selectedColor);
      drawGrid(coords);
      updateAnalytics();
      saveCanvasState();
    }
  }

  /**
   * Flood-Fill Algorithm (Breadth-First Search)
   * Fills contiguous cells sharing a common color with the chosen color
   */
  function floodFill(startX, startY, newColor) {
    const targetColor = grid[startX][startY];
    if (targetColor === newColor) return;

    const queue = [[startX, startY]];
    grid[startX][startY] = newColor;

    const directions = [
      [0, 1],   // South
      [0, -1],  // North
      [1, 0],   // East
      [-1, 0]   // West
    ];

    while (queue.length > 0) {
      const [x, y] = queue.shift();

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (grid[nx][ny] === targetColor) {
            grid[nx][ny] = newColor;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  /**
   * Render the grid state onto the HTML5 Canvas
   */
  function drawGrid(hoverCoords = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw individual cells
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const color = grid[x][y];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
          // Default empty dark grid background
          ctx.fillStyle = '#111827';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw thin grid overlays
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Render hover highlight indicator box
    if (hoverCoords) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hoverCoords.x * CELL_SIZE + 0.5, hoverCoords.y * CELL_SIZE + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    }
  }

  /**
   * Update real-time stats and distributions
   */
  function updateAnalytics() {
    let coloredCount = 0;
    const colorCounts = {};

    // Initalize counts for tracked swatches
    colors.forEach(color => {
      colorCounts[color.hex] = 0;
    });

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const color = grid[x][y];
        if (color) {
          coloredCount++;
          if (colorCounts[color] !== undefined) {
            colorCounts[color]++;
          } else {
            colorCounts[color] = 1; // Fallback if custom hex
          }
        }
      }
    }

    // Update main count labels
    statActivePixels.textContent = coloredCount.toLocaleString();
    const densityPct = Math.round((coloredCount / (GRID_SIZE * GRID_SIZE)) * 100);
    statGridDensity.textContent = `${densityPct}%`;

    // Render Color distributions bar chart
    colorDistributionsList.innerHTML = '';
    const sortedColors = [...colors].sort((a, b) => colorCounts[b.hex] - colorCounts[a.hex]);

    sortedColors.forEach(color => {
      const count = colorCounts[color.hex] || 0;
      const percent = coloredCount > 0 ? Math.round((count / coloredCount) * 100) : 0;

      const item = document.createElement('div');
      item.className = 'color-usage-item';

      item.innerHTML = `
        <div class="color-indicator" style="background-color: ${color.hex}"></div>
        <div class="color-bar-wrapper">
          <div class="color-bar-fill" style="width: ${percent}%; background-color: ${color.hex}"></div>
        </div>
        <div class="color-usage-pct">${percent}%</div>
      `;
      
      colorDistributionsList.appendChild(item);
    });
  }

  /**
   * Reset canvas state
   */
  function clearCanvas() {
    if (confirm('Are you sure you want to reset the canvas grid?')) {
      grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
      drawGrid();
      updateAnalytics();
      saveCanvasState();
      
      // Log event
      addLogEntry('System', 'cleared the canvas board', null, 'italic');
    }
  }

  /**
   * Populate grid with procedural randomized noise
   */
  function randomizeCanvas() {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        // 35% probability of cell activation
        if (Math.random() < 0.35) {
          const randColorIndex = Math.floor(Math.random() * colors.length);
          grid[x][y] = colors[randColorIndex].hex;
        } else {
          grid[x][y] = null;
        }
      }
    }
    
    drawGrid();
    updateAnalytics();
    saveCanvasState();
    
    addLogEntry('System', 'generated random procedural canvas noise', null, 'italic');
  }

  /**
   * Export high-resolution PNG image without grid line artifacts
   */
  function exportCanvasPNG() {
    // Construct a secondary hidden canvas for clean exports
    const exportCanvas = document.createElement('canvas');
    const scale = 20; // 20x upscale to prevent blurry export images (800x800px)
    exportCanvas.width = GRID_SIZE * scale;
    exportCanvas.height = GRID_SIZE * scale;
    const exportCtx = exportCanvas.getContext('2d');

    // Fill background
    exportCtx.fillStyle = '#111827';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw cells
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const color = grid[x][y];
        if (color) {
          exportCtx.fillStyle = color;
          exportCtx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    // Trigger file download
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pixel-canvas-art_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  /**
   * Cooperative Simulator Toggle
   */
  function toggleCooperativeMode() {
    if (simToggle.checked) {
      simTicker.innerHTML = '';
      addLogEntry('System', 'Cooperative draw mode activated. Virtual players entering...', null, 'italic');
      startSimulationLoop();
    } else {
      stopSimulationLoop();
      simTicker.innerHTML = '<div class="sim-log-entry" style="color: var(--text-muted); font-style: italic;">Cooperative draw inactive. Enable switch to start simulation...</div>';
    }
  }

  /**
   * Start Bot Draw intervals
   */
  function startSimulationLoop() {
    if (simIntervalId) clearInterval(simIntervalId);

    const spartanCenter = { x: 19, y: 16 };
    const voidCenter = { x: 30, y: 28 };
    const flagCenter = { x: 8, y: 28 };
    const usFlagCenter = { x: 33, y: 7 }; // American Flag in the top right corner

    simIntervalId = setInterval(() => {
      // Pick a random player count based on config slider (fluctuate slightly)
      const maxBots = parseInt(slideSimUsers.value);
      const activeBotsCount = Math.max(1, Math.round(maxBots + (Math.random() * 4 - 2)));
      valSimUsers.textContent = `${activeBotsCount} Players`;

      // Select random player
      const botName = botNames[Math.floor(Math.random() * botNames.length)];
      
      const r = Math.random();
      
      if (r < 0.30) {
        // Faction 1: MSU Spartans (30% draw frequency)
        drawFactionTemplate(botName, 'MSU Spartans', spartanCenter, SPARTAN_HELMET, ['#00a368', '#ffffff']);
      } else if (r < 0.50) {
        // Faction 2: US Patriots (20% draw frequency)
        drawFactionTemplate(botName, 'US Patriots', usFlagCenter, AMERICAN_FLAG, ['#ff4500', '#ffffff', '#2450a4']);
      } else if (r < 0.62) {
        // Faction 3: The Void (12% draw frequency - reduced & contained)
        drawFactionTemplate(botName, 'The Void', voidCenter, VOID_TEMPLATE, ['#000000', '#811e9f']);
      } else if (r < 0.80) {
        // Faction 4: Gold Flag Union (18% draw frequency)
        drawFactionTemplate(botName, 'Gold Flag', flagCenter, GOLD_FLAG, ['#ffd635', '#ffffff', '#9c6926']);
      } else {
        // Independent / Griefer / Chaotic noise (20% draw frequency)
        const actionRand = Math.random();
        const randX = Math.floor(Math.random() * GRID_SIZE);
        const randY = Math.floor(Math.random() * GRID_SIZE);

        if (actionRand < 0.08) {
          // Erase
          grid[randX][randY] = null;
          addLogEntry(botName, 'erased cell', { x: randX, y: randY });
        } else {
          // Draw random pixel
          const color = colors[Math.floor(Math.random() * colors.length)].hex;
          grid[randX][randY] = color;
          addLogEntry(botName, 'painted random pixel', { x: randX, y: randY });
        }
      }

      drawGrid();
      updateAnalytics();
      
      // Randomly throttle saves to avoid freezing localStorage
      if (Math.random() < 0.2) {
        saveCanvasState();
      }

    }, simSpeedMs);
  }

  /**
   * Helper function for bot faction drawing behavior
   */
  function drawFactionTemplate(botName, factionName, center, template, expansionColors) {
    // 1. Gather all pixels in the template that don't match their target color
    const mismatches = [];
    
    template.forEach(pixel => {
      const px = center.x + pixel.dx;
      const py = center.y + pixel.dy;
      
      if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
        if (grid[px][py] !== pixel.color) {
          mismatches.push({ x: px, y: py, color: pixel.color });
        }
      }
    });

    if (mismatches.length > 0) {
      // Draw/defend mismatching pixels - draw up to 2 pixels to build faster!
      const countToDraw = Math.min(2, mismatches.length);
      let lastCoord = null;
      
      for (let i = 0; i < countToDraw; i++) {
        // Recalculate mismatches list in case the first draw changed it
        const currentMismatches = mismatches.filter(m => grid[m.x][m.y] !== m.color);
        if (currentMismatches.length === 0) break;
        
        const target = currentMismatches[Math.floor(Math.random() * currentMismatches.length)];
        grid[target.x][target.y] = target.color;
        lastCoord = { x: target.x, y: target.y };
      }

      let actionMsg = `defended ${factionName} template`;
      if (factionName === 'MSU Spartans') actionMsg = `painted Spartan Head pixel`;
      else if (factionName === 'The Void') actionMsg = `expanded The Void`;
      else if (factionName === 'Gold Flag') actionMsg = `raised Gold Flag`;
      else if (factionName === 'US Patriots') actionMsg = `stitched American Flag`;
      
      addLogEntry(botName, actionMsg, lastCoord);
    } else {
      // Template is perfect! Expand territory around the center
      // Void has a highly contained radius (only 4 pixels), others expand slightly more (5 pixels)
      const maxRadius = factionName === 'The Void' ? 4 : 5;
      const randAngle = Math.random() * Math.PI * 2;
      const randDist = Math.floor(Math.random() * maxRadius) + 1;
      
      const ex = Math.round(center.x + Math.cos(randAngle) * randDist);
      const ey = Math.round(center.y + Math.sin(randAngle) * randDist);
      
      if (ex >= 0 && ex < GRID_SIZE && ey >= 0 && ey < GRID_SIZE) {
        // Expand using one of the faction colors
        const color = expansionColors[Math.floor(Math.random() * expansionColors.length)];
        grid[ex][ey] = color;
        
        let actionMsg = `expanded ${factionName} territory`;
        if (factionName === 'The Void') actionMsg = `consumed cell for The Void`;
        
        addLogEntry(botName, actionMsg, { x: ex, y: ey });
      }
    }
  }

  function stopSimulationLoop() {
    if (simIntervalId) {
      clearInterval(simIntervalId);
      simIntervalId = null;
    }
  }

  function updateSimSpeed() {
    const val = parseInt(slideSimSpeed.value);
    if (val === 1) {
      simSpeedMs = 1500;
      valSimSpeed.textContent = 'Slow';
    } else if (val === 2) {
      simSpeedMs = 700;
      valSimSpeed.textContent = 'Medium';
    } else if (val === 3) {
      simSpeedMs = 300;
      valSimSpeed.textContent = 'Fast';
    } else if (val === 4) {
      simSpeedMs = 100;
      valSimSpeed.textContent = 'Hyper';
    }

    // Restart loop with new speed if simulation is active
    if (simToggle.checked) {
      startSimulationLoop();
    }
  }

  function updateSimUsers() {
    const val = parseInt(slideSimUsers.value);
    valSimUsers.textContent = `${val} Players`;
  }

  /**
   * Append a log record to the cooperative activity ticker
   */
  function addLogEntry(user, action, coords = null, textStyle = '') {
    const entry = document.createElement('div');
    entry.className = 'sim-log-entry';
    if (textStyle) entry.style.fontStyle = textStyle;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let html = `[${timestamp}] `;
    if (user === 'System') {
      html += `<span style="color: var(--color-gold); font-weight: bold;">${user}</span> ${action}`;
    } else {
      html += `<span class="username">${user}</span> ${action}`;
    }

    if (coords) {
      html += ` at (<span class="coord">${coords.x}, ${coords.y}</span>)`;
    }

    entry.innerHTML = html;
    simTicker.appendChild(entry);

    // Limit log rows to 30 to save memory
    while (simTicker.childNodes.length > 30) {
      simTicker.removeChild(simTicker.firstChild);
    }

    // Scroll ticker container to bottom
    simTicker.scrollTop = simTicker.scrollHeight;
  }

  /**
   * Save canvas grid cache to LocalStorage
   */
  function saveCanvasState() {
    try {
      localStorage.setItem('place_sandbox_grid', JSON.stringify(grid));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }

  /**
   * Restore canvas grid cache from LocalStorage
   */
  function loadCanvasState() {
    try {
      const data = localStorage.getItem('place_sandbox_grid');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.length === GRID_SIZE) {
          grid = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load grid state from localStorage', e);
    }
  }
});
