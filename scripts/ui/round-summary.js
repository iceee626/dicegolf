// Round Summary, History Detail, and Inline Replay UI

function openSummary(viewRound = S.currentRound, backTarget = _summaryBackTarget){
  if(_summaryContext && _summaryContext.mode === 'versus'){
    openVersusSummary(viewRound, backTarget);
    return;
  }
  setSummaryContext(null);
  document.getElementById('overlay').classList.remove('show');
  if(backTarget === 'hcScreen'){
    setMainAppConcealed(true);
    hideMainAppImmediate();
  } else {
    concealMainApp();
  }
  _summaryBackTarget = backTarget || null;
  closeSummaryHoleModal();
  const body=document.getElementById('sumBody'); 
  body.innerHTML='';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.flex = '1';
  body.style.minHeight = '0';
  body.scrollTop = 0;
  const backBtn=document.getElementById('sumBackBtn');
  const backSpacer=document.getElementById('sumHeadSpacer');
  if(backBtn){ backBtn.style.display='flex'; backBtn.style.visibility = _summaryBackTarget ? 'visible' : 'hidden'; }
  if(backSpacer){ backSpacer.style.display='block'; backSpacer.style.visibility = _summaryBackTarget ? 'hidden' : 'visible'; }
  
  document.getElementById('sumTitle').textContent='SUMMARY';

  const isOverallStats = viewRound === 'overall';
  const scorecardRound = typeof viewRound === 'number'
    ? viewRound
    : Math.max(1, Math.min(S.currentRound || 1, S.totalRounds || 1));
  const scData = S.scorecards[scorecardRound - 1] || Array(18).fill(null);
  const histData = S.histories[scorecardRound - 1] || Array(18).fill(null);
  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);

  const roundTotal = scData.reduce((a,b)=>a+(b||0),0);
  const roundPar = activeHoles.reduce((a,h)=>a+h.par,0);
  const roundDiff = roundTotal - roundPar;

  let globalTotal = 0, globalPar = 0;
  S.scorecards.forEach(sc => sc.forEach((s, i) => { if(s!==null){ globalTotal+=s; globalPar+=HOLES[i].par; } }));
  const globalDiff = globalTotal - globalPar;
  const gDiffStr = globalDiff===0?'E':globalDiff>0?`+${globalDiff}`:`${globalDiff}`;
  const roundStats = getRoundStats(isOverallStats ? 'overall' : scorecardRound);

  const statsHead = document.createElement('div');
  statsHead.className = 'sum-section-head';
  statsHead.innerHTML = `<div class="ttl">STATISTICS</div><div class="line"></div>`;
  if(S.totalRounds > 1){
    const pillWrap = document.createElement('div');
    pillWrap.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';
    const allPill = document.createElement('button');
    allPill.className = `sum-tab${isOverallStats ? ' active' : ''}`;
    allPill.textContent = 'ALL';
    allPill.onclick = () => openSummary('overall', backTarget);
    pillWrap.appendChild(allPill);
    for(let r=1; r<=S.totalRounds; r++){
      if(r > S.currentRound && S.currentRound !== S.totalRounds && !S.scorecards[r-1]) continue;
      const pill = document.createElement('button');
      pill.className = `sum-tab${!isOverallStats && r === scorecardRound ? ' active' : ''}`;
      pill.textContent = `R${r}`;
      pill.onclick = () => openSummary(r, backTarget);
      pillWrap.appendChild(pill);
    }
    statsHead.appendChild(pillWrap);
  }
  body.appendChild(statsHead);
  const statsList = document.createElement('div');
  statsList.className = 'sum-stats-list';
  roundStats.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'sum-stats-row';
    row.innerHTML = `<div class="lbl">${s.label}</div><div class="val">${s.val}</div>`;
    statsList.appendChild(row);
  });
  body.appendChild(statsList);

  const scoreHead = document.createElement('div');
  scoreHead.className = 'sum-section-head';
  scoreHead.innerHTML = `<div class="ttl">SCORECARD</div><div class="line"></div>`;
  body.appendChild(scoreHead);
  
  let tournamentTotalBox = null;
  if (S.totalRounds > 1) {
    tournamentTotalBox = document.createElement('div');
    tournamentTotalBox.style.cssText = 'background:var(--summary-chip-bg);border:1px solid var(--summary-chip-border);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;';
    tournamentTotalBox.innerHTML = `
      <div><div style="font-family:'Sen',sans-serif;font-size:10px;color:var(--gold);letter-spacing:1px;">TOURNAMENT TOTAL</div><div style="font-family:'Sen',sans-serif;font-size:12px;color:var(--text);">${globalTotal} strokes</div></div>
      <div style="font-family:'Bebas Neue',cursive;font-size:28px;color:var(--gold);">${gDiffStr}</div>
    `;
  }

  const sc=document.createElement('div');
  sc.className = 'sc-table-wrapper';
  sc.style.cssText='display:block;overflow-x:auto;overflow-y:hidden;flex-shrink:0;margin-bottom:14px;background:var(--card);border:1px solid var(--border);border-radius:10px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:none;transform:translateZ(0);';
  const table=document.createElement('table');
  const minW = activeHoles.length <= 9 ? '100%' : `${Math.max(320, (activeHoles.length + 2) * 34)}px`;
  table.style.cssText=`width:100%;min-width:${minW};border-collapse:collapse;font-family:"Sen",sans-serif;font-size:10px;`;
  
  const td=(txt,styles='',cls='')=>{
    const c=document.createElement('td'); c.textContent=txt;
    c.style.cssText='padding:5px 3px;text-align:center;border:1px solid var(--border);'+styles;
    if(cls)c.className=cls; return c;
  };

  const headRow=document.createElement('tr');
  headRow.style.background='var(--c-fwy)';
  ['HOLE', ...activeHoles.map((_,i)=>S.startIdx+i+1), 'TOT'].forEach((v,i)=>{
    headRow.appendChild(td(v,'color:#fff;font-weight:600;font-size:10px;letter-spacing:1px;'+(i===0?'text-align:left;padding-left:8px;':'')+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);':'')));
  });
  table.appendChild(headRow);

  const parRow=document.createElement('tr');
  parRow.style.background='rgba(255,255,255,.04)';
  ['PAR', ...activeHoles.map(h=>h.par), roundPar].forEach((v,i)=>{
    parRow.appendChild(td(v,'color:var(--muted);'+(i===0?'text-align:left;padding-left:8px;color:var(--text);':'')+(i===activeHoles.length+1?'font-weight:600;color:var(--text);':'')));
  });
  table.appendChild(parRow);

  const scoreRow=document.createElement('tr');
  scoreRow.style.background='rgba(255,255,255,.03)';
  const scoreCells=[PLAYER_NAME, ...activeHoles.map((h,i)=>scData[S.startIdx+i] !== null ? scData[S.startIdx+i] : '–'), roundTotal];
  scoreCells.forEach((v,i)=>{
    const cell=document.createElement('td');
    cell.style.cssText='padding:3px 2px;text-align:center;border:1px solid var(--border);font-size:11px;font-weight:700;'+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);':'');
    if(i===0){
      cell.textContent=v;
      cell.style.cssText+='text-align:left;padding-left:8px;font-family:"Bebas Neue",cursive;font-size:13px;letter-spacing:1px;';
    } else if(i===activeHoles.length+1){
      cell.textContent=v; cell.style.color=roundDiff<0?'var(--gold)':roundDiff>0?'#e05252':'var(--c-fwyl)';
    } else {
      const score=scData[S.startIdx + i - 1];
      const h=activeHoles[i-1];
      if(score===null){cell.textContent='–';cell.style.color='var(--muted)';}
      else {
        const d=score-h.par;
        const span=document.createElement('span'); 
        span.textContent=v;
        span.className = 'sc-sym';
        
        if(d<=-2)       span.classList.add('sc-sym-eagle');
        else if(d===-1) span.classList.add('sc-sym-birdie');
        else if(d===0)  { /* just text, no border */ }
        else if(d===1)  span.classList.add('sc-sym-bogey');
        else            span.classList.add('sc-sym-double');
        
        cell.appendChild(span);
      }
    }
    scoreRow.appendChild(cell);
  });
  table.appendChild(scoreRow);

  const diffRow=document.createElement('tr');
  diffRow.style.background='rgba(0,0,0,.15)';
  let runningDiff=0;
  ['±',...activeHoles.map((h,i)=>{
    const score=scData[S.startIdx+i];
    if(score===null)return null;
    runningDiff+=score-h.par; return runningDiff;
  }),roundDiff].forEach((v,i)=>{
    const cell=document.createElement('td');
    cell.style.cssText='padding:4px 2px;text-align:center;border:1px solid var(--border);font-family:"Sen",sans-serif;font-size:9px;'+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);font-weight:700;':'')+(i===0?'text-align:left;padding-left:8px;':'');
    if(i===0 || v===null){cell.textContent=v===null?'–':'±';cell.style.color='var(--muted)';diffRow.appendChild(cell);return;}
    const txt=v===0?'E':v>0?`+${v}`:`${v}`;
    cell.textContent=txt;
    if(v<0)cell.style.color='var(--gold)'; else if(v===0)cell.style.color='var(--c-fwyl)'; else cell.style.color='#e05252';
    diffRow.appendChild(cell);
  });
  table.appendChild(diffRow);
  sc.appendChild(table);
  body.appendChild(sc);
  if(tournamentTotalBox) body.appendChild(tournamentTotalBox);
  if(S.cpuMode && S.cpuField && typeof renderCpuLeaderboardInto === 'function'){
    renderCpuLeaderboardInto(body, {
      field: S.cpuField,
      holes: HOLES,
      playerName: PLAYER_NAME,
      playerScores: S.scorecards,
      currentRound: isOverallStats ? S.currentRound : scorecardRound
    });
  }

  const detailSec=document.createElement('div');
  detailSec.className = 'sum-detail-hint';
  detailSec.textContent='Tap a hole for details';
  body.appendChild(detailSec);

  const holeList=document.createElement('div');
  holeList.className='sum-hole-list';
  activeHoles.forEach((h,i)=>{
    const absoluteIdx = S.startIdx + i;
    const hist=histData[absoluteIdx];
    if(!hist)return; 
    
    const d=hist.strokes-hist.par;
    let numColor='var(--text)';
    if(h.par===3 && hist.strokes===1) numColor='var(--gold)';
    else if(d<=-2) numColor='var(--gold)';
    else if(d===-1) numColor='#52c87a';
    else if(d===0) numColor='var(--text)';
    else if(d===1) numColor='#e05252';
    else numColor='#c04444';

    const row=document.createElement('div');
    row.className = 'sum-hole-pill';
    row.dataset.holeIdx=String(absoluteIdx);
    row.style.background = 'rgba(255,255,255,.07)';
    row.style.position = 'relative';
    const hasWc = hist.wcsUsed && hist.wcsUsed.length > 0;
    row.style.overflow = 'hidden';
    row.innerHTML=`<div class="shp-num" style="color:${numColor};">${absoluteIdx+1}</div>${hasWc?'<div style="position:absolute;top:4px;right:4px;font-size:7px;line-height:1;pointer-events:none;opacity:.9;">🃏</div>':''}`;
    row.onclick=()=>openHistInline(absoluteIdx, holeList, row, scorecardRound);
    holeList.appendChild(row);
  });
  body.appendChild(holeList);

  const spacer=document.createElement('div');
  spacer.style.cssText='flex:1 1 auto;min-height:8px;';
  body.appendChild(spacer);

  const btnRow=document.createElement('div');
  btnRow.className = 'sum-btn-row';
  btnRow.style.flexShrink = '0';
  
  if (S.currentRound < S.totalRounds && S.holeDone) {
    const nextRndBtn=document.createElement('button');
    nextRndBtn.style.cssText='width:100%;background:var(--c-fwy);color:#fff;border:none;border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
    nextRndBtn.textContent=`START ROUND ${S.currentRound + 1}`;
    nextRndBtn.onclick=startNextRound;
    
    const returnBtn=document.createElement('button');
    returnBtn.style.cssText='width:100%;background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
    returnBtn.textContent='SAVE & MENU';
    returnBtn.onclick=()=>summarySaveAndMenu();
    
    btnRow.appendChild(nextRndBtn);
    btnRow.appendChild(returnBtn);
  } else {
    const returnBtn=document.createElement('button');
    returnBtn.style.cssText='width:100%;background:var(--c-fwy);color:#fff;border:none;border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
    returnBtn.textContent='RETURN TO MAIN MENU';
    returnBtn.onclick=()=>summaryReturnToMenu();
    btnRow.appendChild(returnBtn);
    
    if (S.currentRound === S.totalRounds && S.holeDone) {
      const playAgainBtn=document.createElement('button');
      playAgainBtn.style.cssText='width:100%;background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
      playAgainBtn.textContent='PLAY AGAIN';
      playAgainBtn.onclick=()=>summaryPlayAgain();
      btnRow.appendChild(playAgainBtn);
    }
  }
  
  body.appendChild(btnRow);
  const summaryModal = document.getElementById('summaryModal');
  summaryModal.scrollTop = 0;
  summaryModal.classList.add('show');
}

