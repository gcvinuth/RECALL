// modules/haptics.js
export const Haptics = {
  vibrate(pattern) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration failed', e);
      }
    }
  },
  
  tap() {
    this.vibrate(10);
  },
  
  success() {
    this.vibrate([15, 30, 15]);
  },
  
  error() {
    this.vibrate([50, 50, 50, 50]);
  },
  
  recordingStart() {
    this.vibrate([20]);
  },
  
  recordingStop() {
    this.vibrate([20, 50, 20]);
  }
};
