// Wildcard Inventory, Effects, Reveal Flow, and Save Integration
// WILDCARD SYSTEM
// ═══════════════════════════════════════════════════════

function wcEnabled(){
  if(TUT.active) return true;
  try{return localStorage.getItem('gg_wildcards')!=='off';}catch{return true;}
}
function setWcEnabled(v){
  try{localStorage.setItem('gg_wildcards',v?'on':'off');}catch{}
}

const WILDCARDS=[
  // COMMON (Weight 50) - Situational saves
  {id:'lucky_bounce',    weight: 50, icon:'🍀', name:'Lucky Bounce',      desc:'Next OOB or Water result treated as Rough (or Sand on Par 3).'},
  {id:'iron_will',       weight: 50, icon:'🔩', name:'Iron Will',         desc:'Next Rough result treated as Fairway.'},
  {id:'tailwind',        weight: 50, icon:'💨', name:'Tailwind',          desc:'Re-roll one die of your choice this hole.'},
  {id:'green_read',      weight: 50, icon:'🌱', name:'Green Read',        desc:'On your next putting attempt, convert all 3-putt cells into 2-putt.'},
  {id:'bounce_back',     weight: 50, icon:'🪃', name:'Bounce Back',       desc:'After a bogey or worse, your next tee shot is guaranteed to be Fairway (or Green if on Par 3)'},
  
  // RARE (Weight 30) - Solid utility
  {id:'precision_grip',  weight: 30, icon:'🧤', name:'Precision Grip',    desc:'Adjust the result of one die by +/- 1 after the roll.'},
  {id:'mowers_revenge',  weight: 30, icon:'🚜', name:'Mower\'s Revenge',  desc:'For the rest of this hole, all Rough is treated as Fairway.'},
  {id:'phantom_stroke',  weight: 30, icon:'👻', name:'Phantom Stroke',    desc:'Remove 1 penalty stroke already taken this hole.'},
  {id:'hole_wall',       weight: 30, icon:'🕳️', name:'Hole In The Wall',  desc:'Par 3 only: entire grid becomes Chip & Green.'},
  {id:'birdie_boost',    weight: 30, icon:'🚀', name:'Birdie Boost',      desc:'Add 8 extra Green cells to next approach grid.'},
  
  // EPIC (Weight 15) - Very powerful
  {id:'shortcut',        weight: 15, icon:'⚡', name:'Shortcut',          desc:'Skip straight to Chip zone (only par 4/5 after tee shot).'},
  {id:'bogey_shield',    weight: 15, icon:'🛡️', name:'Bogey Shield',      desc:'Next Bogey+ result converted into a Par.'},
  {id:'sand_wedge_pro',  weight: 15, icon:'🏖️', name:'Sand Wedge Pro',    desc:'Next Sand shot: 80% of grid converted into Green.'},
  {id:'mulligan',        weight: 15, icon:'↩️',  name:'Mulligan',          desc:'Re-roll both dice once, discard previous result.'},
  {id:'cup_magnet',      weight: 15, icon:'🧲', name:'Cup Magnet',        desc:'Next Green roll: If you miss the 1-putt by 1 cell, it \'sucks\' into the hole anyway.'},
  
  // LEGENDARY (Weight 5) - Game breakers
  {id:'golden_putter',   weight: 5,  icon:'🥇', name:'Golden Putter',     desc:'If on green: instant 1-putt now. Otherwise next green roll is guaranteed 1-putt.'},
  {id:'the_ferrett',     weight: 5,  icon:'🦡', name:'The Ferrett',       desc:'Next Sand shot: 75% chance of holing out directly.'},
  {id:'hole_in_one',     weight: 5,  icon:'🌟', name:'Hole In One',       desc:'Next Par 3 tee shot: 80% chance of hole-in-one.'},
  {id:'commercial',      weight: 5,  icon:'🎥', name:'Highlight Reel',    desc:'Next Chip shot: 75% chance of holing out directly.'},
];

function getActiveWcIds() {
  const ids = [];
  if(WCS.active) ids.push(WCS.active);
  if(WCS.luckyBounceActive) ids.push('lucky_bounce');
  if(WCS.ironWillActive) ids.push('iron_will');
  if(WCS.greenReadActive || WCS.greenReadQueued) ids.push('green_read');
  if(WCS.bounceBackPending || WCS.bounceBackReady) ids.push('bounce_back');
  if(WCS.bogeyShieldActive) ids.push('bogey_shield');
  if(WCS.mowersRevengeActive) ids.push('mowers_revenge');
  if(WCS.birdieBoostActive) ids.push('birdie_boost');
  if(WCS.holeWallActive) ids.push('hole_wall');
  if(WCS.sandWedgeProActive) ids.push('sand_wedge_pro');
  if(WCS.cupMagnetActive) ids.push('cup_magnet');
  if(WCS.goldenPutterActive) ids.push('golden_putter');
  if(WCS.ferrettActive) ids.push('the_ferrett');
  if(WCS.hioActive) ids.push('hole_in_one');
  if(WCS.highlightReelActive) ids.push('commercial');
  if(WCS.shortcutActive) ids.push('shortcut');
  return ids;
}

function randWildcard(){
  const equippedIds=WCS.equipped.map(w=>w.id);
  const activeIds=getActiveWcIds(); 
  const excluded=[...equippedIds, ...activeIds];
  const available=WILDCARDS.filter(w=>!excluded.includes(w.id));
  const pool=available.length>0?available:WILDCARDS;

  const totalWeight = pool.reduce((sum, w) => sum + (w.weight || 10), 0);
  let randomVal = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    randomVal -= (pool[i].weight || 10);
    if (randomVal <= 0) {
      return Object.assign({}, pool[i]);
    }
  }
  return Object.assign({}, pool[pool.length - 1]);
}