function closeSummary(){
  closeSummaryHoleModal();
  document.getElementById('summaryModal').classList.remove('show');
  _summaryBackTarget = null;
  setSummaryContext(null);
  setTimeout(()=>{
    if(S.holeIdx >= S.endIdx && S.holeDone && S.currentRound === S.totalRounds){
      returnToMenu();
    } else {
      revealMainApp();
    }
  },220);
}

function summaryGoBack(){
  closeSummaryHoleModal();
  const target=_summaryBackTarget;
  _summaryBackTarget = null;
  setSummaryContext(null);
  if(target === 'hcScreen'){
    _setNavDir('back');
    const hc = document.getElementById('hcScreen');
    const summaryModal = document.getElementById('summaryModal');
    setMainAppConcealed(true);
    hideMainAppImmediate();
    if(hc) hc.classList.add('show');
    requestAnimationFrame(()=>{ if(summaryModal) summaryModal.classList.remove('show'); });
    return;
  }
  if(target === 'overlay'){
    const overlay=document.getElementById('overlay');
    if(overlay) overlay.classList.add('show');
    requestAnimationFrame(()=>document.getElementById('summaryModal').classList.remove('show'));
    return;
  }
  document.getElementById('summaryModal').classList.remove('show');
  setTimeout(()=>{
    if(S.holeIdx >= S.endIdx && S.holeDone && S.currentRound === S.totalRounds){
      returnToMenu();
    } else {
      revealMainApp();
    }
  },220);
}

