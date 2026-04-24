// Viewport, Orientation, Touch Rescue, and Startup Bindings

// iOS Safari standalone can report `dvh` too early on launch.
// Keep `--app-vh` synced to the real visible viewport height.
(function syncAppVh(){
  function update(){
    const h = window.innerHeight;
    if(h > 0) document.documentElement.style.setProperty('--app-vh', h + 'px');
  }
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => setTimeout(update, 120));
  window.addEventListener('pageshow', update);
  window.addEventListener('load', update);
  document.addEventListener('visibilitychange', update);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', update);
  }
  // Catch iOS late viewport settle after first paint.
  setTimeout(update, 60);
  setTimeout(update, 250);
  setTimeout(update, 800);
})();

let _initialBootRevealDone = false;
function revealInitialBootUI(){
  if(_initialBootRevealDone) return;
  _initialBootRevealDone = true;
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      if(document.body) document.body.classList.remove('startup-no-anim');
    });
  });
}

function tryLockPortraitOrientation(){
  const so = screen && screen.orientation;
  if(!so || typeof so.lock !== 'function') return;
  so.lock('portrait').catch(()=>{});
}

function updateOrientationLockState(){
  if(!document.body) return;
  const mobileLike = window.matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
  const isLandscape = window.matchMedia('(orientation: landscape)').matches;
  document.body.classList.toggle('landscape-block', mobileLike && isLandscape);
}

