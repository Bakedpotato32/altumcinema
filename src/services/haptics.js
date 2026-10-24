export const triggerHaptic = (type = 'selection') => {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  switch (type) {
    case 'selection':
    case 'light':
      navigator.vibrate(12);
      break;
    case 'medium':
      navigator.vibrate(28);
      break;
    case 'heavy':
      navigator.vibrate(45);
      break;
    case 'success':
      navigator.vibrate([15, 50, 20]);
      break;
    case 'warning':
      navigator.vibrate([25, 60, 25]);
      break;
    case 'error':
      navigator.vibrate([50, 40, 50]);
      break;
    default:
      navigator.vibrate(15);
  }
};