function summaryReturnToMenu(){
  closeSummaryHoleModal();
  _summaryBackTarget = null;
  setSummaryContext(null);
  returnToMenu({preserveSummary:true});
  requestAnimationFrame(()=>document.getElementById('summaryModal').classList.remove('show'));
  setTimeout(()=>clearCourseVisualTheme(), 220);
}

function summarySaveAndMenu(){
  closeSummaryHoleModal();
  _summaryBackTarget = null;
  setSummaryContext(null);
  returnToMenuSave({preserveSummary:true});
  requestAnimationFrame(()=>document.getElementById('summaryModal').classList.remove('show'));
  setTimeout(()=>clearCourseVisualTheme(), 220);
}

function restoreReplaySetupFromCurrentState(versusReplay){
  const restoredCourseId = normalizeCourseId(
    S.courseId || (versusReplay ? VS.setup?.course : SETUP.course) || DEFAULT_COURSE_ID
  );

  if(versusReplay){
    VS.active = true;
    if(!VS.setup){
      VS.setup = { rounds:1, holesConfig:'18', diff:1, course:null, courseSelected:false };
    }
    VS.setup.course = restoredCourseId;
    VS.setup.courseSelected = true;
    VS.setup.rounds = Math.max(1, S.totalRounds || VS.setup.rounds || 1);
    VS.setup.holesConfig = S.holesConfig || VS.setup.holesConfig || '18';
    VS.setup.diff = Math.max(1, Math.min(3, GAME_DIFF || VS.setup.diff || 1));

    SETUP.mode = 'custom';
    SETUP.rounds = VS.setup.rounds;
    SETUP.holesConfig = VS.setup.holesConfig;
    SETUP.course = restoredCourseId;
    SETUP.courseSelected = true;
    GAME_DIFF = VS.setup.diff;
    return;
  }

  VS.active = false;
  SETUP.mode = S.mode || SETUP.mode || 'single';
  SETUP.rounds = Math.max(1, S.totalRounds || SETUP.rounds || 1);
  SETUP.holesConfig = S.holesConfig || SETUP.holesConfig || '18';
  SETUP.opponent = S.cpuMode ? 'cpu' : 'solo';
  SETUP.course = restoredCourseId;
  SETUP.courseSelected = true;
}

