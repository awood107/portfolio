/**
 * AJ Wood Portfolio - Economic Dashboard Script
 * Implements interactive LBO Debt Stress-Testing calculations
 * and renders premium styled Chart.js macroeconomic timeline charts.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMacroCharts();
  initLboSimulator();
});

/**
 * Renders Chart.js line charts with premium dark theme parameters
 */
function initMacroCharts() {
  const ctxMacro = document.getElementById('chart-macro');
  const ctxYields = document.getElementById('chart-yields');

  if (!ctxMacro || !ctxYields) return;

  // Shared font & color configurations
  const textMuted = '#94a3b8';
  const gridColor = 'rgba(255, 255, 255, 0.04)';
  const fontConfig = {
    family: "'Inter', sans-serif",
    size: 11
  };

  const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

  // Chart 1: Fed Funds vs CPI YoY Inflation
  new Chart(ctxMacro, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Effective Federal Funds Rate (%)',
          data: [0.40, 1.00, 1.80, 2.10, 0.35, 0.10, 1.70, 5.00, 5.33, 4.80, 5.25],
          borderColor: '#c5a880', // Premium Gold
          backgroundColor: 'rgba(197, 168, 128, 0.05)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true
        },
        {
          label: 'Core CPI Inflation YoY (%)',
          data: [1.3, 2.1, 2.4, 1.8, 1.2, 4.7, 8.0, 4.1, 3.2, 2.8, 3.1],
          borderColor: '#ef4444', // Red
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#f8fafc',
            font: fontConfig,
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#f8fafc',
          bodyColor: '#f8fafc',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textMuted, font: fontConfig }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textMuted, font: fontConfig, callback: value => value + '%' }
        }
      }
    }
  });

  // Chart 2: Yield Curve (10-Yr vs 2-Yr yields)
  new Chart(ctxYields, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: '10-Year Treasury Yield (%)',
          data: [1.80, 2.30, 2.90, 2.10, 0.90, 1.40, 3.00, 4.00, 4.20, 4.10, 4.20],
          borderColor: '#38bdf8', // Light Blue
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true
        },
        {
          label: '2-Year Treasury Yield (%)',
          data: [0.80, 1.40, 2.50, 1.90, 0.40, 0.30, 3.10, 4.60, 4.50, 4.20, 4.30],
          borderColor: '#a855f7', // Purple
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#f8fafc',
            font: fontConfig,
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#f8fafc',
          bodyColor: '#f8fafc',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textMuted, font: fontConfig }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textMuted, font: fontConfig, callback: value => value + '%' }
        }
      }
    }
  });
}

/**
 * Handles slider listening and live math rendering for LBO Debt Stress Testing
 */
function initLboSimulator() {
  // Input sliders
  const slideEv = document.getElementById('slide-ev');
  const slideEbitda = document.getElementById('slide-ebitda');
  const slideDebt = document.getElementById('slide-debt');
  const slideSpread = document.getElementById('slide-spread');
  const slideTreasury = document.getElementById('slide-treasury');

  // Input numeric display panels
  const valEv = document.getElementById('val-ev');
  const valEbitda = document.getElementById('val-ebitda');
  const valDebt = document.getElementById('val-debt');
  const valSpread = document.getElementById('val-spread');
  const valTreasury = document.getElementById('val-treasury');

  // Calculation output panels
  const resDebtAmt = document.getElementById('res-debt-amt');
  const resInterestRate = document.getElementById('res-interest-rate');
  const resAnnualInterest = document.getElementById('res-annual-interest');
  const resDscrCalc = document.getElementById('res-dscr-calc');
  const dealStatusBadge = document.getElementById('deal-status-badge');

  // Top KPI elements
  const kpiTreasury = document.getElementById('kpi-treasury');
  const kpiFedFunds = document.getElementById('kpi-fed-funds');
  const kpiDscr = document.getElementById('kpi-dscr');
  const kpiDscrStatus = document.getElementById('kpi-dscr-status');

  if (!slideEv || !slideEbitda || !slideDebt || !slideSpread || !slideTreasury) return;

  function calculateStressTest() {
    // Collect slider inputs
    const ev = parseFloat(slideEv.value);
    const ebitda = parseFloat(slideEbitda.value);
    const debtPct = parseFloat(slideDebt.value);
    const spread = parseFloat(slideSpread.value);
    const treasuryVal = parseFloat(slideTreasury.value);

    // Update input display labels
    valEv.textContent = `$${ev.toFixed(1)}M`;
    valEbitda.textContent = `$${ebitda.toFixed(1)}M`;
    valDebt.textContent = `${debtPct}%`;
    valSpread.textContent = `+${spread.toFixed(2)}%`;
    valTreasury.textContent = `${treasuryVal.toFixed(2)}%`;

    // Calculations
    const debtAmt = ev * (debtPct / 100);
    const allInInterestRate = treasuryVal + spread;
    const annualInterest = debtAmt * (allInInterestRate / 100);
    
    // DSCR = EBITDA / Interest payment
    let dscr = 99.9;
    if (annualInterest > 0) {
      dscr = ebitda / annualInterest;
    }

    // Format output strings
    resDebtAmt.textContent = `$${debtAmt.toFixed(2)}M`;
    resInterestRate.textContent = `${allInInterestRate.toFixed(2)}%`;
    resAnnualInterest.textContent = `$${(annualInterest * 1000).toFixed(0)}k`;
    resDscrCalc.textContent = dscr >= 99.9 ? '99.9x' : `${dscr.toFixed(2)}x`;

    // Update Top KPIs
    kpiTreasury.textContent = `${treasuryVal.toFixed(2)}%`;
    kpiDscr.textContent = dscr >= 99.9 ? '99.9x' : `${dscr.toFixed(2)}x`;
    
    // Dynamic Fed Funds Rate KPI tied to Treasury movements (historical correlation proxy)
    const simulatedFedFunds = Math.max(0, treasuryVal + 1.05);
    kpiFedFunds.textContent = `${simulatedFedFunds.toFixed(2)}%`;

    // Reset status classes
    dealStatusBadge.className = 'status-indicator';
    kpiDscrStatus.className = 'kpi-change';

    // Status warning rules
    if (dscr >= 1.50) {
      dealStatusBadge.textContent = 'INVESTABLE (Target DSCR Safe)';
      dealStatusBadge.classList.add('success');
      kpiDscrStatus.textContent = 'Target Safe (>1.5x)';
      kpiDscrStatus.classList.add('positive');
      kpiDscr.style.color = '#c5a880';
    } else if (dscr >= 1.25) {
      dealStatusBadge.textContent = 'LEVERAGED WARNING (Tight Coverage)';
      dealStatusBadge.classList.add('warning');
      kpiDscrStatus.textContent = 'Tight Spreads (1.25x-1.5x)';
      kpiDscrStatus.classList.add('neutral');
      kpiDscr.style.color = '#f59e0b';
    } else {
      dealStatusBadge.textContent = 'DISTRESSED DEBT (Default Risk)';
      dealStatusBadge.classList.add('danger');
      kpiDscrStatus.textContent = 'Under Minimum Limit (<1.25x)';
      kpiDscrStatus.classList.add('negative');
      kpiDscr.style.color = '#ef4444';
    }
  }

  // Bind Event Listeners
  const sliders = [slideEv, slideEbitda, slideDebt, slideSpread, slideTreasury];
  sliders.forEach(slider => {
    slider.addEventListener('input', calculateStressTest);
  });

  // Run initial calculation on load
  calculateStressTest();
}
