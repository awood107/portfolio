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
  let selectedColor = '#c5a880'; // Default champagne gold
  let activeTool = 'pencil'; // pencil, bucket, eraser
  let isDrawing = false;
  let simIntervalId = null;
  let simulatedUsersCount = 6;
  let simSpeedMs = 700; // Medium

  // Color Palette definition
  const colors = [
    { name: 'Champagne Gold', hex: '#c5a880' },
    { name: 'Electric Indigo', hex: '#6366f1' },
    { name: 'Emerald Green', hex: '#10b981' },
    { name: 'Crimson Rose', hex: '#f43f5e' },
    { name: 'Sky Blue', hex: '#0ea5e9' },
    { name: 'Pure White', hex: '#f8fafc' },
    { name: 'Deep Amber', hex: '#f59e0b' },
    { name: 'Soft Purple', hex: '#a855f7' },
    { name: 'Slate Gray', hex: '#475569' },
    { name: 'Charcoal Dark', hex: '#1e293b' },
    { name: 'Coral Orange', hex: '#f97316' },
    { name: 'Hot Pink', hex: '#ec4899' }
  ];

  // Simulated bot usernames for cooperative mode
  const botNames = [
    'BroadStreetPainter', 'SpartanPixel', 'FinanceQuant', 'GridBuilder', 
    'PlaceExplorer', 'ColorBot', 'NodeCoder', 'YieldMaster', 'MergerStrategist',
    'SQLSlicer', 'M2Moneypit', 'CapRateCrusader', 'LBO_Monte', 'BufferBull', 'AlphaChaser'
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

    simIntervalId = setInterval(() => {
      // Pick a random player count based on config slider (fluctuate slightly)
      const maxBots = parseInt(slideSimUsers.value);
      const activeBotsCount = Math.max(1, Math.round(maxBots + (Math.random() * 4 - 2)));
      valSimUsers.textContent = `${activeBotsCount} Players`;

      // Select random player
      const botName = botNames[Math.floor(Math.random() * botNames.length)];
      
      // Perform draw (pencil edit or occasionally erase)
      const actionRand = Math.random();
      const randX = Math.floor(Math.random() * GRID_SIZE);
      const randY = Math.floor(Math.random() * GRID_SIZE);

      if (actionRand < 0.06) {
        // 6% chance to erase
        grid[randX][randY] = null;
        addLogEntry(botName, 'erased cell', { x: randX, y: randY });
      } else {
        // 94% chance to draw single pixel
        const color = colors[Math.floor(Math.random() * colors.length)].hex;
        grid[randX][randY] = color;
        addLogEntry(botName, 'painted pixel', { x: randX, y: randY });
      }

      drawGrid();
      updateAnalytics();
      
      // Randomly throttle saves to avoid freezing localStorage
      if (Math.random() < 0.2) {
        saveCanvasState();
      }

    }, simSpeedMs);
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