function captureReplayProfileProgress(){
  try{
    const profiles = loadProfiles();
    const idx = Math.min(getActiveProfileIdx(), profiles.length - 1);
    const p = profiles[idx];
    if(!p) return null;
    return { idx, id:p.id || '', profile:JSON.parse(JSON.stringify(p)) };
  }catch{return null;}
}

function restoreReplayProfileProgress(snapshot){
  if(!snapshot || !snapshot.profile) return;
  try{
    const profiles = loadProfiles();
    const idx = snapshot.id
      ? profiles.findIndex(p => p && p.id === snapshot.id)
      : snapshot.idx;
    if(idx < 0 || !profiles[idx]) return;
    const before = snapshot.profile;
    const current = profiles[idx];
    ensureProfileDefaults(before);
    ensureProfileDefaults(current);

    const achievements = new Set([...(before.achievements || []), ...(current.achievements || [])]);
    current.achievements = [...achievements];

    Object.keys(before).forEach(key => {
      if(typeof before[key] === 'number'){
        if(key === 'bestDiff'){
          if(current[key] === undefined || before[key] < current[key]) current[key] = before[key];
        } else {
          current[key] = Math.max(current[key] || 0, before[key] || 0);
        }
      }
    });

    if(before.bestDiff !== undefined && (current.bestDiff === undefined || before.bestDiff < current.bestDiff)){
      current.bestDiff = before.bestDiff;
    }
    if(before.scoreBuckets && typeof before.scoreBuckets === 'object'){
      current.scoreBuckets = current.scoreBuckets || {};
      Object.keys(before.scoreBuckets).forEach(key => {
        current.scoreBuckets[key] = Math.max(current.scoreBuckets[key] || 0, before.scoreBuckets[key] || 0);
      });
    }

    profiles[idx] = current;
    saveProfiles(profiles);
  }catch{}
}

