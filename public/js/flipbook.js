// public/js/flipbook.js
(function(){
  const pages = window.FLIPBOOK_PAGES || [];
  if (!pages.length) { console.warn('[FLIPBOOK] No pages provided.'); return; }

  const viewer = document.getElementById('flipbook-viewer');
  const prevBtn = document.getElementById('flip-prev');
  const nextBtn = document.getElementById('flip-next');
  const pagenoEl = document.getElementById('flip-pageno');
  const downloadEl = document.getElementById('flip-download');
  const zoomBtn = document.getElementById('flip-zoom');

  // build spreads: pair pages into spreads (left,right)
  const spreads = [];
  for (let i = 0; i < pages.length; i += 2) spreads.push({ left: pages[i] || null, right: pages[i+1] || null });

  let current = 0;
  let animating = false;
  let zoomed = false;

  function render(index) {
    viewer.innerHTML = '';
    const spread = spreads[index];
    const container = document.createElement('div');
    container.className = 'flip-spread';

    // left half
    const leftHalf = document.createElement('div');
    leftHalf.className = 'flip-half';
    const leftBox = document.createElement('div');
    leftBox.className = 'page-box';
    if (spread.left) {
      const img = document.createElement('img'); img.src = spread.left; img.alt = 'Left page'; leftBox.appendChild(img);
    }
    leftHalf.appendChild(leftBox);
    container.appendChild(leftHalf);

    // right half
    const rightHalf = document.createElement('div');
    rightHalf.className = 'flip-half';
    const rightBox = document.createElement('div');
    rightBox.className = 'page-box';
    if (spread.right) {
      const img2 = document.createElement('img'); img2.src = spread.right; img2.alt = 'Right page'; rightBox.appendChild(img2);
    }
    rightHalf.appendChild(rightBox);
    container.appendChild(rightHalf);

    // flip layers (invisible until used)
    const flipLeft = document.createElement('div'); flipLeft.className = 'flip-layer left';
    const flipRight = document.createElement('div'); flipRight.className = 'flip-layer right';
    const flImg = document.createElement('div'); flImg.className = 'page-box'; flipLeft.appendChild(flImg);
    const frImg = document.createElement('div'); frImg.className = 'page-box'; flipRight.appendChild(frImg);
    container.appendChild(flipLeft);
    container.appendChild(flipRight);

    // gradient overlay for shadow
    const grad = document.createElement('div'); grad.className = 'flip-gradient';
    container.appendChild(grad);

    viewer.appendChild(container);

    // update UI
    pagenoEl.textContent = `${index+1} / ${spreads.length}`;
    const downloadTarget = spread.right || spread.left || '#';
    downloadEl.href = downloadTarget;
    downloadEl.setAttribute('download', `brochure-spread-${index+1}.jpg`);
  }

  // simple animation functions
  function animateNext() {
    if (animating || current >= spreads.length-1) return;
    animating = true;
    const spreadWrap = viewer.querySelector('.flip-spread');
    const flipRight = spreadWrap.querySelector('.flip-layer.right');
    const frontBox = flipRight.querySelector('.page-box');

    // set flip image to current left (will appear to flip away)
    const curLeft = spreads[current].left;
    if (curLeft) {
      frontBox.innerHTML = `<img src="${curLeft}" alt="flip">`;
    } else {
      frontBox.innerHTML = '';
    }

    // initial setup
    flipRight.style.transition = 'transform 700ms cubic-bezier(.25,.9,.25,1)';
    flipRight.style.transformOrigin = 'left center';
    flipRight.style.transform = 'rotateY(0deg)';
    flipRight.style.zIndex = 90;
    flipRight.style.pointerEvents = 'none';

    // shadow show
    const grad = spreadWrap.querySelector('.flip-gradient');
    grad.style.opacity = '1';

    // animate
    requestAnimationFrame(() => {
      flipRight.style.transform = 'rotateY(-180deg)';
    });

    flipRight.addEventListener('transitionend', function handler() {
      flipRight.removeEventListener('transitionend', handler);
      current++;
      render(current);
      animating = false;
      grad.style.opacity = '0';
    });
  }

  function animatePrev() {
    if (animating || current <= 0) return;
    animating = true;
    const spreadWrap = viewer.querySelector('.flip-spread');
    const flipLeft = spreadWrap.querySelector('.flip-layer.left');
    const frontBox = flipLeft.querySelector('.page-box');

    const curRight = spreads[current].right;
    if (curRight) {
      frontBox.innerHTML = `<img src="${curRight}" alt="flip">`;
    } else frontBox.innerHTML = '';

    flipLeft.style.transition = 'transform 700ms cubic-bezier(.25,.9,.25,1)';
    flipLeft.style.transformOrigin = 'right center';
    flipLeft.style.transform = 'rotateY(0deg)';
    flipLeft.style.zIndex = 90;
    flipLeft.style.pointerEvents = 'none';

    const grad = spreadWrap.querySelector('.flip-gradient');
    grad.style.opacity = '1';

    requestAnimationFrame(() => {
      flipLeft.style.transform = 'rotateY(180deg)';
    });

    flipLeft.addEventListener('transitionend', function handler(){
      flipLeft.removeEventListener('transitionend', handler);
      current--;
      render(current);
      animating = false;
      grad.style.opacity = '0';
    });
  }

  // pointer drag to control flip progress
  function enableDrag() {
    const viewerEl = viewer;
    let dragging = false;
    let startX = 0;
    let targetLayer = null;
    let maxWidth = 0;

    function down(e) {
      if (animating) return;
      dragging = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      maxWidth = viewerEl.getBoundingClientRect().width;
      // decide which half user started on
      const rect = viewerEl.getBoundingClientRect();
      const relativeX = startX - rect.left;
      if (relativeX > rect.width/2) {
        // started on right half -> interactive next flip
        targetLayer = viewerEl.querySelector('.flip-layer.right');
        const curLeft = spreads[current].left;
        targetLayer.querySelector('.page-box').innerHTML = curLeft ? `<img src="${curLeft}" alt="flip">` : '';
        targetLayer.style.zIndex = 120;
        targetLayer.style.transition = 'none';
      } else {
        // started on left half -> interactive prev flip
        targetLayer = viewerEl.querySelector('.flip-layer.left');
        const curRight = spreads[current].right;
        targetLayer.querySelector('.page-box').innerHTML = curRight ? `<img src="${curRight}" alt="flip">` : '';
        targetLayer.style.zIndex = 120;
        targetLayer.style.transition = 'none';
      }
      // show shadow
      const g = viewerEl.querySelector('.flip-gradient'); if (g) g.style.opacity = '1';
    }

    function move(e) {
      if (!dragging || !targetLayer) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const rect = viewerEl.getBoundingClientRect();
      const rel = (x - rect.left) / rect.width; // 0..1
      // compute rotate based on rel and which side
      if (targetLayer.classList.contains('right')) {
        // when dragging left -> rotate towards -180
        const p = Math.max(0, Math.min(1, 1 - ((x - rect.left) / (rect.width/2))));
        const deg = -p * 180;
        targetLayer.style.transform = `rotateY(${deg}deg)`;
      } else {
        // left layer: dragging right -> rotate towards +180
        const p = Math.max(0, Math.min(1, ((x - rect.left) / (rect.width/2))));
        const deg = p * 180;
        targetLayer.style.transform = `rotateY(${deg}deg)`;
      }
    }

    function up(e) {
      if (!dragging || !targetLayer) { dragging = false; targetLayer = null; return; }
      const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      const rect = viewerEl.getBoundingClientRect();
      const halfway = rect.left + rect.width/4; // threshold
      // determine whether to complete flip
      if (targetLayer.classList.contains('right')) {
        // if we dragged left enough (x < center) -> complete next
        if (x < rect.left + rect.width * 0.4) {
          // finish
          targetLayer.style.transition = 'transform 300ms cubic-bezier(.2,.9,.25,1)';
          targetLayer.style.transform = 'rotateY(-180deg)';
          targetLayer.addEventListener('transitionend', function h(){
            targetLayer.removeEventListener('transitionend', h);
            current = Math.min(spreads.length-1, current+1);
            render(current);
          });
        } else {
          // revert
          targetLayer.style.transition = 'transform 260ms';
          targetLayer.style.transform = 'rotateY(0deg)';
        }
      } else {
        if (x > rect.left + rect.width * 0.6) {
          targetLayer.style.transition = 'transform 300ms cubic-bezier(.2,.9,.25,1)';
          targetLayer.style.transform = 'rotateY(180deg)';
          targetLayer.addEventListener('transitionend', function h(){
            targetLayer.removeEventListener('transitionend', h);
            current = Math.max(0, current-1);
            render(current);
          });
        } else {
          targetLayer.style.transition = 'transform 260ms';
          targetLayer.style.transform = 'rotateY(0deg)';
        }
      }
      // hide shadow
      const g = viewerEl.querySelector('.flip-gradient'); if (g) g.style.opacity = '0';
      dragging = false; targetLayer = null;
    }

    viewerEl.addEventListener('pointerdown', down, {passive:true});
    viewerEl.addEventListener('pointermove', move, {passive:true});
    viewerEl.addEventListener('pointerup', up, {passive:true});
    viewerEl.addEventListener('pointercancel', up, {passive:true});
    // touch fallback (some browsers)
    viewerEl.addEventListener('touchstart', down, {passive:true});
    viewerEl.addEventListener('touchmove', move, {passive:true});
    viewerEl.addEventListener('touchend', up, {passive:true});
  }

  // keyboard
  function enableKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { animateNext(); }
      if (e.key === 'ArrowLeft') { animatePrev(); }
      if (e.key === 'Escape' && zoomed) { toggleZoom(); }
    });
  }

  // zoom
  function toggleZoom() {
    const stage = document.getElementById('flipbook-stage');
    zoomed = !zoomed;
    stage.style.transform = zoomed ? 'scale(1.12)' : '';
    stage.style.transition = 'transform 220ms';
  }

  // initial simple controls
  function animateNext() {
    if (animating || current >= spreads.length-1) return;
    animating = true;
    const spreadWrap = viewer.querySelector('.flip-spread');
    const flipRight = spreadWrap.querySelector('.flip-layer.right');
    const frontBox = flipRight.querySelector('.page-box');
    const curLeft = spreads[current].left;
    if (curLeft) frontBox.innerHTML = `<img src="${curLeft}" alt="flip">`; else frontBox.innerHTML='';
    flipRight.style.transition = 'transform 700ms cubic-bezier(.2,.9,.25,1)';
    flipRight.style.transformOrigin = 'left center';
    flipRight.style.transform = 'rotateY(-180deg)';
    const grad = spreadWrap.querySelector('.flip-gradient'); if (grad) grad.style.opacity = '1';
    flipRight.addEventListener('transitionend', function h(){
      flipRight.removeEventListener('transitionend', h);
      current = Math.min(spreads.length-1, current+1);
      render(current);
      animating = false;
      if (grad) grad.style.opacity = '0';
    });
  }
  function animatePrev() {
    if (animating || current <= 0) return;
    animating = true;
    const spreadWrap = viewer.querySelector('.flip-spread');
    const flipLeft = spreadWrap.querySelector('.flip-layer.left');
    const frontBox = flipLeft.querySelector('.page-box');
    const curRight = spreads[current].right;
    if (curRight) frontBox.innerHTML = `<img src="${curRight}" alt="flip">`; else frontBox.innerHTML='';
    flipLeft.style.transition = 'transform 700ms cubic-bezier(.2,.9,.25,1)';
    flipLeft.style.transformOrigin = 'right center';
    flipLeft.style.transform = 'rotateY(180deg)';
    const grad = spreadWrap.querySelector('.flip-gradient'); if (grad) grad.style.opacity = '1';
    flipLeft.addEventListener('transitionend', function h(){
      flipLeft.removeEventListener('transitionend', h);
      current = Math.max(0, current-1);
      render(current);
      animating = false;
      if (grad) grad.style.opacity = '0';
    });
  }

  // wire up events
  function wire() {
    prevBtn && prevBtn.addEventListener('click', () => { animatePrev(); });
    nextBtn && nextBtn.addEventListener('click', () => { animateNext(); });
    zoomBtn && zoomBtn.addEventListener('click', toggleZoom);
    enableDrag(); enableKeyboard();
  }

  // start
  render(current);
  wire();

})();
