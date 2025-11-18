// public/js/flipbook.js
(function () {
  // ensure pages are provided
  const pages = window.FLIPBOOK_PAGES || [];
  if (!pages.length) return console.warn('[FLIPBOOK] No pages defined.');

  const viewer = document.getElementById('flipbook-viewer');
  const prevBtn = document.getElementById('flip-prev');
  const nextBtn = document.getElementById('flip-next');
  const pagenoEl = document.getElementById('flip-pageno');
  const downloadEl = document.getElementById('flip-download');
  const zoomBtn = document.getElementById('flip-zoom');

  // Build spreads: each spread shows two pages (left,right). Use pages[0] as left of spread 0?
  // We'll treat page indices as 0-based. Spread 0 shows pages[0] (left) + pages[1] (right)
  const spreads = [];
  for (let i = 0; i < pages.length; i += 2) {
    const left = pages[i] || null;
    const right = pages[i + 1] || null;
    spreads.push({ left, right });
  }

  let currentSpread = 0;
  let isAnimating = false;
  let isZoomed = false;

  function renderSpread(idx) {
    viewer.innerHTML = ''; // clear
    const spread = spreads[idx];
    // wrapper
    const wrap = document.createElement('div');
    wrap.className = 'flip-spread';

    // left static page (under)
    const leftWrap = document.createElement('div');
    leftWrap.className = 'flip-page left';
    const leftFace = document.createElement('div');
    leftFace.className = 'page-face';
    if (spread.left) {
      const img = document.createElement('img'); img.src = spread.left; img.alt = 'Left page'; leftFace.appendChild(img);
    } else leftFace.innerHTML = '';
    leftWrap.appendChild(leftFace);
    wrap.appendChild(leftWrap);

    // right static page (under)
    const rightWrap = document.createElement('div');
    rightWrap.className = 'flip-page right';
    const rightFace = document.createElement('div');
    rightFace.className = 'page-face';
    if (spread.right) {
      const img = document.createElement('img'); img.src = spread.right; img.alt = 'Right page'; rightFace.appendChild(img);
    } else rightFace.innerHTML = '';
    rightWrap.appendChild(rightFace);
    wrap.appendChild(rightWrap);

    // flipping layer: we create a page element that will rotate over
    // Create left flip element (to flip previous "right" to left)
    const flipLeft = document.createElement('div');
    flipLeft.className = 'flip-anim flip-left';
    flipLeft.style.zIndex = 60;
    const flipLeftFace = document.createElement('div'); flipLeftFace.className = 'page-face';
    flipLeftFace.style.visibility = 'hidden'; // shown during flip
    flipLeft.appendChild(flipLeftFace);
    wrap.appendChild(flipLeft);

    // Create right flip element (to flip current left to right)
    const flipRight = document.createElement('div');
    flipRight.className = 'flip-anim flip-right';
    flipRight.style.zIndex = 60;
    const flipRightFace = document.createElement('div'); flipRightFace.className = 'page-face';
    flipRightFace.style.visibility = 'hidden';
    flipRight.appendChild(flipRightFace);
    wrap.appendChild(flipRight);

    // shadow overlay for realism
    const shadow = document.createElement('div'); shadow.className = 'flip-shadow';
    wrap.appendChild(shadow);

    viewer.appendChild(wrap);

    // Update page number and download link
    const totalSpreads = spreads.length;
    pagenoEl.textContent = `${idx + 1} / ${totalSpreads}`;
    if (spread.right) {
      downloadEl.href = spread.right;
      downloadEl.setAttribute('download', `brochure-spread-${idx + 1}.jpg`);
    } else if (spread.left) {
      downloadEl.href = spread.left;
      downloadEl.setAttribute('download', `brochure-spread-${idx + 1}.jpg`);
    } else {
      downloadEl.href = '#';
      downloadEl.removeAttribute('download');
    }

    // Prepare flip faces images (for animation)
    if (spread.left && flipRightFace) {
      const img = document.createElement('img'); img.src = spread.left; img.alt = 'flip';
      flipRightFace.innerHTML = ''; flipRightFace.appendChild(img);
      flipRightFace.style.visibility = 'visible';
    }
    if (spread.right && flipLeftFace) {
      const img2 = document.createElement('img'); img2.src = spread.right; img2.alt = 'flip';
      flipLeftFace.innerHTML = ''; flipLeftFace.appendChild(img2);
      flipLeftFace.style.visibility = 'visible';
    }
  }

  // animate forward: emulate right page flipping to reveal next spread
  function turnNext() {
    if (isAnimating) return;
    if (currentSpread >= spreads.length - 1) return;
    isAnimating = true;

    const spread = spreads[currentSpread];
    const viewerSpread = viewer.querySelector('.flip-spread');
    const flipRight = viewerSpread.querySelector('.flip-right');
    const flipFace = flipRight.querySelector('.page-face');

    // set initial transform origin and styles
    flipRight.style.transformOrigin = 'left center';
    flipRight.style.transform = 'rotateY(0deg)';
    flipRight.style.left = '50%';
    flipRight.style.pointerEvents = 'none';
    flipFace.style.boxShadow = '0 18px 60px rgba(0,0,0,0.28)';

    // animate: rotate from 0 to -180deg
    flipRight.animate([
      { transform: 'rotateY(0deg)' },
      { transform: 'rotateY(-180deg)' }
    ], {
      duration: 700,
      easing: 'cubic-bezier(.25,.8,.25,1)',
      fill: 'forwards'
    }).onfinish = () => {
      currentSpread++;
      renderSpread(currentSpread);
      isAnimating = false;
    };
  }

  // animate backward: emulate left page flipping back
  function turnPrev() {
    if (isAnimating) return;
    if (currentSpread <= 0) return;
    isAnimating = true;

    const viewerSpread = viewer.querySelector('.flip-spread');
    const flipLeft = viewerSpread.querySelector('.flip-left');
    const flipFace = flipLeft.querySelector('.page-face');

    flipLeft.style.transformOrigin = 'right center';
    flipLeft.style.transform = 'rotateY(0deg)';
    flipLeft.style.right = '50%';
    flipFace.style.boxShadow = '0 18px 60px rgba(0,0,0,0.28)';

    // animate rotate from 0 to +180deg (flip back)
    flipLeft.animate([
      { transform: 'rotateY(0deg)' },
      { transform: 'rotateY(180deg)' }
    ], {
      duration: 700,
      easing: 'cubic-bezier(.25,.8,.25,1)',
      fill: 'forwards'
    }).onfinish = () => {
      currentSpread--;
      renderSpread(currentSpread);
      isAnimating = false;
    };
  }

  // keyboard navigation
  function keyHandler(e) {
    if (e.key === 'ArrowRight') turnNext();
    if (e.key === 'ArrowLeft') turnPrev();
    if (e.key === 'Escape' && isZoomed) toggleZoom();
  }

  // zoom toggle (simple scale)
  function toggleZoom() {
    const stage = document.getElementById('flipbook-stage');
    if (!stage) return;
    isZoomed = !isZoomed;
    stage.style.transform = isZoomed ? 'scale(1.15)' : '';
    stage.style.transition = 'transform 260ms';
  }

  // touch swipe short handlers (left/right)
  let touchStartX = 0;
  function touchStart(e) { touchStartX = e.touches ? e.touches[0].clientX : e.clientX; }
  function touchEnd(e) {
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = endX - touchStartX;
    if (Math.abs(diff) < 40) return;
    if (diff < 0) turnNext(); else turnPrev();
  }

  // events
  prevBtn.addEventListener('click', turnPrev);
  nextBtn.addEventListener('click', turnNext);
  document.addEventListener('keydown', keyHandler);
  viewer.addEventListener('touchstart', touchStart);
  viewer.addEventListener('touchend', touchEnd);
  viewer.addEventListener('mousedown', touchStart);
  viewer.addEventListener('mouseup', touchEnd);

  zoomBtn && zoomBtn.addEventListener('click', toggleZoom);

  // initial render and simple autoplay demo (optional)
  renderSpread(currentSpread);

  // Optional: autoplay (comment out if not desired)
  // let autoplay = false, apTimer;
  // if (autoplay) apTimer = setInterval(()=>{ if (!isAnimating) { if (currentSpread < spreads.length-1) turnNext(); else currentSpread= -1 }}, 5500);

})();