function summaryPlayAgain(){
  closeSummaryHoleModal();
  setMainAppConcealed(true);
  hideMainAppImmediate();
  const summaryModal = document.getElementById('summaryModal');
  const overlay = document.getElementById('overlay');
  _summaryBackTarget = null;
  const hc = document.getElementById('hcScreen');
  if(hc) hc.classList.remove('show');
  clearRoundStartSplash();
  const versusReplay = !!(_summaryContext && _summaryContext.mode === 'versus');
  const profileProgress = captureReplayProfileProgress();
  restoreReplaySetupFromCurrentState(versusReplay);
  setSummaryContext(null);
  startGame();
  restoreReplayProfileProgress(profileProgress);
  if(summaryModal) summaryModal.classList.remove('show');
  if(overlay) overlay.classList.remove('show');
  document.querySelector('.tv-bar')?.classList.add('show');
}

function renderHistGrid(wrap, snapGrid, log, logIdx) {
  if (!snapGrid) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'hgrid';
  
  const corner = document.createElement('div');
  grid.appendChild(corner);
  for(let c=1; c<=6; c++){ const ax = document.createElement('div'); ax.className='hax'; ax.textContent=c; grid.appendChild(ax); }
  
  const alwaysLabels = getCellLabelMode() === 'always';
  
  for(let r=0; r<6; r++){
    const rAx = document.createElement('div'); rAx.className='hax'; rAx.textContent=r+1; grid.appendChild(rAx);
    for(let c=0; c<6; c++){
      const zk = snapGrid[r][c];
      const zd = Z[zk] || Z.fwy;
      const cell = document.createElement('div');
      cell.className = `hcell ${zd.cls}`;
      
      // 1. Apply labels just like the main game grid
      const abbr={ob:'OB',h2o:'H₂O',hole:'⛳',p1:'1P',p2:'2P',p3:'3P'};
      const alwaysName={h2o:'WATER',ob:'OB',grn:'GREEN',fwy:'FAIRWAY',rgh:'ROUGH',chip:'CHIP',sand:'SAND',tee:'TEE',hole:'HOLE',p1:'1P',p2:'2P',p3:'3P'};
      
      let baseText = '';
      if(alwaysLabels){
        baseText = (alwaysName[zk]||zd.name).toUpperCase();
        cell.style.cssText='font-size:5px;line-height:1.1;text-align:center;padding:1px;word-break:break-word;font-weight:700;';
      } else if(abbr[zk]){
        baseText = abbr[zk];
      }
      cell.innerHTML = baseText;

      // 2. Make them clickable if labels aren't always showing
      if(!alwaysLabels){
        cell.addEventListener('click', () => flipCell(cell, zd));
      }
      
      // 3. Display only the currently selected shot
      let shots = [];
      if (log[logIdx] && log[logIdx].row === r && log[logIdx].col === c) {
        shots.push(log[logIdx].num);
        cell.classList.add('hlit');
      }
      
      if (shots.length > 0) {
        const shotText = shots.join(',');
        // Shrink the font slightly if there are multiple shots so it fits in the box
        const fontSize = shots.length > 1 ? '4.5px' : '6px';
        // Added a semi-transparent background so it's readable over the text labels
        cell.innerHTML += `<span class="shot-marker" style="font-size:${fontSize}; background:rgba(0,0,0,0.5); padding:1px 2px; border-radius:3px;">${shotText}</span>`;
      }
      
      grid.appendChild(cell);
    }
  }
  wrap.appendChild(grid);
}

