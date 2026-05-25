/**
 * AJ Wood Portfolio Javascript
 * Handles responsive navigation, scroll indicators, skill animations,
 * form submissions, and visual canvas graphics.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTimelineAnimation();
  initSkillProgressAnimation();
  initContactForm();
  initNetworkCanvas();
  initProjectModals();
});

/**
 * Navigation functions
 */
function initNavigation() {
  const header = document.getElementById('header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  // Change header background on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Toggle mobile navigation menu
  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  // Close mobile nav when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // Track active section and update nav indicator (ScrollSpy)
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px', // Trigger when section occupies the active zone
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    sectionObserver.observe(section);
  });
}

/**
 * Timeline scroll-fade animation
 */
function initTimelineAnimation() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.15
  };

  const timelineObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Trigger once
      }
    });
  }, observerOptions);

  timelineItems.forEach(item => {
    timelineObserver.observe(item);
  });
}

/**
 * Skill progress bar animations
 */
function initSkillProgressAnimation() {
  const skillsSection = document.getElementById('skills');
  const progressBars = document.querySelectorAll('.skill-progress-bar');
  
  if (!skillsSection) return;

  const observerOptions = {
    root: null,
    threshold: 0.2
  };

  const skillsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        progressBars.forEach(bar => {
          const targetProgress = bar.getAttribute('data-progress');
          bar.style.width = targetProgress;
        });
        observer.unobserve(entry.target); // Animate once
      }
    });
  }, observerOptions);

  skillsObserver.observe(skillsSection);
}

/**
 * Contact Form validation and submit handling
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear feedback
    feedback.className = 'form-status';
    feedback.textContent = '';
    feedback.style.display = 'none';

    // Simple validation
    const nameInput = document.getElementById('form-name');
    const emailInput = document.getElementById('form-email');
    const messageInput = document.getElementById('form-message');
    const submitBtn = document.getElementById('btn-submit');

    if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
      showFeedback('Please fill out all fields.', 'error');
      return;
    }

    if (!validateEmail(emailInput.value)) {
      showFeedback('Please enter a valid email address.', 'error');
      return;
    }

    // Submit Simulation
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending Message...';
    
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      showFeedback('Thank you, AJ! Your message has been sent successfully.', 'success');
      form.reset();
    }, 1500);
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.classList.add(type);
    feedback.style.display = 'block';
  }
}

/**
 * Background network node/particle animation (symbolic of connections & data)
 */
