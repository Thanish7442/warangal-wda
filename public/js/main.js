// public/js/main.js
document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  const btn = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('mobileNav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      nav.classList.toggle('hidden');
    });
  }

  // Tiny testimonial slider (auto)
  const slides = Array.from(document.querySelectorAll('.testimonial'));
  if (slides.length > 1) {
    let idx = 0;
    slides.forEach((s, i) => {
      s.style.display = i === 0 ? 'block' : 'none';
    });
    setInterval(() => {
      slides[idx].style.display = 'none';
      idx = (idx + 1) % slides.length;
      slides[idx].style.display = 'block';
    }, 4500);
  }
});