function highlightInlineGrid(idx, log, container) {
  container.querySelectorAll('.hlog-entry').forEach(e => e.style.borderColor='transparent');
  const entry = container.querySelector(`#ihl-entry-${idx}`);
  if(entry) entry.style.borderColor='var(--c-fwyl)';
  const wrap = container.querySelector('#inlineHistGrid');
  if(wrap) renderHistGrid(wrap, log[idx].gridSnap, log, idx);
}  

let _summaryHoleActiveRow = null;
let _summaryHoleCloseTimer = null;

function ensureSummaryHoleModal(){
  const summaryCard = document.querySelector('#summaryModal .summary-card');
  if(!summaryCard) return null;
  let modal = document.getElementById('sumHoleDetailModal');
  if(modal) return modal;
  modal = document.createElement('div');
  modal.id = 'sumHoleDetailModal';
  modal.className = 'sum-hole-modal';
  modal.innerHTML = `
    <div class="sum-hole-card">
      <div class="sum-hole-head">
        <div class="sum-hole-ttl" id="sumHoleDetailTitle">HOLE DETAILS</div>
        <button class="sum-hole-close" onclick="closeSummaryHoleModal()" aria-label="Close">✕</button>
      </div>
      <div class="sum-hole-body" id="sumHoleDetailBody"></div>
    </div>
  `;
  modal.addEventListener('click', e=>{
    if(e.target === modal) closeSummaryHoleModal();
  });
  summaryCard.appendChild(modal);
  return modal;
}

function closeSummaryHoleModal(){
  const modal = document.getElementById('sumHoleDetailModal');
  if(modal){
    if(_summaryHoleCloseTimer){
      clearTimeout(_summaryHoleCloseTimer);
      _summaryHoleCloseTimer = null;
    }
    if(modal.classList.contains('show') && !modal.classList.contains('closing')){
      modal.classList.add('closing');
      _summaryHoleCloseTimer = setTimeout(()=>{
        modal.classList.remove('closing');
        modal.classList.remove('show');
        _summaryHoleCloseTimer = null;
      }, 210);
    } else {
      modal.classList.remove('closing');
      modal.classList.remove('show');
    }
  }
  if(_summaryHoleActiveRow){
    _summaryHoleActiveRow.classList.remove('active');
    _summaryHoleActiveRow = null;
  }
}