function initNetworkCanvas() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  // Handle Resize
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  // Scale particle counts by screen size
  const maxParticles = Math.min(60, Math.floor((width * height) / 22000));
  const maxDistance = 140;

  // Particle class definition
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce bounds
      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y < 0 || this.y > height) this.vy = -this.vy;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(197, 168, 128, 0.4)'; // Gold hue
      ctx.fill();
    }
  }

  // Populate particles
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Stop animating if user has scrolled past hero section to save resources
    if (window.scrollY < height) {
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`; // Blue line link
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  animate();
}

/**
 * Interactive Modal controllers for projects
 */
function initProjectModals() {
  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const modalBody = document.getElementById('modal-body-content');
  
  // Link elements
  const timelineLink = document.getElementById('link-project-timeline');
  const economicsLink = document.getElementById('link-project-economics');
  const dashboardLink = document.getElementById('link-project-dashboard');
  const amortizationLink = document.getElementById('link-project-amortization');
  const etlLink = document.getElementById('link-project-etl');

  if (!modal || !modalClose || !modalBody) return;

  const projectData = {
    timeline: {
      title: '"The Timeline of Our Time"',
      content: `
        <div class="modal-title">"The Timeline of Our Time"</div>
        <div class="modal-text">
          <p><strong>Overview:</strong> An ongoing historical book project compiling a granular, data-driven chronology of key sovereign credit, inflation, monetary peg transitions, and technological waves from classical antiquity to the modern era.</p>
          <h4>Primary Research Spheres:</h4>
          <ul>
            <li><strong>Sovereign Debt Cycles:</strong> Tracing the progression of public credit expansions, currency debasement inflection points, and default behaviors across global empires.</li>
            <li><strong>Monetary Structural Breaks:</strong> Analyzing the mechanics of peg dissolutions, including the Roman denarius devaluations, the Assignats of the French Revolution, and the Bretton Woods Nixon Shock of 1971.</li>
            <li><strong>Technology S-Curves:</strong> Correlating structural economic growth spikes with infrastructure cycles (railroads, telegraph networks, electrification, database systems).</li>
          </ul>
          <h4>Current Project Status:</h4>
          <p>Chapter 1 ("The Mathematics of Currency Debasement") and Chapter 2 ("A History of Sovereign Debt Cycles") are currently in draft phase. Release planning is targeted for mid-2027.</p>
        </div>
      `
    },
    economics: {
      title: "Economic & Monetary Policy Commentary",
      content: `
        <div class="modal-title">Economic Commentary & Op-Eds</div>
        <div class="modal-text">
          <p><strong>Overview:</strong> A compilation of research briefs and planned op-eds reviewing current Federal Reserve monetary policy, inflation paths, yield curve dynamics, and debt underwriting trends.</p>
          <h4>Featured Analysis Areas:</h4>
          <ul>
            <li><strong>The Search for R-Star:</strong> Analyzing the long-term neutral real rate of interest (r*) and its implications on capital expenditure forecasting, corporate pricing, and long-term cost structures.</li>
            <li><strong>Quantitative Tightening & Asset Yield Spreads:</strong> Underwriting the yield premiums of commercial real estate and corporate bonds relative to the US 10-Year Treasury under monetary contraction.</li>
            <li><strong>The Mechanics of Debt Amortization:</strong> Modeling compounding structures and interest coverage ratios under elevated inflation regimes.</li>
          </ul>
          <h4>Recent Drafts & Releases:</h4>
          <p>Draft briefs are shared quarterly with private equity and investment groups. Formal submissions targeting publications like the Wall Street Journal are slated for Q3 2026.</p>
        </div>
      `
    },
    dashboard: {
      title: "M&A Integration & Valuation Dashboard",
      content: `
        <div class="modal-title">M&A Integration & Valuation Dashboard</div>
        <div class="modal-text">
          <p><strong>Overview:</strong> A custom internal dashboard built in Python (using Pandas, Streamlit, and Plotly) designed to streamline buy-side due diligence. It binds traditional cash flow targets directly to post-merger technology integrations.</p>
          <h4>Core Functions:</h4>
          <ul>
            <li><strong>Automated LBO & DCF Valuation:</strong> Ingests target business financials to output instant valuation models, debt scenarios, and purchase price suggestions.</li>
            <li><strong>Synergy Milestones Mapping:</strong> Translates pre-transaction operational synergies into post-merger engineering backlogs.</li>
            <li><strong>Portfolio Consolidation Forecasts:</strong> Evaluates variable cost reduction models across merged IT stacks.</li>
          </ul>
          <h4>Technical Architecture:</h4>
          <p>Engineered using Python Streamlit for UI, Pandas for dataset transformations, and JSON-based configuration files for flexible debt structuring parameters.</p>
        </div>
      `
    },
    amortization: {
      title: "Debt Amortization & Yield Sensitivity Engine",
      content: `
        <div class="modal-title">Debt Amortization & Yield Engine</div>
        <div class="modal-text">
          <p><strong>Overview:</strong> A mathematical modeling library engineered in Python to evaluate capital yields, debt schedules, and risk coverage limits for commercial assets.</p>
          <h4>Core Math Capabilities:</h4>
          <ul>
            <li><strong>Interest Coverage Sensitivity:</strong> Simulates DSCR variations across multi-tier debt arrangements under Federal Reserve rate hiking scenarios.</li>
            <li><strong>Amortization Matrix Outputs:</strong> Generates dynamic repayment logs mapping principal and interest splits over customizable rate paths.</li>
            <li><strong>Cap Rate Yield Analysis:</strong> Models spreads between target commercial asset capitalization rates and US Treasury yields.</li>
          </ul>
          <h4>Technical Architecture:</h4>
          <p>Constructed utilizing NumPy for rapid matrix operations, packaged as a lightweight command-line script capable of exporting CSV logs.</p>
        </div>
      `
    },
    etl: {
      title: "Database Schema Migration & ETL Tool",
      content: `
        <div class="modal-title">Database Schema Migration & ETL Utility</div>
        <div class="modal-text">
          <p><strong>Overview:</strong> A high-performance Python script and database utility that automates legacy SQL database migrations and schema transformations.</p>
          <h4>Core Capabilities:</h4>
          <ul>
            <li><strong>Auto-Mapping & Transformations:</strong> Parses legacy SQL columns, validates data types against target tables, and generates optimized TSQL mapping structures.</li>
            <li><strong>Financial Record Sanitization:</strong> Identifies accounting transaction record breaks and duplicate legacy files with 99.9% data integrity constraints.</li>
            <li><strong>Index Optimization:</strong> Analyzes execution logs to suggest index improvements for million-record batch runs.</li>
          </ul>
          <h4>Technical Architecture:</h4>
          <p>Built with Python, utilizing SQLAlchemy for ETL connections and custom TSQL stored procedures for relational mapping controls.</p>
        </div>
      `
    }
  };

  function openModal(type) {
    if (!projectData[type]) return;
    modalBody.innerHTML = projectData[type].content;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Lock scroll
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = ''; // Unlock scroll
    setTimeout(() => {
      modalBody.innerHTML = '';
    }, 400);
  }

  // Bind Event Listeners
  if (timelineLink) {
    timelineLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('timeline');
    });
  }

  if (economicsLink) {
    economicsLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('economics');
    });
  }

  if (dashboardLink) {
    dashboardLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('dashboard');
    });
  }

  if (amortizationLink) {
    amortizationLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('amortization');
    });
  }

  if (etlLink) {
    etlLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('etl');
    });
  }

  modalClose.addEventListener('click', closeModal);

  // Close modal when clicking outside the content area
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}
