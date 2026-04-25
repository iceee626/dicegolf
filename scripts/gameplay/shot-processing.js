// Dice Rolling, Shot Processing, Results, and Shot Log

function startDiceIdle(){
  if(window._diceIdleTimer) clearInterval(window._diceIdleTimer);
  const renderIdleFaces = (tick) => {
    const faces=[1,2,3,4,5,6];
    setDie('dp1',faces[tick%6]);
    setDie('dp2',faces[(tick+3)%6]);
    const d1=document.getElementById('die1'),d2=document.getElementById('die2');
    if(d1)d1.classList.add('idle');
    if(d2)d2.classList.add('idle');
  };
  let _idleTick=0;
  renderIdleFaces(_idleTick);
  window._diceIdleTimer=setInterval(()=>{
    if(S.rolling||S.holeDone){clearInterval(window._diceIdleTimer);window._diceIdleTimer=null;return;}
    _idleTick++;
    renderIdleFaces(_idleTick);
  },500);
}

function doRoll(){
  if(S.rolling||S.holeDone||_rerollChoiceActive)return;
  if(TUT.active && TUT.blocked) return;
  if(!TUT.active && gridFocusEnabled()) scrollToGrid();
  S.rolling=true;
  const rollBtn=document.getElementById('rollBtn');
  if(rollBtn){ rollBtn.disabled=true; rollBtn.classList.add('rolling-state'); }
  let r1=Math.ceil(Math.random()*6),r2=Math.ceil(Math.random()*6);
  
  // Tutorial: use fixed dice
  if(TUT.active){
    const td = tutGetDice();
    if(td){ r1=td.r; r2=td.c; }
  }

  // Anti-frustration: Max 2 consecutive hazards (Water/OB)
  if(!TUT.active && S.currentGrid) {
    let penCount = 0;
    for(let i=S.log.length-1; i>=0; i--){
        if(S.log[i].zk === 'h2o' || S.log[i].zk === 'ob') penCount++;
        else break;
    }
    if(penCount >= 2) {
        let attempts = 0;
        // Secretly reroll the dice until they land on a non-penalty cell
        while((S.currentGrid[r1-1][r2-1] === 'h2o' || S.currentGrid[r1-1][r2-1] === 'ob') && attempts < 50) {
            r1=Math.ceil(Math.random()*6);
            r2=Math.ceil(Math.random()*6);
            attempts++;
        }
    }
  }

  const d1=document.getElementById('die1'),d2=document.getElementById('die2');

  if(window._diceIdleTimer){clearInterval(window._diceIdleTimer);window._diceIdleTimer=null;}
  d1.classList.remove('rolling','landed','idle');
  d2.classList.remove('idle');
  void d1.offsetWidth;
  d1.classList.add('rolling');

  setTimeout(()=>{
    d2.classList.remove('rolling','landed');
    void d2.offsetWidth;
    d2.classList.add('rolling');
  },80);

  setTimeout(()=>{
    d1.classList.remove('rolling');
    setDie('dp1',r1);
    d1.classList.add('landed');
    vibDiceLand();
  },550);

  setTimeout(()=>{
    d2.classList.remove('rolling');
    setDie('dp2',r2);
    d2.classList.add('landed');
    vibDiceLand();
    setTimeout(()=>{
      if(r1===r2 && (wcEnabled() || TUT.active) && !S.holeDone){
        triggerWcReveal(r1-1,r2-1);
      } else {
        processShot(r1-1,r2-1);
      }
    }, 30);
  },650);
}

// ═══════════════════════════════════════
// SHOT PROCESSING
// ═══════════════════════════════════════
function cupMagnetCanPull(row,col){
  if(!S.currentGrid || !['p2','p3'].includes(S.currentGrid[row]?.[col])) return false;
  const orthogonalNeighbors = [
    [-1,0],
    [1,0],
    [0,-1],
    [0,1]
  ];
  for(const [dr, dc] of orthogonalNeighbors){
    const nr=row+dr, nc=col+dc;
    if(nr<0 || nr>5 || nc<0 || nc>5) continue;
    if(S.currentGrid[nr][nc] === 'p1') return true;
  }
  return false;
}