function openHistInline(absoluteIdx, holeList, targetRow, roundIdx){
  const roundHist = S.histories[roundIdx-1] || [];
  const hist = roundHist[absoluteIdx];
  if(!hist) return;

  const modal = ensureSummaryHoleModal();
  if(!modal) return;
  if(_summaryHoleActiveRow && _summaryHoleActiveRow !== targetRow){
    _summaryHoleActiveRow.classList.remove('active');
  }
  if(targetRow){
    targetRow.classList.add('active');
    _summaryHoleActiveRow = targetRow;
  }

  const hole = HOLES[absoluteIdx];
  const d = hist.strokes - hist.par;
  let resultLabel = d===0 ? 'PAR' : d>0 ? `+${d}` : `${d}`;
  if(hole.par===3 && hist.strokes===1) resultLabel = 'HOLE IN ONE';
  else if(d<=-2) resultLabel = 'EAGLE';
  else if(d===-1) resultLabel = 'BIRDIE';
  else if(d===1) resultLabel = 'BOGEY';
  else if(d===2) resultLabel = 'DOUBLE';

  const title = document.getElementById('sumHoleDetailTitle');
  if(title) title.textContent = `${hole.name} · PAR ${hole.par}`;
  const body = document.getElementById('sumHoleDetailBody');
  if(!body) return;
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;">
      <div style="flex:1;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:7px 8px;text-align:center;">
        <div style="font-family:'Bebas Neue',cursive;font-size:24px;line-height:1;color:var(--text);">${hist.strokes}</div>
        <div style="font-family:'Sen',sans-serif;font-size:9px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;">Strokes</div>
      </div>
      <div style="flex:1;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:7px 8px;text-align:center;">
        <div style="font-family:'Bebas Neue',cursive;font-size:24px;line-height:1;color:${d<=0?'var(--c-fwyl)':'#e05252'};">${resultLabel}</div>
        <div style="font-family:'Sen',sans-serif;font-size:9px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;">Result</div>
      </div>
    </div>
  `;

  const detail = document.createElement('div');
  const logDiv = document.createElement('div');
  logDiv.style.cssText='display:flex;flex-direction:column;gap:3px;margin-bottom:10px;';
  hist.log.forEach((e,i)=>{
    const zd=Z[e.zk]||Z.fwy;
    const entry=document.createElement('div');
    entry.className = 'hlog-entry';
    entry.id='ihl-entry-'+i;
    entry.innerHTML=`<span class="hlog-n">${e.num}</span><span class="hlog-dot" style="background:${zd.color};"></span><span style="flex:1;color:var(--text);">${e.desc}</span><span class="hlog-r" style="color:${e.pen?'#e05252':'var(--muted)'};">${e.note}</span>`;
    entry.onclick=()=>highlightInlineGrid(i, hist.log, detail);
    logDiv.appendChild(entry);
  });
  detail.appendChild(logDiv);

  const lastValidSnap=hist.log.reduceRight((acc,e)=>acc||(Array.isArray(e.gridSnap)?e.gridSnap:null),null);
  if(lastValidSnap){
    const gridWrap=document.createElement('div');
    gridWrap.id='inlineHistGrid';
    gridWrap.className='hgrid-wrap';
    detail.appendChild(gridWrap);
    renderHistGrid(gridWrap, lastValidSnap, hist.log, hist.log.length-1);
  }

  const wcs = hist.wcsUsed || [];
  if (wcEnabled() && wcs.length > 0) {
    const wcList = document.createElement('div');
    wcList.style.cssText = 'font-family:"Sen",sans-serif;font-size:9px;color:var(--c-fwyl);margin-top:8px;text-align:center;letter-spacing:1px;';
    wcList.textContent = `🃏 WILDCARDS USED: ${wcs.join(', ').toUpperCase()}`;
    detail.appendChild(wcList);
  }

  if(hist.log.length){
    highlightInlineGrid(hist.log.length - 1, hist.log, detail);
  }
  body.appendChild(detail);
  if(_summaryHoleCloseTimer){
    clearTimeout(_summaryHoleCloseTimer);
    _summaryHoleCloseTimer = null;
  }
  modal.classList.remove('closing');
  modal.classList.add('show');
}

function closeHist(){document.getElementById('histModal').classList.remove('show');}
