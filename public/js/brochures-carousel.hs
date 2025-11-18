// public/js/brochures-carousel.js
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.brochure-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const items = Array.from(track.children);
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const dotsWrap = carousel.querySelector('.carousel-dots');

  let currentIndex = 0;
  let autoplay = true;
  let autoplaySpeed = 4000;
  let autoplayTimer = null;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationID = null;

  // Create dots
  items.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel-dot';
    d.type = 'button';
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  });

  const dots = Array.from(dotsWrap.children);

  function updateDots() {
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
  }

  function setPositionByIndex() {
    const containerWidth = carousel.clientWidth;
    // items per view based on CSS breakpoints
    const itemsPerView = getItemsPerView();
    const itemWidth = items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 16);
    const target = (itemWidth) * currentIndex;
    track.style.transform = `translateX(${ -target }px)`;
    updateDots();
  }

  function getItemsPerView() {
    const w = window.innerWidth;
    if (w <= 600) return 1;
    if (w <= 1000) return 2;
    return 3;
  }

  function goTo(index) {
    const maxIndex = Math.max(0, items.length - getItemsPerView());
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    setPositionByIndex();
    resetAutoplay();
  }

  function next() {
    goTo(currentIndex + 1);
  }
  function prev() {
    goTo(currentIndex - 1);
  }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // Keyboard navigation
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Autoplay
  function startAutoplay() {
    if (!autoplay) return;
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => {
      const maxIndex = Math.max(0, items.length - getItemsPerView());
      if (currentIndex >= maxIndex) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      setPositionByIndex();
    }, autoplaySpeed);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }
  startAutoplay();

  // Responsive: adjust on resize
  window.addEventListener('resize', () => {
    setPositionByIndex();
  });

  // Drag / touch support
  items.forEach((item, index) => {
    const media = item;
    media.addEventListener('pointerdown', pointerDown(index));
    media.addEventListener('pointerup', pointerUp);
    media.addEventListener('pointerleave', pointerUp);
    media.addEventListener('pointermove', pointerMove);
  });

  function pointerDown(index) {
    return function (e) {
      isDragging = true;
      startX = e.clientX;
      prevTranslate = currentTranslate;
      carousel.classList.add('dragging');
      cancelAnimationFrame(animationID);
      // pause autoplay while dragging
      clearInterval(autoplayTimer);
    };
  }

  function pointerMove(e) {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    track.style.transform = `translateX(${ - (currentIndex * (items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 16))) + diff }px)`;
  }

  function pointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.clientX;
    const diff = endX - startX;
    const threshold = 50;
    if (diff > threshold) {
      prev();
    } else if (diff < -threshold) {
      next();
    } else {
      setPositionByIndex();
    }
    carousel.classList.remove('dragging');
    resetAutoplay();
  }

  // initialize positions and dots
  setPositionByIndex();
  updateDots();

  // Pause autoplay on hover
  carousel.addEventListener('mouseenter', () => { clearInterval(autoplayTimer); });
  carousel.addEventListener('mouseleave', () => { resetAutoplay(); });
});
