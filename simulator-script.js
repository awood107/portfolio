/**
 * AJ Wood Portfolio - LBO Monte Carlo Simulator Script
 * Runs a 2,000-run client-side stochastic projection model for Leveraged Buyouts.
 * Computes IRR and MoIC outcomes and plots the probability distribution.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLboMonteCarlo();
});

function initLboMonteCarlo() {
  // Input Sliders
  const slideEv = document.getElementById('slide-ev');
  const slideEbitda = document.getElementById('slide-ebitda');
  const slideDebt = document.getElementById('slide-debt');
  
  const slideRevMean = document.getElementById('slide-rev-mean');
  const slideMultMean = document.getElementById('slide-mult-mean');
  const slideMarginMean = document.getElementById('slide-margin-mean');
  const slideRateMean = document.getElementById('slide-rate-mean');
  
  const slideRevSd = document.getElementById('slide-rev-sd');
  const slideMultSd = document.getElementById('slide-mult-sd');
  const slideMarginSd = document.getElementById('slide-margin-sd');
  const slideRateSd = document.getElementById('slide-rate-sd');

  // Value Labels
  const valEv = document.getElementById('val-ev');
  const valEbitda = document.getElementById('val-ebitda');
  const valDebt = document.getElementById('val-debt');
  
  const valRevMean = document.getElementById('val-rev-mean');
  const valMultMean = document.getElementById('val-mult-mean');
  const valMarginMean = document.getElementById('val-margin-mean');
  const valRateMean = document.getElementById('val-rate-mean');
  
  const valRevSd = document.getElementById('val-rev-sd');
  const valMultSd = document.getElementById('val-mult-sd');
  const valMarginSd = document.getElementById('val-margin-sd');
  const valRateSd = document.getElementById('val-rate-sd');

  // KPI Output Cards
  const kpiMedianIrr = document.getElementById('kpi-median-irr');
  const kpiExpectedMoic = document.getElementById('kpi-expected-moic');
  const kpiLossProb = document.getElementById('kpi-loss-prob');
  const kpiTargetProb = document.getElementById('kpi-target-prob');

  const canvas = document.getElementById('chart-simulator');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let chartInstance = null;

  // Box-Muller random normal generator
  function boxMuller(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
  }

  function runSimulation() {
    // 1. Gather Inputs
    const ev = parseFloat(slideEv.value);
    const initialEbitda = parseFloat(slideEbitda.value);
    const debtPct = parseFloat(slideDebt.value);

    const revMean = parseFloat(slideRevMean.value) / 100;
    const multMean = parseFloat(slideMultMean.value);
    const marginMean = parseFloat(slideMarginMean.value) / 100;
    const rateMean = parseFloat(slideRateMean.value) / 100;

    const revSd = parseFloat(slideRevSd.value) / 100;
    const multSd = parseFloat(slideMultSd.value);
    const marginSd = parseFloat(slideMarginSd.value) / 100;
    const rateSd = parseFloat(slideRateSd.value) / 100;

    // 2. Update Label Displays
    valEv.textContent = `$${ev.toFixed(1)}M`;
    valEbitda.textContent = `$${initialEbitda.toFixed(1)}M`;
    valDebt.textContent = `${debtPct}%`;
    
    valRevMean.textContent = `${(revMean * 100).toFixed(1)}%`;
    valMultMean.textContent = `${multMean.toFixed(2)}x`;
    valMarginMean.textContent = `${(marginMean * 100).toFixed(1)}%`;
    valRateMean.textContent = `${(rateMean * 100).toFixed(1)}%`;
    
    valRevSd.textContent = `${(revSd * 100).toFixed(2)}%`;
    valMultSd.textContent = `${multSd.toFixed(2)}x`;
    valMarginSd.textContent = `${(marginSd * 100).toFixed(2)}%`;
    valRateSd.textContent = `${(rateSd * 100).toFixed(2)}%`;

    const runs = 2000;
    const irrs = [];
    const moics = [];

    const initialDebt = ev * (debtPct / 100);
    const initialEquity = ev - initialDebt;

    // Entry Revenue proxy (using marginMean as base)
    const entryRev = initialEbitda / marginMean;

    // 3. Monte Carlo Loop
    for (let i = 0; i < runs; i++) {
      // Sample variables for this run
      const sampledGrowth = boxMuller(revMean, revSd);
      const sampledExitMult = Math.max(2.0, boxMuller(multMean, multSd)); // Floor at 2.0x
      const sampledMargin = Math.max(0.02, Math.min(0.85, boxMuller(marginMean, marginSd))); // Clamp margin
      const sampledInterestRate = Math.max(0.01, boxMuller(rateMean, rateSd)); // Floor at 1%

      // Run 5-Year Projections
      let currentRev = entryRev;
      let accumulatedCash = 0;
      const annualInterest = initialDebt * sampledInterestRate;

      for (let yr = 1; yr <= 5; yr++) {
        currentRev = currentRev * (1 + sampledGrowth);
        const currentEbitda = currentRev * sampledMargin;
        
        // CapEx assumed at 15% of EBITDA
        const currentCapex = currentEbitda * 0.15;
        const currentEbt = currentEbitda - annualInterest - currentCapex;
        const currentTaxes = currentEbt > 0 ? currentEbt * 0.25 : 0; // 25% Tax Rate
        
        const currentFcf = currentEbitda - annualInterest - currentCapex - currentTaxes;
        accumulatedCash += currentFcf;
      }

      const finalEbitda = currentRev * sampledMargin;
      const exitEv = finalEbitda * sampledExitMult;
      
      // Net exit equity = Exit Enterprise Value - Debt + Cash
      const exitEquity = Math.max(0, exitEv - initialDebt + accumulatedCash);
      
      const moic = exitEquity / initialEquity;
      const irr = moic > 0 ? Math.pow(moic, 0.2) - 1 : -1.0; // Year 5 IRR

      irrs.push(irr);
      moics.push(moic);
    }

    // 4. Calculate Summary Statistics
    irrs.sort((a, b) => a - b);
    moics.sort((a, b) => a - b);

    // Median (50th percentile)
    const medianIrr = irrs[Math.floor(runs * 0.5)];
    // Average MoIC
    const averageMoic = moics.reduce((sum, val) => sum + val, 0) / runs;

    // Probability of capital loss (IRR < 0%)
    const lossRuns = irrs.filter(val => val < 0).length;
    const lossProb = (lossRuns / runs) * 100;

    // Probability of hitting target (IRR >= 20%)
    const targetRuns = irrs.filter(val => val >= 0.20).length;
    const targetProb = (targetRuns / runs) * 100;

    // Render KPIs
    kpiMedianIrr.textContent = `${(medianIrr * 100).toFixed(1)}%`;
    kpiExpectedMoic.textContent = `${averageMoic.toFixed(2)}x`;
    kpiLossProb.textContent = `${lossProb.toFixed(1)}%`;
    kpiTargetProb.textContent = `${targetProb.toFixed(1)}%`;

    // Dynamic warning colors for loss probability
    if (lossProb > 15) {
      kpiLossProb.style.color = '#ef4444'; // Red alert
    } else if (lossProb > 5) {
      kpiLossProb.style.color = '#f59e0b'; // Yellow caution
    } else {
      kpiLossProb.style.color = '#10b981'; // Green safe
    }

    // 5. Aggregate Histogram Data
    // Define 25 buckets from -20% to +80% (4% size)
    const bucketSize = 0.04;
    const numBuckets = 26;
    const minVal = -0.20;
    const bucketCounts = new Array(numBuckets).fill(0);
    const bucketLabels = [];

    // Pre-generate bucket labels (e.g. "-16%", "0%", "24%")
    for (let j = 0; j < numBuckets; j++) {
      const centerVal = minVal + (j * bucketSize);
      bucketLabels.push(`${(centerVal * 100).toFixed(0)}%`);
    }

    irrs.forEach(irr => {
      let index = Math.floor((irr - minVal) / bucketSize);
      if (index < 0) {
        bucketCounts[0]++; // Put in the lowest bucket
      } else if (index >= numBuckets) {
        bucketCounts[numBuckets - 1]++; // Put in the highest bucket
      } else {
        bucketCounts[index]++;
      }
    });

    // 6. Draw Chart
    renderHistogram(bucketLabels, bucketCounts);
  }

  function renderHistogram(labels, data) {
    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = data;
      chartInstance.update('none'); // Update smoothly without reset animations
      return;
    }

    // Shared style constants
    const textMuted = '#94a3b8';
    const gridColor = 'rgba(255, 255, 255, 0.04)';
    const fontConfig = {
      family: "'Inter', sans-serif",
      size: 11
    };

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Simulation Frequency (Run Count)',
          data: data,
          backgroundColor: 'rgba(197, 168, 128, 0.75)', // Gold overlay
          borderColor: '#c5a880',
          borderWidth: 1.5,
          borderRadius: 3,
          barPercentage: 0.9,
          categoryPercentage: 0.9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Save space
          },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `Frequency: ${context.parsed.y} runs`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textMuted,
              font: fontConfig,
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 15
            }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textMuted,
              font: fontConfig
            }
          }
        }
      }
    });
  }

  // Bind Slider Event Listeners
  const sliders = [
    slideEv, slideEbitda, slideDebt,
    slideRevMean, slideMultMean, slideMarginMean, slideRateMean,
    slideRevSd, slideMultSd, slideMarginSd, slideRateSd
  ];

  sliders.forEach(slider => {
    slider.addEventListener('input', runSimulation);
  });

  // Run initial simulation
  runSimulation();
}
