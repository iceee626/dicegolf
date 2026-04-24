// Initialization, Scorecard, TV Bar, and Round Summary Rendering
// INIT & SCORECARD
// ═══════════════════════════════════════
function init(){buildLegend();buildScorecard();loadHole();}

function buildLegend(){
  const lg=document.getElementById('legend');lg.innerHTML='';
  [Z.tee,Z.fwy,Z.rgh,Z.chip,Z.sand,Z.grn,Z.h2o,Z.ob,Z.hole,Z.p1,Z.p2,Z.p3].forEach(z=>{
    const d=document.createElement('div');d.className='leg';
    d.innerHTML=`<div class="leg-sw" style="background:${z.color}"></div><span>${z.name}</span>`;
    lg.appendChild(d);
  });
  updateLegendVisibility();
}
function starsHTML(d){
  return Array.from({length:3},(_,i)=>`<span class="star ${i<d?'fill':'empty'}">${i<d?'&#9733;':'&#9734;'}</span>`).join('');
}
function starsPlain(d){
  const full=String.fromCharCode(9733);
  const empty=String.fromCharCode(9734);
  return full.repeat(d)+empty.repeat(3-d);
}

function clampHorizontalScroller(el){
  if(!el) return;
  const maxScroll=Math.max(0,el.scrollWidth-el.clientWidth);
  if(el.scrollLeft<0) el.scrollLeft=0;
  else if(el.scrollLeft>maxScroll) el.scrollLeft=maxScroll;
}

function bindHorizontalScrollerClamp(el){
  if(!el || el.dataset.clampBound==='1') return;
  const clamp=()=>clampHorizontalScroller(el);
  el.addEventListener('scroll', clamp, {passive:true});
  el.addEventListener('touchend', clamp, {passive:true});
  el.addEventListener('mouseup', clamp);
  el.addEventListener('mouseleave', clamp);
  el.dataset.clampBound='1';
  clamp();
}

function buildScorecard(){
  if(VS.active) vsSyncScorecardMirror();
  const pr=document.getElementById('parRow');
  const sr=document.getElementById('scoreRow');
  const headRow = document.getElementById('scHeadRow');
  if(!pr||!sr||!headRow)return;
  
  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);
  const currentSc = S.scorecards[S.currentRound - 1] || Array(18).fill(null);
  
  // Use stretching columns for 9 holes, fixed 34px columns for 18 holes
  const colWidth = activeHoles.length <= 9 ? 'minmax(0, 1fr)' : '34px';
  
  headRow.style.gridTemplateColumns = `40px repeat(${activeHoles.length}, ${colWidth})`;
  pr.style.gridTemplateColumns = `40px repeat(${activeHoles.length}, ${colWidth})`;
  sr.style.gridTemplateColumns = `40px repeat(${activeHoles.length}, ${colWidth})`;
  
  const scInner = document.querySelector('header .sc-inner');
  if (scInner) {
      scInner.style.width = activeHoles.length <= 9 ? '100%' : 'max-content';
  }
  const scWrap=document.querySelector('header .sc-wrap');
  bindHorizontalScrollerClamp(scWrap);
  if(scWrap) requestAnimationFrame(()=>clampHorizontalScroller(scWrap));
  
  headRow.innerHTML = '<div class="sc-lbl">H</div>';
  activeHoles.forEach((_, i) => {
    const d=document.createElement('div'); d.textContent = S.startIdx + i + 1; headRow.appendChild(d);
  });

  pr.innerHTML = '<div class="sc-lbl">PAR</div>';
  sr.innerHTML = '<div class="sc-lbl">YOU</div>';

  activeHoles.forEach((h, idx)=>{
    const absoluteIdx = S.startIdx + idx;
    const pc=document.createElement('div');pc.textContent=h.par;
    if(absoluteIdx===S.holeIdx) pc.style.color='var(--c-fwyl)';
    pr.appendChild(pc);
    
    const sc=document.createElement('div');
    const v=currentSc[absoluteIdx];
    if(v!==null){
      const d=v-h.par;
      sc.classList.add('sc-cell-btn');
      sc.onclick=(()=>openHist(absoluteIdx));
      if(d<=-2){ sc.innerHTML=`<span class="sc-sym sc-sym-eagle">${v}</span>`; } 
      else if(d===-1){ sc.innerHTML=`<span class="sc-sym sc-sym-birdie">${v}</span>`; } 
      else if(d===0){ sc.innerHTML=`<span class="sc-sym">${v}</span>`; } 
      else if(d===1){ sc.innerHTML=`<span class="sc-sym sc-sym-bogey">${v}</span>`; } 
      else { sc.innerHTML=`<span class="sc-sym sc-sym-double">${v}</span>`; }
    } else if(absoluteIdx===S.holeIdx){
      sc.textContent='•'; 
      sc.classList.add('sc-active');
      sc.style.display = 'flex';
      sc.style.alignItems = 'center';
      sc.style.justifyContent = 'center';
    }
    sr.appendChild(sc);
  });
  
  // holeBadge removed from header

  setTimeout(()=>{
    const activeCell = sr.querySelector('.sc-active');
    if(activeCell) activeCell.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
  }, 100);
}

function loadHole(){
  S.rolling=false;
  const nr=document.getElementById('ovNameRow');
  if(nr){nr.style.fontSize='';nr.style.fontFamily='';nr.style.letterSpacing='';nr.style.color='';}

  const nextBtn = document.getElementById('nextShotBtn');
  if(nextBtn){
     nextBtn.textContent='NEXT SHOT';
     nextBtn.style.background='var(--c-tee)';
     nextBtn.style.pointerEvents = '';
     nextBtn.disabled=false;
     nextBtn.onclick=doNextShot;
  }
  _holdFinishBtn=false;
  hideNextShotBtn(true);

  const h=HOLES[S.holeIdx];
  applyCourseVisualTheme(S.courseId || ACTIVE_COURSE_ID);
  S.zone='tee';S.strokes=0;S.shotNum=1;S._tvShotNum=1;S.shotCount=0;
  S._wcsUsedThisHole=[];S._wcNextShotNote=null;
  S._skipCelebration=false;S._preserveGrid=false;S._forceGrid=false;
  S._mulliganJustFired=false;S._puttWcUsed=false;S._pendingPuttResult=null;S._pendingHoleFinish=null;
  S._eyesClosedArmed=false;S._landscaperRoughFixes=0;S._rocketApproachPending=false;
  S._ferrettArmedShot=false;S._highlightReelArmedShot=false;
  S.zoneHistory=[];
  S.log=[];S.holeDone=false;S.rolling=false;S._skipCelebration=false;
  S.fwyVisits=0;S.prevZone=null;S._wcUsedThisRound=S._wcUsedThisRound||0;
  S.yrdTotal=h.yards;S.yrdRemain=h.yards;
  
  const pbRow = document.getElementById('ovPbRow');
  if(pbRow) pbRow.remove();

  document.getElementById('holeName').textContent=h.name;
  document.getElementById('holeYards').textContent=fmtYds(h.yards);
  document.getElementById('holeStars').innerHTML=starsHTML(h.baseDiff);
  document.getElementById('holePar').textContent=h.par;
  if(typeof wcResetHole==='function')wcResetHole();
  startDiceIdle();
  buildScorecard();buildGrid();updateZonePill();updateYrd();resetResult();renderLog();updateFloat();
  updateTVBanner();
  
  if(!TUT.active && gridFocusEnabled()) scrollToGrid();
}

// ═══════════════════════════════════════
// TV SCORECARD BAR
// ═══════════════════════════════════════
function ordinal(n){const s=['th','st','nd','rd'];const v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}

