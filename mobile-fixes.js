// mobile-fixes.js - Mobile-specific optimizations
(function() {
  'use strict';
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  console.log(`Mobile Detection: ${isMobile ? 'Yes' : 'No'}, iOS: ${isIOS ? 'Yes' : 'No'}, Safari: ${isSafari ? 'Yes' : 'No'}`);
  
  // 1. FIX TIMER BUTTONS FOR TOUCH
  if (isMobile) {
    // Increase touch target size
    document.querySelectorAll('.timer-controls button, .music-controls button').forEach(btn => {
      btn.style.minHeight = '48px';
      btn.style.minWidth = '48px';
      btn.style.padding = '12px 20px';
    });
    
    // Prevent zoom on double tap
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Add touch feedback
    document.addEventListener('touchstart', () => {}, { passive: true });
  }
  
  // 2. FIX IOS SAFARI SPECIFIC
  if (isIOS) {
    // Fix for iOS elastic scroll
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Fix 100vh issue on iOS
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Fix audio on iOS
    const unlockAudio = () => {
      const audio = document.getElementById('audio-player');
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(e => console.log('iOS audio unlock:', e));
      }
    };
    
    // Unlock audio on first touch
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('touchend', unlockAudio, { once: true });
  }
  
  // 3. PREVENT DOUBLE TAP ZOOM ON BUTTONS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
  
  // 4. FIX TIMER ACCURACY ON MOBILE
  if (isMobile) {
    // Use performance.now() for better accuracy
    let timerStartTime = 0;
    let timerRemaining = 0;
    
    function startAccurateTimer(duration, callback) {
      timerStartTime = performance.now();
      timerRemaining = duration;
      
      function tick() {
        const elapsed = (performance.now() - timerStartTime) / 1000;
        timerRemaining = duration - elapsed;
        
        if (timerRemaining <= 0) {
          callback();
          return;
        }
        
        requestAnimationFrame(tick);
      }
      
      requestAnimationFrame(tick);
    }
  }
  
  // 5. BETTER ERROR HANDLING FOR MOBILE
  window.addEventListener('error', (e) => {
    console.error('Mobile Error:', e.error);
    
    // Show user-friendly error
    if (isMobile && e.error.message.includes('audio') || e.error.message.includes('play')) {
      showMobileAlert('Audio Error', 'Please tap the screen first to enable audio');
    }
  });
  
  function showMobileAlert(title, message) {
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      left: 10px;
      right: 10px;
      background: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 8px;
      z-index: 9999;
      text-align: center;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    alert.innerHTML = `<strong>${title}</strong><br>${message}`;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
  }
  
  console.log('Mobile fixes applied');
})();