function getWildcardRarityMeta(wc){
  const weight = wc?.weight || 0;
  if(weight === 50) return { key:'common', color:'#5cd6ff' };
  if(weight === 30) return { key:'rare', color:'#b200ff' };
  if(weight === 15) return { key:'epic', color:'#ff3b3b' };
  return { key:'legendary', color:'#ffd700' };
}

const WCS={
  equipped:[], active:null,
  luckyBounceActive:false, ironWillActive:false,
  greenReadActive:false, greenReadQueued:false,
  bounceBackPending:false, bounceBackReady:false,
  bogeyShieldActive:false,
  mowersRevengeActive:false, birdieBoostActive:false,
  holeWallActive:false, sandWedgeProActive:false, cupMagnetActive:false,
  goldenPutterActive:false, ferrettActive:false, hioActive:false,
  highlightReelActive:false, shortcutActive:false
};
let _expandedActiveWcId = null;
let _rerollChoiceActive = false;
let _wcInfoListScroll = 0;

function setRerollChoiceActive(active){
  _rerollChoiceActive = !!active;
  const rollBtn=document.getElementById('rollBtn');
  const nextBtn=document.getElementById('nextShotBtn');
  if(rollBtn){
    rollBtn.disabled = _rerollChoiceActive || !!S.rolling;
    if(_rerollChoiceActive) rollBtn.classList.remove('rolling-state');
  }
  if(nextBtn){
    nextBtn.disabled = _rerollChoiceActive;
    nextBtn.style.pointerEvents = _rerollChoiceActive ? 'none' : '';
  }
}

function swapWcInfoContent(renderFn){
  const list=document.getElementById('wcInfoList');
  if(!list || typeof renderFn !== 'function') return;
  if(!list.innerHTML.trim()){
    renderFn(list);
    list.classList.add('swap-in');
    requestAnimationFrame(()=>list.classList.remove('swap-in'));
    return;
  }
  list.classList.add('swap-out');
  requestAnimationFrame(()=>{
    renderFn(list);
    list.classList.remove('swap-out');
    list.classList.add('swap-in');
    requestAnimationFrame(()=>list.classList.remove('swap-in'));
  });
}

function wcReset(){
  WCS.equipped=[]; WCS.active=null; WCS.pending=null; WCS.pendingRow=null; WCS.pendingCol=null;
  WCS.luckyBounceActive=false; WCS.ironWillActive=false;
  WCS.greenReadActive=false; WCS.greenReadQueued=false;
  WCS.bounceBackPending=false; WCS.bounceBackReady=false;
  WCS.bogeyShieldActive=false;
  WCS.mowersRevengeActive=false; WCS.birdieBoostActive=false;
  WCS.holeWallActive=false; WCS.sandWedgeProActive=false; WCS.cupMagnetActive=false;
  WCS.goldenPutterActive=false; WCS.ferrettActive=false; WCS.hioActive=false;
  WCS.highlightReelActive=false; WCS.shortcutActive=false;
  renderWcFab(); renderWcDrawer();
}
function wcResetHole(){
  WCS.active=null; WCS.pending=null; WCS.pendingRow=null; WCS.pendingCol=null;
  WCS.mowersRevengeActive=false;
  renderWcFab(); renderWcDrawer();
}

function renderWcFab(){
  const fab=document.getElementById('wcFab');
  if(!fab)return;
  if(!wcEnabled()){ fab.classList.remove('visible');return; }
  fab.classList.add('visible');
  const countEl=document.getElementById('wcFabCount');
  if(countEl)countEl.textContent=`${WCS.equipped.length}/3`;
  [0,1,2].forEach(i=>{
    const dot=document.getElementById('wcDot'+i);
    if(dot)dot.classList.toggle('filled',i<WCS.equipped.length);
  });
  const btn=document.getElementById('rollBtn');
  if(btn)btn.classList.toggle('wc-active',!!WCS.active);
}