function updateTVBanner(){
  const h=HOLES[S.holeIdx];
  const bar=document.getElementById('tvBar');
  if(!bar)return;
  bar.classList.add('show');
  // Keep current putt strip visible while FINISH HOLE is transitioning
  // into the hole-complete screen.
  const preservePuttStrip = !!(S.holeDone && _holdFinishBtn);
  if(preservePuttStrip){
    syncWcToastStackPosition();
    return;
  }
  bar.classList.remove('putt-row-active');
  const row2=document.getElementById('tvRow2');
  if(row2) row2.classList.remove('show');

  document.getElementById('tvName').textContent=PLAYER_NAME;
  const rText = S.totalRounds > 1 ? `R${S.currentRound} · ` : '';
  document.getElementById('tvHoleInfo').textContent=`${rText}${ordinal(S.holeIdx+1)} HOLE · PAR ${h.par}`;

  let totalScore = 0; let totalPar = 0;
  S.scorecards.forEach(sc => {
     sc.forEach((s, i) => {
        if (s !== null) { totalScore += s; totalPar += HOLES[i].par; }
     });
  });
  const totalDiff = totalScore - totalPar;
  const totalEl=document.getElementById('tvTotal');
  totalEl.textContent=totalDiff===0?'E':totalDiff>0?`+${totalDiff}`:`${totalDiff}`;
  totalEl.dataset.state = totalDiff < 0 ? 'good' : totalDiff > 0 ? 'bad' : 'even';

  const onGreen=S.zone==='grn';

  if (!S.holeDone) {
    const shotsEl=document.getElementById('tvShots');
    shotsEl.innerHTML='';

    // _tvShotNum is the shot currently highlighted — set externally at the right moments
    const displayShot = S._tvShotNum || 1;
    const totalSlots = Math.max(h.par, displayShot);
    const showPuttTarget = onGreen && displayShot > S.strokes;
    const showOverParShot = displayShot > h.par;

    // Putt class only applies when we're on the green AND it's the active display shot
    const puttScore = h.par - S.strokes - 1;
    let puttClass = '';
    if(showPuttTarget){
      if(puttScore>=2)       puttClass='putt-eagle';
      else if(puttScore===1) puttClass='putt-birdie';
      else if(puttScore===0) puttClass='putt-par';
      else if(puttScore===-1)puttClass='putt-bogey';
      else                   puttClass='putt-double';
    }

    for(let i=1;i<=totalSlots;i++){
      const sn=document.createElement('div');
      if(i < displayShot){
        sn.className='tv-sn past';
      } else if(i === displayShot){
        sn.className=`tv-sn current${showPuttTarget?' '+puttClass:''}${showOverParShot?' over-par':''}`;
      } else {
        sn.className='tv-sn future';
      }
      sn.textContent=i;
      shotsEl.appendChild(sn);
    }

    setTimeout(() => {
       const activeShot = shotsEl.querySelector('.current');
       if (activeShot) {
           activeShot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
       }
    }, 50);

    // Bottom strip
    const puttStatus=document.getElementById('tvPuttStatus');
    if(showPuttTarget){
      if(row2) row2.classList.add('show');
      bar.classList.add('putt-row-active');
      if(puttStatus){
        puttStatus.className='tv-putt-status';
        if(puttScore>=2)       {puttStatus.textContent='FOR EAGLE';puttStatus.classList.add('eagle-c');}
        else if(puttScore===1) {puttStatus.textContent='FOR BIRDIE';puttStatus.classList.add('birdie-c');}
        else if(puttScore===0) {puttStatus.textContent='FOR PAR';}
        else if(puttScore===-1){puttStatus.textContent='FOR BOGEY';puttStatus.classList.add('bogey-c');}
        else if(puttScore===-2){puttStatus.textContent='FOR DOUBLE BOGEY';puttStatus.classList.add('double-c');}
        else if(puttScore===-3){puttStatus.textContent='FOR TRIPLE BOGEY';puttStatus.classList.add('double-c');}
        else if(puttScore===-4){puttStatus.textContent='FOR QUADRUPLE BOGEY';puttStatus.classList.add('double-c');}
        else if(puttScore===-5){puttStatus.textContent='FOR QUINTUPLE BOGEY';puttStatus.classList.add('double-c');}
        else                   {puttStatus.textContent=`FOR ${Math.abs(puttScore)}+`;puttStatus.classList.add('double-c');}
      }
    } else {
      if(row2) row2.classList.remove('show');
      bar.classList.remove('putt-row-active');
    }
  }
  syncWcToastStackPosition();
}

// ═══════════════════════════════════════
// GRID SELECTION — layout-driven
// ═══════════════════════════════════════

// Layout → template selectors
function _layoutForStage(h, stage){
  const key = stage === 'par3' ? 'par3Layout' : `${stage}Layout`;
  return h[key] || h.layout;
}
function _teeTmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'tee');
  switch(layout){
    case 'doglegs':      return d===1?T_TEE_DOG_E(): d===2?T_TEE_DOG_M(): T_TEE_DOG_H();
    case 'bunkerFwy':    return d===1?T_TEE_BFWY_E():d===2?T_TEE_BFWY_M():T_TEE_BFWY_H();
    case 'waterCross':   return d===1?T_TEE_WCRS_E():d===2?T_TEE_WCRS_M():T_TEE_WCRS_H();
    case 'waterTee':     return d===1?T_TEE_WTEE_E():d===2?T_TEE_WTEE_M():T_TEE_WTEE_H();
    case 'coastal':      return d===1?T_TEE_COAST_E():d===2?T_TEE_COAST_M():T_TEE_COAST_H();
    case 'desertWash':   return d===1?T_TEE_DSRT_E():d===2?T_TEE_DSRT_M():T_TEE_DSRT_H();
    case 'cathedral':    return d===1?T_TEE_CATH_E():d===2?T_TEE_CATH_M():T_TEE_CATH_H();
    default:             return d===1?T_TEE_OPEN_E():d===2?T_TEE_OPEN_M():T_TEE_OPEN_H();
  }
}
function _par3Tmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'par3');
  switch(layout){
    case 'waterCross':   return d===1?T_P3_WCRS_E():d===2?T_P3_WCRS_M():T_P3_WCRS_H();
    case 'waterTee':     return d===1?T_P3_WTEE_E():d===2?T_P3_WTEE_M():T_P3_WTEE_H();
    case 'bunkerGreen':  return d===1?T_P3_BGRN_E():d===2?T_P3_BGRN_M():T_P3_BGRN_H();
    case 'stadium':      return d===1?T_P3_STAD_E():d===2?T_P3_STAD_M():T_P3_STAD_H();
    default:             return d===1?T_P3_OPEN_E():d===2?T_P3_OPEN_M():T_P3_OPEN_H();
  }
}
function _appTmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'app');
  switch(layout){
    case 'doglegs':      return d===1?T_APP_DOG_E(): d===2?T_APP_DOG_M(): T_APP_DOG_H();
    case 'bunkerFwy':    return d===1?T_APP_BFWY_E():d===2?T_APP_BFWY_M():T_APP_BFWY_H();
    case 'bunkerGreen':  return d===1?T_APP_BGRN_E():d===2?T_APP_BGRN_M():T_APP_BGRN_H();
    case 'waterCross':   return d===1?T_APP_WCRS_E():d===2?T_APP_WCRS_M():T_APP_WCRS_H();
    case 'waterApproach':return d===1?T_APP_WAPR_E():d===2?T_APP_WAPR_M():T_APP_WAPR_H();
    case 'coastal':      return d===1?T_APP_COAST_E():d===2?T_APP_COAST_M():T_APP_COAST_H();
    case 'desertWash':   return d===1?T_APP_DSRT_E():d===2?T_APP_DSRT_M():T_APP_DSRT_H();
    case 'cathedral':    return d===1?T_APP_CATH_E():d===2?T_APP_CATH_M():T_APP_CATH_H();
    default:             return d===1?T_APP_OPEN_E():d===2?T_APP_OPEN_M():T_APP_OPEN_H();
  }
}
function _farTmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'far');
  switch(layout){
    case 'doglegs':
    case 'cathedral':    return d===1?T_FAR_TGHT_E():d===2?T_FAR_TGHT_M():T_FAR_TGHT_H();
    case 'bunkerFwy':    return d===1?T_FAR_BFWY_E():d===2?T_FAR_BFWY_M():T_FAR_BFWY_H();
    case 'waterCross':   return d===1?T_FAR_WCRS_E():d===2?T_FAR_WCRS_M():T_FAR_WCRS_H();
    case 'coastal':      return d===1?T_FAR_COAST_E():d===2?T_FAR_COAST_M():T_FAR_COAST_H();
    case 'desertWash':   return d===1?T_FAR_DSRT_E():d===2?T_FAR_DSRT_M():T_FAR_DSRT_H();
    default:             return d===1?T_FAR_OPEN_E():d===2?T_FAR_OPEN_M():T_FAR_OPEN_H();
  }
}
function _puttTmpl(h){
  const bd=h.baseDiff||2, gd=GAME_DIFF||1;
  const tbl=[[T_PUTT_1E,T_PUTT_1N,T_PUTT_1H],[T_PUTT_2E,T_PUTT_2N,T_PUTT_2H],[T_PUTT_3E,T_PUTT_3N,T_PUTT_3H]];
  return (tbl[bd-1]||tbl[1])[gd-1]();
}
// Count consecutive sand/chip shots — used to detect and break loops
function _sandChipLoopDepth(){
  const h=S.zoneHistory||[];
  let n=0;
  for(let i=h.length-1;i>=0;i--){
    if(h[i]==='sand'||h[i]==='chip')n++;
    else break;
  }
  return n;
}

