/**
 * AJ Wood Portfolio - Economic Dashboard Script
 * Implements interactive Recession Risk Gauge, dynamic SVG sparklines,
 * dual-axis comparison charts, and live FRED API sync with CORS proxy support.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMacroDashboard();
});

function initMacroDashboard() {
  // 1. Core State with Default Fallback Historical Data
  const state = {
    macroIndicators: [
      {
        id: "shiller-pe",
        name: "Shiller PE Ratio (CAPE)",
        value: 35.80,
        previousValue: 35.20,
        unit: "ratio",
        status: "Highly Overvalued",
        history: [31.5, 32.8, 33.5, 33.8, 35.2, 35.8],
        description: "Price to earnings ratio adjusted for inflation over 10 years. Historical mean is ~17.1. Current level indicates significant market froth.",
        source: "Yale / Robert Shiller",
        sourceUrl: "https://www.econ.yale.edu/~shiller/data.htm"
      },
      {
        id: "buffett-indicator",
        name: "Buffett Indicator",
        value: 194.50,
        previousValue: 191.20,
        unit: "%",
        status: "Highly Overvalued",
        history: [175.2, 180.4, 184.1, 188.9, 191.2, 194.5],
        description: "Total U.S. stock market capitalization relative to gross domestic product (GDP). Levels over 120% historically represent overvaluation.",
        source: "FRED / Wilshire / BEA",
        sourceUrl: "https://fred.stlouisfed.org/series/GDP"
      },
      {
        id: "m2-growth",
        name: "M2 Money Supply Growth (YoY)",
        value: 1.85,
        previousValue: 1.20,
        unit: "% YoY",
        status: "Moderate Expansion",
        history: [-2.10, -1.50, -0.50, 0.40, 1.20, 1.85],
        description: "Broad measure of U.S. money supply (cash, savings, and money market deposits). Rebounding slowly from recent contraction.",
        source: "Federal Reserve Board",
        sourceUrl: "https://fred.stlouisfed.org/series/M2SL"
      },
      {
        id: "m1-supply",
        name: "M1 Money Supply Growth (YoY)",
        value: -4.20,
        previousValue: -5.80,
        unit: "% YoY",
        status: "Contraction",
        history: [-12.40, -9.80, -8.10, -6.50, -5.80, -4.20],
        description: "Narrow money supply (physical currency and liquid demand deposits). Continuing contraction post-COVID unwind, but rate is slowing.",
        source: "Federal Reserve Board",
        sourceUrl: "https://fred.stlouisfed.org/series/M1SL"
      },
      {
        id: "yield-spread",
        name: "10Y-2Y Treasury Yield Spread",
        value: -0.18,
        previousValue: -0.28,
        unit: "%",
        status: "Inverted",
        history: [-0.65, -0.55, -0.45, -0.35, -0.28, -0.18],
        description: "Difference between 10-year and 2-year Treasury yields. A sustained negative spread (inversion) is a reliable recession predictor.",
        source: "U.S. Treasury Department",
        sourceUrl: "https://fred.stlouisfed.org/series/T10Y2Y"
      },
      {
        id: "fed-funds",
        name: "Effective Federal Funds Rate",
        value: 5.33,
        previousValue: 5.33,
        unit: "%",
        status: "Restrictive",
        history: [5.08, 5.33, 5.33, 5.33, 5.33, 5.33],
        description: "Interbank overnight lending reserve rate. Represents the Federal Reserve's baseline target policy interest rate stance.",
        source: "Federal Reserve System",
        sourceUrl: "https://fred.stlouisfed.org/series/FEDFUNDS"
      },
      {
        id: "cpi-inflation",
        name: "US CPI Inflation (YoY)",
        value: 3.12,
        previousValue: 3.24,
        unit: "% YoY",
        status: "Sticky Inflation",
        history: [3.70, 3.50, 3.40, 3.30, 3.24, 3.12],
        description: "Year-over-year rate of change in the Consumer Price Index for All Urban Consumers. Measures aggregate retail inflation pressures.",
        source: "Bureau of Labor Statistics",
        sourceUrl: "https://www.bls.gov/cpi/"
      },
      {
        id: "unemployment-rate",
        name: "US Unemployment Rate",
        value: 3.90,
        previousValue: 3.80,
        unit: "%",
        status: "Low / Inflecting",
        history: [3.60, 3.70, 3.80, 3.70, 3.80, 3.90],
        description: "The percentage of the total labor force that is unemployed but actively seeking employment. Shows minor signs of bottoming out.",
        source: "Bureau of Labor Statistics",
        sourceUrl: "https://www.bls.gov/news.release/empsit.toc.htm"
      }
    ],
    periods: ["Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "2026 Q1"],
    macroPrimaryCompare: "shiller-pe",
    macroSecondaryCompare: "buffett-indicator"
  };

  // Cached DOM elements
  const els = {
    apiKeyInput: document.getElementById('fred-api-key'),
    btnSaveFred: document.getElementById('btn-save-fred'),
    btnClearFred: document.getElementById('btn-clear-fred'),
    fredStatusText: document.getElementById('fred-status-text'),
    syncBtnSvg: document.getElementById('sync-btn-svg'),
    syncBtnText: document.getElementById('sync-btn-text'),
    macroRiskGaugeContainer: document.getElementById('macro-risk-gauge-container'),
    macroRiskScoreVal: document.getElementById('macro-risk-score-val'),
    macroAnalystSummaryText: document.getElementById('macro-analyst-summary-text'),
    macroEvalDate: document.getElementById('macro-eval-date'),
    macroIndicatorsGrid: document.getElementById('macro-indicators-grid'),
    macroComparePrimary: document.getElementById('macro-compare-primary'),
    macroCompareSecondary: document.getElementById('macro-compare-secondary'),
    macroComparisonChartContainer: document.getElementById('macro-comparison-chart-container')
  };

  // Try to load cached metrics state if available from prior API queries
  const cachedState = localStorage.getItem('fred_dashboard_metrics');
  const cachedPeriods = localStorage.getItem('fred_dashboard_periods');
  if (cachedState && cachedPeriods) {
    try {
      state.macroIndicators = JSON.parse(cachedState);
      state.periods = JSON.parse(cachedPeriods);
    } catch (e) {
      console.warn("Failed to parse cached metrics, using defaults.");
    }
  }

  // 2. Initialize Views
  applyApiKeyUiState();
  renderMacroDashboard();
  bindEventHandlers();

  // If a key is already saved, auto-trigger a sync to ensure fresh feeds
  const savedKey = localStorage.getItem('fred_api_key');
  if (savedKey) {
    triggerFredSync(savedKey, true); // Silent auto-sync
  }

  // 3. UI and Binding Operations
  function bindEventHandlers() {
    // API actions
    els.btnSaveFred.addEventListener('click', () => {
      const inputKey = els.apiKeyInput.value.trim();
      const existingKey = localStorage.getItem('fred_api_key');

      if (!inputKey && !existingKey) {
        showToast("Please enter a valid 32-character FRED API key.", "error");
        return;
      }
      
      const keyToUse = inputKey || existingKey;
      if (inputKey) {
        localStorage.setItem('fred_api_key', keyToUse);
        applyApiKeyUiState();
      }
      triggerFredSync(keyToUse, false);
    });

    els.btnClearFred.addEventListener('click', () => {
      localStorage.removeItem('fred_api_key');
      localStorage.removeItem('fred_dashboard_metrics');
      localStorage.removeItem('fred_dashboard_periods');
      els.apiKeyInput.value = "";
      applyApiKeyUiState();
      showToast("FRED API Key cleared. Reloading default statistics.", "info");
      // Restore default state
      setTimeout(() => location.reload(), 1000);
    });

    // Select actions for comparison playground
    els.macroComparePrimary.addEventListener('change', (e) => {
      state.macroPrimaryCompare = e.target.value;
      drawMacroComparisonChart();
    });

    els.macroCompareSecondary.addEventListener('change', (e) => {
      state.macroSecondaryCompare = e.target.value;
      drawMacroComparisonChart();
    });
  }

  function applyApiKeyUiState() {
    const key = localStorage.getItem('fred_api_key');
    if (key) {
      els.apiKeyInput.placeholder = "••••••••••••••••••••••••••••••••";
      els.apiKeyInput.value = "";
      els.btnClearFred.style.display = "inline-block";
      els.fredStatusText.innerHTML = "Live St. Louis Fed connection is <strong>Active</strong>.";
      els.syncBtnText.innerText = "Sync Now";
    } else {
      els.apiKeyInput.placeholder = "FRED API Key (e.g. 4a5e...)";
      els.apiKeyInput.value = "";
      els.btnClearFred.style.display = "none";
      els.fredStatusText.innerText = "Local cache is active. Enter a St. Louis Fed API key to pull live market feeds.";
      els.syncBtnText.innerText = "Sync Live Feeds";
    }
  }

  // 4. Fetching Data from St. Louis Fed API via CORS Proxy
  async function triggerFredSync(apiKey, isSilent = false) {
    if (!isSilent) {
      els.syncBtnSvg.classList.add('sync-icon-spinning');
      els.btnSaveFred.disabled = true;
      showToast("Querying FRED data series...", "info");
    }

    try {
      const isSuccess = await syncAllFromFred(apiKey);
      if (isSuccess) {
        // Cache states
        localStorage.setItem('fred_dashboard_metrics', JSON.stringify(state.macroIndicators));
        localStorage.setItem('fred_dashboard_periods', JSON.stringify(state.periods));
        
        renderMacroDashboard();
        if (!isSilent) {
          showToast("Successfully synced live feeds from FRED!", "success");
        }
      } else {
        if (!isSilent) {
          showToast("FRED API request rejected. Check key validity.", "error");
        }
      }
    } catch (e) {
      console.error(e);
      if (!isSilent) {
        showToast("Error establishing connection to FRED servers.", "error");
      }
    } finally {
      if (!isSilent) {
        els.syncBtnSvg.classList.remove('sync-icon-spinning');
        els.btnSaveFred.disabled = false;
      }
    }
  }

  async function syncAllFromFred(apiKey) {
    // Standard proxies used to bypass CORS restrictions
    const corsProxy = "https://api.allorigins.win/raw?url=";

    // FRED base endpoint - fetch 10 observations to allow target date alignment
    const getFredUrl = (seriesId, extraParams = "") => {
      const targetUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=10&sort_order=desc${extraParams}`;
      return corsProxy + encodeURIComponent(targetUrl);
    };

    // Construct promises for all series
    const queries = {
      fedFunds: fetch(getFredUrl("FEDFUNDS", "&frequency=q&aggregation_method=avg")).then(r => r.json()),
      cpi: fetch(getFredUrl("CPIAUCSL", "&units=pc1&frequency=q&aggregation_method=avg")).then(r => r.json()),
      spread: fetch(getFredUrl("T10Y2Y", "&frequency=q&aggregation_method=avg")).then(r => r.json()),
      unemployment: fetch(getFredUrl("UNRATE", "&frequency=q&aggregation_method=avg")).then(r => r.json()),
      m2: fetch(getFredUrl("M2SL", "&units=pc1&frequency=q&aggregation_method=avg")).then(r => r.json()),
      m1: fetch(getFredUrl("M1SL", "&units=pc1&frequency=q&aggregation_method=avg")).then(r => r.json()),
      // For Buffett indicator, we fetch Wilshire 5000 index & GDP Level
      wilshire: fetch(getFredUrl("WILL5000PR", "&frequency=q&aggregation_method=avg")).then(r => r.json()),
      gdp: fetch(getFredUrl("GDP")).then(r => r.json())
    };

    try {
      const results = await Promise.all([
        queries.fedFunds,
        queries.cpi,
        queries.spread,
        queries.unemployment,
        queries.m2,
        queries.m1,
        queries.wilshire,
        queries.gdp
      ]);

      // If St. Louis Fed returns an error block, reject the credentials
      if (results.some(res => res.error_code)) {
        return false;
      }

      // 1. Establish aligned target dates based on baseline series (FEDFUNDS)
      // Filter out invalid/empty/non-numeric observations, take latest 6
      const baselineObs = (results[0].observations || [])
        .filter(obs => obs.value !== "." && !isNaN(parseFloat(obs.value)))
        .slice(0, 6);

      // Re-order oldest to newest
      const targetDates = baselineObs.map(obs => obs.date).reverse();
      state.periods = targetDates.map(date => formatFredQuarter(date));

      // 2. Helper to align individual indicators to the target dates (with forward-filling)
      function alignIndicator(id, rawObservations) {
        const ind = state.macroIndicators.find(m => m.id === id);
        if (!ind || !rawObservations) return;

        // Map observations to date dictionary
        const obsMap = {};
        rawObservations.forEach(obs => {
          if (obs.value !== "." && !isNaN(parseFloat(obs.value))) {
            obsMap[obs.date] = parseFloat(obs.value);
          }
        });

        const alignedHistory = [];
        let lastValidValue = ind.history[0]; // fallback from static state

        targetDates.forEach(date => {
          if (obsMap[date] !== undefined) {
            alignedHistory.push(obsMap[date]);
            lastValidValue = obsMap[date];
          } else {
            alignedHistory.push(lastValidValue); // forward-fill lag
          }
        });

        ind.history = alignedHistory;
        ind.value = alignedHistory[5];
        ind.previousValue = alignedHistory[4];
      }

      // Align indicators
      alignIndicator("fed-funds", results[0].observations);
      alignIndicator("cpi-inflation", results[1].observations);
      alignIndicator("yield-spread", results[2].observations);
      alignIndicator("unemployment-rate", results[3].observations);
      alignIndicator("m2-growth", results[4].observations);
      alignIndicator("m1-supply", results[5].observations);

      // 3. Compute Buffett Indicator dynamically (Wilshire 5000 / GDP * 105 calibration)
      const wilshireObs = results[6].observations || [];
      const gdpObs = results[7].observations || [];

      const wilshireMap = {};
      wilshireObs.forEach(obs => {
        if (obs.value !== "." && !isNaN(parseFloat(obs.value))) {
          wilshireMap[obs.date] = parseFloat(obs.value);
        }
      });

      const gdpMap = {};
      gdpObs.forEach(obs => {
        if (obs.value !== "." && !isNaN(parseFloat(obs.value))) {
          gdpMap[obs.date] = parseFloat(obs.value);
        }
      });

      const buffett = state.macroIndicators.find(m => m.id === "buffett-indicator");
      if (buffett) {
        const alignedBuffett = [];
        let lastValidBuffett = buffett.history[0];

        targetDates.forEach(date => {
          const wVal = wilshireMap[date];
          const gVal = gdpMap[date];
          if (wVal !== undefined && gVal !== undefined && gVal > 0) {
            const calculated = (wVal / gVal) * 105;
            alignedBuffett.push(calculated);
            lastValidBuffett = calculated;
          } else {
            alignedBuffett.push(lastValidBuffett);
          }
        });

        buffett.history = alignedBuffett;
        buffett.value = alignedBuffett[5];
        buffett.previousValue = alignedBuffett[4];
        buffett.status = buffett.value > 185 ? "Highly Overvalued" : (buffett.value > 120 ? "Overvalued" : "Fair Value");
      }

      // Recalculate status for other indicators based on loaded numbers
      state.macroIndicators.forEach(ind => {
        if (ind.id === "fed-funds") {
          ind.status = ind.value >= 5.0 ? "Restrictive" : (ind.value >= 3.0 ? "Neutral/Tight" : "Stimulative");
        } else if (ind.id === "cpi-inflation") {
          ind.status = ind.value > 3.0 ? "Sticky Inflation" : "Target Range";
        } else if (ind.id === "yield-spread") {
          ind.status = ind.value < 0 ? "Inverted" : "Normal Spread";
        } else if (ind.id === "unemployment-rate") {
          ind.status = ind.value > 4.2 ? "Inflecting Up" : "Low / Stable";
        } else if (ind.id === "m2-growth") {
          ind.status = ind.value < 0 ? "Contraction" : "Liquid Expansion";
        } else if (ind.id === "m1-supply") {
          ind.status = ind.value < 0 ? "Contraction" : "Expansion";
        }
      });

      return true;
    } catch (e) {
      console.error("FRED Sync failed during JSON parse:", e);
      return false;
    }
  }

  function formatFredQuarter(dateStr) {
    const parts = dateStr.split("-");
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    let q = "Q1";
    if (month >= 4 && month <= 6) q = "Q2";
    else if (month >= 7 && month <= 9) q = "Q3";
    else if (month >= 10 && month <= 12) q = "Q4";
    return `${year} ${q}`;
  }

  // 5. Calculation Models & Dial Rendering
  function renderMacroDashboard() {
    // Determine risk gauge scoring
    const riskData = calculateRecessionRisk();
    drawRecessionGauge(riskData.score);
    els.macroAnalystSummaryText.innerHTML = riskData.summary;
    els.macroEvalDate.innerText = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    // Populate widgets & comparison axes
    renderMacroGrid();
    renderComparisonSelectors();
    drawMacroComparisonChart();
  }

  function calculateRecessionRisk() {
    let riskPoints = 0;
    let details = [];

    // 1. Yield Spread (10Y-2Y): 25% weight
    const yieldSpread = state.macroIndicators.find(m => m.id === "yield-spread");
    if (yieldSpread) {
      let val = yieldSpread.value;
      let spreadRisk = 0;
      if (val < 0) {
        spreadRisk = 100;
        details.push("The 10Y-2Y Treasury Yield Spread is inverted (negative), historically a near-perfect recession precursor.");
      } else if (val < 0.5) {
        spreadRisk = ((0.5 - val) / 0.5) * 100;
        details.push(`The 10Y-2Y Yield Spread is narrow (${val.toFixed(2)}%), indicating yield flattening and tightening credit markets.`);
      } else {
        spreadRisk = 0;
        details.push("The 10Y-2Y Yield Spread is normal (positive), reflecting typical steepening.");
      }
      riskPoints += spreadRisk * 0.25;
    }

    // 2. CAPE Ratio: 15% weight
    const cape = state.macroIndicators.find(m => m.id === "shiller-pe");
    if (cape) {
      let val = cape.value;
      let capeRisk = 0;
      if (val >= 30) {
        capeRisk = 100;
        details.push(`The Shiller CAPE ratio is highly elevated at ${val.toFixed(1)}, significantly above the long-term historical mean of ~17.1, indicating equity market overvaluation.`);
      } else if (val > 17) {
        capeRisk = ((val - 17) / (30 - 17)) * 100;
        details.push(`The Shiller CAPE ratio is at ${val.toFixed(1)}, moderately above the historical average.`);
      } else {
        capeRisk = 0;
        details.push(`The Shiller CAPE ratio is at ${val.toFixed(1)}, near or below historical averages.`);
      }
      riskPoints += capeRisk * 0.15;
    }

    // 3. Buffett Indicator: 15% weight
    const buffett = state.macroIndicators.find(m => m.id === "buffett-indicator");
    if (buffett) {
      let val = buffett.value;
      let buffettRisk = 0;
      if (val >= 185) {
        buffettRisk = 100;
        details.push(`The Buffett Indicator (Market Cap to GDP) is at ${val.toFixed(1)}%, indicating extreme valuation froth relative to real economic output.`);
      } else if (val > 120) {
        buffettRisk = ((val - 120) / (185 - 120)) * 100;
        details.push(`The Buffett Indicator is at ${val.toFixed(1)}%, reflecting a moderately overvalued stock market compared to GDP.`);
      } else {
        buffettRisk = 0;
        details.push(`The Buffett Indicator is at ${val.toFixed(1)}%, signaling a reasonably valued market.`);
      }
      riskPoints += buffettRisk * 0.15;
    }

    // 4. Fed Funds Rate: 15% weight
    const fedFunds = state.macroIndicators.find(m => m.id === "fed-funds");
    if (fedFunds) {
      let val = fedFunds.value;
      let fedRisk = 0;
      if (val >= 5.0) {
        fedRisk = 100;
        details.push(`The Effective Federal Funds Rate is restrictive at ${val.toFixed(2)}%, placing stress on corporate debt servicing.`);
      } else if (val > 1.0) {
        fedRisk = ((val - 1.0) / (5.0 - 1.0)) * 100;
        details.push(`The Federal Funds Rate is at ${val.toFixed(2)}%, representing a neutral monetary policy stance.`);
      } else {
        fedRisk = 0;
        details.push(`The Federal Funds Rate is low at ${val.toFixed(2)}%, indicating stimulative monetary policy.`);
      }
      riskPoints += fedRisk * 0.15;
    }

    // 5. M2 Growth: 15% weight
    const m2 = state.macroIndicators.find(m => m.id === "m2-growth");
    if (m2) {
      let val = m2.value;
      let m2Risk = 0;
      if (val < 0) {
        m2Risk = 100;
        details.push(`M2 Money Supply Growth is contracting YoY, indicating structural liquidity constraints.`);
      } else if (val < 4.0) {
        m2Risk = ((4.0 - val) / 4.0) * 100;
        details.push(`M2 Money Supply is expanding slowly at ${val.toFixed(2)}% YoY, suggesting constrained monetary expansion compared to normal cycles.`);
      } else {
        m2Risk = 0;
        details.push(`M2 Money Supply is expanding at a healthy ${val.toFixed(2)}% YoY.`);
      }
      riskPoints += m2Risk * 0.15;
    }

    // 6. Unemployment Rate: 15% weight
    const unemployment = state.macroIndicators.find(m => m.id === "unemployment-rate");
    if (unemployment) {
      let val = unemployment.value;
      let unempRisk = 0;
      let history = unemployment.history || [];
      if (history.length > 0) {
        let minVal = Math.min(...history);
        let rise = val - minVal;
        if (rise >= 0.50) {
          unempRisk = 100;
          details.push(`The US Unemployment Rate has risen by ${rise.toFixed(2)}% from its cycle low (currently ${val.toFixed(2)}%), triggering Sahm-Rule-like recessionary thresholds.`);
        } else if (rise > 0) {
          unempRisk = (rise / 0.50) * 100;
          details.push(`The US Unemployment Rate is showing inflections, up ${rise.toFixed(2)}% from its cyclical low (currently ${val.toFixed(2)}%).`);
        } else {
          unempRisk = 0;
          details.push(`The US Unemployment Rate is stable or near cycle lows at ${val.toFixed(2)}%.`);
        }
      }
      riskPoints += unempRisk * 0.15;
    }

    let riskScore = Math.round(riskPoints);
    let summaryText = "";
    if (riskScore >= 70) {
      summaryText = `<strong>High Stress / Valuation Froth (${riskScore}% Risk):</strong> ${details.slice(0, 3).join(" ")} Structural risks are highly elevated across both capital valuations and yield curve signals. Caution is advised.`;
    } else if (riskScore >= 40) {
      summaryText = `<strong>Moderate Caution (${riskScore}% Risk):</strong> ${details.slice(0, 3).join(" ")} Mixed signals indicate valuation premiums but reasonably stable labor markets. Portfolio hedging is recommended.`;
    } else {
      summaryText = `<strong>Stable Economic Health (${riskScore}% Risk):</strong> ${details.slice(0, 3).join(" ")} Macro indicators are supportive of continuing expansion and low systemic valuations.`;
    }

    return {
      score: riskScore,
      summary: summaryText,
      details: details
    };
  }

  function drawRecessionGauge(score) {
    if (!els.macroRiskGaugeContainer) return;
    
    const angle = -180 + (score / 100) * 180;
    const needleColor = "var(--text-primary)";
    
    els.macroRiskGaugeContainer.innerHTML = `
      <svg viewBox="0 0 200 120" style="width: 100%; height: 100%;">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--accent-emerald)" />
            <stop offset="50%" stop-color="var(--accent-amber)" />
            <stop offset="100%" stop-color="var(--accent-rose)" />
          </linearGradient>
        </defs>
        
        <!-- Background Track -->
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="16" stroke-linecap="round"/>
        
        <!-- Colored Gauge Track -->
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="url(#gauge-grad)" stroke-width="16" stroke-linecap="round"/>
        
        <!-- Legend labels -->
        <text x="25" y="123" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="9" text-anchor="middle" font-weight="600">HEALTHY</text>
        <text x="100" y="20" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="9" text-anchor="middle" font-weight="600">CAUTION</text>
        <text x="175" y="123" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="9" text-anchor="middle" font-weight="600">RISK</text>
        
        <!-- Center point -->
        <circle cx="100" cy="110" r="8" fill="${needleColor}"/>
        <circle cx="100" cy="110" r="4" fill="var(--bg-secondary)"/>
        
        <!-- Needle pointer pointing right by default, rotated around cx, cy -->
        <polygon class="gauge-needle" points="100,107 100,113 165,110" fill="${needleColor}" style="transform: rotate(${angle}deg); transform-origin: 100px 110px;" />
      </svg>
    `;
    
    if (els.macroRiskScoreVal) {
      els.macroRiskScoreVal.innerText = `${score}%`;
      if (score >= 70) {
        els.macroRiskScoreVal.style.color = "var(--accent-rose)";
      } else if (score >= 40) {
        els.macroRiskScoreVal.style.color = "var(--accent-amber)";
      } else {
        els.macroRiskScoreVal.style.color = "var(--accent-emerald)";
      }
    }
  }

  // 6. Rendering Macro Widget Grid & Sparklines
  function renderMacroGrid() {
    if (!els.macroIndicatorsGrid) return;
    
    let html = "";
    state.macroIndicators.forEach(indicator => {
      const statusDetails = getMacroStatusDetails(indicator.status);
      const sparklineHtml = drawMacroSparkline(indicator.history, statusDetails.statusClass);
      
      let displayValue = indicator.value;
      if (indicator.unit === "%" || indicator.unit === "% YoY") {
        displayValue = `${indicator.value > 0 ? "+" : ""}${indicator.value.toFixed(2)}`;
      } else {
        displayValue = indicator.value.toFixed(2);
      }
      
      let displayPrev = indicator.previousValue;
      if (indicator.unit === "%" || indicator.unit === "% YoY") {
        displayPrev = `${indicator.previousValue > 0 ? "+" : ""}${indicator.previousValue.toFixed(2)}`;
      } else {
        displayPrev = indicator.previousValue.toFixed(2);
      }

      html += `
        <div class="glass-card macro-card" id="macro-card-${indicator.id}">
          <div class="macro-card-header">
            <span class="macro-card-title">${indicator.name}</span>
            <span class="badge ${statusDetails.badgeClass}">${indicator.status}</span>
          </div>
          
          <div class="macro-card-value-group">
            <span class="macro-card-value">${displayValue}</span>
            <span class="macro-card-unit">${indicator.unit}</span>
          </div>
          
          <div class="macro-card-previous">
            Previous: ${displayPrev} ${indicator.unit}
          </div>
          
          <div class="macro-card-sparkline-container" title="Historical Trend (Last 6 Periods)">
            ${sparklineHtml}
          </div>
          
          <p class="macro-card-desc">
            ${indicator.description}
          </p>
          
          <div class="macro-card-footer">
            <span class="macro-card-source">Source: ${indicator.source}</span>
            <a href="${indicator.sourceUrl}" target="_blank" class="macro-card-link">
              Data Link
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>
      `;
    });
    
    els.macroIndicatorsGrid.innerHTML = html;
  }

  function getMacroStatusDetails(status) {
    let s = status.toLowerCase();
    if (s.includes("overvalued") || s.includes("inverted") || s.includes("danger") || s.includes("risk")) {
      return { badgeClass: "badge-rose", statusClass: "rose" };
    } else if (s.includes("restrictive") || s.includes("sticky") || s.includes("contraction") || s.includes("inflecting") || s.includes("warning")) {
      return { badgeClass: "badge-warning", statusClass: "warning" };
    } else if (s.includes("expansion") || s.includes("healthy") || s.includes("growth") || s.includes("target")) {
      return { badgeClass: "badge-emerald", statusClass: "emerald" };
    } else {
      return { badgeClass: "badge-indigo", statusClass: "indigo" };
    }
  }

  function drawMacroSparkline(history, statusClass) {
    if (!history || history.length < 2) return "";
    const minVal = Math.min(...history);
    const maxVal = Math.max(...history);
    const range = maxVal - minVal;
    
    const width = 280;
    const height = 48;
    const padding = 6;
    const points = [];
    
    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
      const y = range === 0 
        ? height / 2 
        : height - padding - ((history[i] - minVal) / range) * (height - padding * 2);
      points.push(`${x},${y}`);
    }
    
    const pathData = `M ${points.join(" L ")}`;
    const areaPoints = [
      `${padding},${height}`,
      ...points,
      `${width - padding},${height}`
    ];
    const areaData = `M ${areaPoints.join(" L ")} Z`;
    
    let colorVar = "var(--accent-indigo)";
    let lightColorVar = "var(--accent-indigo-light)";
    
    if (statusClass === "rose") {
      colorVar = "var(--accent-rose)";
      lightColorVar = "rgba(244, 63, 94, 0.4)";
    } else if (statusClass === "warning") {
      colorVar = "var(--accent-amber)";
      lightColorVar = "rgba(245, 158, 11, 0.4)";
    } else if (statusClass === "emerald") {
      colorVar = "var(--accent-emerald)";
      lightColorVar = "rgba(16, 185, 129, 0.4)";
    }
    
    const gradId = `spark-grad-${Math.random().toString(36).substr(2, 9)}`;
    
    return `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; display:block;">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${colorVar}" stop-opacity="0.15" />
            <stop offset="100%" stop-color="${colorVar}" stop-opacity="0" />
          </linearGradient>
        </defs>
        <!-- Area path -->
        <path d="${areaData}" fill="url(#${gradId})" stroke="none" />
        <!-- Glowing stroke behind -->
        <path d="${pathData}" fill="none" stroke="${lightColorVar}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.15" />
        <!-- Actual stroke -->
        <path d="${pathData}" fill="none" stroke="${colorVar}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  // 7. Interactive Macro Comparison Dual-Axis Line Chart
  function renderComparisonSelectors() {
    if (!els.macroComparePrimary || !els.macroCompareSecondary) return;
    
    let primaryHtml = "";
    let secondaryHtml = "";
    
    state.macroIndicators.forEach(indicator => {
      const primarySelected = indicator.id === state.macroPrimaryCompare ? "selected" : "";
      const secondarySelected = indicator.id === state.macroSecondaryCompare ? "selected" : "";
      
      primaryHtml += `<option value="${indicator.id}" ${primarySelected}>${indicator.name}</option>`;
      secondaryHtml += `<option value="${indicator.id}" ${secondarySelected}>${indicator.name}</option>`;
    });
    
    els.macroComparePrimary.innerHTML = primaryHtml;
    els.macroCompareSecondary.innerHTML = secondaryHtml;
  }

  function drawMacroComparisonChart() {
    if (!els.macroComparisonChartContainer) return;
    
    const primaryId = state.macroPrimaryCompare;
    const secondaryId = state.macroSecondaryCompare;
    
    const primary = state.macroIndicators.find(m => m.id === primaryId);
    const secondary = state.macroIndicators.find(m => m.id === secondaryId);
    
    if (!primary || !secondary) return;
    
    const hP = primary.history || [];
    const hS = secondary.history || [];
    
    if (hP.length === 0 || hS.length === 0) {
      els.macroComparisonChartContainer.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-muted);">No historical data found</div>`;
      return;
    }
    
    const periods = state.periods;
    
    let minP = Math.min(...hP);
    let maxP = Math.max(...hP);
    let rangeP = maxP - minP;
    if (rangeP === 0) rangeP = 1;
    minP -= rangeP * 0.1;
    maxP += rangeP * 0.1;
    rangeP = maxP - minP;
    
    let minS = Math.min(...hS);
    let maxS = Math.max(...hS);
    let rangeS = maxS - minS;
    if (rangeS === 0) rangeS = 1;
    minS -= rangeS * 0.1;
    maxS += rangeS * 0.1;
    rangeS = maxS - minS;
    
    const w = els.macroComparisonChartContainer.clientWidth || 800;
    const h = 330;
    const padL = 70;
    const padR = 70;
    const padT = 40;
    const padB = 40;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    
    const ptsP = [];
    const ptsS = [];
    for (let i = 0; i < hP.length; i++) {
      const x = padL + (i / (hP.length - 1)) * chartW;
      const yP = h - padB - ((hP[i] - minP) / rangeP) * chartH;
      const yS = h - padB - ((hS[i] - minS) / rangeS) * chartH;
      ptsP.push({ x, y: yP, val: hP[i] });
      ptsS.push({ x, y: yS, val: hS[i] });
    }
    
    const pathP = `M ${ptsP.map(p => `${p.x},${p.y}`).join(" L ")}`;
    const pathS = `M ${ptsS.map(p => `${p.x},${p.y}`).join(" L ")}`;
    
    let gridLinesHtml = "";
    for (let j = 0; j <= 4; j++) {
      const y = padT + (j / 4) * chartH;
      gridLinesHtml += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4,4"/>`;
    }
    
    let primaryAxisHtml = "";
    for (let j = 0; j <= 4; j++) {
      const y = padT + (j / 4) * chartH;
      const val = maxP - (j / 4) * rangeP;
      primaryAxisHtml += `
        <text x="${padL - 10}" y="${y + 4}" fill="var(--accent-indigo-light)" font-family="var(--font-sans)" font-size="9" text-anchor="end" font-weight="600">
          ${val.toFixed(2)}${primary.unit === "%" || primary.unit === "% YoY" ? "%" : ""}
        </text>
        <line x1="${padL - 5}" y1="${y}" x2="${padL}" y2="${y}" stroke="var(--accent-indigo)" stroke-width="1"/>
      `;
    }
    
    let secondaryAxisHtml = "";
    for (let j = 0; j <= 4; j++) {
      const y = padT + (j / 4) * chartH;
      const val = maxS - (j / 4) * rangeS;
      secondaryAxisHtml += `
        <text x="${w - padR + 10}" y="${y + 4}" fill="var(--accent-emerald)" font-family="var(--font-sans)" font-size="9" text-anchor="start" font-weight="600">
          ${val.toFixed(2)}${secondary.unit === "%" || secondary.unit === "% YoY" ? "%" : ""}
        </text>
        <line x1="${w - padR}" y1="${y}" x2="${w - padR + 5}" y2="${y}" stroke="var(--accent-emerald)" stroke-width="1"/>
      `;
    }
    
    let xAxisHtml = "";
    for (let i = 0; i < periods.length; i++) {
      const x = padL + (i / (periods.length - 1)) * chartW;
      xAxisHtml += `
        <text x="${x}" y="${h - 10}" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="9" text-anchor="middle" font-weight="600">
          ${periods[i]}
        </text>
        <line x1="${x}" y1="${h - padB}" x2="${x}" y2="${h - padB + 5}" stroke="var(--border-color)" stroke-width="1"/>
      `;
    }
    
    let dotsHtml = "";
    ptsP.forEach((p, idx) => {
      dotsHtml += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--bg-secondary)" stroke="var(--accent-indigo)" stroke-width="2" id="macro-dot-p-${idx}"/>
      `;
    });
    ptsS.forEach((p, idx) => {
      dotsHtml += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--bg-secondary)" stroke="var(--accent-emerald)" stroke-width="2" id="macro-dot-s-${idx}"/>
      `;
    });
    
    let guidesHtml = "";
    let hotSpotsHtml = "";
    const colW = chartW / (periods.length - 1);
    
    for (let i = 0; i < periods.length; i++) {
      const x = padL + (i / (periods.length - 1)) * chartW;
      const xStart = x - colW / 2;
      const xEnd = x + colW / 2;
      
      guidesHtml += `
        <line x1="${x}" y1="${padT}" x2="${x}" y2="${h - padB}" stroke="var(--border-color)" stroke-width="1.5" stroke-dasharray="2,2" opacity="0" id="macro-guide-${i}"/>
      `;
      
      hotSpotsHtml += `
        <rect x="${i === 0 ? padL : xStart}" y="${padT}" width="${i === 0 || i === periods.length - 1 ? colW / 2 : colW}" height="${chartH}" fill="transparent" style="cursor:crosshair;" class="macro-hover-rect" data-index="${i}"/>
      `;
    }
    
    els.macroComparisonChartContainer.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: 100%; display: block;" id="macro-svg-element">
        <defs>
          <linearGradient id="macro-grad-p" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--accent-indigo)" stop-opacity="0.1" />
            <stop offset="100%" stop-color="var(--accent-indigo)" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="macro-grad-s" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--accent-emerald)" stop-opacity="0.1" />
            <stop offset="100%" stop-color="var(--accent-emerald)" stop-opacity="0" />
          </linearGradient>
        </defs>
        
        <!-- Gridlines -->
        ${gridLinesHtml}
        
        <!-- Y-Axes and X-Axis -->
        ${primaryAxisHtml}
        ${secondaryAxisHtml}
        ${xAxisHtml}
        
        <!-- Guides (rendered under lines) -->
        ${guidesHtml}
        
        <!-- Line Paths -->
        <path d="${pathP}" fill="none" stroke="var(--accent-indigo)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${pathS}" fill="none" stroke="var(--accent-emerald)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Dots -->
        ${dotsHtml}
        
        <!-- Hotspots -->
        ${hotSpotsHtml}
      </svg>
      <div class="macro-chart-tooltip" id="macro-chart-tooltip"></div>
    `;
    
    const hotspots = els.macroComparisonChartContainer.querySelectorAll(".macro-hover-rect");
    const tooltip = els.macroComparisonChartContainer.querySelector("#macro-chart-tooltip");
    
    hotspots.forEach(target => {
      target.addEventListener("mouseenter", () => {
        const idx = parseInt(target.getAttribute("data-index"));
        
        const guide = els.macroComparisonChartContainer.querySelector(`#macro-guide-${idx}`);
        if (guide) guide.setAttribute("opacity", "0.4");
        
        const dotP = els.macroComparisonChartContainer.querySelector(`#macro-dot-p-${idx}`);
        const dotS = els.macroComparisonChartContainer.querySelector(`#macro-dot-s-${idx}`);
        if (dotP) {
          dotP.setAttribute("r", "6");
          dotP.setAttribute("fill", "var(--accent-indigo)");
        }
        if (dotS) {
          dotS.setAttribute("r", "6");
          dotS.setAttribute("fill", "var(--accent-emerald)");
        }
        
        const pVal = hP[idx];
        const sVal = hS[idx];
        const periodName = periods[idx];
        
        let pFmt = pVal.toFixed(2) + (primary.unit === "%" || primary.unit === "% YoY" ? "%" : "");
        let sFmt = sVal.toFixed(2) + (secondary.unit === "%" || secondary.unit === "% YoY" ? "%" : "");
        
        tooltip.innerHTML = `
          <div style="font-weight:700; color:var(--text-primary); border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-bottom:6px;">${periodName}</div>
          <div class="macro-tooltip-row">
            <span style="color:var(--accent-indigo-light); font-weight:600;">${primary.name}:</span>
            <span class="macro-tooltip-val" style="color:var(--text-primary);">${pFmt}</span>
          </div>
          <div class="macro-tooltip-row" style="margin-top:2px;">
            <span style="color:var(--accent-emerald); font-weight:600;">${secondary.name}:</span>
            <span class="macro-tooltip-val" style="color:var(--text-primary);">${sFmt}</span>
          </div>
        `;
        tooltip.classList.add("visible");
      });
      
      target.addEventListener("mousemove", (e) => {
        const rect = els.macroComparisonChartContainer.getBoundingClientRect();
        tooltip.style.left = `${e.clientX - rect.left + 15}px`;
        tooltip.style.top = `${e.clientY - rect.top - 15}px`;
      });
      
      target.addEventListener("mouseleave", () => {
        const idx = parseInt(target.getAttribute("data-index"));
        
        const guide = els.macroComparisonChartContainer.querySelector(`#macro-guide-${idx}`);
        if (guide) guide.setAttribute("opacity", "0");
        
        const dotP = els.macroComparisonChartContainer.querySelector(`#macro-dot-p-${idx}`);
        const dotS = els.macroComparisonChartContainer.querySelector(`#macro-dot-s-${idx}`);
        if (dotP) {
          dotP.setAttribute("r", "4");
          dotP.setAttribute("fill", "var(--bg-secondary)");
        }
        if (dotS) {
          dotS.setAttribute("r", "4");
          dotS.setAttribute("fill", "var(--bg-secondary)");
        }
        
        tooltip.classList.remove("visible");
      });
    });
  }

  // 8. Custom Toast Alerts
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span style="font-size: 16px;">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}