function freezeCurrentGridForFinish(){
  const ax = document.getElementById('gridAxes');
  if(ax) ax.classList.add('finish-grid-frozen');
  S._finishGridFrozenHTML = ax ? ax.innerHTML : null;
  const rollBtn=document.getElementById('rollBtn');
  const nextBtn=document.getElementById('nextShotBtn');
  if(rollBtn){
    rollBtn.textContent='FINISH HOLE';
    rollBtn.disabled=true;
    rollBtn.classList.remove('rolling-state');
    rollBtn.style.pointerEvents='none';
  }
  if(nextBtn) nextBtn.textContent='FINISH HOLE';
}

function processShot(row,col){
  S._preserveGrid=false;
  let outcome=S.currentGrid[row][col];
  litCell(row,col);
  const prevZone=S.zone;
  const prevYrdRemain=S.yrdRemain;
  const snapGrid=S.currentGrid.map(r=>[...r]);

  if(S.zone==='grn'){
    S._forceP1PuttGrid=false;
    const putts=outcome==='p1'?1:outcome==='p2'?2:3;
    let finalPutts=putts;
    let wcPuttNote = '';
    // Legacy save fallback: if Green Read survived without grid conversion, apply once here.
    if (WCS.greenReadActive) {
        WCS.greenReadActive = false;
        showWcToast('🌱 Green Read activated!');
        appendWcNote('🌱 Green Read');
        if (putts === 3) {
            finalPutts = 2;
        }
    }
    if (S._wcNextShotNote) {
        wcPuttNote = S._wcNextShotNote;
        S._wcNextShotNote = null;
    }
    if (WCS.cupMagnetActive && ['p2','p3'].includes(outcome) && cupMagnetCanPull(row,col)) {
        finalPutts = 1;
        WCS.cupMagnetActive = false;
        wcPuttNote += ' (🧲 Cup Magnet)';
        showWcToast('🧲 Cup Magnet activated!');
        unlockAchievement('magnetic_personality');
    }

    playShotSound('grn', outcome);
    const h_putt=HOLES[S.holeIdx];
    S.strokes+=finalPutts;S.yrdRemain=0;
    if (WCS.bogeyShieldActive && (S.strokes - h_putt.par) >= 1) {
        WCS.bogeyShieldActive = false;
        S.strokes = h_putt.par;
        wcPuttNote += ' (🛡️ Bogey Shield)';
        showWcToast('🛡️ Bogey Shield activated!');
    }
    S._pendingPuttResult={putts:finalPutts, row, col, snapGrid, prevZone};
    addLog(S.shotNum,`Green → ${finalPutts} putt${finalPutts>1?'s':''}${wcPuttNote}`,outcome,`+${finalPutts}`,false,row,col,snapGrid, prevZone, prevYrdRemain);
    S._tvShotNum = S.shotNum;
    S.shotNum += finalPutts;
    updateYrd();
    S.holeDone=false;

    {
      const d_putt=S.strokes-h_putt.par;
      const isHio_putt=(h_putt.par===3&&S.strokes===1);
      showCelebration(isHio_putt?-99:d_putt, ()=>{});
      S._skipCelebration=true;
    }

    const nextBtn=document.getElementById('nextShotBtn');
    if(nextBtn){
      nextBtn.textContent='FINISH HOLE';
      nextBtn.style.background='var(--c-tee)';
      nextBtn.onclick=()=>{
        if(_rerollChoiceActive) return;
        document.querySelectorAll('.celebration-overlay').forEach(e=>e.remove());
        const tutorialFinish = TUT.active;
        const b=document.getElementById('puttWcBtn');if(b)b.remove();
        S._pendingHoleFinish=null;
        freezeCurrentGridForFinish();
        _holdFinishBtn=true;
        S.holeDone=true;
        nextBtn.disabled=true;
        nextBtn.style.pointerEvents='none';
        updateTVBanner();
        try{ saveGameState(); }catch{}
        setTimeout(()=>{ if(tutorialFinish && !TUT.active) return; completeHole(); try{ saveGameState(); }catch{} },200);
      };
    }
    showNextShotBtn();
    renderWcFab();
    S._puttWcUsed=false;
    S.rolling=false;
    if(TUT.active) _tutFire('after_putt_shot');
    return;
  }

  let resolvedOutcome=outcome;
  let wcAppliedNote='';
  const rawOutcome = outcome;
  const addAppliedNote = note => { if(note) wcAppliedNote += note; };
  const consumeNextShotNote = () => {
    if (!S._wcNextShotNote) return '';
    const note = S._wcNextShotNote;
    S._wcNextShotNote = null;
    return note;
  };
  let bounceBackApplied = false;
  if (WCS.bounceBackReady && prevZone === 'tee') {
      WCS.bounceBackReady = false;
      resolvedOutcome = HOLES[S.holeIdx].par === 3 ? 'grn' : 'fwy';
      bounceBackApplied = true;
      addAppliedNote(' (🪃 Bounce Back)');
      showWcToast('🪃 Bounce Back activated!');
  }
  
  if (!bounceBackApplied && WCS.shortcutActive && prevZone === 'tee' && HOLES[S.holeIdx].par !== 3) {
      WCS.shortcutActive = false;
      resolvedOutcome = 'chip';
      addAppliedNote(' (⚡ Shortcut)');
      showWcToast('⚡ Shortcut activated!');
      if(HOLES[S.holeIdx].par === 5){
        unlockAchievement('express_route');
      }
  }
  if (!bounceBackApplied && WCS.luckyBounceActive && (rawOutcome === 'ob' || rawOutcome === 'h2o')) {
      resolvedOutcome = HOLES[S.holeIdx].par === 3 ? 'sand' : 'rgh';
      WCS.luckyBounceActive = false; 
      addAppliedNote(' (🍀 Lucky Bounce)');
      showWcToast('🍀 Lucky Bounce activated!');
  }
  if (!bounceBackApplied && WCS.mowersRevengeActive && rawOutcome === 'rgh') {
      resolvedOutcome = S.yrdRemain <= 87 ? 'grn' : 'fwy';
      addAppliedNote(' (🚜 Mower\'s Revenge)');
      showWcToast('🚜 Mower\'s Revenge activated!');
      S._landscaperRoughFixes = (S._landscaperRoughFixes || 0) + 1;
      if(S._landscaperRoughFixes >= 2){
        unlockAchievement('landscaper');
      }
  }
  else if (!bounceBackApplied && WCS.ironWillActive && rawOutcome === 'rgh') {
      resolvedOutcome = 'fwy';
      WCS.ironWillActive = false; 
      addAppliedNote(' (🔩 Iron Will)');
      showWcToast('🔩 Iron Will activated!');
  }
  if (WCS.cupMagnetActive && S.zone === 'grn' && resolvedOutcome !== 'p1' && cupMagnetCanPull(row,col)) {
      resolvedOutcome = 'p1';
      WCS.cupMagnetActive = false;
      addAppliedNote(' (🧲 Cup Magnet)');
      showWcToast('🧲 Cup Magnet activated!');
  }

  addAppliedNote(consumeNextShotNote());
  handleShotAchievementOutcome(resolvedOutcome, prevZone);

  if(resolvedOutcome==='h2o'||resolvedOutcome==='ob'){
    trackImmediateRoundAchievementProgress(resolvedOutcome, true);
    playShotSound(prevZone, resolvedOutcome);
    S.strokes+=2;
    addLog(S.shotNum,`${Z[prevZone].name} → ${Z[resolvedOutcome].name} — penalty`,resolvedOutcome,'+2 (pen)',true,row,col,snapGrid, prevZone, prevYrdRemain);
    showResult(Z[resolvedOutcome],'Penalty — no advance','pen',`Back in ${Z[prevZone].name} · ${fmtYds(S.yrdRemain)} left`);
    S.shotNum += 2;
    S._tvShotNum = S.shotNum - 2;
    S._preserveGrid = true;
    updateFloat();updateTVBanner();
    document.getElementById('resultPanel').classList.add('pflash');
    setTimeout(()=>document.getElementById('resultPanel').classList.remove('pflash'),600);
    setTimeout(()=>{S.rolling=false;showNextShotBtn();renderWcDrawer();
      if(TUT.active) tutAfterShot(resolvedOutcome);
    }, 400); // Reduced from 1100ms. Gives just enough time to read the penalty text.
    return;
  }

  trackImmediateRoundAchievementProgress(resolvedOutcome, false);

  if(resolvedOutcome==='hole'){
    const h=HOLES[S.holeIdx];
    if(h.par===3&&S.zone==='tee'){
      showHoleInConfirmation(row, col, snapGrid);
    } else {
      playShotSound(prevZone,'hole');
      S.strokes+=1;S.yrdRemain=0;S.zone='hole';
      addLog(S.shotNum,`⛳ Hole In!${wcAppliedNote}`,'hole','+1',false,row,col,snapGrid, prevZone, prevYrdRemain);
      showResult(Z.hole,'Hole In!','good',`Row ${row+1} · Col ${col+1}`);
      S._pendingHoleFinish={row,col,snapGrid,prevZone};
      S._tvShotNum = S.shotNum;
      S.shotNum++;
      S.holeDone=false;
      hidePostShotWcBtn();
      updateFloat();updateYrd();updateTVBanner();
      S.rolling=false;
      const nextBtn=document.getElementById('nextShotBtn');
      if(nextBtn){
        nextBtn.textContent='FINISH HOLE';
        nextBtn.style.background='var(--c-tee)';
        nextBtn.onclick=()=>{
          if(_rerollChoiceActive) return;
          document.querySelectorAll('.celebration-overlay').forEach(e=>e.remove());
          const tutorialFinish = TUT.active;
          const b=document.getElementById('puttWcBtn');if(b)b.remove();
          S._pendingHoleFinish=null;
          freezeCurrentGridForFinish();
          _holdFinishBtn=true;
          S.holeDone=true;
          nextBtn.disabled=true;
          nextBtn.style.pointerEvents='none';
          updateTVBanner();
          try{ saveGameState(); }catch{}
          setTimeout(()=>{ if(tutorialFinish && !TUT.active) return; completeHole(); try{ saveGameState(); }catch{} },200);
        };
      }
      showNextShotBtn();
      renderWcFab();
    }
    return;
  }

  playShotSound(prevZone, resolvedOutcome);
  // Outcome-specific haptics — subtle for good, stronger for trouble
  if(resolvedOutcome==='wtr' || resolvedOutcome==='ob'){ _doHaptic('HEAVY'); }
  else if(resolvedOutcome==='bkr' || resolvedOutcome==='rgh'){ _doHaptic('MEDIUM'); }
  else if(resolvedOutcome==='grn' || resolvedOutcome==='chip'){ _doHaptic('LIGHT'); }
  else { vibShot(); }

  S.strokes+=1;S.shotCount++;
  if(resolvedOutcome==='fwy')S.fwyVisits++;
  S.prevZone=prevZone;
  advanceYrd(resolvedOutcome);

  // Chip zone only near green (≤80m after advance); prevents chip from 301m etc.
  if(resolvedOutcome==='chip' && S.yrdRemain>87){
    resolvedOutcome=(prevZone==='fwy'||prevZone==='tee')?'fwy':'rgh';
  }
  if(resolvedOutcome==='grn'){
    let newDist = Math.round(3+Math.random()*22);
    if(S.yrdRemain > 0 && newDist > S.yrdRemain) {
        newDist = Math.max(1, Math.round(S.yrdRemain * (0.3 + Math.random() * 0.5)));
    }
    S.yrdRemain = newDist;
  }
  S.zone=resolvedOutcome;
  S._puttWcUsed=false;
  if(!S.zoneHistory)S.zoneHistory=[];
  S.zoneHistory.push(resolvedOutcome);
  if(S.zoneHistory.length>5)S.zoneHistory.shift();

  const yrdStr=S.yrdRemain>0?` · ${fmtYds(S.yrdRemain)} left`:' · on green';
  addLog(S.shotNum,`${Z[prevZone].name} → ${Z[resolvedOutcome].name}${yrdStr}${wcAppliedNote}`,resolvedOutcome,'+1',false,row,col,snapGrid, prevZone, prevYrdRemain);
  showResult(Z[resolvedOutcome],`${Z[prevZone].name} → ${Z[resolvedOutcome].name}`,'ok',
    S.yrdRemain>0?fmtYds(S.yrdRemain)+' to hole'+wcAppliedNote:'Reached the green'+wcAppliedNote);
  S.shotNum++; S._tvShotNum = S.shotNum - 1; updateFloat();updateYrd();updateTVBanner();

  // Trigger UI state changes instantly without artificial timeouts
  S.rolling=false;
  showNextShotBtn();
  updateTVBanner();
  renderWcFab();
  renderWcDrawer();
  if(TUT.active) tutAfterShot(resolvedOutcome);
}

