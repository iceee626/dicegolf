// Preferences, Theme, Roll Mode, and Settings Modal

let _legendVisible=true;
function legendHiddenEnabled(){
  if(TUT.active) return false;
  try{return localStorage.getItem('gg_hide_legend')==='yes';}catch{return false;}
}
function setLegendHiddenEnabled(v){try{localStorage.setItem('gg_hide_legend',v?'yes':'no');}catch{}}
function toggleLegend(){
  if(legendHiddenEnabled()) return;
  _legendVisible=!_legendVisible;
  updateLegendVisibility();
}
function updateLegendVisibility(){
  const el=document.getElementById('legend');
  const btn=document.getElementById('legendToggleBtn');
  const arrow=document.getElementById('legendArrow');
  const hiddenBySetting=legendHiddenEnabled();
  if(btn)btn.style.display=hiddenBySetting?'none':'flex';
  if(el)el.style.display=!hiddenBySetting&&_legendVisible?'grid':'none';
  if(arrow)arrow.textContent=_legendVisible?'▾':'▸';
}
function setLegendPref(v){
  setLegendHiddenEnabled(v);
  updateLegendSettingUI();
  updateLegendVisibility();
}
function updateLegendSettingUI(){
  const el=document.getElementById('zoneLegendToggle');
  if(el)el.classList.toggle('on', legendHiddenEnabled());
}

function gridFocusEnabled(){
  // Feature removed: auto-focus on grid is always off now
  return false;
}
function setGridFocusEnabled(v){try{localStorage.setItem('gg_focus_grid',v?'on':'off');}catch{}}
function setGridFocusPref(v){
  setGridFocusEnabled(v);
  updateGridFocusSettingUI();
}
function updateGridFocusSettingUI(){
  const el=document.getElementById('gridFocusToggle');
  if(el)el.classList.toggle('on', gridFocusEnabled());
}

// ═══════════════════════════════════════
// CELL LABELS SETTING
// ═══════════════════════════════════════
function getCellLabelMode(){try{return localStorage.getItem('gg_celllabels')||'tap';}catch{return 'tap';}}
function setCellLabelMode(m){try{localStorage.setItem('gg_celllabels',m);}catch{}}
function toggleCellLabels(){
  const cur=getCellLabelMode();
  const next=cur==='tap'?'always':'tap';
  setCellLabelMode(next);
  updateCellLabelUI();
  if(S.currentGrid)renderGrid();
}
function updateCellLabelUI(){
  const m=getCellLabelMode();
  const el=document.getElementById('labelsToggle');
  if(el)el.classList.toggle('on', m==='always');
}

function setCellLabelModeDirect(mode){
  setCellLabelMode(mode);
  updateCellLabelUI();
  if(S.currentGrid)renderGrid();
}

// ═══════════════════════════════════════
// ACHIEVEMENTS SYSTEM
// ═══════════════════════════════════════

function getThemeSetting(){
  try{return localStorage.getItem('gg_theme')||'dark';}catch{return 'dark';}
}
function setThemeSetting(v){
  try{localStorage.setItem('gg_theme',v);}catch{}
}
function syncThemeAssets(){
  const isLight = document.body.classList.contains('theme-light');
  const menuLogoSrc = isLight ? 'assets/dice-light-logo.png' : 'assets/dicegolf-logo.png';
  document.querySelectorAll('#menuScreen .menu-logo .brand-logo-img').forEach(img=>{
    if(img.getAttribute('src') !== menuLogoSrc) img.setAttribute('src', menuLogoSrc);
  });
}
function applyTheme(setting){
  const body=document.body;
  body.classList.remove('theme-light','theme-dark');
  if(setting==='light'){
    body.classList.add('theme-light');
  } else if(setting==='dark'){
    body.classList.add('theme-dark'); 
  } else {
    const prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
    if(!prefersDark) body.classList.add('theme-light');
  }
  syncThemeAssets();
}
function _applyThemeWithCrossfade(setting){
  const body=document.body;
  if(!body){
    applyTheme(setting);
    return;
  }
  body.classList.add('theme-swapping');
  requestAnimationFrame(()=>{
    applyTheme(setting);
    setTimeout(()=>body.classList.remove('theme-swapping'),260);
  });
}
function initTheme(){
  applyTheme(getThemeSetting());
  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{
      if(getThemeSetting()==='system') _applyThemeWithCrossfade('system');
    });
  }
}

