// Screen Navigation, Main App Visibility, and Summary Transitions

function _setNavDir(dir){
  const b=document.body; if(!b) return;
  b.classList.remove('nav-forward','nav-back');
  if(dir) b.classList.add(dir==='back'?'nav-back':'nav-forward');
  // Auto-clear after transition completes so non-nav actions don't inherit direction
  clearTimeout(window._navDirClear);
  window._navDirClear=setTimeout(()=>{
    b.classList.remove('nav-forward','nav-back');
  }, 420);
}
function showScreen(id, flexOrBlock='flex'){
  const el=document.getElementById(id);
  if(!el)return;
  // Default to forward direction if nothing else set it
  if(!document.body.classList.contains('nav-back') && !document.body.classList.contains('nav-forward')){
    _setNavDir('forward');
  }
  if(!window._screenHideTimers) window._screenHideTimers = {};
  if(window._screenHideTimers[id]){
    clearTimeout(window._screenHideTimers[id]);
    delete window._screenHideTimers[id];
  }
  el.style.display=flexOrBlock;
  void el.offsetWidth;
  el.classList.add('visible');
}
function showMainApp(){
  const app=document.getElementById('mainApp');
  if(!app)return;
  if(window._mainAppHideTimer){clearTimeout(window._mainAppHideTimer);window._mainAppHideTimer=null;}
  // The app container is a vertical flex column; preserve that when showing it.
  app.style.display='flex';
  app.style.visibility='visible';
  void app.offsetWidth;
  app.classList.add('visible');
}
function hideMainApp(){
  const app=document.getElementById('mainApp');
  if(!app)return;
  app.classList.remove('visible');
  if(window._mainAppHideTimer) clearTimeout(window._mainAppHideTimer);
  window._mainAppHideTimer=setTimeout(()=>{
    if(!app.classList.contains('visible')) app.style.display='none';
    window._mainAppHideTimer=null;
  },260);
}
function hideMainAppImmediate(){
  const app=document.getElementById('mainApp');
  if(!app)return;
  app.classList.remove('visible');
  if(window._mainAppHideTimer){
    clearTimeout(window._mainAppHideTimer);
    window._mainAppHideTimer=null;
  }
  app.style.visibility='hidden';
  app.style.display='none';
}
function setMainAppConcealed(concealed){
  const app=document.getElementById('mainApp');
  if(!app)return;
  app.style.visibility = concealed ? 'hidden' : 'visible';
}
function concealMainApp(){
  showMainApp();
  setMainAppConcealed(true);
}
function revealMainApp(){
  setMainAppConcealed(false);
  showMainApp();
}
function runScreenTransition(fn){
  if(typeof fn==='function') fn();
}
function closeHcScreenThen(fn, delay=230){
  const hc=document.getElementById('hcScreen');
  if(!hc){ if(typeof fn==='function') fn(); return; }
  hc.classList.remove('show');
  setTimeout(()=>{ if(typeof fn==='function') fn(); },delay);
}
let _hcPanelSwapTimer = null;
function swapHcScreenContent(updateFn){
  const hc=document.getElementById('hcScreen');
  if(!hc || typeof updateFn !== 'function'){
    if(typeof updateFn === 'function') updateFn();
    return;
  }
  if(_hcPanelSwapTimer){
    clearTimeout(_hcPanelSwapTimer);
    _hcPanelSwapTimer = null;
  }
  hc.classList.remove('panel-swap-in','panel-swap-out');
  void hc.offsetWidth;
  hc.classList.add('panel-swap-out');
  _hcPanelSwapTimer = setTimeout(()=>{
    updateFn();
    hc.classList.remove('panel-swap-out');
    hc.classList.add('panel-swap-in');
    setTimeout(()=>{
      hc.classList.remove('panel-swap-in');
      _hcPanelSwapTimer = null;
    },240);
  },180);
}
function swapHcScreenContentForward(updateFn){
  const hc=document.getElementById('hcScreen');
  if(!hc || typeof updateFn !== 'function'){
    if(typeof updateFn === 'function') updateFn();
    return;
  }
  if(_hcPanelSwapTimer){
    clearTimeout(_hcPanelSwapTimer);
    _hcPanelSwapTimer = null;
  }
  hc.classList.remove('panel-swap-in','panel-swap-out');
  updateFn();
  void hc.offsetWidth;
  hc.classList.add('panel-swap-in');
  _hcPanelSwapTimer = setTimeout(()=>{
    hc.classList.remove('panel-swap-in');
    _hcPanelSwapTimer = null;
  },240);
}
let _summaryBackTarget = null;
let _summaryContext = null;
let _vsSummaryPlayer = 0;
let _onboardFocusLockCount = 0;

function lockOnboardPosition(){
  const screen = document.getElementById('onboardScreen');
  const content = screen?.querySelector('.onboard-content');
  if(!screen || !content) return;
  const top = content.getBoundingClientRect().top;
  screen.style.setProperty('--onboard-lock-top', `${Math.max(24, Math.round(top))}px`);
  content.classList.add('locked-focus');
}

function unlockOnboardPosition(){
  const screen = document.getElementById('onboardScreen');
  const content = screen?.querySelector('.onboard-content');
  if(!screen || !content) return;
  content.classList.remove('locked-focus');
  screen.style.removeProperty('--onboard-lock-top');
}

function openSummaryTransition(viewRound = S.currentRound, backTarget = null){
  _summaryBackTarget = backTarget;
  concealMainApp();
  requestAnimationFrame(()=>openSummary(viewRound, backTarget));
}
function openSummaryFromRoundComplete(viewRound = S.currentRound){
  _setNavDir('forward');
  _summaryBackTarget = 'hcScreen';
  setMainAppConcealed(true);
  hideMainAppImmediate();
  openSummary(viewRound, 'hcScreen');
  const hc = document.getElementById('hcScreen');
  requestAnimationFrame(()=>{ if(hc) hc.classList.remove('show'); });
}
function setSummaryContext(ctx = null){
  _summaryContext = ctx ? { ...ctx } : null;
}
function hideScreen(id){
  const el=document.getElementById(id);
  if(!el)return;
  if(!window._screenHideTimers) window._screenHideTimers = {};
  el.classList.remove('visible');
  if(window._screenHideTimers[id]) clearTimeout(window._screenHideTimers[id]);
  window._screenHideTimers[id] = setTimeout(()=>{
    if(!el.classList.contains('visible')) el.style.display='none';
    delete window._screenHideTimers[id];
  }, 260);
}
