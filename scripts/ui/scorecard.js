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
  const rollBtn = document.getElementById('rollBtn');
  if(rollBtn){ rollBtn.textContent='ROLL'; rollBtn.classList.remove('finish-hole-state'); }
  if(nextBtn){
     nextBtn.classList.remove('finish-hole-state');
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
  S._skipCelebration=false;S._preserveGrid=false;S._forceGrid=false;S._forceP1PuttGrid=false;S._finishGridFrozenHTML=null;
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