function _chipTmpl(h){
  // Force easiest chip template if stuck in sand↔chip loop
  const d=_sandChipLoopDepth()>=2?1:h.diff;
  return d===1?T_CHIP_E():d===2?T_CHIP_M():T_CHIP_H();
}
function _sandTmpl(h){
  // Force easiest sand template if stuck in sand↔chip loop
  const looping=_sandChipLoopDepth()>=2;
  const d=looping?1:h.diff;
  // Far bunker (>80m) — fwy-exit grid, no rgh cells
  if(S.yrdRemain>87) return d===1?T_SAND_FAR_E():d===2?T_SAND_FAR_M():T_SAND_FAR_H();
  // Near-green bunker (≤80m) — green+chip+hole, no rgh
  return d===1?T_SAND_E():d===2?T_SAND_M():T_SAND_H();
}

function buildGrid(){
  // Tutorial override
  if(TUT.active){
    const tg=tutGetGrid();
    if(tg){
      S.currentGrid=tg.map(r=>[...r]);
      document.getElementById('gridTitle').textContent=S.zone==='grn'?'Putting Grid':S.zone==='tee'?'Tee Shot Grid':'Shot Grid';
      renderGrid();return;
    }
  }
  // Versus: player 1 gets base grid, applies own wildcards
  if(VS.active&&VS.currentPlayer===1){
    const cached=vsGetCachedGrid();
    if(cached){
      let tmpl=cached.map(r=>[...r]);
      if(WCS&&wcEnabled())tmpl=applyWcGridMods(tmpl);
      S.currentGrid=tmpl;renderGrid();return;
    }
  }

  const h=HOLES[S.holeIdx];
  const isPar3=h.par===3;
  const gate=getGate(S.yrdRemain,isPar3);
  let tmpl;

  const _emit=(title,t)=>{
    document.getElementById('gridTitle').textContent=title;
    // Replace chip cells with fwy when yardage is too high for chip zone after advance
    // (chip advance min 30yds; if pre-advance >117yds chip will always be overridden visually)
    // Don't replace chip→fwy on par 3 tee: chip is always valid there and hole cell must stay
    if(S.yrdRemain>117 && S.zone!=='chip' && S.zone!=='sand' && !(isPar3&&S.zone==='tee')){
      t=t.map(row=>row.map(c=>c==='chip'?'fwy':c));
    }
    if(VS.active)vsCacheGrid(t);
    if(WCS&&wcEnabled())t=applyWcGridMods(t);
    S.currentGrid=t;renderGrid();
  };

  // PUTTING
  if(S.zone==='grn'||gate==='green'){
    return _emit('Putting Grid',_puttTmpl(h));
  }

  // CHIP (no chip cells — chip→chip loop impossible)
  if(S.zone==='chip'||(gate==='nearpin'&&S.zone!=='grn'&&S.zone!=='sand') || ((S.zone==='fwy'||S.zone==='rgh') && S.yrdRemain <= 35)){
    return _emit('Chip Shot Grid',_chipTmpl(h));
  }

  // SAND ESCAPE (max 3 sand cells — sand→sand loop near-impossible)
  if(S.zone==='sand'){
    return _emit('Sand Shot Grid',_sandTmpl(h));
  }

  // TEE — par 3
  if(S.zone==='tee'&&isPar3){
    return _emit('Tee Shot Grid',_par3Tmpl(h));
  }

  // TEE — par 4/5
  if(S.zone==='tee'){
    return _emit('Tee Shot Grid',_teeTmpl(h));
  }

  // FAIRWAY
  if(S.zone==='fwy'){
    if(gate==='short'||gate==='nearpin'){
      tmpl=_appTmpl(h); // approach templates have no raw fwy cells
    } else if(gate==='mid'){
      tmpl=_appTmpl(h);
    } else {
      tmpl=_farTmpl(h);
    }
    return _emit('Fairway Shot Grid',tmpl);
  }

  // ROUGH
  if(S.zone==='rgh'){
    if(gate==='short'||gate==='nearpin'){
      // anti-loop: RGH_SHORT has no chip cells → breaks chip→rgh-short→chip
      tmpl=h.diff===1?T_RGH_SHORT_E():h.diff===2?T_RGH_SHORT_M():T_RGH_SHORT_H();
    } else if(gate==='far'){
      tmpl=h.diff===1?T_RGH_FAR_E():h.diff===2?T_RGH_FAR_M():T_RGH_FAR_H();
    } else {
      tmpl=h.diff===1?T_RGH_MID_E():h.diff===2?T_RGH_MID_M():T_RGH_MID_H();
    }
    return _emit('Rough Shot Grid',tmpl);
  }

  // Fallback
  tmpl=T_FAR_OPEN_M();
  if(VS.active)vsCacheGrid(tmpl);
  S.currentGrid=tmpl;renderGrid();
}

function flipCell(cell, zd){
  if(cell.dataset.flipping==='1')return;
  cell.dataset.flipping='1';
  cell.style.transition='transform .15s ease';
  cell.style.transform='scaleX(0)';
  
  // Use innerHTML instead of textContent so we don't destroy the shot markers
  const origHTML=cell.innerHTML; 
  
  setTimeout(()=>{
    cell.innerHTML=zd.name.toUpperCase();
    cell.style.fontSize='7px';
    cell.style.transform='scaleX(1)';
    setTimeout(()=>{
      cell.style.transform='scaleX(0)';
      setTimeout(()=>{
        cell.innerHTML=origHTML;
        cell.style.fontSize='';
        cell.style.transform='scaleX(1)';
        cell.style.transition='';
        cell.dataset.flipping='0';
      },150);
    },800);
  },150);
}

function renderGrid(){
  const ax=document.getElementById('gridAxes');ax.innerHTML='';
  const corner=document.createElement('div');ax.appendChild(corner);
  const alwaysLabels=getCellLabelMode()==='always';
  for(let c=1;c<=6;c++){const l=document.createElement('div');l.className='ax';l.textContent=c;ax.appendChild(l);}
  for(let r=0;r<6;r++){
    const rl=document.createElement('div');rl.className='ax';rl.textContent=r+1;ax.appendChild(rl);
    for(let c=0;c<6;c++){
      const zk=S.currentGrid[r][c];const zd=Z[zk]||Z.fwy;
      const cell=document.createElement('div');
      cell.className=`cell ${zd.cls}`;cell.id=`cell-${r}-${c}`;
      const abbr={ob:'OB',h2o:'H₂O',hole:'⛳',p1:'1P',p2:'2P',p3:'3P'};
      const alwaysName={h2o:'WATER',ob:'OB',grn:'GREEN',fwy:'FAIRWAY',rgh:'ROUGH',chip:'CHIP',sand:'SAND',tee:'TEE',hole:'HOLE',p1:'1P',p2:'2P',p3:'3P'};
      if(alwaysLabels){
        cell.textContent=(alwaysName[zk]||zd.name).toUpperCase();
        cell.style.cssText='font-size:6px;line-height:1.1;text-align:center;padding:1px;word-break:break-word;font-weight:700;';
      } else if(abbr[zk]){
        cell.textContent=abbr[zk];
      }
      if(getCellLabelMode()!=='always'){
        cell.addEventListener('click',()=>flipCell(cell,zd));
      }
      ax.appendChild(cell);
    }
  }
}

function litCell(r,c){
  document.querySelectorAll('.cell.lit').forEach(e=>e.classList.remove('lit'));
  const el=document.getElementById(`cell-${r}-${c}`);
  if(el)el.classList.add('lit');
}

