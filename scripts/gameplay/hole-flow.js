// Hole Completion, Hole Transitions, and Round-End Flow

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
  if(isCpuLeaderboardEnabled() && !restoringCompletedHole && typeof advanceCpuFieldForPlayerHole === 'function'){
    advanceCpuFieldForPlayerHole(S.cpuField, {
      holes: HOLES,
      currentRound: S.currentRound,
      completedHoleIdx: S.holeIdx,
      playerScores: S.scorecards,
      gameDiff: GAME_DIFF,
      courseId: S.courseId || ACTIVE_COURSE_ID
    });
  }

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
      profiles[idx]=p;saveProfiles(profiles);
      if(prevStreak<3 && newStreak>=3) unlockAchievement('on_a_roll');
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
  [scHead, scPar, scYou].forEach((row, idx)=>{
    const lbl=row?.querySelector('.sc-lbl');
    if(lbl){
      lbl.style.opacity='1';
      lbl.style.filter='none';
      lbl.style.color='#fff';
      lbl.style.background = idx === 0 ? 'var(--c-fwy)' : 'var(--dark)';
    }
  });

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

  if(isCpuLeaderboardEnabled() && typeof renderCpuLeaderboardInto === 'function'){
    renderCpuLeaderboardInto(midSection, {
      field: S.cpuField,
      holes: HOLES,
      playerName: PLAYER_NAME,
      playerScores: S.scorecards,
      currentRound: S.currentRound,
      compact: true
    });
  } else if(midSection) {
    midSection.querySelectorAll('.cpu-lb-block').forEach(el => el.remove());
  }
  
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
    S._finishGridFrozenHTML=null;
    document.getElementById('gridAxes')?.classList.remove('finish-grid-frozen');
    document.getElementById('hcScreen').classList.add('show');
  } else {
    showCelebration(isHoleInOne?-99:d, ()=>{
      setMainAppConcealed(true);
      hideMainAppImmediate();
      S._finishGridFrozenHTML=null;
      document.getElementById('gridAxes')?.classList.remove('finish-grid-frozen');
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
  if(isCpuLeaderboardEnabled() && !alreadyProcessed && typeof completeCpuFieldRound === 'function'){
    completeCpuFieldRound(S.cpuField, {
      holes: HOLES,
      currentRound: S.currentRound,
      gameDiff: GAME_DIFF,
      courseId: S.courseId || ACTIVE_COURSE_ID
    });
  }
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
    let achievementIds = roundEndMeta && Array.isArray(roundEndMeta.achievementIds) ? roundEndMeta.achievementIds : [];
    if(!alreadyProcessed){
      updateProfileAfterRound(roundTotal, roundPar);
      updateProfileStatsAfterRound(roundTotal, roundPar, S._wcUsedThisRound||0);
      applyCompletionModeAchievements();
      incrementCompletedGameCounters();
      achievementIds = checkAndAwardAchievements({silent:true}).map(a => a.id);
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
      S._roundEndMeta = { xpAward, isNewPB, achievementIds };
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
    if(achievementIds.length && !S._roundEndAchievementPopupsShown && typeof showAchievementPopups === 'function'){
      S._roundEndAchievementPopupsShown = true;
      try{ saveGameState(); }catch{}
      showAchievementPopups(achievementIds, 650);
    }
  } else {
    let xpAward = roundEndMeta && roundEndMeta.xpAward ? roundEndMeta.xpAward : null;
    let achievementIds = roundEndMeta && Array.isArray(roundEndMeta.achievementIds) ? roundEndMeta.achievementIds : [];
    if(!alreadyProcessed){
      updateProfileAfterRound(roundTotal, roundPar);
      updateProfileStatsAfterRound(roundTotal, roundPar, S._wcUsedThisRound||0);
      achievementIds = checkAndAwardAchievements({silent:true}).map(a => a.id);
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
      S._roundEndMeta = { xpAward, achievementIds };
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
    if(achievementIds.length && !S._roundEndAchievementPopupsShown && typeof showAchievementPopups === 'function'){
      S._roundEndAchievementPopupsShown = true;
      try{ saveGameState(); }catch{}
      showAchievementPopups(achievementIds, 650);
    }
  }
}