function showNextShotBtn(immediate=false){ _setShotBtnState(true, immediate); }
function hideNextShotBtn(immediate=false){ _setShotBtnState(false, immediate); }
let _scrollGridTimeout;
function scrollToGrid() {
  window._disableTutScroll = true; // Tell the tutorial to skip its centering scroll
  clearTimeout(_scrollGridTimeout);
  setTimeout(() => {
    if (_skipGridScrollOnce) {
        _skipGridScrollOnce = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    const gridTitle = document.getElementById('gridTitle');
    const gridSec = document.querySelector('.grid-section');
    const header = document.querySelector('header');
    const target = gridTitle || gridSec;
    if (target) {
      const headerOffset = header ? header.offsetHeight : 0;
      const y = target.getBoundingClientRect().top + window.scrollY - headerOffset - 8;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
    _scrollGridTimeout = setTimeout(() => { window._disableTutScroll = false; }, 500); // Re-enable tutorial scroll
  }, 50);
}

function doNextShot(){
  if(S.holeDone||_rerollChoiceActive)return;
  S._mulliganJustFired=false;
  S._tvShotNum = S.shotNum;
  _holdFinishBtn=false;

  // Instantly trigger button swap
  hideNextShotBtn();
  // iOS spam protection: briefly block ROLL until the new grid is ready
  const rollBtnEl = document.getElementById('rollBtn');
  if(rollBtnEl){ rollBtnEl.disabled = true; }

  // Allow Safari to fully paint the button press state before building the heavy grid
  requestAnimationFrame(() => {
      setTimeout(() => {
          if(S._forceP1PuttGrid && S.zone === 'grn'){
            S.currentGrid=Array(6).fill(null).map(()=>Array(6).fill('p1'));
            document.getElementById('gridTitle').textContent='Putting Grid';
            renderGrid();
            S._forceGrid=false;
          }
          else if(S._forceGrid){S._forceGrid=false;}
          else if(S._preserveGrid){S._preserveGrid=false;}
          else{buildGrid();}

          updateZonePill();
          updateTVBanner();
          startDiceIdle();
          if(rollBtnEl && !S.rolling){ rollBtnEl.disabled = false; }

          if(!TUT.active && gridFocusEnabled()) scrollToGrid();
          if(TUT.active) _tutFire('next_shot_clicked');
      }, 20); // Small 20ms buffer guarantees UI responsiveness
  });
}

function showTailwindChoice(){
  _showTailwindDieChoice();
}

function _showTailwindDieChoice(){
  hidePostShotWcBtn();
  const wrap=document.createElement('div');
  wrap.id='postShotWcBtn';
  wrap.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7b2f9e,#4a1a6e);border-radius:12px;padding:12px 16px;z-index:80;box-shadow:0 4px 16px rgba(123,47,158,.5);display:flex;flex-direction:column;align-items:center;gap:8px;min-width:240px;';
  wrap.innerHTML='<div style="font-family:Bebas Neue,cursive;font-size:14px;letter-spacing:2px;color:#f0c040;margin-bottom:4px;">💨 RE-ROLL WHICH DIE?</div>';
  const btns=document.createElement('div');
  btns.style.cssText='display:flex;gap:8px;width:100%;';
  ['ROW','COL'].forEach((label,idx)=>{
    const b=document.createElement('button');
    b.style.cssText='background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:8px 0;font-family:Bebas Neue,cursive;font-size:14px;letter-spacing:1px;cursor:pointer;flex:1;line-height:1.2;';
    b.innerHTML=`${label}<br>DIE`;
    b.onclick=()=>{
      hidePostShotWcBtn();
      const newVal=Math.ceil(Math.random()*6);
      const r1=getDieVal('dp1');
      const r2=getDieVal('dp2');
      const newR1=idx===0?newVal:r1;
      const newR2=idx===1?newVal:r2;
      
      const dieId = idx===0 ? 'die1' : 'die2';
      const dpId = idx===0 ? 'dp1' : 'dp2';
      const d = document.getElementById(dieId);
      
      d.classList.remove('landed', 'idle');
      void d.offsetWidth;
      d.classList.add('rolling');
      
      setTimeout(() => {
        d.classList.remove('rolling');
        setDie(dpId, newVal);
      d.classList.add('landed');
      vibDiceLand();
        showWcToast(`💨 Tailwind activated!`, 86);
      appendWcNote('💨 Tailwind');
        
        // Flash the new cell on the grid so you see the change before processing
        litCell(newR1-1, newR2-1);
        
        // Wait 900ms before taking the shot so the player can read the grid
        setTimeout(()=>{
          setRerollChoiceActive(false);
          processShot(newR1-1,newR2-1);
        }, 900); 
      }, 850);
      
      renderWcFab();
    };
    btns.appendChild(b);
  });
  wrap.appendChild(btns);
  document.body.appendChild(wrap);
}

function _showPrecisionGripChoice(){
  hidePostShotWcBtn();
  const rowVal = getDieVal('dp1');
  const colVal = getDieVal('dp2');
  const originalOutcome = S.currentGrid?.[rowVal-1]?.[colVal-1];
  const originalWasPenalty = originalOutcome === 'h2o' || originalOutcome === 'ob';
  const wrap=document.createElement('div');
  wrap.id='postShotWcBtn';
  wrap.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7b2f9e,#4a1a6e);border-radius:12px;padding:12px 16px;z-index:80;box-shadow:0 4px 16px rgba(123,47,158,.5);display:flex;flex-direction:column;align-items:center;gap:8px;min-width:240px;';
  wrap.innerHTML='<div style="font-family:Bebas Neue,cursive;font-size:14px;letter-spacing:2px;color:#f0c040;margin-bottom:4px;">🧤 ADJUST WHICH DIE?</div>';
  const btns=document.createElement('div');
  btns.style.cssText='display:flex;gap:8px;width:100%;';
  ['ROW','COL'].forEach((label,idx)=>{
    const colWrap = document.createElement('div');
    colWrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1;';
    
    const title = document.createElement('div');
    title.style.cssText = 'font-family:Bebas Neue,cursive;font-size:12px;color:#fff;text-align:center;';
    title.textContent = label;
    colWrap.appendChild(title);

    ['-1','+1'].forEach(adj=>{
        const b=document.createElement('button');
        const delta = parseInt(adj, 10);
        const currentVal = idx===0 ? rowVal : colVal;
        const disabled = (currentVal === 1 && delta < 0) || (currentVal === 6 && delta > 0);
        b.style.cssText=`background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:6px 0;font-family:Bebas Neue,cursive;font-size:16px;cursor:${disabled?'not-allowed':'pointer'};width:100%;opacity:${disabled?'0.35':'1'};`;
        b.textContent=adj;
        b.disabled = disabled;
        b.onclick=()=>{
          if(disabled) return;
          hidePostShotWcBtn();
          const r1=getDieVal('dp1');
          const r2=getDieVal('dp2');
          let newVal = (idx===0 ? r1 : r2) + delta;
          if(newVal > 6) newVal = 6;
          if(newVal < 1) newVal = 1;

          const newR1=idx===0?newVal:r1;
          const newR2=idx===1?newVal:r2;
          const newOutcome = S.currentGrid?.[newR1-1]?.[newR2-1];
          const newIsPenalty = newOutcome === 'h2o' || newOutcome === 'ob';
          if(originalWasPenalty && !newIsPenalty){
            unlockAchievement('calculated_adjustment');
          }
          
          const dpId = idx===0 ? 'dp1' : 'dp2';
          setDie(dpId, newVal);
          showWcToast(`🧤 Precision Grip activated!`, 86);
          appendWcNote('🧤 Precision Grip');
          
          litCell(newR1-1, newR2-1);
          setTimeout(()=>{
            setRerollChoiceActive(false);
            processShot(newR1-1,newR2-1);
          }, 900); 
          renderWcFab();
        };
        colWrap.appendChild(b);
    });
    btns.appendChild(colWrap);
  });
  wrap.appendChild(btns);
  document.body.appendChild(wrap);
}
  
function showPostShotWcBtn(wcId, label, onUse){
  hidePostShotWcBtn();
  const btn=document.createElement('button');
  btn.id='postShotWcBtn';
  btn.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7b2f9e,#4a1a6e);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-family:Bebas Neue,cursive;font-size:16px;letter-spacing:2px;cursor:pointer;z-index:80;box-shadow:0 4px 16px rgba(123,47,158,.5);white-space:nowrap;';
  btn.textContent=label;
  btn.onclick=onUse;
  const skip=document.createElement('button');
  skip.style.cssText='position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:transparent;color:var(--muted);border:none;font-family:Sen,sans-serif;font-size:11px;letter-spacing:1px;cursor:pointer;z-index:80;';
  skip.textContent='skip →';
  skip.id='postShotSkipBtn';
  skip.onclick=()=>{
    WCS.active=null;
    hidePostShotWcBtn();
    document.getElementById('rollBtn').disabled=false;
    renderWcFab();
  };
  document.body.appendChild(btn);
  document.body.appendChild(skip);
}
function hidePostShotWcBtn(){
  const b=document.getElementById('postShotWcBtn');
  const s=document.getElementById('postShotSkipBtn');
  if(b)b.remove();
  if(s)s.remove();
}

// ═══════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════
function updateZonePill(){
  if(!document.getElementById('zonePill') || !document.getElementById('shotCtr')) return;
  const zd=Z[S.zone]||Z.tee;
  document.getElementById('zoneDot').style.background=zd.color;
  document.getElementById('zoneLabel').textContent=zd.name;
  document.getElementById('zonePill').style.borderColor=zd.color+'99';
  document.getElementById('shotCtr').textContent=`Shot ${S.shotNum}`;
}

function resetResult(){
  document.getElementById('resChip').style.background='var(--border)';
  document.getElementById('resChip').textContent='🎲';
  document.getElementById('resTitle').textContent='Ready to tee off';
  document.getElementById('resTitle').style.color='var(--muted)';
  document.getElementById('resSub').textContent='Roll the dice';
  document.getElementById('resBadge').textContent='';
}

function showResult(zd,title,mode,sub){
  document.getElementById('resChip').style.background=zd.color;
  document.getElementById('resChip').textContent=zd.emoji;
  document.getElementById('resTitle').textContent=title.toUpperCase();
  document.getElementById('resTitle').style.color=mode==='pen'?'#e05252':mode==='good'?'var(--gold)':'var(--text)';
  document.getElementById('resSub').textContent=sub;
  const b=document.getElementById('resBadge');
  if(mode==='pen'){b.textContent='+2';b.className='res-badge b-pen';}
  else if(mode==='good'){b.textContent='⛳';b.className='res-badge b-good';}
  else{b.textContent='';b.className='res-badge b-ok';}
}

function addLog(num,desc,zk,note,pen,row,col,gridSnap,prevZone,prevYrdRemain){
  S.log.push({num,desc,zk,note,pen,row,col,gridSnap,prevZone,prevYrdRemain});
  renderLog();
  saveGameState();
}
function getNetPenaltyCount(entries=S.log){
  const penaltyAdds = (entries||[]).filter(e=>e.pen).length;
  const penaltyRemovals = (entries||[]).filter(e=>String(e.desc||'').startsWith('Penalty removed (')).length;
  return Math.max(0, penaltyAdds - penaltyRemovals);
}

const _ZONE_ABBR={tee:'T',fwy:'F',rgh:'R',chip:'C',sand:'S',grn:'G',h2o:'W',ob:'OB',hole:'⛳'};
function _scoreDiffLabel(d){
  if(d==null) return null;
  if(d<=-3) return 'ALBATROSS';
  if(d<=-2) return 'EAGLE';
  if(d===-1) return 'BIRDIE';
  if(d===0) return 'PAR';
  if(d===1) return 'BOGEY';
  if(d===2) return 'DOUBLE BOGEY';
  if(d===3) return 'TRIPLE BOGEY';
  if(d===4) return 'QUADRUPLE';
  if(d===5) return 'QUINTUPLE';
  return `+${d}`;
}
function _scoreDiffColor(d){
  if(d==null) return 'var(--muted)';
  if(d<=-3) return '#ff6b9d';
  if(d<=-2) return 'var(--gold)';
  if(d===-1) return '#52c87a';
  if(d===0) return 'var(--c-fwyl)';
  return '#e05252';
}
function _scoreOutcomeColor(d, isHoleInOne=false){
  if(isHoleInOne) return 'var(--gold)';
  return _scoreDiffColor(d);
}
function _renderShotReplay(log, holeDone, scoreDiff){
  const trail = document.getElementById('hcShotTrail');
  const detail = document.getElementById('hcShotDetail');
  if(!trail || !detail){ return; }
  if(!log || !log.length){ trail.innerHTML=''; detail.innerHTML=''; return; }

  const resultLabel = _scoreDiffLabel(scoreDiff != null ? scoreDiff : null);
  const resultColor = _scoreDiffColor(scoreDiff != null ? scoreDiff : null);
  // -1 is the virtual "result pill" index
  const RESULT_IDX = log.length;

  function render(idx){
    trail.innerHTML = '';
    log.forEach((e, i) => {
      const fromZk = e.prevZone || e.zk || 'fwy';
      const zd = Z[fromZk] || Z.fwy;
      const abbr = _ZONE_ABBR[fromZk] || fromZk.substring(0,2).toUpperCase();
      const isActive = i === idx;
      if(i > 0){
        const arr = document.createElement('span');
        arr.textContent = '→';
        arr.style.cssText = 'color:var(--muted);font-size:10px;flex-shrink:0;';
        trail.appendChild(arr);
      }
      const pill = document.createElement('button');
      pill.textContent = abbr;
      pill.style.cssText = `flex-shrink:0;width:32px;height:32px;border-radius:8px;cursor:pointer;font-family:'Bebas Neue',cursive;font-size:14px;letter-spacing:1px;padding:0;display:flex;align-items:center;justify-content:center;transition:transform .18s cubic-bezier(.22,1,.36,1),background .18s ease,border-color .18s ease,box-shadow .18s ease;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 8px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.08);${isActive?`background:${zd.color};color:#fff;border:1px solid rgba(255,255,255,.35);`:'background:rgba(255,255,255,.1);color:var(--muted);border:1px solid rgba(255,255,255,.18);'}`;
      pill.onclick = () => render(i);
      trail.appendChild(pill);
    });
    // Result pill (⛳ + BIRDIE etc.)
    if(resultLabel != null){
      const rarr = document.createElement('span');
      rarr.textContent = '→';
      rarr.style.cssText = 'color:var(--muted);font-size:10px;flex-shrink:0;';
      trail.appendChild(rarr);
      const rpill = document.createElement('button');
      rpill.textContent = '⛳';
      const isResultActive = idx === RESULT_IDX;
      rpill.style.cssText = `flex-shrink:0;width:32px;height:32px;border-radius:8px;cursor:pointer;font-family:'Bebas Neue',cursive;font-size:16px;letter-spacing:0;padding:0;display:flex;align-items:center;justify-content:center;transition:transform .18s cubic-bezier(.22,1,.36,1),background .18s ease,border-color .18s ease,box-shadow .18s ease;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 8px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.08);${isResultActive?`background:rgba(255,255,255,.2);border:1px solid ${resultColor};`:'background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);'}`;
      rpill.onclick = () => render(RESULT_IDX);
      trail.appendChild(rpill);
    }
    if(idx === RESULT_IDX){
      // Show result summary card
      detail.innerHTML = `
        <div style="width:44px;height:44px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);">⛳</div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;">
          <div style="font-family:'Bebas Neue',cursive;font-size:19px;letter-spacing:2px;color:${resultColor};line-height:1.1;">${resultLabel}</div>
        </div>`;
      return;
    }
    const e = log[idx];
    const fromZk = e.prevZone || e.zk || 'fwy';
    const zOutcome = Z[e.zk] || Z.fwy;
    const chipColor = zOutcome.color;
    const chipEmoji = zOutcome.emoji || '🎲';
    const descStr = String(e.desc||'');
    let titleStr = descStr;
    let subStr = '';
    const sepIdx = descStr.indexOf(' · ');
    if(sepIdx >= 0){
      titleStr = descStr.substring(0, sepIdx);
      subStr = descStr.substring(sepIdx + 3);
    } else {
      const wcMatch = titleStr.match(/^(.+?)\s*(\([^)]+\))\s*$/);
      if(wcMatch){ titleStr = wcMatch[1].trim(); subStr = wcMatch[2]; }
    }
    if(ACTIVE_COURSE_ID === 'septembra-national'){
      titleStr = titleStr.replace(/→/g, '->').toUpperCase();
    }
    detail.innerHTML = `
      <div class="res-chip" style="background:${chipColor};width:44px;height:44px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;">${chipEmoji}</div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-family:'Bebas Neue',cursive;font-size:19px;letter-spacing:1.5px;color:var(--text);line-height:1.2;">${titleStr}</div>
        ${subStr?`<div style="font-family:'Sen',sans-serif;font-size:11px;color:var(--muted);margin-top:3px;line-height:1.25;">${subStr}</div>`:''}
      </div>`;
  }
  render(0);
}

function renderLog(targetEl,data){
  const el=targetEl||document.getElementById('logList');
  const entries=data||S.log;
  el.innerHTML='';
  [...entries].reverse().forEach(e=>{
    const zd=Z[e.zk]||Z.fwy;
    const d=document.createElement('div');d.className='log-entry';
    d.innerHTML=`<div class="log-n">${e.num}</div><div class="log-dot" style="background:${zd.color}"></div><span style="color:var(--text);flex:1">${e.desc}</span>${(e.note&&e.note!=='+1')?`<span class="log-r" style="color:${e.pen?'#e05252':'var(--muted)'}">${e.note}</span>`:''}`;
    el.appendChild(d);
  });
}

function updateFloat(){updateTVBanner();}