// ═══════════════════════════════════════
// YARDAGE
// ═══════════════════════════════════════
function updateYrd(){
  const rem=Math.max(0,S.yrdRemain);
  const pct=S.yrdTotal>0?rem/S.yrdTotal:0;
  const pendingHoleFinish=!!S._pendingHoleFinish;
  const putts=S._pendingPuttResult?.putts||0;
  const puttLabel=`${putts} PUTT${putts===1?'':'S'}`;
  document.getElementById('yrdNum').textContent=
    pendingHoleFinish ? 'IN HOLE' :
    putts>0 ? puttLabel :
    S.zone==='grn' ? 'ON GREEN' :
    rem>0 ? fmtYds(rem) : 'On green';
  document.getElementById('yrdFill').style.width=`${Math.round(pct*100)}%`;
  document.getElementById('yrdLbl').textContent=
    pendingHoleFinish ? 'ready to finish' :
    putts>0 ? 'in a hole' :
    S.zone==='grn' ? 'putting' :
    rem>0 ? 'to hole' : 'putting';
}

function getOverallScoreDiff(){
  let total = 0, par = 0;
  S.scorecards.forEach(sc => sc.forEach((score, i) => {
    if(score !== null){
      total += score;
      par += HOLES[i].par;
    }
  }));
  return total - par;
}

function appendWcNoteToLastLog(noteStr){
  if(!noteStr || !Array.isArray(S.log) || S.log.length === 0) return;
  const last = S.log[S.log.length - 1];
  if(!last || typeof last.desc !== 'string') return;
  if(last.desc.includes(noteStr)) return;
  if(/\)\s*$/.test(last.desc) && last.desc.includes('(')){
    last.desc = last.desc.replace(/\)\s*$/, `, ${noteStr})`);
  } else {
    last.desc += ` (${noteStr})`;
  }
}

function activateGreenReadOnGrid(grid){
  if(!Array.isArray(grid)) return grid;
  if(!(WCS.greenReadQueued || WCS.greenReadActive)) return grid;
  WCS.greenReadQueued = false;
  WCS.greenReadActive = false;
  const nextGrid = grid.map(row => row.map(cell => (cell === 'p3' ? 'p2' : cell)));
  showWcToast('🌱 Green Read activated!');
  appendWcNote('🌱 Green Read');
  return nextGrid;
}

function maybeArmBounceBackFromHoleResult(diff){
  if(!WCS.bounceBackPending) return;
  if(diff >= 1){
    WCS.bounceBackPending = false;
    WCS.bounceBackReady = true;
  }
}

function applyBogeyShieldToScore(rawScore, par){
  if(!WCS.bogeyShieldActive) return rawScore;
  if((rawScore - par) < 1) return rawScore;
  WCS.bogeyShieldActive = false;
  showWcToast('🛡️ Bogey Shield activated!');
  appendWcNoteToLastLog('🛡️ Bogey Shield');
  renderLog();
  return par;
}

function advanceYrd(zk){
  if (['h2o', 'ob', 'grn', 'p1', 'p2', 'p3', 'hole'].includes(zk)) return;

  const isPar3 = HOLES[S.holeIdx].par === 3;
  const isTee = S.zone === 'tee'; // This is the origin zone of the shot

  // 1. Short escapes (Greenside Bunkers and Chip zones)
  if (S.zone === 'sand' || S.zone === 'chip') {
    const advance = Math.round(20 + Math.random() * 30);
    S.yrdRemain = Math.max(5, S.yrdRemain - advance);
    return;
  }

  // 2. Par 3 Tee Shots landing in a hazard (Rough/Sand/Chip)
  // The ball travels all the way to the greenside area (5-25 yards left).
  if (isPar3 && isTee) {
    S.yrdRemain = Math.round(5 + Math.random() * 20);
    return;
  }

  // 3. Dynamic "Golf Club" Distance Logic
  let dist = 0;
  if (isTee) {
    dist = Math.round(240 + Math.random() * 50); // Driver range (240-290)
  } else {
    if (S.yrdRemain > 220) {
      dist = Math.round(190 + Math.random() * 50); // Wood / Long Iron (190-240)
    } else if (S.yrdRemain >= 150) {
      dist = Math.round(140 + Math.random() * 40); // Mid Iron (140-180)
    } else {
      // Approach shot (Short Iron/Wedge) - scaled to the distance remaining
      dist = Math.round(S.yrdRemain * (0.8 + Math.random() * 0.3));
    }
  }

  // 4. Apply distance penalties for landing in hazards
  if (zk === 'rgh' || zk === 'sand' || zk === 'chip') {
    let penalty = 1.0;
    
    // Using a +/- 5% variance around your target percentages to keep it organic
    const variance = (Math.random() * 0.10) - 0.05; 
    
    if (GAME_DIFF === 1) {
      penalty = 0.85 + variance; // ~15% distance loss on Easy
    } else if (GAME_DIFF === 2) {
      penalty = 0.70 + variance; // ~30% distance loss on Normal
    } else {
      penalty = 0.55 + variance; // ~45% distance loss on Hard
    }
    dist = Math.round(dist * penalty);
  }

  S.yrdRemain = Math.max(0, S.yrdRemain - dist);

  // 5. Clamp yardage for hazards so we don't accidentally reach 0 yds (the green)
  if ((zk === 'fwy' || zk === 'rgh' || zk === 'sand' || zk === 'chip') && S.yrdRemain < 5) {
    S.yrdRemain = Math.round(5 + Math.random() * 10);
  }
}

