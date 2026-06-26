import confetti from 'canvas-confetti';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function themeAccentColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  const colors = [
    style.getPropertyValue('--theme-accent-400').trim(),
    style.getPropertyValue('--theme-accent-500').trim(),
    style.getPropertyValue('--theme-accent-600').trim(),
    '#ffffff',
    '#fbbf24',
  ];
  return colors.filter(Boolean);
}

/** Brief confetti burst after a successful practice check-in. */
export function celebrateCheckIn() {
  if (prefersReducedMotion()) return;

  const colors = themeAccentColors();
  const end = Date.now() + 700;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      ticks: 200,
      gravity: 1.1,
      scalar: 0.9,
      drift: 0,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      ticks: 200,
      gravity: 1.1,
      scalar: 0.9,
      drift: 0,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.55 },
    colors,
    ticks: 220,
  });

  frame();
}