function openWcDrawer(){
  renderWcDrawer();
  const drawer=document.getElementById('wcDrawer');
  drawer.classList.toggle('tut-force-use', !!(TUT.active && _tutWaitEvent === 'wc_used'));
  drawer.classList.add('open');
  document.getElementById('wcBackdrop').classList.add('show');
  document.body.style.overflow = 'hidden'; // Lock background scroll
  if (TUT.active && _tutWaitEvent === 'wc_used') {
     _tutHighlight('.wc-use-btn', false); 
  }
}
function closeWcDrawer(){
  if (TUT.active && _tutWaitEvent === 'wc_used') return;
  document.getElementById('wcDrawer').classList.remove('open');
  document.getElementById('wcDrawer').classList.remove('tut-force-use');
  document.getElementById('wcBackdrop').classList.remove('show');
  document.body.style.overflow = ''; // Restore scroll
  _expandedActiveWcId = null;
  closeWcInfo();
  if (TUT.active && _tutWaitEvent === 'wc_used') {
     _tutHighlight('#wcFab', false);
  }
}
function renderWcInfoList(force=false){
  const list=document.getElementById('wcInfoList');
  if(!list) return;
  if(list.dataset.ready === '1' && !force) return;
  list.innerHTML=`
    <div style="font-family:'Sen', sans-serif;font-size:12px;color:rgba(255,255,255,.5);padding:6px 0 10px;line-height:1.5;">Wildcards are earned by rolling doubles. Equip up to 3 and use them to your advantage. Tap any wildcard for more details.</div>
    <div style="background:rgba(255,255,255,.05);border-radius:8px;padding:10px;margin-bottom:12px;font-family:'Sen', sans-serif;font-size:12px;color:rgba(255,255,255,.7);line-height:1.6;">
      <b style="color:#5cd6ff">COMMON:</b> Standard gameplay modifiers.<br>
      <b style="color:#b200ff">RARE:</b> Enhanced utility and boosts.<br>
      <b style="color:#ff3b3b">EPIC:</b> Significant grid and shot alterations.<br>
      <b style="color:#ffd700">LEGENDARY:</b> The most powerful abilities.<br><br>
      <i>Note: When you USE a card, it is either <b>"Applied"</b> (waiting for the right trigger) or <b>"Activated"</b> (taking effect immediately).</i>
    </div>
  `;

  const groups = [
    { name: 'COMMON', weight: 50, color: '#5cd6ff' },
    { name: 'RARE', weight: 30, color: '#b200ff' },
    { name: 'EPIC', weight: 15, color: '#ff3b3b' },
    { name: 'LEGENDARY', weight: 5, color: '#ffd700' }
  ];

  groups.forEach(g => {
    const groupWcs = WILDCARDS.filter(w => w.weight === g.weight);
    if (groupWcs.length === 0) return;

    const header = document.createElement('div');
    header.style.cssText = `font-family:'Bebas Neue',cursive;font-size:14px;letter-spacing:2px;color:${g.color};margin:12px 0 6px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;`;
    header.textContent = g.name;
    list.appendChild(header);

    groupWcs.forEach(wc=>{
      const item=document.createElement('div');
      item.className='wc-info-item';
      item.innerHTML=`<span style="font-size:24px;flex-shrink:0;margin-right:8px;">${wc.icon}</span><div style="font-family:'Bebas Neue',cursive;font-size:18px;letter-spacing:1px;color:${g.color};margin-top:4px;">${wc.name}</div>`;
      item.onclick=()=>{
        _wcInfoListScroll = list.scrollTop;
        showWcInfoDetail(wc, g.color);
      };
      list.appendChild(item);
    });
  });
  list.dataset.ready = '1';
}
function showWcInfoList(){
  const panel=document.getElementById('wcInfoPanel');
  const title=document.getElementById('wcInfoTitle');
  const list=document.getElementById('wcInfoList');
  const detail=document.getElementById('wcInfoDetail');
  if(!panel || !title || !list || !detail)return;

  title.textContent='ALL WILDCARDS';
  title.style.color='#fff';
  document.getElementById('wcInfoBackBtn').onclick = closeWcInfo;
  renderWcInfoList();
  panel.classList.remove('show-detail');
  detail.innerHTML='';
  requestAnimationFrame(()=>{ list.scrollTop = _wcInfoListScroll; });
}
function openWcInfo(){
  const panel=document.getElementById('wcInfoPanel');
  if(!panel)return;
  panel.classList.add('open');
  showWcInfoList();
}

function showWcInfoDetail(wc, color){
  const panel=document.getElementById('wcInfoPanel');
  const title=document.getElementById('wcInfoTitle');
  const detail=document.getElementById('wcInfoDetail');
  if(!panel || !title || !detail) return;
  title.textContent='ALL WILDCARDS';
  title.style.color = '#fff';
  document.getElementById('wcInfoBackBtn').onclick = showWcInfoList;
  detail.innerHTML=`
    <div style="font-size:40px;text-align:center;margin:10px 0 8px;">${wc.icon}</div>
    <div style="font-family:'Bebas Neue',cursive;font-size:22px;letter-spacing:2px;color:${color || '#fff'};text-align:center;margin-bottom:10px;">${wc.name}</div>
    <div style="font-family:'Sen', sans-serif;font-size:12px;color:rgba(255,255,255,.8);text-align:center;line-height:1.5;padding:0 12px;">${wc.desc}</div>
  `;
  panel.classList.add('show-detail');
}
  
function closeWcInfo(){
  const panel=document.getElementById('wcInfoPanel');
  if(panel){
    panel.classList.remove('show-detail');
    panel.classList.remove('open');
  }
  // Force synchronous repaint on back buttons that may have been visually
  // obscured by the panel's z-index during its open state.
  const bb=document.getElementById('wcInfoBackBtn');
  if(bb){bb.style.visibility='visible';bb.style.pointerEvents='';void bb.offsetHeight;}
  document.querySelectorAll('.setup-back-btn').forEach(b=>{
    b.style.visibility='visible';b.style.pointerEvents='';void b.offsetHeight;
  });
}

