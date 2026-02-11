// timer-worker.js - MOBILE OPTIMIZED TIMER WORKER
let timerId = null;
let remainingTime = 0;
let startTime = 0;
let isRunning = false;

self.addEventListener('message', (e) => {
  const { action, data } = e.data;
  
  switch (action) {
    case 'START':
      remainingTime = data.timeLeft;
      startTime = Date.now();
      isRunning = true;
      
      // Clear existing timer
      if (timerId) clearInterval(timerId);
      
      // Gunakan interval lebih pendek untuk akurasi mobile
      timerId = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const newRemaining = remainingTime - elapsedSeconds;
        
        if (newRemaining <= 0) {
          clearInterval(timerId);
          timerId = null;
          isRunning = false;
          
          // Kirim event completion
          self.postMessage({ 
            event: 'COMPLETE',
            timeLeft: 0,
            elapsed: elapsedSeconds
          });
        } else {
          // Kirim update setiap detik
          if (elapsedSeconds % 1 === 0) {
            self.postMessage({ 
              event: 'TICK',
              timeLeft: newRemaining,
              elapsed: elapsedSeconds,
              timestamp: now
            });
          }
        }
      }, 100); // Check setiap 100ms untuk akurasi
      break;
      
    case 'PAUSE':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      isRunning = false;
      
      // Hitung waktu yang tersisa
      if (startTime > 0) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        remainingTime = Math.max(0, remainingTime - elapsed);
        startTime = 0;
      }
      break;
      
    case 'RESET':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      isRunning = false;
      remainingTime = data.timeLeft;
      startTime = 0;
      
      self.postMessage({ 
        event: 'RESET',
        timeLeft: remainingTime
      });
      break;
      
    case 'GET_STATUS':
      self.postMessage({
        event: 'STATUS',
        isRunning,
        timeLeft: remainingTime,
        startTime,
        remainingTime
      });
      break;
  }
});

// Handle error
self.addEventListener('error', (e) => {
  console.error('Worker error:', e);
  self.postMessage({
    event: 'ERROR',
    error: e.message
  });
});

// Handle jika worker di-terminate
self.addEventListener('unhandledrejection', (e) => {
  console.error('Worker unhandled rejection:', e);
});