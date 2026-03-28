// DOM Elements
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const progressBar = document.querySelector('.progress-bar');
const sections = Array.from(document.querySelectorAll('section'));
const body = document.body;
const bgLayer = document.querySelector('.bg-layer');

const heroSec = document.querySelector('.sec-hero');
const heroOverlay = document.querySelector('.hero-overlay');
const heroBadge = document.querySelector('.hero-badge');

// Colors
const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16)
  ];
};

const colors = {
  dark: hexToRgb('#141412'),
  light: hexToRgb('#f0ede6')
};

function lerpColor(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ];
}

// 1. CUSTOM CURSOR
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  
  // Dot follows immediately
  cursorDot.style.left = `${mouseX}px`;
  cursorDot.style.top = `${mouseY}px`;
  
  // Hover effects
  const target = e.target;
  if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
    cursorRing.classList.add('hover');
    body.classList.add('hovering');
  } else {
    cursorRing.classList.remove('hover');
    body.classList.remove('hovering');
  }
});

// Lagging ring using requestAnimationFrame
function animateCursor() {
  ringX += (mouseX - ringX) * 0.15;
  ringY += (mouseY - ringY) * 0.15;
  
  cursorRing.style.left = `${ringX}px`;
  cursorRing.style.top = `${ringY}px`;
  
  requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);


// 2. SCROLL EVENTS: Animations, Progress Bar, Theme Interpolation
function onScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollRatio = scrollTop / docHeight;
  
  // Progress Bar
  progressBar.style.width = `${scrollRatio * 100}%`;

  // Hero Section Overlay Animation (0 to 1 as we scroll past first 100vh)
  const vh = window.innerHeight;
  let heroScrollProgress = Math.min(Math.max(scrollTop / vh, 0), 1);
  
  if (heroOverlay) {
    // Fade out to black only in the last 30% of the stick scroll
    heroOverlay.style.opacity = Math.max(0, (heroScrollProgress - 0.7) * 3.33);
  }
  
  const heroCar = document.querySelector('.hero-car');
  if (heroCar) {
    // Zoom from 0.4 up to 3.0 as you scroll
    const scale = 0.4 + (heroScrollProgress * 2.6);
    // Smooth fast fade in at the start
    const carOpacity = heroScrollProgress < 0.1 ? heroScrollProgress * 10 : 1;
    
    heroCar.style.transform = `scale(${scale})`;
    heroCar.style.opacity = carOpacity;
  }
  
  if (heroBadge) {
    if (heroScrollProgress > 0.8 && heroScrollProgress < 0.99) {
      heroBadge.classList.add('visible');
    } else if (heroScrollProgress >= 0.99 || heroScrollProgress < 0.8) {
      heroBadge.classList.remove('visible'); // Hide when fully black or scrolled back up
    }
  }

  // Continuous Background Interpolation
  // Map sections centers to their themes
  let sectionPoints = sections.map(sec => {
    let rect = sec.getBoundingClientRect();
    let absTop = scrollTop + rect.top;
    let center = absTop + rect.height / 2;
    return {
      center: center,
      theme: sec.getAttribute('data-theme')
    };
  });

  // Sort by center just in case
  sectionPoints.sort((a, b) => a.center - b.center);

  // Find where our current scroll center is
  let currentScrollCenter = scrollTop + vh / 2;
  
  let currentSecIdx = 0;
  for (let i = 0; i < sectionPoints.length - 1; i++) {
    if (currentScrollCenter >= sectionPoints[i].center && currentScrollCenter < sectionPoints[i+1].center) {
      currentSecIdx = i;
      break;
    }
    // If we're past all sections except the last one
    if (currentScrollCenter >= sectionPoints[sectionPoints.length - 1].center) {
      currentSecIdx = sectionPoints.length - 1;
    }
  }

  let colorToApply = colors[sectionPoints[currentSecIdx].theme];
  let themeName = sectionPoints[currentSecIdx].theme;

  // Interp between current and next if we are between their centers
  if (currentSecIdx < sectionPoints.length - 1 && currentScrollCenter >= sectionPoints[currentSecIdx].center) {
    let curr = sectionPoints[currentSecIdx];
    let next = sectionPoints[currentSecIdx + 1];
    let distance = next.center - curr.center;
    let progress = (currentScrollCenter - curr.center) / distance;
    
    // Smooth easing
    let easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    colorToApply = lerpColor(colors[curr.theme], colors[next.theme], easeProgress);
    
    // Switch text color halfway
    if (progress > 0.5) themeName = next.theme;
  }

  body.style.backgroundColor = `rgb(${colorToApply[0]}, ${colorToApply[1]}, ${colorToApply[2]})`;
  body.setAttribute('data-current-theme', themeName);
}

window.addEventListener('scroll', onScroll, { passive: true });
// Trigger once on load
onScroll();


// 3. INTERSECTION OBSERVER FOR REVEALS
const observerOptions = {
  root: null,
  rootMargin: '0px 0px -10% 0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      
      // Handle the underline drawing for contact
      if (target.classList.contains('styled-link') && target.querySelector('.underline')) {
        target.classList.add('draw');
      } else {
        // Handle clip-text spans specifically if we want
        if (target.classList.contains('clip-text') && target.tagName !== 'SPAN') {
          // Instead of target itself, we might want to just add intersected to target.
        }
        target.classList.add('intersected');
      }
      
      observer.unobserve(target);
    }
  });
}, observerOptions);

// Elements to observe
const revealElements = document.querySelectorAll('.clip-text, .fade-up, .slide-in, .flip-card, .peel-up, .styled-link');
revealElements.forEach(el => observer.observe(el));

// Specific logic for clip text words or spans inside them if needed
document.querySelectorAll('.clip-text').forEach(parent => {
  // If no inner spans, wrap it? We assume HTML structure has them wrapped
  // Observer will trigger on the parent clip-text and css targets .clip-text.intersected span
});