function renderWcDrawer(){
  const el=document.getElementById('wcDrawerSlots');
  if(!el)return;
  document.getElementById('wcDrawer')?.classList.toggle('tut-force-use', !!(TUT.active && _tutWaitEvent === 'wc_used'));
  el.innerHTML='';
  
  // 1. Render Equipped Slots
  for(let i=0;i<3;i++){
    const wc=WCS.equipped[i];
    const slot=document.createElement('div');
    slot.className='wc-slot'+(wc?'':' empty');
    if(!wc){
      slot.innerHTML='<div class="wc-slot-empty-txt">EMPTY SLOT</div>';
    } else {
      const rarityMeta = getWildcardRarityMeta(wc);
      slot.classList.add(`rarity-${rarityMeta.key}`);
      const puttPending=!!document.getElementById('puttWcBtn');
      const rerollPending=WCS.active==='mulligan'||WCS.active==='tailwind';
      const isRerollCard=wc.id==='mulligan'||wc.id==='tailwind'||wc.id==='precision_grip';
      
      let canUse=!S.rolling&&!rerollPending&&(!S.holeDone||puttPending);
      if(isRerollCard) {
         const nextBtnVisible = isShotBtnShown('nextShotBtn');
         if (!nextBtnVisible && !puttPending) canUse = false;
      }

      slot.innerHTML=`
        <div class="wc-slot-header">
          <div class="wc-slot-icon">${wc.icon}</div>
          <div class="wc-slot-info">
            <div class="wc-slot-name">${wc.name}</div>
            <div class="wc-slot-desc">${wc.desc}</div>
          </div>
        </div>
        <div class="wc-slot-actions">
          <button class="wc-use-btn" onclick="activateWildcard(${i})" ${canUse?'':'disabled'}>USE</button>
          <button class="wc-discard-btn" onclick="discardEquipped(${i})" ${TUT.active && _tutWaitEvent === 'wc_used' ? 'disabled' : ''}>✕</button>
        </div>
      `;
    }
    el.appendChild(slot);
  }

  // 2. Render Active Effects Below
  const activeWcs = getActiveWcIds().map(id => WILDCARDS.find(w => w.id === id));

  if (activeWcs.length > 0) {
    const activeContainer = document.createElement('div');
    activeContainer.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(123,47,158,.4);';
    activeContainer.innerHTML = '<div style="font-family:\'Bebas Neue\',cursive;font-size:14px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">⚡ ACTIVE EFFECTS</div>';

    activeWcs.forEach(wc => {
      if(!wc) return;
      
      let statusText = 'Waiting for trigger...';
      if (wc.id === 'mowers_revenge') statusText = 'Active for the entire hole';
      if (wc.id === 'lucky_bounce') statusText = 'Saves next OB/Water';
      if (wc.id === 'iron_will') statusText = 'Saves next Rough';
      if (wc.id === 'green_read') statusText = WCS.greenReadQueued ? 'Queued for next putting attempt' : 'Armed for next putting attempt';
      if (wc.id === 'bounce_back') statusText = WCS.bounceBackReady ? 'Ready for next tee shot' : 'Waiting for bogey+ result';
      if (wc.id === 'bogey_shield') statusText = 'Waiting for bogey+ result';
      if (wc.id === 'cup_magnet') statusText = 'Waiting for Green...';

      const item = document.createElement('div');
      item.className = `wc-active-item${_expandedActiveWcId===wc.id?' expanded':''}`;
      item.innerHTML = `
        <div style="font-size:18px;line-height:1;">${wc.icon}</div>
        <div class="wc-active-copy">
          <div class="wc-active-name">${wc.name}</div>
          <div class="wc-active-status">${statusText}</div>
          <div class="wc-active-desc">${wc.desc}</div>
        </div>
      `;
      item.onclick=()=>{
        const shouldExpand = _expandedActiveWcId !== wc.id;
        _expandedActiveWcId = shouldExpand ? wc.id : null;
        activeContainer.querySelectorAll('.wc-active-item').forEach(el=>el.classList.remove('expanded'));
        if(shouldExpand) item.classList.add('expanded');
      };
      activeContainer.appendChild(item);
    });
    el.appendChild(activeContainer);
  }
}

function activateWildcard(slotIdx){
  const wc=WCS.equipped[slotIdx];
  if(!wc)return;

  const success = applyWildcardEffect(wc);
  if(!success) return; 

  playSound('wc_use', 0.9);
  S._wcUsedThisRound=(S._wcUsedThisRound||0)+1;
  if (!S._wcsUsedThisHole) S._wcsUsedThisHole = [];
  S._wcsUsedThisHole.push(wc.name);
  WCS.equipped.splice(slotIdx,1);

  if (!TUT.active) {
    const profiles = loadProfiles();
    const pIdx = Math.min(getActiveProfileIdx(), profiles.length-1);
    if(profiles[pIdx]) {
      profiles[pIdx].wildcardsUsed = (profiles[pIdx].wildcardsUsed || 0) + 1;
      saveProfiles(profiles);
      setTimeout(() => checkAndAwardAchievements(), 300);
    }
  }
  if(TUT.active && _tutWaitEvent === 'wc_used'){
    document.getElementById('wcDrawer')?.classList.remove('tut-force-use');
  }

  const rerollWcs=['mulligan','tailwind','precision_grip'];
  if(rerollWcs.includes(wc.id) && S.zone === 'grn'){
    S._eyesClosedArmed = true;
  }
  if(rerollWcs.includes(wc.id)){
    setRerollChoiceActive(true);
    const wcPuttBtn=document.getElementById('puttWcBtn');
    if(wcPuttBtn) wcPuttBtn.remove();
    
    const popped = S.log.pop();
    if (popped) {
        let deduction = 1;
        if (popped.pen) deduction = 2; 
        else if (S._pendingPuttResult) deduction = S._pendingPuttResult.putts;
        
        S.strokes = Math.max(0, S.strokes - deduction);
        S.shotNum = Math.max(1, S.shotNum - deduction);
        
        if (popped.prevZone) S.zone = popped.prevZone;
        if (popped.prevYrdRemain !== undefined) S.yrdRemain = popped.prevYrdRemain;
    }
    renderLog();

    if(S._pendingPuttResult){
      S._preserveGrid=true;
      S._pendingPuttResult=null;
      S._pendingHoleFinish=null;
      S._puttWcUsed=true;
      S._skipCelebration=false; 
    } else {
      S._preserveGrid=true; 
      updateFloat();updateYrd();updateZonePill();
    }
    const nextBtn=document.getElementById('nextShotBtn');
    if(nextBtn){
      nextBtn.textContent='NEXT SHOT';
      nextBtn.onclick=doNextShot;
      nextBtn.style.background='var(--c-tee)';
    }
    const rollBtn2=document.getElementById('rollBtn');
    if(rollBtn2){rollBtn2.disabled=false;rollBtn2.classList.remove('rolling-state');}
    _holdFinishBtn=false;
    hideNextShotBtn(true);

    closeWcDrawer(); // Reroll wildcards MUST close the drawer to trigger their mechanics safely
    
    if(wc.id==='tailwind'){
      WCS.active=null;
      renderWcFab();
      setTimeout(()=>_showTailwindDieChoice(),100);
      return; 
    }
    if(wc.id==='precision_grip'){
      WCS.active=null;
      renderWcFab();
      setTimeout(()=>_showPrecisionGripChoice(),100);
      return; 
    }
    if(wc.id==='mulligan'){
      WCS.active=null;
      appendWcNote(`${wc.icon} ${wc.name}`);
      showWcToast(`↩️ Mulligan activated!`, 86);
      renderWcFab();
      setTimeout(()=>{
        setRerollChoiceActive(false);
        S.rolling=false;
        doRoll();
      },500);
      return;
    }
      }
      
      if (WCS.equipped.length === 0) {
          closeWcDrawer();
      } else {
          renderWcDrawer();
      }
      renderWcFab();
    }

