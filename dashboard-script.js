/**
 * AJ Wood Portfolio - Economic Dashboard Script
 * Renders premium styled Chart.js macroeconomic timeline charts.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMacroCharts();
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