// ═══════════════════════════════════════
// ROLL
// ═══════════════════════════════════════
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
function processShot(row,col){
  S._preserveGrid=false;
  let outcome=S.currentGrid[row][col];
  litCell(row,col);
  const prevZone=S.zone;
  const prevYrdRemain=S.yrdRemain;
  const snapGrid=S.currentGrid.map(r=>[...r]);

  if(S.zone==='grn'){
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
    S.strokes+=finalPutts;S.yrdRemain=0;
    S._pendingPuttResult={putts:finalPutts, row, col, snapGrid, prevZone};
    addLog(S.shotNum,`Green → ${finalPutts} putt${finalPutts>1?'s':''}${wcPuttNote}`,outcome,`+${finalPutts}`,false,row,col,snapGrid, prevZone, prevYrdRemain);
    S._tvShotNum = S.shotNum;
    S.shotNum += finalPutts;
    updateYrd();
    S.holeDone=false;

    {
      const h_putt=HOLES[S.holeIdx];
      const previewScore = (WCS.bogeyShieldActive && (S.strokes - h_putt.par) >= 1) ? h_putt.par : S.strokes;
      const d_putt=previewScore-h_putt.par;
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
        S._pendingPuttResult=null;
        S._pendingHoleFinish=null;
        S.holeDone=true;
        _holdFinishBtn=true;
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
      resolvedOutcome = 'fwy';
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
          S._pendingPuttResult=null;
          S._pendingHoleFinish=null;
          S.holeDone=true;
          _holdFinishBtn=true;
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
          if(S._forceGrid){S._forceGrid=false;}
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

// ═══════════════════════════════════════
// HOLE COMPLETE
// ═══════════════════════════════════════
function showCelebration(d, onDone){
  let txt, cls;
  if(d===-99)    {txt='HOLE IN ONE! ⛳'; cls='celeb-eagle';}
  else if(d<=-3) {txt='ALBATROSS 🪶'; cls='celeb-albatross';}
  else if(d<=-2) {txt='EAGLE 🦅'; cls='celeb-eagle';}
  else if(d===-1){txt='BIRDIE 🐤';  cls='celeb-birdie';}
  else if(d===0) {txt='PAR ⛳';     cls='celeb-par';}
  else if(d===1) {txt='BOGEY';      cls='celeb-bogey';}
  else if(d===2) {txt='DOUBLE BOGEY'; cls='celeb-double';}
  else if(d===3) {txt='TRIPLE BOGEY'; cls='celeb-double';}
  else if(d===4) {txt='QUADRUPLE BOGEY'; cls='celeb-double';}
  else if(d===5) {txt='QUINTUPLE BOGEY'; cls='celeb-double';}
  else           {txt=`+${d}`;     cls='celeb-double';}

  const ov=document.createElement('div');
  ov.className='celebration-overlay';
  const badge=document.createElement('div');
  badge.className=`celebration-badge ${cls}`;
  badge.textContent=txt;
  ov.appendChild(badge);
  document.body.appendChild(ov);
  setTimeout(()=>{ov.remove();onDone();},1400);
}

function completeHole(){
  const h=HOLES[S.holeIdx];
  const restoringCompletedHole = !!S._resumeCompletedHolePanel;
  const savedScore = S.scorecards?.[S.currentRound - 1]?.[S.holeIdx];
  const savedHistScore = S.histories?.[S.currentRound - 1]?.[S.holeIdx]?.strokes;
  let score = restoringCompletedHole && savedScore != null
    ? savedScore
    : restoringCompletedHole && savedHistScore != null
      ? savedHistScore
      : applyBogeyShieldToScore(S.strokes, h.par);
  S.strokes = score;
  const roundXpWrap = document.getElementById('hcRoundXpWrap');
  if(roundXpWrap) roundXpWrap.style.display = 'none';
  
  // VERSUS MODE
  if(VS.active){
    S.holeDone=true;
    hideNextShotBtn();hidePostShotWcBtn();
    const wcpb=document.getElementById('puttWcBtn');if(wcpb)wcpb.remove();
    updateTVBanner();
    
    const d=score-h.par;
    maybeArmBounceBackFromHoleResult(d);
    const isHoleInOne=(h.par===3&&score===1);
    
    let emoji,title;
    if(isHoleInOne){emoji='⛳';title='HOLE IN ONE!';}
    else if(d<=-2){emoji='🦅';title='EAGLE!';}
    else if(d===-1){emoji='🐤';title='BIRDIE!';}
    else if(d===0){emoji='⛳';title='PAR!';}
    else if(d===1){emoji='⛳';title='BOGEY';}
    else{emoji='⛳';title=d>=2?'+'+d:'';}
    
    if(d<=-3 && !isHoleInOne) title='ALBATROSS!';
    else if(d===2) title='DOUBLE BOGEY';
    else if(d===3) title='TRIPLE BOGEY';
    else if(d===4) title='QUADRUPLE BOGEY';
    else if(d===5) title='QUINTUPLE BOGEY';
    else if(d>5) title=`+${d}`;
    // Outcome haptic on hole completion
    if(isHoleInOne || d<=-2){ vibHoleInOne(); }
    else if(d===-1){ _doHaptic('MEDIUM'); }
    else if(d>=2){ _doHaptic('HEAVY'); }
    document.getElementById('ovEmoji').textContent=emoji;
    document.getElementById('ovEmoji').style.display='block';
    const ovTitle=document.getElementById('ovTitle');
    ovTitle.textContent=title;
    ovTitle.style.color=_scoreOutcomeColor(d, isHoleInOne);

    let pTotal = 0, pPar = 0;
    for(let i=S.startIdx; i<=S.holeIdx; i++){
        if (i === S.holeIdx) {
            pTotal += score;
        } else {
            const savedScore = vsGetScore(VS.currentPlayer, i);
            if(savedScore !== null) pTotal += savedScore;
        }
        pPar += HOLES[i].par;
    }
    let diff = pTotal - pPar;
    let diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
    
    if (VS.format === 'stroke') {
        document.getElementById('ovNameRow').textContent=`${VS.players[VS.currentPlayer].name}: ${diffStr} (Total)`;
    } else {
        document.getElementById('ovNameRow').textContent=`${VS.players[VS.currentPlayer].name}: ${score} strokes`;
    }

    document.getElementById('ovNameRow').style.fontSize='';
    document.getElementById('ovStatsRow').innerHTML=`Par ${h.par} &nbsp; ${starsHTML(h.baseDiff)}`;
    document.getElementById('ovBtn').textContent='CONTINUE';
    document.getElementById('ovBtn').style.display='block';
    document.getElementById('ovBtn').onclick=()=>vsCompleteHole();
    document.getElementById('ovSummaryBtn').style.display='none';
    document.getElementById('ovPlayAgainBtn').style.display='none';
    
    if(S._skipCelebration){
      S._skipCelebration=false;
      document.getElementById('overlay').classList.add('show');
    } else {
      showCelebration(isHoleInOne?-99:d, ()=>{
        document.getElementById('overlay').classList.add('show');
      });
    }
    return;
  }
  
  // TUTORIAL MODEe
  if(TUT.active){
    const curSc = S.scorecards[S.currentRound - 1];
    const curHist = S.histories[S.currentRound - 1];
    curSc[S.holeIdx] = score;
    curHist[S.holeIdx] = {log:[...S.log], strokes:score, par:h.par, name:h.name, yards:h.yards, diff:h.diff, wcsUsed: [...(S._wcsUsedThisHole||[])]};
    buildScorecard();
    
    S.holeDone=true;
    hideNextShotBtn();hidePostShotWcBtn();
    const d=score-h.par;
    maybeArmBounceBackFromHoleResult(d);
    const isHoleInOne=(h.par===3&&score===1);
    
    let emoji='⛳',title='PAR!';
    if(isHoleInOne){emoji='⛳';title='HOLE IN ONE!';}
    else if(d<=-2){emoji='🦅';title='EAGLE!';}
    else if(d===-1){emoji='🐤';title='BIRDIE!';}
    else if(d===0){title='PAR!';}
    else{title='BOGEY';}
    
    let tutTotalScore = 0; let tutTotalPar = 0;
    S.scorecards.forEach(sc => sc.forEach((s, i) => { if(s!==null){ tutTotalScore+=s; tutTotalPar+=HOLES[i].par; } }));
    const tutDiff = tutTotalScore - tutTotalPar;
    const tutDiffStr = tutDiff===0?'E':tutDiff>0?`+${tutDiff}`:`${tutDiff}`;

    document.getElementById('ovEmoji').textContent=emoji;
    document.getElementById('ovEmoji').style.display='block';
    const ovTitle=document.getElementById('ovTitle');
    ovTitle.textContent=title;
    ovTitle.style.color=_scoreOutcomeColor(d, isHoleInOne);
    document.getElementById('ovNameRow').textContent=`TOTAL SCORE: ${tutDiffStr}`;
    document.getElementById('ovStatsRow').innerHTML= score === 1 ? `Hole in One! · par ${h.par} &nbsp; ${starsHTML(h.baseDiff)}` : `${score} strokes · par ${h.par} &nbsp; ${starsHTML(h.baseDiff)}`;
    
    document.getElementById('ovBtn').style.display='none';
    document.getElementById('ovSummaryBtn').style.display='none';
    document.getElementById('ovPlayAgainBtn').style.display='none';
    
    if(S._skipCelebration){
      S._skipCelebration=false;
      document.getElementById('overlay').classList.add('show');
      tutAfterHoleComplete();
    } else {
      showCelebration(isHoleInOne?-99:d, ()=>{
        document.getElementById('overlay').classList.add('show');
        tutAfterHoleComplete();
      });
    }
    return;
  }
  
  // NORMAL SINGLE PLAYER MODE
  const curSc = S.scorecards[S.currentRound - 1];
  const curHist = S.histories[S.currentRound - 1];
  
  curSc[S.holeIdx] = score;
  curHist[S.holeIdx] = {log:[...S.log], strokes:score, par:h.par, name:h.name, yards:h.yards, diff:h.diff, wcsUsed: [...(S._wcsUsedThisHole||[])]};

 // --- RESTORE SP VIEW (In case VS modified it) ---
  ['hcIcon', 'hcTitle', 'hcSub', 'hcTot'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.display = '';
  });
  const vsContainer = document.getElementById('hcVsContainer');
  if(vsContainer) vsContainer.style.display = 'none';

  const baseSecTitles = document.querySelectorAll('#hcScreen .sec-title');
  baseSecTitles.forEach(t => t.style.display = 'flex');
  if(baseSecTitles[0]) baseSecTitles[0].textContent = 'SHOT REPLAY';
  if(baseSecTitles[1]) baseSecTitles[1].textContent = 'SCORECARD';
  
  const scWrap = document.querySelector('#hcScreen .sc-wrap');
  if (scWrap) scWrap.style.display = ''; // Restore scorecard visibility
  const midSection = document.getElementById('hcMidSection');
  if(midSection) midSection.style.display = 'flex';

  const statsContainer = document.getElementById('hcVsStats');
  if(statsContainer) statsContainer.style.display = 'none';

  const vsToggle = document.getElementById('vsToggleRow');
  if(vsToggle) vsToggle.style.display = 'none';
  // Restore shot trail/detail cards hidden by VS mode
  const trailCard = document.getElementById('hcShotTrailCard');
  const detailCard = document.getElementById('hcShotDetailCard');
  if(trailCard) trailCard.style.display = '';
  if(detailCard) detailCard.style.display = '';
  const shotTrailEl = document.getElementById('hcShotTrail');
  const shotDetailEl = document.getElementById('hcShotDetail');
  if(shotTrailEl) shotTrailEl.style.display = 'flex';
  if(shotDetailEl) shotDetailEl.style.display = 'flex';
  // ------------------------------------------------
  
  S.holeDone=true;
  hideNextShotBtn();hidePostShotWcBtn();
  const wcpb=document.getElementById('puttWcBtn');if(wcpb)wcpb.remove();
  updateTVBanner();
  
  const d=score-h.par;
  if(!restoringCompletedHole) maybeArmBounceBackFromHoleResult(d);
  const isHoleInOne=(h.par===3&&score===1);
  if(!restoringCompletedHole && S._roundPrevWasDoubleOrWorse && d <= -1){
    unlockAchievement('ice_veins');
    S._roundIceTriggered = true;
  }
  if(!restoringCompletedHole) S._roundPrevWasDoubleOrWorse = d >= 2;
  if(!restoringCompletedHole && S._eyesClosedArmed && d <= -1){
    unlockAchievement('eyes_closed');
  }

  if(!TUT.active && !restoringCompletedHole){
    const profiles=loadProfiles();
    const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
    const p=profiles[idx];
    if(p){
      if(d<=-2) p.eagles=(p.eagles||0)+1;
      if(d===-1) p.birdies=(p.birdies||0)+1;
      if(isHoleInOne) p.holeInOnes=(p.holeInOnes||0)+1;
      if(d>=3) p.tripleTroubles=(p.tripleTroubles||0)+1;
      const prevStreak=S._gameUnderParStreak||0;
      const newStreak=d<0?prevStreak+1:0;
      S._gameUnderParStreak=newStreak;
      p.bestUnderParStreak=Math.max(p.bestUnderParStreak||0,newStreak);
      if(newStreak>=3) unlockAchievement('on_a_roll');
      profiles[idx]=p;saveProfiles(profiles);
      setTimeout(()=>checkAndAwardAchievements(),300);
    }
  }

  let emoji,title;
  if(isHoleInOne){emoji='⛳';title='HOLE IN ONE';}
  else if(d<=-3){emoji='🪶';title='ALBATROSS';}
  else if(d<=-2){emoji='🦅';title='EAGLE';}
  else if(d===-1){emoji='🐤';title='BIRDIE';}
  else if(d===0){emoji='⛳';title='PAR';}
  else if(d===1){emoji='⛳';title='BOGEY';}
  else if(d===2){emoji='⛳';title='DOUBLE BOGEY';}
  else if(d===3){emoji='⛳';title='TRIPLE BOGEY';}
  else if(d===4){emoji='⛳';title='QUADRUPLE BOGEY';}
  else if(d===5){emoji='⛳';title='QUINTUPLE BOGEY';}
  else{emoji='⛳';title=`+${d}`;}

  let totalScore = 0; let totalPar = 0;
  S.scorecards.forEach(sc => sc.forEach((s, i) => { if(s!==null){ totalScore+=s; totalPar+=HOLES[i].par; } }));
  const totalDiff=totalScore-totalPar;
  const totalStr=totalDiff===0?'E':totalDiff>0?`+${totalDiff}`:`${totalDiff}`;
  
  buildScorecard();

  const hcScreen = document.getElementById('hcScreen');
  document.getElementById('hcHoleTitle').style.display = '';
  document.getElementById('hcHoleTitle').textContent = `HOLE ${S.holeIdx + 1} COMPLETE`;
  document.getElementById('hcRndBadge').textContent = `ROUND ${S.currentRound}`;
  document.getElementById('hcRndBadge').style.display = S.totalRounds > 1 ? 'block' : 'none';

  const hcIconEl = document.getElementById('hcIcon');
  if(hcIconEl){ hcIconEl.style.display = 'none'; }
  const hcTitle = document.getElementById('hcTitle');
  hcTitle.textContent = title;
  hcTitle.style.display = '';

  // Outcome haptic
  if(!restoringCompletedHole){
    if(isHoleInOne || d<=-2){ vibHoleInOne(); }
    else if(d===-1){ _doHaptic('MEDIUM'); }
    else if(d>=2){ _doHaptic('HEAVY'); }
  }

  hcTitle.style.color=_scoreOutcomeColor(d, isHoleInOne);

  document.getElementById('hcSub').innerHTML = score === 1 ? `HOLE IN ONE · PAR ${h.par} · ${starsHTML(h.baseDiff)}` : `${score} STROKES · PAR ${h.par} · ${starsHTML(h.baseDiff)}`;
  
  const totSpan = document.getElementById('hcTotSpan');
  totSpan.textContent = totalStr;
  if(totalDiff<0) totSpan.style.color='var(--gold)';
  else if(totalDiff===0) totSpan.style.color='var(--c-fwyl)';
  else totSpan.style.color='#e05252';

  // Populate Shot Replay
  _renderShotReplay([...S.log], S.holeDone, d);

  // Populate Mini Scorecard
  const scHead = document.getElementById('hcScHead');
  const scPar = document.getElementById('hcScPar');
  const scYou = document.getElementById('hcScYou');
  scHead.innerHTML = '<div class="sc-lbl">H</div>';
  scPar.innerHTML = '<div class="sc-lbl">PAR</div>';
  scYou.innerHTML = '<div class="sc-lbl">YOU</div>';

  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);
  let runningTot = 0, runningPar = 0;
  activeHoles.forEach((ah, i) => {
      const absIdx = S.startIdx + i;
      const v = S.scorecards[S.currentRound-1][absIdx];
      if (v !== null) { runningTot+=v; runningPar+=ah.par; }

      const d1 = document.createElement('div'); d1.textContent = absIdx + 1; scHead.appendChild(d1);
      const d2 = document.createElement('div'); d2.textContent = ah.par; scPar.appendChild(d2);
      const d3 = document.createElement('div');
      if(v!==null){
          const diff = v - ah.par;
          if(diff<=-2){ d3.innerHTML=`<span class="sc-sym sc-sym-eagle">${v}</span>`; }
          else if(diff===-1){ d3.innerHTML=`<span class="sc-sym sc-sym-birdie">${v}</span>`; }
          else if(diff===0){ d3.innerHTML=`<span class="sc-sym">${v}</span>`; }
          else if(diff===1){ d3.innerHTML=`<span class="sc-sym sc-sym-bogey">${v}</span>`; }
          else { d3.innerHTML=`<span class="sc-sym sc-sym-double">${v}</span>`; }
      } else {
          d3.textContent = '';
          d3.style.display = 'flex';
          d3.style.alignItems = 'center';
          d3.style.justifyContent = 'center';
      }
      scYou.appendChild(d3);
  });
  
  const t1 = document.createElement('div'); t1.textContent = 'TOT'; t1.style.background='rgba(0,0,0,.2)'; scHead.appendChild(t1);
  const t2 = document.createElement('div'); t2.textContent = runningPar; t2.style.background='rgba(0,0,0,.2)'; scPar.appendChild(t2);
  const t3 = document.createElement('div');
  const runDiff = runningTot - runningPar;
  t3.textContent = runningTot;
  t3.style.background='rgba(0,0,0,.2)';
  t3.style.color = runDiff < 0 ? 'var(--gold)' : runDiff > 0 ? '#e05252' : 'var(--c-fwyl)';
  t3.style.fontWeight = 'bold';
  t3.style.display = 'flex';
  t3.style.alignItems = 'center';
  t3.style.justifyContent = 'center';
  scYou.appendChild(t3);

  const colW = activeHoles.length <= 9 ? 'minmax(0, 1fr)' : '34px';
  scHead.style.gridTemplateColumns = `40px repeat(${activeHoles.length}, ${colW}) 40px`;
  scPar.style.gridTemplateColumns = `40px repeat(${activeHoles.length}, ${colW}) 40px`;
  scYou.style.gridTemplateColumns = `40px repeat(${activeHoles.length}, ${colW}) 40px`;

  const scInner = document.querySelector('#hcScreen .sc-inner');
  if (scInner) {
      scInner.style.width = activeHoles.length <= 9 ? '100%' : 'max-content';
  }

  // Auto-scroll the mini scorecard to the current hole
  setTimeout(() => {
      const youCells = scYou.querySelectorAll('div:not(.sc-lbl)');
      const activeIndex = S.holeIdx - S.startIdx;
      if (youCells[activeIndex]) {
          youCells[activeIndex].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
      }
  }, 50);
  
  const btn = document.getElementById('hcBtn');
  if (S.holeIdx === S.endIdx) {
      if (S.currentRound < S.totalRounds) {
          btn.textContent = `COMPLETE ROUND ${S.currentRound}`;
      } else {
          btn.textContent = 'VIEW SUMMARY';
      }
  } else {
      btn.textContent = 'NEXT HOLE';
  }
  btn.onclick = nextHole;

  if(S._skipCelebration){
    S._skipCelebration=false;
    setMainAppConcealed(true);
    hideMainAppImmediate();
    document.getElementById('hcScreen').classList.add('show');
  } else {
    showCelebration(isHoleInOne?-99:d, ()=>{
      setMainAppConcealed(true);
      hideMainAppImmediate();
      document.getElementById('hcScreen').classList.add('show');
    });
  }
  try{ saveGameState(); }catch{}
}

function nextHole(){
  const nr=document.getElementById('ovNameRow');
  if(nr){nr.style.fontSize='';nr.style.fontFamily='';nr.style.letterSpacing='';nr.style.color='';}
  document.getElementById('overlay').classList.remove('show');
  const pbRow = document.getElementById('ovPbRow'); if(pbRow) pbRow.remove();
  const ovBtn = document.getElementById('ovBtn');
  if(ovBtn) ovBtn.onclick = ()=>nextHole();

  if(S.holeIdx >= S.endIdx){
    _setNavDir('forward');
    setMainAppConcealed(true);
    hideMainAppImmediate();
    const hc = document.getElementById('hcScreen');
    if(hc && hc.classList.contains('show')){
      swapHcScreenContent(()=>showRoundEnd());
    } else {
      showRoundEnd();
    }
    return;
  }
  revealMainApp();
  
  // Instantly load the next hole in the DOM in the background
  S.holeIdx++;
  loadHole();
  // Ensure the game screen is scrolled to the top so the new hole starts at the header
  try{ window.scrollTo({top:0, left:0, behavior:'auto'}); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }catch{}

  // Wait exactly long enough for Safari to paint the new layout, then hide the overlay
  setTimeout(() => {
      const hc = document.getElementById('hcScreen');
      if (hc) hc.classList.remove('show');
      try{ window.scrollTo({top:0, left:0, behavior:'auto'}); }catch{}
  }, 30);
}

function ensureRoundXpPanel(){
  const hcScreen = document.getElementById('hcScreen');
  if(!hcScreen) return null;
  let xpWrap = document.getElementById('hcRoundXpWrap');
  if(xpWrap) return xpWrap;
  const scoreCard = document.getElementById('hcScoreCard');
  const mid = document.getElementById('hcMidSection');
  if(!scoreCard || !mid || !scoreCard.parentNode) return null;
  xpWrap = document.createElement('div');
  xpWrap.id = 'hcRoundXpWrap';
  xpWrap.style.cssText = 'margin-top:-8px;margin-bottom:12px;display:none;flex-shrink:0;';
  scoreCard.parentNode.insertBefore(xpWrap, mid);
  return xpWrap;
}

function showRoundEnd(){
  setMainAppConcealed(true);
  hideMainAppImmediate();
  const alreadyProcessed = !!S._roundEndProcessed;
  const roundEndMeta = S._roundEndMeta || null;
  if(S.currentRound === S.totalRounds || !alreadyProcessed){
    clearSavedGame();
  }
  const midSection = document.getElementById('hcMidSection');
  if(midSection) midSection.style.display = 'flex';
  
  const curSc = S.scorecards[S.currentRound - 1];
  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);
  const roundTotal = curSc.reduce((a,b)=>a+(b||0),0);
  const roundPar = activeHoles.reduce((a,h)=>a+h.par,0);
  const roundDiff = roundTotal - roundPar;
  
  if (S.currentRound === S.totalRounds) {
    const profiles = loadProfiles();
    const p = profiles[getActiveProfileIdx()];
    const isNewPB = alreadyProcessed
      ? !!(roundEndMeta && roundEndMeta.isNewPB)
      : !!(p && (p.bestDiff === undefined || roundDiff < p.bestDiff));

    let xpAward = roundEndMeta && roundEndMeta.xpAward ? roundEndMeta.xpAward : null;
    if(!alreadyProcessed){
      updateProfileAfterRound(roundTotal, roundPar);
      updateProfileStatsAfterRound(roundTotal, roundPar, S._wcUsedThisRound||0);
      applyCompletionModeAchievements();
      incrementCompletedGameCounters();
      checkAndAwardAchievements({silent:true});
      xpAward = awardRoundExperience({
        source: 'round',
        title: 'GAINED XP',
        roundNumber: S.currentRound,
        roundIdx: S.currentRound - 1,
        holesPlayed: activeHoles.length,
        roundDiff,
        roundTotal,
        roundPar,
        gameDiff: GAME_DIFF
      });
      S._roundEndProcessed = true;
      S._roundEndMeta = { xpAward, isNewPB };
    }
    
    let globalTotal = 0, globalPar = 0;
    S.scorecards.forEach(sc => sc.forEach((s, i) => { if(s!==null){ globalTotal+=s; globalPar+=HOLES[i].par; } }));
    const globalDiff = globalTotal - globalPar;
    const finalTotalStr = globalDiff===0?'E':globalDiff>0?`+${globalDiff}`:`${globalDiff}`;
    
    const hcScreen = document.getElementById('hcScreen');
    document.getElementById('hcHoleTitle').style.display = '';
    document.getElementById('hcHoleTitle').textContent = 'ROUND COMPLETE';
    document.getElementById('hcRndBadge').style.display = 'none';
    const hcDiffSub = document.getElementById('hcDiffSub');
    if (hcDiffSub) hcDiffSub.style.display = 'none';
    const hcXpWrapFinal = document.getElementById('hcXpWrap');
    if (hcXpWrapFinal) hcXpWrapFinal.style.display = 'none';
    const hcRoundXpWrapFinal = document.getElementById('hcRoundXpWrap');
    if (hcRoundXpWrapFinal) hcRoundXpWrapFinal.style.display = 'none';

    ['hcIcon', 'hcTitle', 'hcSub', 'hcTot'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    let vsContainer = document.getElementById('hcVsContainer');
    if (!vsContainer) {
        vsContainer = document.createElement('div');
        vsContainer.id = 'hcVsContainer';
        document.querySelector('.hc-card').appendChild(vsContainer);
    }
    vsContainer.style.display = 'block';

    let emoji = globalDiff < 0 ? '🏆' : globalDiff === 0 ? '⛳' : '🏌️';
    let color = globalDiff < 0 ? 'var(--gold)' : globalDiff === 0 ? 'var(--c-fwyl)' : '#e05252';
    const roundsStr = S.totalRounds > 1 ? ` (${S.totalRounds} Rounds)` : '';
    const diffNamesFinal = {1:'EASY', 2:'MEDIUM', 3:'HARD'};
    const finalDiffLabel = diffNamesFinal[GAME_DIFF] || 'MEDIUM';

    vsContainer.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:14px;">
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Bebas Neue',cursive;font-size:40px;color:var(--text);letter-spacing:2px;line-height:1;margin-bottom:6px;">FINAL SCORE</div>
        <div style="font-family:'Sen',sans-serif;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">${globalTotal} strokes</div>
        <div style="font-family:'Sen',sans-serif;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Par ${globalPar}${roundsStr} · ${finalDiffLabel}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;gap:4px;">
        <span style="font-family:'Sen',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;">TOTAL</span>
        <div style="background:var(--course-panel-strong);border:1px solid var(--border);border-radius:14px;padding:10px 16px;min-width:62px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',cursive;font-size:36px;letter-spacing:1px;line-height:1;color:${color};">${finalTotalStr}</div>
      </div>
    </div>
`;
    const roundXpWrapFinal = ensureRoundXpPanel();
    if(roundXpWrapFinal){
      roundXpWrapFinal.innerHTML = xpAward ? renderXpAwardCardHtml(xpAward) : '';
      roundXpWrapFinal.style.display = xpAward ? 'block' : 'none';
      if(xpAward) animateXpBars(roundXpWrapFinal);
    }

    document.querySelectorAll('#hcScreen .sec-title').forEach(t => t.style.display = 'none');
    const shotTrailF = document.getElementById('hcShotTrail');
    const shotDetailF = document.getElementById('hcShotDetail');
    if(shotTrailF) shotTrailF.style.display = 'none';
    if(shotDetailF) shotDetailF.style.display = 'none';
    const scWrap = document.querySelector('#hcScreen .sc-wrap');
    if (scWrap) scWrap.style.display = 'none'; // Hide the scorecard here
    const vsToggle = document.getElementById('vsToggleRow');
    if (vsToggle) vsToggle.style.display = 'none';

    let statsContainer = document.getElementById('hcVsStats');
    const midSectionFinal = document.getElementById('hcMidSection');
    if(midSectionFinal) midSectionFinal.style.display = 'none';
    if(statsContainer){
      statsContainer.style.display = 'none';
      statsContainer.innerHTML = '';
    }

    const btn = document.getElementById('hcBtn');
    btn.textContent = 'NEXT';
    btn.onclick = () => {
        setSummaryContext(null);
        openSummaryFromRoundComplete(S.currentRound);
    };

    setMainAppConcealed(true);
    hcScreen.classList.add('show');
  } else {
    let xpAward = roundEndMeta && roundEndMeta.xpAward ? roundEndMeta.xpAward : null;
    if(!alreadyProcessed){
      updateProfileAfterRound(roundTotal, roundPar);
      updateProfileStatsAfterRound(roundTotal, roundPar, S._wcUsedThisRound||0);
      checkAndAwardAchievements({silent:true});
      xpAward = awardRoundExperience({
        source: 'round',
        title: 'GAINED XP',
        roundNumber: S.currentRound,
        roundIdx: S.currentRound - 1,
        holesPlayed: activeHoles.length,
        roundDiff,
        roundTotal,
        roundPar,
        gameDiff: GAME_DIFF
      });
      S._roundEndProcessed = true;
      S._roundEndMeta = { xpAward };
      saveGameState();
    }

    const hcScreen = document.getElementById('hcScreen');
    document.getElementById('hcHoleTitle').style.display = '';
    document.getElementById('hcHoleTitle').textContent = `ROUND ${S.currentRound} COMPLETE`;
    document.getElementById('hcRndBadge').style.display = 'none';

    // Hide the classic score card elements; use vsContainer layout for clean rendering
    ['hcIcon', 'hcTitle', 'hcSub', 'hcTot'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    const vsT = document.getElementById('vsToggleRow');
    if(vsT) vsT.style.display = 'none';

    const rDiffStr = roundDiff===0?'E':roundDiff>0?`+${roundDiff}`:`${roundDiff}`;
    let rColor = roundDiff<0?'var(--gold)':roundDiff===0?'var(--c-fwyl)':'#e05252';
    const diffNames2 = {1:'EASY', 2:'MEDIUM', 3:'HARD'};
    const roundDiffLabel = diffNames2[GAME_DIFF] || 'MEDIUM';

    let vsContainerR = document.getElementById('hcVsContainer');
    if (!vsContainerR) {
        vsContainerR = document.createElement('div');
        vsContainerR.id = 'hcVsContainer';
        document.querySelector('.hc-card').appendChild(vsContainerR);
    }
    vsContainerR.style.display = 'block';
    vsContainerR.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:14px;">
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Bebas Neue',cursive;font-size:36px;color:var(--text);letter-spacing:2px;line-height:1;margin-bottom:6px;">ROUND ${S.currentRound}</div>
        <div style="font-family:'Sen',sans-serif;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">${roundTotal} strokes</div>
        <div style="font-family:'Sen',sans-serif;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Par ${roundPar} · ${roundDiffLabel}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;gap:4px;">
        <span style="font-family:'Sen',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;">TOTAL</span>
        <div style="background:var(--course-panel-strong);border:1px solid var(--border);border-radius:14px;padding:10px 16px;min-width:62px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',cursive;font-size:36px;letter-spacing:1px;line-height:1;color:${rColor};">${rDiffStr}</div>
      </div>
    </div>`;

    let hcDiffSub = document.getElementById('hcDiffSub');
    if (hcDiffSub) hcDiffSub.style.display = 'none';
    const roundXpWrap = ensureRoundXpPanel();
    if(roundXpWrap){
      roundXpWrap.innerHTML = xpAward ? renderXpAwardCardHtml(xpAward) : '';
      roundXpWrap.style.display = xpAward ? 'block' : 'none';
      if (xpAward) animateXpBars(roundXpWrap);
    }

    // Show tournament statistics only
    const shotTrailT = document.getElementById('hcShotTrail');
    const shotDetailT = document.getElementById('hcShotDetail');
    if(shotTrailT) shotTrailT.style.display = 'none';
    if(shotDetailT) shotDetailT.style.display = 'none';
    const secTitles = document.querySelectorAll('#hcScreen .sec-title');
    if(secTitles[0]) secTitles[0].style.display = 'none';
    if(secTitles[1]) secTitles[1].style.display = 'none';

    const scWrap2 = document.querySelector('#hcScreen .sc-wrap');
    if(scWrap2) scWrap2.style.display = 'none';
    
    let statsC = document.getElementById('hcVsStats');
    const midSectionRound = document.getElementById('hcMidSection');
    if(midSectionRound) midSectionRound.style.display = 'none';
    if(statsC){
      statsC.style.display = 'none';
      statsC.innerHTML = '';
    }

    const btn = document.getElementById('hcBtn');
    btn.textContent = 'NEXT';
    btn.onclick = () => {
        setSummaryContext(null);
        openSummaryFromRoundComplete(S.currentRound);
    };

    setMainAppConcealed(true);
    hcScreen.classList.add('show');
  }
}

// ═══════════════════════════════════════
// ROUND SUMMARY MODAL
// ═══════════════════════════════════════
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

  const scData = S.scorecards[viewRound - 1] || Array(18).fill(null);
  const histData = S.histories[viewRound - 1] || Array(18).fill(null);
  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);

  const roundTotal = scData.reduce((a,b)=>a+(b||0),0);
  const roundPar = activeHoles.reduce((a,h)=>a+h.par,0);
  const roundDiff = roundTotal - roundPar;

  let globalTotal = 0, globalPar = 0;
  S.scorecards.forEach(sc => sc.forEach((s, i) => { if(s!==null){ globalTotal+=s; globalPar+=HOLES[i].par; } }));
  const globalDiff = globalTotal - globalPar;
  const gDiffStr = globalDiff===0?'E':globalDiff>0?`+${globalDiff}`:`${globalDiff}`;
  const roundStats = getRoundStats(viewRound);

  const statsHead = document.createElement('div');
  statsHead.className = 'sum-section-head';
  statsHead.innerHTML = `<div class="ttl">STATISTICS</div><div class="line"></div>`;
  if(S.totalRounds > 1){
    const pillWrap = document.createElement('div');
    pillWrap.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';
    for(let r=1; r<=S.totalRounds; r++){
      if(r > S.currentRound && S.currentRound !== S.totalRounds && !S.scorecards[r-1]) continue;
      const pill = document.createElement('button');
      pill.className = `sum-tab${r === viewRound ? ' active' : ''}`;
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
    row.onclick=()=>openHistInline(absoluteIdx, holeList, row, viewRound);
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
  setSummaryContext(null);
  if(versusReplay){
    VS.active = true;
    startGame();
    if(summaryModal) summaryModal.classList.remove('show');
    if(overlay) overlay.classList.remove('show');
    document.querySelector('.tv-bar')?.classList.add('show');
    return;
  }
  startGame();
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


// ═══════════════════════════════════════