function discardEquipped(i){
  if(TUT.active && _tutWaitEvent === 'wc_used') return;
  WCS.equipped.splice(i,1);
  renderWcDrawer();
  renderWcFab();
  trackWcDiscard();
}

function trackWcDiscard() {
  S._wcDiscardedThisRound = (S._wcDiscardedThisRound || 0) + 1;
  saveGameState();

  const profiles=loadProfiles();
  const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
  const p=profiles[idx];
  if(p) {
    ensureProfileDefaults(p);
    p.wcDiscardedTotal = (p.wcDiscardedTotal || 0) + 1;
    p.wcDiscardedRound = Math.max(p.wcDiscardedRound || 0, S._wcDiscardedThisRound);
    profiles[idx]=p;
    saveProfiles(profiles);
  }

  if(S._wcDiscardedThisRound === 5) {
    setTimeout(() => checkAndAwardAchievements(), 300);
  }
}

// ── APPLY EFFECTS ─────────────────────────────────────
function applyWildcardEffect(wc){
  const h=HOLES[S.holeIdx];
  let applied = true;
  let toastMsg = `${wc.icon} ${wc.name} applied!`;
  let afterApply = null;

  // Par 3 Wildcard Logic: Hole In One overrides lesser cards.
  const isPar3Wc = ['eagle_eye', 'hole_wall', 'hole_in_one'].includes(wc.id);

  if (isPar3Wc) {
      if (wc.id === 'hole_in_one') {
          // Hole in One overrides Eagle Eye and Hole in the Wall
          if (WCS.eagleEyeActive || WCS.holeWallActive) {
              toastMsg = `🌟 Hole In One overrides your previous wildcard!`;
              WCS.eagleEyeActive = false;
              WCS.holeWallActive = false;
          } else if (WCS.hioActive) {
              showWcToast(`⚠️ Hole in One is already active!`);
              return false;
          }
      } else {
          // If trying to apply Eagle Eye / Hole in the Wall, block if ANY par 3 card is active
          if (WCS.eagleEyeActive || WCS.holeWallActive || WCS.hioActive) {
              showWcToast(`⚠️ You already have a Par 3 wildcard active!`);
              return false;
          }
      }
  }

  switch(wc.id){
    case 'shortcut':
      if (h.par === 3 || S.zone === 'tee') {
        toastMsg = `⚡ Shortcut only works on Par 4/5 after the tee shot!`;
        applied = false;
      } else if (S.zone === 'grn' || S._pendingPuttResult) {
        WCS.shortcutActive = true;
        toastMsg = `⚡ Already on the green. Shortcut activates on your next Par 4/5 hole.`;
      } else {
        const prevZone = S.zone;
        const prevYrdRemain = S.yrdRemain;
        S.zone='chip';
        S.yrdRemain=Math.min(S.yrdRemain, Math.round(15+Math.random()*30));
        addLog('🃏', `Skipped to Chip (${wc.icon} ${wc.name})`, 'chip', 'WC', false, null, null, null, prevZone, prevYrdRemain);
        updateZonePill();updateYrd();updateFloat();updateTVBanner();
        toastMsg = `⚡ ${wc.name} activated!`;
        if(h.par === 5){
          unlockAchievement('express_route');
        }
      }
      break;
    case 'phantom_stroke':
      const removablePenalties = getNetPenaltyCount(S.log);
      if(removablePenalties > 0) {
        const prevZone = S.zone;
        const prevYrdRemain = S.yrdRemain;
        S.strokes=Math.max(0,S.strokes-1);
        S.shotNum=Math.max(1,S.shotNum-1);
        addLog('🃏', `Penalty removed (${wc.icon} ${wc.name})`, S.zone, '-1', false, null, null, null, prevZone, prevYrdRemain);
        updateFloat();updateTVBanner();
        toastMsg = `${wc.icon} ${wc.name} activated!`;
      } else {
        toastMsg = `${wc.icon} ${wc.name}: No penalty to remove on this hole.`;
        applied = false;
      }
      break;
    case 'green_read':
      toastMsg = `🌱 ${wc.name} applied!`;
      if(S.zone === 'grn' && !S._pendingPuttResult && !S.holeDone){
        if(Array.isArray(S.currentGrid) && S.currentGrid.length){
          const hasPuttCells = S.currentGrid.some(row => Array.isArray(row) && row.some(cell => ['p1','p2','p3'].includes(cell)));
          const hasP3 = S.currentGrid.some(row => Array.isArray(row) && row.includes('p3'));
          if(!hasPuttCells){
            WCS.greenReadActive = false;
            WCS.greenReadQueued = true;
            break;
          }
          if(!hasP3){
            toastMsg = `${wc.icon} ${wc.name}: no 3P cells to read.`;
            applied = false;
            break;
          }
          toastMsg = null;
          WCS.greenReadActive = false;
          WCS.greenReadQueued = false;
          afterApply = () => {
            const changed = typeof mutateCurrentPuttGridCells === 'function'
              ? mutateCurrentPuttGridCells('p3','p2')
              : 0;
            if(changed > 0){
              showWcToast('🌱 Green Read activated!');
              appendWcNote('🌱 Green Read');
            }
          };
        } else {
          WCS.greenReadActive = false;
          WCS.greenReadQueued = true;
        }
      } else {
        WCS.greenReadActive = false;
        WCS.greenReadQueued = true;
      }
      break;
    case 'bounce_back':
      WCS.bounceBackPending = true;
      WCS.bounceBackReady = false;
      toastMsg = `🪃 ${wc.name} applied!`;
      break;
    case 'bogey_shield':
      WCS.bogeyShieldActive = true;
      toastMsg = `🛡️ ${wc.name} applied!`;
      break;
    case 'mowers_revenge': WCS.mowersRevengeActive = true; toastMsg = `🚜 ${wc.name} applied!`; break;
    case 'cup_magnet': WCS.cupMagnetActive = true; toastMsg = `🧲 ${wc.name} applied!`; break;
    case 'commercial': WCS.highlightReelActive = true; toastMsg = `🎥 ${wc.name} applied!`; break;
    case 'sand_wedge_pro': WCS.sandWedgeProActive = true; toastMsg = `🏖️ ${wc.name} applied!`; break;
    case 'lucky_bounce': WCS.luckyBounceActive = true; toastMsg = `🍀 ${wc.name} applied!`; break;
    case 'iron_will': WCS.ironWillActive = true; toastMsg = `🔩 ${wc.name} applied!`; break;
    case 'birdie_boost': WCS.birdieBoostActive = true; toastMsg = `🚀 ${wc.name} armed for your next approach!`; break;
    case 'hole_wall': WCS.holeWallActive = true; toastMsg = `🕳️ ${wc.name} applied!`; break;
    case 'the_ferrett': 
      if (S.zone === 'sand' && S.yrdRemain > 87) {
          toastMsg = `🦡 The Ferrett only works on greenside bunkers!`;
          applied = false;
      } else {
          WCS.ferrettActive = true;
          toastMsg = `🦡 ${wc.name} applied!`; 
      }
      break;
    case 'hole_in_one': WCS.hioActive = true; toastMsg = `🌟 ${wc.name} applied!`; break;
    case 'golden_putter':
      if(S.zone === 'grn' && !S._pendingPuttResult && !S.holeDone && Array.isArray(S.currentGrid) && S.currentGrid.length){
        const hasPuttCells = S.currentGrid.some(row => Array.isArray(row) && row.some(cell => ['p1','p2','p3'].includes(cell)));
        if(!hasPuttCells){
          WCS.goldenPutterActive = true;
          toastMsg = `${wc.icon} ${wc.name} armed for the next putting grid!`;
          break;
        }
        WCS.goldenPutterActive = false;
        afterApply = () => {
          if(typeof mutateAllCurrentPuttGridCells === 'function') mutateAllCurrentPuttGridCells('p1');
          showWcToast('🥇 Golden Putter activated!');
          appendWcNote('🥇 Golden Putter');
        };
        toastMsg = null;
      } else {
        WCS.goldenPutterActive = true;
        toastMsg = `🥇 ${wc.name} applied!`;
      }
      break;
    case 'mulligan':
    case 'tailwind':
    case 'precision_grip':
      WCS.active = wc.id;
      toastMsg = null;
      break;
  }
  
  if(toastMsg) showWcToast(toastMsg);
  if(typeof afterApply === 'function') afterApply();
  renderWcFab();
  if(applied && TUT.active && typeof tutAfterWcUse === 'function') tutAfterWcUse();
  return applied;
}

