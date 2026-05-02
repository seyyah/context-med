/**
 * IdleManager.js - Kiosk Kullanıcı Hareketsizliği Yönetimi
 * 60 saniye hareketsizlikte sistemi sıfırlar.
 */

export const IdleManager = {
  timeout: 60000, // 60 saniye
  timer: null,
  onReset: null,

  init: (onResetCallback) => {
    IdleManager.onReset = onResetCallback;
    IdleManager.startTimer();

    // Kullanıcı etkileşimlerini dinle
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => {
      document.addEventListener(name, IdleManager.resetTimer, true);
    });
  },

  startTimer: () => {
    IdleManager.timer = setTimeout(() => {
      console.log("🕒 Idle timeout reached. Resetting kiosk...");
      if (IdleManager.onReset) IdleManager.onReset();
    }, IdleManager.timeout);
  },

  resetTimer: () => {
    clearTimeout(IdleManager.timer);
    IdleManager.startTimer();
  },

  stop: () => {
    clearTimeout(IdleManager.timer);
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => {
      document.removeEventListener(name, IdleManager.resetTimer, true);
    });
  }
};

export default IdleManager;