function getRollMode(){
  try{return localStorage.getItem('gg_rollmode')||'classic';}catch{return 'classic';}
}
function setRollMode(mode){
  try{localStorage.setItem('gg_rollmode',mode);}catch{}
  // If enabling shake and iOS requires explicit permission, request it now.
  // This is called directly from the toggle onclick, so we are inside a user gesture —
  // the only context iOS allows requestPermission() to be called from.
  if(mode==='haptic'
      && typeof DeviceMotionEvent!=='undefined'
      && typeof DeviceMotionEvent.requestPermission==='function'){
    _loadShakePermission();
    if(!_shakePermissionGranted){
      // Show in-app pre-prompt first; the Allow button calls requestPermission()
      // from its own click handler so the user-gesture context is preserved for iOS.
      updateRollModeUI('haptic');
      _showShakePrePrompt();
      return;
    }
  }
  applyRollMode(mode);
  updateRollModeUI(mode);
}
function updateRollModeUI(mode){
  _setToggle('shakeToggle',mode==='haptic');
}

let _shakeLastTime=0, _shakeLastX=0, _shakeLastY=0, _shakeLastZ=0;
let _shakeListener=null;
let _shakePermissionGranted=false;

function _loadShakePermission(){
  // Removed localStorage cache so WebKit/iOS can natively handle its own permission prompts on toggle
  _shakePermissionGranted = false; 
}
function _saveShakePermission(){
  // Removed
}

function applyRollMode(mode){
  if(_shakeListener){
    window.removeEventListener('devicemotion',_shakeListener);
    _shakeListener=null;
  }
  const rollBtn=document.getElementById('rollBtn');
  if(mode==='haptic'){
    if(rollBtn) rollBtn.textContent='ROLL';
    _loadShakePermission();
    if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){
      if(_shakePermissionGranted){
        // Permission was granted in a prior session — start listener directly.
        _startShakeListener();
      }
      // If not granted, setRollMode handles it from the toggle user-gesture context.
    } else if(typeof DeviceMotionEvent!=='undefined'){
      _startShakeListener();
    }
  } else {
    if(rollBtn) rollBtn.textContent='ROLL';
  }
}