const _wcToastStack = [];
let _wcToastLayoutRaf = null;
let _wcToastResizeBound = false;

function _wcToastBaseBottom(){
  const tvBar = document.getElementById('tvBar');
  if(tvBar){
    const rect = tvBar.getBoundingClientRect();
    if(rect && rect.top < window.innerHeight){
      return Math.max(4, Math.round(window.innerHeight - rect.top + 4));
    }
  }
  return 24;
}
function _layoutWcToasts(){
  let bottom = _wcToastBaseBottom();
  _wcToastStack.forEach(item=>{
    if(!item.el || !item.el.isConnected) return;
    item.el.style.bottom = `${bottom}px`;
    bottom += item.el.offsetHeight + 8;
  });
}
function _queueWcToastLayout(){
  if(_wcToastLayoutRaf) cancelAnimationFrame(_wcToastLayoutRaf);
  _wcToastLayoutRaf = requestAnimationFrame(()=>{
    _wcToastLayoutRaf = null;
    _layoutWcToasts();
  });
}
function syncWcToastStackPosition(){
  if(!_wcToastStack.length) return;
  _queueWcToastLayout();
}
function _removeWcToast(item){
  const idx = _wcToastStack.indexOf(item);
  if(idx >= 0) _wcToastStack.splice(idx, 1);
  if(item.timeout) clearTimeout(item.timeout);
  const el = item.el;
  if(el){
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(()=>{ if(el.parentNode) el.remove(); }, 220);
  }
  _queueWcToastLayout();
}
function showWcToast(msg, _legacyBottom){
  if(!msg) return;
  if(!_wcToastResizeBound){
    _wcToastResizeBound = true;
    window.addEventListener('resize', syncWcToastStackPosition);
  }
  const t=document.createElement('div');
  t.className='gg-wc-toast';
  t.textContent=msg;
  document.body.appendChild(t);
  const item={el:t,timeout:null};
  _wcToastStack.push(item);
  _queueWcToastLayout();
  requestAnimationFrame(()=>{
    t.classList.add('show');
    _queueWcToastLayout();
  });
  item.timeout=setTimeout(()=>_removeWcToast(item),2200);
}