window.addEventListener('DOMContentLoaded', function(){
  initTheme();
  _loadShakePermission();
  applyRollMode(getRollMode());
  initFloatingEntities();
  const ua = navigator.userAgent || '';
  if(/iPhone/i.test(ua)) document.documentElement.classList.add('ios-iphone');
  updateOrientationLockState();
  tryLockPortraitOrientation();
  window.addEventListener('resize', updateOrientationLockState);
  window.addEventListener('orientationchange', () => setTimeout(updateOrientationLockState, 80));
  window.addEventListener('pageshow', updateOrientationLockState);
  document.addEventListener('visibilitychange', ()=>{
    if(document.visibilityState === 'visible'){
      updateOrientationLockState();
      tryLockPortraitOrientation();
    }
  });
  document.addEventListener('touchstart', tryLockPortraitOrientation, { passive:true, once:true });
  document.addEventListener('click', tryLockPortraitOrientation, { passive:true, once:true });
  // Shot-button tap rescue: on iOS Safari a click can be dropped when
  // ROLL ↔ NEXT SHOT swap happens during a touch, leaving a visible button
  // unresponsive. Delegate at the .roll-col level and fire the currently
  // visible + enabled button programmatically. Handlers are idempotent
  // (guarded by S.rolling / S.holeDone / _rerollChoiceActive).
  (function initShotBtnTapRescue(){
    let downX=0, downY=0, downT=0, tracking=false;
    let lastFire=0;
    function getVisibleBtn(rc){
      if(!rc) return null;
      const btns = rc.querySelectorAll('button');
      for(const b of btns){
        if(b.classList.contains('shot-btn-visible') && !b.disabled){
          const cs = getComputedStyle(b);
          if(cs.visibility !== 'hidden' && cs.display !== 'none') return b;
        }
      }
      return null;
    }
    document.addEventListener('pointerdown', (e) => {
      const rc = e.target && e.target.closest ? e.target.closest('.roll-col') : null;
      if(!rc){ tracking=false; return; }
      downX=e.clientX; downY=e.clientY; downT=Date.now(); tracking=true;
    }, true);
    document.addEventListener('pointerup', (e) => {
      if(!tracking) return;
      tracking=false;
      const dt = Date.now() - downT;
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if(dt > 800 || dx > 18 || dy > 18) return;
      const rc = e.target && e.target.closest ? e.target.closest('.roll-col') : document.querySelector('.roll-col');
      const btn = getVisibleBtn(rc);
      if(!btn) return;
      setTimeout(() => {
        const now = Date.now();
        if(now - lastFire < 220) return;
        lastFire = now;
        try { btn.click(); } catch(err) {}
      }, 10);
    }, true);
    document.addEventListener('click', (e) => {
      const rc = e.target && e.target.closest ? e.target.closest('.roll-col') : null;
      if(!rc) return;
      lastFire = Date.now();
    }, true);
  })();
  // Edge-swipe back gesture (iOS-native feel). Finds the visible back button and taps it.
  (function initEdgeSwipe(){
    let sx=0, sy=0, sT=0, tracking=false;
    const EDGE = 28;            // start zone from left edge (px)
    const MIN_DX = 70;          // min horizontal travel
    const MAX_DY = 60;          // max vertical drift
    const MAX_T = 600;          // max duration (ms)
    function findBackBtn(){
      // Priority: visible modal back buttons, then current screen back buttons
      const selectors=['.setup-back-btn:not([disabled])','.profile-hub-back:not([disabled])','#wcInfoBackBtn','.modal-back-btn'];
      for(const sel of selectors){
        const els=document.querySelectorAll(sel);
        for(const el of els){
          const s=getComputedStyle(el);
          if(s.display==='none'||s.visibility==='hidden'||el.style.pointerEvents==='none') continue;
          const r=el.getBoundingClientRect();
          if(r.width===0||r.height===0) continue;
          return el;
        }
      }
      return null;
    }
    document.addEventListener('touchstart', e=>{
      if(!e.touches[0]) return;
      const t=e.touches[0];
      // Ignore if touch starts on an interactive scroll area mid-screen
      if(t.clientX > EDGE) { tracking=false; return; }
      sx=t.clientX; sy=t.clientY; sT=Date.now(); tracking=true;
    }, {passive:true});
    document.addEventListener('touchend', e=>{
      if(!tracking) return;
      tracking=false;
      const t=e.changedTouches[0]; if(!t) return;
      const dx=t.clientX-sx, dy=Math.abs(t.clientY-sy), dt=Date.now()-sT;
      if(dx>MIN_DX && dy<MAX_DY && dt<MAX_T){
        const btn=findBackBtn();
        if(btn){ _setNavDir('back'); _hapticClick(); btn.click(); }
      }
    }, {passive:true});
  })();
  // Double-tap zoom prevention on interactive controls (iOS Safari/WKWebView)
  let _lastTapTime=0;
  document.addEventListener('touchend', e=>{
    const now=Date.now();
    if(now-_lastTapTime<300){
      const tgt=e.target;
      if(tgt && tgt.closest('button, .cell, .dice, .menu-btn-play, .menu-btn-sec, .setup-back-btn, .ov-btn, .tee-off-btn, .vs-turn-btn')){
        e.preventDefault();
      }
    }
    _lastTapTime=now;
  }, {passive:false});
  const oi=document.getElementById('onboardInput');
  if(oi){
    oi.addEventListener('keydown',e=>{if(e.key==='Enter')createFirstProfile();});
    oi.addEventListener('focus', ()=>{
      _onboardFocusLockCount++;
      lockOnboardPosition();
    });
    oi.addEventListener('blur', ()=>{
      _onboardFocusLockCount = Math.max(0, _onboardFocusLockCount - 1);
      if(_onboardFocusLockCount === 0){
        setTimeout(()=>{ if(_onboardFocusLockCount === 0) unlockOnboardPosition(); }, 120);
      }
    });
  }
  const pni=document.getElementById('profileNewInput');
  if(pni) pni.addEventListener('keydown',e=>{if(e.key==='Enter')saveNewProfile();});
  const hm=document.getElementById('histModal');
  if(hm) hm.addEventListener('click',function(e){if(e.target===this)closeHist();});
  const pm=document.getElementById('profileModal');
  if(pm) pm.addEventListener('click',function(e){if(e.target===this)closeProfileModal();});
  const phm=document.getElementById('profileHubModal');
  if(phm) phm.addEventListener('click',function(e){if(e.target===this)closeProfileModal();});
  const xrm=document.getElementById('xpRewardModal');
  if(xrm) xrm.addEventListener('click',function(e){if(e.target===this)closeXpRewardModal();});
  const sm=document.getElementById('summaryModal');
  if(sm) sm.addEventListener('click',function(e){if(e.target===this)closeSummary();});
  const stm=document.getElementById('settingsModal');
  if(stm) stm.addEventListener('click',function(e){if(e.target===this)closeSettings();});
  const epm=document.getElementById('editProfileModal');
  if(epm) epm.addEventListener('click',function(e){if(e.target===this)closeEditProfile();});
  const gmm=document.getElementById('gameMenuModal');
  if(gmm) gmm.addEventListener('click',function(e){if(e.target===this)resumeGameScreenMenu();});
  bindNameSanitizer('onboardInput',12);
  bindNameSanitizer('profileNewInput',10);
  bindNameSanitizer('editProfileName',10);
  bindNameSanitizer('vs1Name',10);
  bindNameSanitizer('vs2Name',10);
  autoLoadProfile();
  setTimeout(revealInitialBootUI, 120);
  setTimeout(revealInitialBootUI, 280);
});