function _showShakePrePrompt(){
  const old = document.getElementById('shakePrePrompt');
  if(old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'shakePrePrompt';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,11,15,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:900;display:flex;align-items:flex-end;justify-content:center;padding:0 0 env(safe-area-inset-bottom,0);animation:fadeIn .22s ease;';
  modal.innerHTML = `
    <div style="background:#161c24;border:1px solid var(--border);border-radius:20px 20px 0 0;max-width:460px;width:100%;padding:24px 22px 28px;text-align:center;animation:slideUp .32s cubic-bezier(.34,1.56,.64,1);">
      <div style="width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);margin:0 auto 18px;"></div>
      <div style="font-size:36px;line-height:1;margin-bottom:10px;">📳</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:22px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">SHAKE TO ROLL</div>
      <div style="font-family:'Sen',sans-serif;font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:20px;">DiceGolf needs access to your device motion so you can shake to roll the dice. Tap <b style="color:var(--text);">Allow Motion</b> to continue.</div>
      <div style="display:flex;gap:8px;flex-direction:column;">
        <button id="shakePreAllow" style="background:var(--c-fwy);color:#fff;border:none;border-radius:12px;padding:14px;font-family:'Bebas Neue',cursive;font-size:17px;letter-spacing:2px;cursor:pointer;transition:transform .2s cubic-bezier(.34,1.56,.64,1);">ALLOW MOTION</button>
        <button id="shakePreCancel" style="background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:12px;padding:12px;font-family:'Sen',sans-serif;font-size:12px;letter-spacing:1px;cursor:pointer;">USE TAP TO ROLL</button>
      </div>
    </div>`;
  if(!document.getElementById('shakeSlideUpStyle')){
    const s = document.createElement('style');
    s.id = 'shakeSlideUpStyle';
    s.textContent = '@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(modal);
  const close = () => { modal.style.animation = 'fadeOut .18s ease forwards'; setTimeout(()=>modal.remove(), 180); };
  modal.querySelector('#shakePreCancel').onclick = () => {
    try{localStorage.setItem('gg_rollmode','classic');}catch{}
    updateRollModeUI('classic');
    close();
  };
  modal.querySelector('#shakePreAllow').onclick = () => {
    close();
    if(typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
      DeviceMotionEvent.requestPermission().then(r => {
        if(r === 'granted'){
          _shakePermissionGranted = true;
          _saveShakePermission();
          _startShakeListener();
          try{localStorage.setItem('gg_rollmode','haptic');}catch{}
          updateRollModeUI('haptic');
          if(typeof showWcToast === 'function') showWcToast('📳 Shake mode active!');
        } else {
          try{localStorage.setItem('gg_rollmode','classic');}catch{}
          updateRollModeUI('classic');
          _showShakePermissionDeniedUI();
        }
      }).catch(() => {
        try{localStorage.setItem('gg_rollmode','classic');}catch{}
        updateRollModeUI('classic');
        _showShakePermissionDeniedUI();
      });
    }
  };
}

function _showShakePermissionDeniedUI(){
  // Remove any existing modal first
  const old=document.getElementById('shakeDeniedModal');
  if(old) old.remove();
  const modal=document.createElement('div');
  modal.id='shakeDeniedModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(7,11,15,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .22s ease;';
  modal.innerHTML=`
    <div style="background:#1a1a2e;border:1px solid var(--border);border-radius:18px;max-width:340px;width:100%;padding:22px 22px 18px;text-align:center;animation:popin .34s cubic-bezier(.34,1.56,.64,1);">
      <div style="font-size:38px;line-height:1;margin-bottom:10px;">📳</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:22px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">MOTION ACCESS NEEDED</div>
      <div style="font-family:'Sen',sans-serif;font-size:13px;color:var(--muted);line-height:1.45;margin-bottom:14px;">
        Shake‑to‑roll needs permission to read device motion. You can grant it now, or enable it later in iOS&nbsp;Settings → Safari → Motion&nbsp;&amp;&nbsp;Orientation&nbsp;Access.
      </div>
      <div style="display:flex;gap:8px;flex-direction:column;">
        <button id="shakeDeniedTry" style="background:var(--c-fwy);color:#fff;border:none;border-radius:10px;padding:12px;font-family:'Bebas Neue',cursive;font-size:16px;letter-spacing:2px;cursor:pointer;">TRY AGAIN</button>
        <button id="shakeDeniedClose" style="background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:10px;font-family:'Sen',sans-serif;font-size:12px;letter-spacing:2px;cursor:pointer;">USE TAP TO ROLL</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close=()=>{ modal.style.animation='fadeOut .2s ease forwards'; setTimeout(()=>modal.remove(),200); };
  modal.querySelector('#shakeDeniedClose').onclick=close;
  modal.querySelector('#shakeDeniedTry').onclick=()=>{
    // Must be re-requested from a user gesture — this click counts.
    if(typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function'){
      DeviceMotionEvent.requestPermission().then(r=>{
        if(r==='granted'){
          _shakePermissionGranted=true;
          _saveShakePermission();
          _startShakeListener();
          try{localStorage.setItem('gg_rollmode','haptic');}catch{}
          updateRollModeUI('haptic');
          close();
          if(typeof showWcToast==='function') showWcToast('📳 Shake mode active!');
        } else {
          // Still denied — keep modal up but nudge to Settings
          const sub=modal.querySelector('div[style*="color:var(--muted)"]');
          if(sub) sub.innerHTML='Still blocked. Open iOS&nbsp;Settings → Safari → <b>Motion &amp; Orientation Access</b> and toggle it on, then return here.';
        }
      }).catch(()=>close());
    } else { close(); }
  };
}
function _showShakePermissionBanner(){
  const existing=document.getElementById('shakePermBanner');
  if(existing)existing.remove();
  const banner=document.createElement('div');
  banner.id='shakePermBanner';
  banner.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:1px solid var(--gold);border-radius:12px;padding:12px 18px;z-index:90;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5);max-width:280px;';
  banner.innerHTML=`
    <div style="font-family:'Sen', sans-serif;font-size:10px;color:var(--gold);letter-spacing:2px;margin-bottom:6px;">📳 SHAKE MODE</div>
    <div style="font-family:'Sen', sans-serif;font-size:10px;color:var(--muted);margin-bottom:10px;">Tap to allow motion access</div>
    <button onclick="requestShakePermission()" style="background:var(--c-fwy);color:#fff;border:none;border-radius:8px;padding:9px 20px;font-family:'Bebas Neue',cursive;font-size:15px;letter-spacing:2px;cursor:pointer;width:100%;">ALLOW MOTION</button>
  `;
  document.body.appendChild(banner);
}

function requestShakePermission(){
  const banner=document.getElementById('shakePermBanner');
  DeviceMotionEvent.requestPermission().then(r=>{
    if(r==='granted'){
      _shakePermissionGranted=true;
      _saveShakePermission(); 
      _startShakeListener();
      if(banner)banner.remove();
      showWcToast('📳 Shake mode active!');
    } else {
      if(banner)banner.innerHTML='<div style="font-family:Sen,sans-serif;font-size:10px;color:#e05252;padding:8px;">Motion access denied. Go to Settings → Safari → Motion & Orientation Access to enable.</div>';
      setTimeout(()=>{if(banner)banner.remove();},5000);
    }
  }).catch(()=>{
    if(banner)banner.remove();
  });
}

function _startShakeListener(){
  const SHAKE_THRESHOLD=15; 
  const SHAKE_COOLDOWN=600;
  _shakeListener=function(e){
    const now=Date.now();
    if(now-_shakeLastTime<SHAKE_COOLDOWN)return;
    const acc=e.accelerationIncludingGravity||e.acceleration;
    if(!acc)return;
    const dx=Math.abs((acc.x||0)-_shakeLastX);
    const dy=Math.abs((acc.y||0)-_shakeLastY);
    const dz=Math.abs((acc.z||0)-_shakeLastZ);
    _shakeLastX=acc.x||0;_shakeLastY=acc.y||0;_shakeLastZ=acc.z||0;
    if(dx+dy+dz>SHAKE_THRESHOLD){
      _shakeLastTime=now;
      const hioOverlay=document.getElementById('hioOverlay');
      const hioBtn=document.getElementById('hioRollBtn');
      if(hioOverlay&&hioOverlay.classList.contains('show')&&hioBtn&&!hioBtn.disabled){
        doHioRoll();
        return;
      }
      if(!S.rolling&&!S.holeDone&&isShotBtnShown('rollBtn')){
        const profiles=loadProfiles();
        const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
        if(profiles[idx]){profiles[idx].shakeRolls=(profiles[idx].shakeRolls||0)+1;saveProfiles(profiles);}
        doRoll();
      }
    }
  };
  window.addEventListener('devicemotion',_shakeListener,{passive:true});
  let _motionVerified=false;
  const _motionCheck=window.addEventListener('devicemotion',()=>{
    _motionVerified=true;
    window.removeEventListener('devicemotion',_motionCheck);
  },{once:true,passive:true});
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&getRollMode()==='haptic'&&_shakePermissionGranted&&!_shakeListener){
    _startShakeListener();
  }
});

function maybeShowShakeBanner(){
  // No-op: permission is now requested inline from the toggle user-gesture, no banner needed.
}

// ═══════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════
function toggleVibSetting(){
  const nowOn=!vibEnabled();
  setVibEnabled(nowOn);
  updateSettingsUI();
  if(nowOn){
    if(navigator.vibrate){
      navigator.vibrate([40,30,40]);
    } else {
      showWcToast('📳 Vibration not supported on this device');
    }
  }
}
function setVibPref(on){setVibEnabled(on);updateSettingsUI();}
function setSoundPref(on){setSoundEnabled(on);updateSettingsUI();}
function setWcPref(on){setWcEnabled(on);updateSettingsUI();}

function _setToggle(id,isOn){
  const el=document.getElementById(id);
  if(el)el.classList.toggle('on',isOn);
}
function updateSettingsUI(){
  _setToggle('soundToggle',soundEnabled());
  _setToggle('vibToggle',vibEnabled());
  _setToggle('wcToggle',wcEnabled());
  _setToggle('shakeToggle',getRollMode()==='haptic');
  updateMetricsUI();
  updateCellLabelUI();
  updateGridFocusSettingUI();
  updateLegendSettingUI();
  updateLegendVisibility();
  
  const _appDisp = document.getElementById('mainApp').style.display;
  const isGameActive = _appDisp && _appDisp !== 'none';
  
  const wcToggle = document.getElementById('wcToggle');
  if (wcToggle) {
      if (isGameActive || hasSavedGame()) {
          wcToggle.style.opacity = '0.4';
          wcToggle.style.pointerEvents = 'none';
      } else {
          wcToggle.style.opacity = '1';
          wcToggle.style.pointerEvents = 'auto';
      }
  }
  
  const tutRow = document.getElementById('settingsTutorialRow');
  if (tutRow) {
      tutRow.style.display = isGameActive ? 'none' : 'flex';
  }
}

function openSettings(fromGame){
  updateSettingsUI();
  const theme=getThemeSetting();
  ['dark','light','system'].forEach(t=>{
    const b=document.getElementById('themeBtn-'+t);
    if(b){
      b.style.background=theme===t?'var(--c-fwy)':'rgba(255,255,255,.08)';
      b.style.borderColor=theme===t?'var(--c-fwyl)':'var(--border)';
      b.style.color=theme===t?'#fff':'var(--muted)';
    }
  });
  // Hide the TUTORIAL header only when opened from the gamescreen gear icon
  const tutHdr=document.getElementById('settingsTutorialHdr');
  if(tutHdr) tutHdr.style.display = fromGame ? 'none' : '';
  document.getElementById('settingsModal').classList.add('show');
}
function _closeProfileLikeModal(id, afterClose){
  const modal=document.getElementById(id);
  if(!modal){
    if(typeof afterClose==='function') afterClose();
    return;
  }
  modal.classList.remove('show');
  if(typeof afterClose==='function'){
    setTimeout(()=>afterClose(),220);
  }
}
function setTheme(t){
  setThemeSetting(t);
  _applyThemeWithCrossfade(t);
  ['dark','light','system'].forEach(id=>{
    const b=document.getElementById('themeBtn-'+id);
    if(b){
      b.style.background=t===id?'var(--c-fwy)':'rgba(255,255,255,.08)';
      b.style.borderColor=t===id?'var(--c-fwyl)':'var(--border)';
      b.style.color=t===id?'#fff':'var(--muted)';
    }
  });
}
function closeSettings(afterClose){_closeProfileLikeModal('settingsModal', afterClose);}
function toggleWcSetting(){

  setWcEnabled(!wcEnabled());
  const btn=document.getElementById('wcToggleBtn');
  if(btn){btn.textContent=wcEnabled()?'ON':'OFF';btn.style.background=wcEnabled()?'var(--c-fwy)':'rgba(255,255,255,.1)';}
}