function appendWcNote(noteStr) {
    if (!S._wcNextShotNote) {
        S._wcNextShotNote = ` (${noteStr})`;
    } else {
        // If it already exists, replace the closing parenthesis with a comma, add the new note, and re-close it
        S._wcNextShotNote = S._wcNextShotNote.replace(')', `, ${noteStr})`);
    }
}
  
function applyWcGridMods(grid){
  const h=HOLES[S.holeIdx];

  if (S.zone === 'grn' && !S._pendingPuttResult && (WCS.greenReadQueued || WCS.greenReadActive)) {
    grid = activateGreenReadOnGrid(grid);
  }

  if (WCS.ferrettActive && S.zone === 'sand' && S.yrdRemain <= 87) {
    WCS.ferrettActive = false; 
    S._ferrettArmedShot = true;
    showWcToast('🦡 The Ferrett activated!'); appendWcNote('🦡 The Ferrett');
    grid = grid.map(r=>r.map(()=>Math.random()<.75?'hole':'grn'));
  }
  if (WCS.goldenPutterActive && S.zone === 'grn') {
    WCS.goldenPutterActive = false; 
    showWcToast('🥇 Golden Putter activated!'); appendWcNote('🥇 Golden Putter');
    grid = grid.map(r=>r.map(()=>'p1'));
  }
  if (WCS.holeWallActive && h.par === 3 && S.zone === 'tee') {
    WCS.holeWallActive = false; 
    showWcToast('🕳️ Hole In The Wall activated!'); appendWcNote('🕳️ Hole In The Wall');
    grid = grid.map(r=>r.map(c=>(c==='rgh'||c==='sand'||c==='fwy'||c==='ob')?'chip':'grn'));
  }
  if (WCS.hioActive && h.par === 3 && S.zone === 'tee') {
    WCS.hioActive = false; 
    showWcToast('🌟 Hole In One activated!'); appendWcNote('🌟 Hole In One');
    grid = grid.map(r=>r.map(()=>Math.random()<.80?'hole':'grn'));
  }
  if (WCS.birdieBoostActive && ['fwy','rgh','sand','chip'].includes(S.zone)) {
    const isApproach = S.yrdRemain <= 200 && S.yrdRemain > 35 && !(S.zone === 'sand' && S.yrdRemain > 87);
    if(!isApproach) return grid;
    WCS.birdieBoostActive = false; 
    S._rocketApproachPending = (S.zone === 'rgh' || S.zone === 'sand');
    showWcToast('🚀 Birdie Boost activated!'); appendWcNote('🚀 Birdie Boost');
    let eligible = [];
    const worseZones = new Set(['sand','rgh','fwy','h2o','ob','chip']);
    for(let r=0; r<6; r++) for(let c=0; c<6; c++) if(worseZones.has(grid[r][c])) eligible.push({r,c});
    eligible = shuffle(eligible).slice(0, 8);
    eligible.forEach(cell => { grid[cell.r][cell.c] = 'grn'; });
  }
  if (WCS.sandWedgeProActive && S.zone === 'sand') {
      WCS.sandWedgeProActive = false; 
      showWcToast('🏖️ Sand Wedge Pro activated!'); appendWcNote('🏖️ Sand Wedge Pro');
      grid = grid.map(r=>r.map(c=>Math.random() < 0.8 ? 'grn' : c));
  }
  if (WCS.highlightReelActive && S.zone === 'chip') {
      WCS.highlightReelActive = false; 
      S._highlightReelArmedShot = true;
      showWcToast('🎥 Highlight Reel activated!'); appendWcNote('🎥 Highlight Reel');
      grid = grid.map(r=>r.map(c=> (c !== 'hole' && Math.random() < 0.75) ? 'hole' : c));
  }

  return grid;
}

// ── WILDCARD REVEAL FLOW ──────────────────────────────
let _pendingWc=null;
function _resetWcRevealState(){
  const card = document.getElementById('wcCard');
  const rarityEl = document.getElementById('wcRevealRarity');
  const hintEl = document.getElementById('wcRevealHint');
  const actionsEl = document.getElementById('wcRevealActions');
  if(card){
    card.style.transition = 'none';
    card.classList.remove('revealed');
    void card.offsetHeight;
    card.style.transition = '';
  }
  if(rarityEl) rarityEl.classList.remove('revealed');
  if(hintEl) hintEl.style.display='block';
  if(actionsEl){
    actionsEl.style.display='none';
    actionsEl.innerHTML='';
  }
}

