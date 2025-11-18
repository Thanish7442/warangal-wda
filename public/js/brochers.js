// public/js/brochures.js
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.brochure-media');
  if (!items.length) return;

  // reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  items.forEach(i => io.observe(i));

  // pointer parallax tilt
  items.forEach(media => {
    const img = media.querySelector('img.brochure-img');
    let raf = null;

    media.addEventListener('pointermove', (ev) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = media.getBoundingClientRect();
        const px = (ev.clientX - rect.left) / rect.width;
        const py = (ev.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 8;
        const rotateX = (0.5 - py) * 8;
        media.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        img.style.transform = `translateZ(0) scale(1.03)`;
      });
    });

    media.addEventListener('pointerleave', () => {
      if (raf) cancelAnimationFrame(raf);
      media.style.transform = '';
      img.style.transform = '';
    });
  });
});