function triggerWcReveal(row, col){
  _pendingWc=randWildcard();
  if(TUT.active) _pendingWc = WILDCARDS.find(w=>w.id==='phantom_stroke');
  WCS.pendingRow=row;
  WCS.pendingCol=col;
  const rarityEl=document.getElementById('wcRevealRarity');
  document.getElementById('wcFrontIcon').textContent=_pendingWc.icon;
  document.getElementById('wcFrontName').textContent=_pendingWc.name;
  document.getElementById('wcFrontDesc').textContent=_pendingWc.desc;
  
  const front = document.querySelector('.wc-card-front');
  front.className = 'wc-card-face wc-card-front';
  if(rarityEl) rarityEl.style.color='var(--gold)';
  
  if (_pendingWc.weight === 50) {
    front.classList.add('rarity-common');
    if(rarityEl){
      rarityEl.textContent='COMMON';
      rarityEl.style.color='#5cd6ff';
    }
  }
  else if (_pendingWc.weight === 30) {
    front.classList.add('rarity-rare');
    if(rarityEl){
      rarityEl.textContent='RARE';
      rarityEl.style.color='#b66bff';
    }
  }
  else if (_pendingWc.weight === 15) {
    front.classList.add('rarity-epic');
    if(rarityEl){
      rarityEl.textContent='EPIC';
      rarityEl.style.color='#ff5f8f';
    }
  }
  else {
    front.classList.add('rarity-legendary');
    if(rarityEl){
      rarityEl.textContent='LEGENDARY';
      rarityEl.style.color='var(--gold)';
    }
  }

  _resetWcRevealState();
  document.getElementById('wcReveal').classList.add('show');
  document.body.style.overflow = 'hidden'; // Lock background scroll
  playSound('wildcard', 0.85);
  vibWildcard();
  if(TUT.active) setTimeout(() => _tutFire('wc_revealed'), 100);
}

function revealWcCard(){
  const card=document.getElementById('wcCard');
  if(card.classList.contains('revealed'))return;
  card.classList.add('revealed');
  if(_pendingWc && _pendingWc.weight === 5){
    unlockAchievement('my_precious');
  }
  const rarityEl=document.getElementById('wcRevealRarity');
  if(rarityEl) rarityEl.classList.add('revealed');
  document.getElementById('wcRevealHint').style.display='none';
  setTimeout(()=>{
    const actions=document.getElementById('wcRevealActions');
    actions.style.display='flex';
    actions.innerHTML=''; 
    if(WCS.equipped.length>=3){
      const fullBtn=document.createElement('button');
      fullBtn.className='wc-equip-btn';
      fullBtn.style.fontSize='16px';
      fullBtn.style.letterSpacing='1px';
      fullBtn.textContent='FULL — CHOOSE ONE TO REPLACE';
      fullBtn.onclick=showDiscardChoice;
      const discardNewBtn=document.createElement('button');
      discardNewBtn.className='wc-discard-outline-btn';
      discardNewBtn.textContent='DISCARD';
      if(TUT.active){
        discardNewBtn.disabled=true;
        discardNewBtn.classList.add('disabled');
      } else {
        discardNewBtn.onclick=discardAndProceed;
      }
      actions.appendChild(fullBtn);
      actions.appendChild(discardNewBtn);
    } else {
      const equipBtn=document.createElement('button');
      equipBtn.className='wc-equip-btn';
      equipBtn.id='wcEquipBtn';
      equipBtn.textContent='EQUIP';
      equipBtn.onclick=equipWildcard;
      const discardBtn=document.createElement('button');
      discardBtn.className='wc-discard-outline-btn';
      discardBtn.textContent='DISCARD';
      if(TUT.active){
        discardBtn.disabled=true;
        discardBtn.classList.add('disabled');
      } else {
        discardBtn.onclick=discardAndProceed;
      }
      actions.appendChild(equipBtn);
      actions.appendChild(discardBtn);
    }
  },400);
}

function equipWildcard(){
  if(!_pendingWc)return;
  if(WCS.equipped.length<3){
    WCS.equipped.push(_pendingWc);
    maybeUnlockHoarder();
  }
  closeWcReveal();
  if(TUT.active) _tutFire('wc_equipped');
}

function discardAndProceed(){
  const discarded = _pendingWc;
  const qualifiesRarityDiscard = !!discarded && (discarded.weight === 15 || discarded.weight === 5);
  if(discarded){
    trackWcDiscard();
  }
  _pendingWc=null;
  closeWcReveal();
  if(qualifiesRarityDiscard){
    unlockAchievement('thanks_but_no_thanks');
  }
}

function showDiscardChoice(){
  const actions=document.getElementById('wcRevealActions');
  actions.innerHTML='';
  const replaceGrid=document.createElement('div');
  replaceGrid.className='wc-replace-grid';
  WCS.equipped.forEach((wc,i)=>{
    const rarityMeta = getWildcardRarityMeta(wc);
    const b=document.createElement('button');
    b.className='wc-replace-btn';
    b.style.borderColor = rarityMeta.color;
    b.style.boxShadow = `0 0 0 1px ${rarityMeta.color}33`;
    b.innerHTML=`<span class="wc-replace-icon">${wc.icon}</span><span class="wc-replace-name">${wc.name}</span>`;
    b.onclick=()=>{
      WCS.equipped.splice(i,1);
      WCS.equipped.push(_pendingWc);
      maybeUnlockHoarder();
      closeWcReveal();
    };
    replaceGrid.appendChild(b);
  });
  actions.appendChild(replaceGrid);
  const keepBtn=document.createElement('button');
  keepBtn.className='wc-discard-outline-btn';
  keepBtn.style.cssText='width:100%;margin-top:0;font-size:18px;';
  keepBtn.textContent='DISCARD';
  if(TUT.active){
    keepBtn.disabled=true;
    keepBtn.classList.add('disabled');
  } else {
    keepBtn.onclick=discardAndProceed;
  }
  actions.appendChild(keepBtn);
}

function closeWcReveal(){
  document.getElementById('wcReveal').classList.remove('show');
  document.body.style.overflow = ''; // Restore scroll
  _resetWcRevealState();
  renderWcFab();
  renderWcDrawer();
  if(WCS.pendingRow!==null){
    const r=WCS.pendingRow, c=WCS.pendingCol;
    WCS.pendingRow=null; WCS.pendingCol=null;
    _pendingWc=null;
    setTimeout(()=>processShot(r,c),280);
  }
}
