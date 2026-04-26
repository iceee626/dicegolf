// Versus Setup, Turns, Scoring, Comparisons, and Final Results
// VERSUS MODE SYSTEM (with custom game options)
// ═══════════════════════════════════════════════════════
let VS = {
  active: false,
  format: 'stroke', // 'stroke' or 'match'
  players: [{name:'P1',icon:'🏌️'},{name:'P2',icon:'⛳'}],
  currentPlayer: 0,
  scores: [[], []],
  histories: [[], []],
  matchScore: [0, 0], // holes won for match play
  sharedGrids: {},
  setup: { rounds:1, holesConfig:'18', diff:1, course:null, courseSelected:false },
  lastStrokeRounds: 1,
  completionRecorded: false,
  wcs: [null, null],
};

const VS_EMOJIS = ['🏌️','🏌️‍♀️','⛳','🏆','🎯','⚡','🔥','🌟','💪','🦅','🐯','🦁','🐺','😎','🤠','🧢','🕶️','🥸','😤','🥊','🏄','🌊','🐤','💎','🍀','👑','🎲','🃏'];
function navToVersusSetup(){
  forceHideGame();
  _courseScreenFlow = 'versus';
  VS.active = false; // Reset until they start
  hideScreen('menuScreen');
  [1,2].forEach(pn=>{
    const grid = document.getElementById('vs'+pn+'Emoji');
    grid.innerHTML='';
    VS_EMOJIS.forEach(e=>{
      const b=document.createElement('button');
      b.textContent=e;
      b.onclick=()=>selectVsEmoji(pn,e);
      grid.appendChild(b);
    });
  });
  showScreen('versusSetupScreen','flex');
}

function toggleVsEmoji(pn){
  document.getElementById('vs'+pn+'Emoji').classList.toggle('show');
}
function selectVsEmoji(pn,emoji){
  document.getElementById('vs'+pn+'Icon').textContent=emoji;
  document.getElementById('vs'+pn+'Emoji').classList.remove('show');
  document.querySelectorAll('#vs'+pn+'Emoji button').forEach(b=>b.classList.toggle('sel', b.textContent===emoji));
}

function navToVsOptions(){
  const n1=sanitizeName(document.getElementById('vs1Name').value,10);
  const n2=sanitizeName(document.getElementById('vs2Name').value,10);
  if(!n1 || !n2){ 
      document.getElementById('alertMsg').textContent = 'BOTH PLAYERS MUST ENTER A NAME!';
      document.getElementById('alertModal').classList.add('show');
      return; 
  }
  if(n1===n2){ 
      document.getElementById('alertMsg').textContent = 'PLAYERS MUST HAVE DIFFERENT NAMES!';
      document.getElementById('alertModal').classList.add('show');
      return; 
  }
  VS.players[0]={name:n1, icon:document.getElementById('vs1Icon').textContent};
  VS.players[1]={name:n2, icon:document.getElementById('vs2Icon').textContent};
  hideScreen('versusSetupScreen');
  showScreen('vsOptionsScreen','flex');
  // Init defaults
  vsSetFormat('stroke');
  vsSetHoles('18');
  vsSetRounds(1);
  vsSetDiff(1);
}

function vsSetFormat(f){
  VS.format = f;
  document.getElementById('vsFormatStroke').classList.toggle('active', f==='stroke');
  document.getElementById('vsFormatMatch').classList.toggle('active', f==='match');
  if(f==='match'){
    if((VS.setup.rounds||1) > 1) VS.lastStrokeRounds = VS.setup.rounds;
    vsSetRoundsAvailability(true);
    vsSetRounds(1, true);
  } else {
    vsSetRoundsAvailability(false);
    const restored = [1,2,3,4].includes(VS.lastStrokeRounds) ? VS.lastStrokeRounds : (VS.setup.rounds || 1);
    vsSetRounds(restored, true);
  }
  const desc = document.getElementById('vsFormatDesc');
  if(desc) desc.textContent = f==='stroke' ? 'Lowest total score wins. Every stroke counts!' : 'Win individual holes. Most holes won = winner!';
}
function vsSetHoles(h){
  VS.setup.holesConfig = h;
  ['18','front','back'].forEach(k=>document.getElementById('vsH-'+k)?.classList.toggle('active', k===h));
}
function vsSetRounds(r, force=false){
  if(VS.format==='match' && r!==1 && !force) return;
  VS.setup.rounds = r;
  if(VS.format==='stroke') VS.lastStrokeRounds = r;
  [1,2,3,4].forEach(i=>document.getElementById(`vsR-${i}`)?.classList.toggle('active', i===r));
}
function vsSetDiff(d){
  VS.setup.diff = d;
  [1,2,3].forEach(i=>document.getElementById('vsDiff-'+i)?.classList.toggle('active', i===d));
}

function vsSetRoundsAvailability(lockToOne){
  [1,2,3,4].forEach(i=>{
    const btn = document.getElementById(`vsR-${i}`);
    if(!btn) return;
    btn.disabled = lockToOne && i!==1;
  });
}

function navBackFromCourse(){
  _setNavDir('back');
  hideScreen('courseScreen');
  if(_courseScreenFlow === 'versus'){
    if(VS.setup) VS.setup.courseSelected=false;
    updateCourseScreenModeUI();
    showScreen('vsOptionsScreen','flex');
  } else if(_courseScreenFlow === 'custom'){
    SETUP.courseSelected = false;
    SETUP.course = null;
    updateCourseScreenModeUI();
    showScreen('customScreen','flex');
  } else {
    SETUP.courseSelected = false;
    SETUP.course = null;
    updateCourseScreenModeUI();
    showScreen('diffScreen','flex');
  }
}
  
function vsStartFromOptions(){
  if(VS.format === 'match') VS.setup.rounds = 1;
  SETUP.mode = 'custom';
  SETUP.rounds = VS.setup.rounds || 1;
  SETUP.holesConfig = VS.setup.holesConfig;
  GAME_DIFF = VS.setup.diff;
  _lastMenuScreen = 'vsOptionsScreen';
  _courseScreenFlow = 'versus';
  VS.setup.courseSelected = false;
  VS.setup.course = null;
  hideScreen('vsOptionsScreen');
  showScreen('courseScreen','flex');
  VS.active = true;
  updateCourseScreenModeUI();
}

function vsStartGame(){
  VS.active = true;
  VS.completionRecorded = false;
  if(VS.setup) VS.setup.courseSelected = false;
  if(VS.format === 'match'){
    VS.setup.rounds = 1;
    S.totalRounds = 1;
    S.currentRound = 1;
  }
  VS.currentPlayer = 0;
  const makeRounds = () => Array.from({length:S.totalRounds}, ()=>Array(18).fill(null));
  VS.scores = [makeRounds(), makeRounds()];
  VS.histories = [makeRounds(), makeRounds()];
  VS.matchScore = [0, 0];
  VS.sharedGrids = {};
  const baseWc = () => ({ equipped:[], active:null, luckyBounceActive:false, ironWillActive:false, greenReadActive:false, greenReadQueued:false, bounceBackPending:false, bounceBackReady:false, bogeyShieldActive:false, mowersRevengeActive:false, mowersRevengeQueued:false, birdieBoostActive:false, holeWallActive:false, sandWedgeProActive:false, cupMagnetActive:false, goldenPutterActive:false, ferrettActive:false, hioActive:false, highlightReelActive:false, shortcutActive:false });
  VS.wcs = [baseWc(), baseWc()];
  vsShowTurnScreen();
}

function vsRoundIdx(){
  return Math.max(0, (S.currentRound || 1) - 1);
}

function vsRoundScores(playerIdx, roundIdx = vsRoundIdx()){
  const store = VS.scores[playerIdx] || [];
  if(Array.isArray(store[0])) return store[roundIdx] || Array(18).fill(null);
  return store;
}

function vsRoundHistories(playerIdx, roundIdx = vsRoundIdx()){
  const store = VS.histories[playerIdx] || [];
  if(Array.isArray(store[0])) return store[roundIdx] || Array(18).fill(null);
  return store;
}

function vsSyncScorecardMirror(playerIdx = VS.currentPlayer){
  if(!VS.active) return;
  const rounds = Math.max(1, S.totalRounds || VS.setup?.rounds || 1);
  if(!Array.isArray(S.scorecards)) S.scorecards = [];
  if(!Array.isArray(S.histories)) S.histories = [];
  while(S.scorecards.length < rounds) S.scorecards.push(Array(18).fill(null));
  while(S.histories.length < rounds) S.histories.push(Array(18).fill(null));
  for(let r=0; r<rounds; r++){
    S.scorecards[r] = [...vsRoundScores(playerIdx, r)];
    S.histories[r] = [...vsRoundHistories(playerIdx, r)];
  }
}

function vsGetScore(playerIdx, holeIdx, roundIdx = vsRoundIdx()){
  const roundScores = vsRoundScores(playerIdx, roundIdx);
  return roundScores[holeIdx] ?? null;
}

function vsSetScore(playerIdx, holeIdx, value, roundIdx = vsRoundIdx()){
  if(Array.isArray(VS.scores[playerIdx]?.[0])){
    VS.scores[playerIdx][roundIdx][holeIdx] = value;
    return;
  }
  VS.scores[playerIdx][holeIdx] = value;
}

function vsGetHistory(playerIdx, holeIdx, roundIdx = vsRoundIdx()){
  const roundHist = vsRoundHistories(playerIdx, roundIdx);
  return roundHist[holeIdx] || null;
}

function vsSetHistory(playerIdx, holeIdx, value, roundIdx = vsRoundIdx()){
  if(Array.isArray(VS.histories[playerIdx]?.[0])){
    VS.histories[playerIdx][roundIdx][holeIdx] = value;
    return;
  }
  VS.histories[playerIdx][holeIdx] = value;
}

function vsStrokeTotals(playerIdx, roundsToInclude = (S.currentRound || 1)){
  let total = 0;
  let par = 0;
  for(let r = 0; r < roundsToInclude; r++){
    for(let i = S.startIdx; i <= S.endIdx; i++){
      const score = vsGetScore(playerIdx, i, r);
      if(score !== null){
        total += score;
        par += HOLES[i].par;
      }
    }
  }
  return { total, par, diff: total - par };
}

function vsShowTurnScreen(){
  const p = VS.players[VS.currentPlayer];
  const h = HOLES[S.holeIdx];
  document.getElementById('vsTurnIcon').textContent = p.icon;
  document.getElementById('vsTurnName').textContent = p.name + "'S TURN";
  const roundPrefix = S.totalRounds > 1 ? `ROUND ${S.currentRound} · ` : '';
  document.getElementById('vsTurnSub').textContent = `${roundPrefix}HOLE ${S.holeIdx+1} · PAR ${h.par}`;
  try{ setMainAppConcealed(true); }catch{}
  try{ hideMainAppImmediate(); }catch{}
  const tvBar = document.getElementById('tvBar');
  if(tvBar) tvBar.classList.remove('show');
  if(typeof replayVersusTurnSplashAnimation === 'function') replayVersusTurnSplashAnimation();
  document.getElementById('vsTurnScreen').classList.add('show');
}

function vsStartTurn(){
  document.getElementById('vsTurnScreen').classList.remove('show');
  if(typeof resetVersusTurnSplashReplay === 'function') resetVersusTurnSplashReplay();
  revealMainApp();
  const p = VS.players[VS.currentPlayer];
  PLAYER_NAME = p.name;
  
  S.zone='tee'; S.strokes=0; S.shotNum=1; S._tvShotNum=1; S.shotCount=0;
  S.log=[]; S.holeDone=false; S.rolling=false;
  S.fwyVisits=0; S.prevZone=null;
  S._wcsUsedThisHole=[]; S._wcNextShotNote=null;
  S._skipCelebration=false; S._preserveGrid=false; S._forceGrid=false;
  S._mulliganJustFired=false; S._puttWcUsed=false; S._pendingPuttResult=null; S._pendingHoleFinish=null;
  _holdFinishBtn=false;
  setRerollChoiceActive(false);
  const nextBtn=document.getElementById('nextShotBtn');
  if(nextBtn){
    nextBtn.textContent='NEXT SHOT';
    nextBtn.onclick=doNextShot;
    nextBtn.style.background='var(--c-tee)';
    nextBtn.style.pointerEvents='';
    nextBtn.disabled=false;
  }
  
  vsSyncScorecardMirror(VS.currentPlayer);
  
  // Wipe all active wildcard states cleanly before switching turns
  WCS.active=null; WCS.greenLightShots=0; WCS.sandCastleActive=false; WCS.luckyBounceActive=false;
  WCS.ironWillActive=false; WCS.ferrettActive=false; WCS.goldenPutterActive=false;
  WCS.eagleEyeActive=false; WCS.sandWedgeProActive=false; WCS.birdieBoostActive=false;
  WCS.holeWallActive=false; WCS.hioActive=false;

  if (VS.wcs && VS.wcs[VS.currentPlayer]) {
      Object.assign(WCS, VS.wcs[VS.currentPlayer]); // Load persistent buffs
      WCS.equipped = (VS.wcs[VS.currentPlayer].equipped || []).filter(wc=>wc && WILDCARDS.some(def=>def.id===wc.id));
  }
  wcResetHole(); // Clear only temporary per-shot flags
  
  const h = HOLES[S.holeIdx];
  S.yrdTotal=h.yards; S.yrdRemain=h.yards;
  
  document.getElementById('holeName').textContent=h.name;
  document.getElementById('holeYards').textContent=fmtYds(h.yards);
  document.getElementById('holeStars').innerHTML=starsHTML(h.baseDiff);
  document.getElementById('holePar').textContent=h.par;
  
  const sr = document.getElementById('scoreRow');
  if(sr){ const lbl = sr.querySelector('.sc-lbl'); if(lbl) lbl.textContent = p.name.substring(0,6); }
  
  document.getElementById('tvName').textContent = p.name;
  const tvIcon = document.querySelector('.tv-icon-box');
  if(tvIcon) tvIcon.textContent = p.icon;
  
  startDiceIdle();
  hideNextShotBtn(true);
  buildGrid(); updateZonePill(); updateYrd(); resetResult(); renderLog(); updateFloat();
  updateTVBanner();
  buildScorecard(); // FIX: ensure missing scorecard updates immediately
  renderWcFab(); // Re-render WC fab for current player
}

function vsCompleteHole(){
  const score = S.strokes;
  vsSetScore(VS.currentPlayer, S.holeIdx, score);
  vsSetHistory(VS.currentPlayer, S.holeIdx, {
      log: [...S.log], 
      strokes: score, 
      par: HOLES[S.holeIdx].par, 
      name: HOLES[S.holeIdx].name,
      wcsUsed: [...(S._wcsUsedThisHole || [])]
  });
  
  if (!VS.wcs) {
  const baseWc = () => ({ equipped:[], active:null, luckyBounceActive:false, ironWillActive:false, greenReadActive:false, greenReadQueued:false, bounceBackPending:false, bounceBackReady:false, bogeyShieldActive:false, mowersRevengeActive:false, mowersRevengeQueued:false, birdieBoostActive:false, holeWallActive:false, sandWedgeProActive:false, cupMagnetActive:false, goldenPutterActive:false, ferrettActive:false, hioActive:false, highlightReelActive:false, shortcutActive:false });
   VS.wcs = [baseWc(), baseWc()];
  }
  VS.wcs[VS.currentPlayer] = { ...WCS, equipped: [...WCS.equipped] }; // Save FULL wildcard state for this player
  
  if(VS.currentPlayer === 0){
    VS.currentPlayer = 1;
    document.getElementById('overlay').classList.remove('show');
    try{ setMainAppConcealed(true); }catch{}
    try{ hideMainAppImmediate(); }catch{}
    vsShowTurnScreen();
  } else {
    VS.currentPlayer = 0;
    document.getElementById('overlay').classList.remove('show');

    // Match play: track hole winner
    if(VS.format === 'match'){
      const s1 = vsGetScore(0, S.holeIdx), s2 = vsGetScore(1, S.holeIdx);
      if(s1 < s2) VS.matchScore[0]++;
      else if(s2 < s1) VS.matchScore[1]++;
    }

    try{ setMainAppConcealed(true); }catch{}
    try{ hideMainAppImmediate(); }catch{}
    const tvBarVs = document.getElementById('tvBar');
    if(tvBarVs) tvBarVs.classList.remove('show');
    vsShowHoleComparison();
  }
}

function renderVsReplayAndScoreboard(playerIdx) {
  // 1. Render Shot Replay
  const pLog = vsGetHistory(playerIdx, S.holeIdx)?.log || [];
  const vsScore = vsGetScore(playerIdx, S.holeIdx);
  const vsDiff = (vsScore !== null) ? vsScore - HOLES[S.holeIdx].par : null;
  _renderShotReplay([...pLog], true, vsDiff);

  // 2. Render Scorecard
  const scHead = document.getElementById('hcScHead');
  const scPar = document.getElementById('hcScPar');
  const scYou = document.getElementById('hcScYou');
  scHead.innerHTML = '<div class="sc-lbl">H</div>';
  scPar.innerHTML = '<div class="sc-lbl">PAR</div>';
  scYou.innerHTML = `<div class="sc-lbl">${escapeHtml(VS.players[playerIdx].name.substring(0,3))}</div>`;

  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);
  let runningTot = 0, runningPar = 0;
  activeHoles.forEach((ah, i) => {
      const absIdx = S.startIdx + i;
      const v = vsGetScore(playerIdx, absIdx);
      if (v !== null) { runningTot+=v; runningPar+=ah.par; }

      const d1 = document.createElement('div'); d1.textContent = absIdx + 1; scHead.appendChild(d1);
      const d2 = document.createElement('div'); d2.textContent = ah.par; scPar.appendChild(d2);
      const d3 = document.createElement('div');
      if(v!==null){
          const diff = v - ah.par;
          d3.innerHTML = `<span class="sc-sym${diff<=-2?' sc-sym-eagle':diff===-1?' sc-sym-birdie':diff===1?' sc-sym-bogey':diff>=2?' sc-sym-double':''}">${v}</span>`;
      } else if (absIdx <= S.holeIdx) {
          d3.textContent = '•';
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
  const scWrap = document.querySelector('#hcScreen .sc-wrap');
  if (scWrap) scWrap.style.display = '';

  // 3. Update Pills UI
  const p0 = document.getElementById('vsPill0');
  const p1 = document.getElementById('vsPill1');
  if (p0 && p1) {
      p0.style.background = playerIdx === 0 ? 'var(--c-fwy)' : 'rgba(255,255,255,.05)';
      p0.style.color = playerIdx === 0 ? '#fff' : 'var(--muted)';
      p0.style.borderColor = playerIdx === 0 ? 'var(--c-fwyl)' : 'var(--border)';
      
      p1.style.background = playerIdx === 1 ? 'var(--c-fwy)' : 'rgba(255,255,255,.05)';
      p1.style.color = playerIdx === 1 ? '#fff' : 'var(--muted)';
      p1.style.borderColor = playerIdx === 1 ? 'var(--c-fwyl)' : 'var(--border)';
  }

  // 4. Auto-scroll scorecard
  setTimeout(() => {
      const youCells = scYou.querySelectorAll('div:not(.sc-lbl)');
      const activeIndex = S.holeIdx - S.startIdx;
      if (youCells[activeIndex]) {
          youCells[activeIndex].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
      }
  }, 50);
}

function vsShowHoleComparison(){
  const h = HOLES[S.holeIdx];
  const s1 = vsGetScore(0, S.holeIdx), s2 = vsGetScore(1, S.holeIdx);
  const d1 = s1 - h.par, d2 = s2 - h.par;

  const totalsP1 = vsStrokeTotals(0, S.currentRound);
  const totalsP2 = vsStrokeTotals(1, S.currentRound);
  const td1 = totalsP1.diff;
  const td2 = totalsP2.diff;
  const p1=VS.players[0], p2=VS.players[1];
  const fmtD=(d)=>d===0?'E':d>0?'+'+d:''+d;

  let matchClinched = false;
  let clinchText = '';
  if (VS.format === 'match' && S.holeIdx < S.endIdx) {
    const holesLeft = S.endIdx - S.holeIdx;
    const lead = VS.matchScore[0] - VS.matchScore[1];
    const absLead = Math.abs(lead);
    if (absLead > holesLeft) {
      matchClinched = true;
      const clinchWinner = lead > 0 ? p1 : p2;
      const clinchNotation = `${absLead}&${holesLeft}`;
      clinchText = `${clinchWinner.name} WINS ${clinchNotation}!`;
    }
  }

  const hcScreen = document.getElementById('hcScreen');
  const midSection = document.getElementById('hcMidSection');
  if(midSection) midSection.style.display = 'flex';
  let titleText = `HOLE ${S.holeIdx + 1} COMPLETE`;
  let centerText = '';
  
  if (VS.format === 'match') {
      if (s1 < s2) titleText = `${p1.name} WINS HOLE!`;
      else if (s2 < s1) titleText = `${p2.name} WINS HOLE!`;
      else titleText = 'HOLE TIED!';
      
      let lead = VS.matchScore[0] - VS.matchScore[1];
      if (lead > 0) centerText = `${p1.name} IS LEADING ${lead} UP`;
      else if (lead < 0) centerText = `${p2.name} IS LEADING ${Math.abs(lead)} UP`;
      else centerText = 'MATCH IS TIED';

      if (matchClinched) centerText = clinchText;
  } else {
      let isTie = td1 === td2;
      let p1Leading = td1 < td2;
      let p2Leading = td2 < td1;
      if (p1Leading) {
          const diff = td2 - td1;
          centerText = `${p1.name} IS LEADING BY ${diff} STROKE${diff !== 1 ? 'S' : ''}!`;
      } else if (p2Leading) {
          const diff = td1 - td2;
          centerText = `${p2.name} IS LEADING BY ${diff} STROKE${diff !== 1 ? 'S' : ''}!`;
      } else {
          centerText = 'TIED!';
      }
  }

  document.getElementById('hcHoleTitle').style.display = '';
  document.getElementById('hcHoleTitle').textContent = titleText;
  document.getElementById('hcRndBadge').style.display = 'none';

  let p1Color = 'var(--text)', p2Color = 'var(--text)';
  if (VS.format === 'match') {
      if (VS.matchScore[0] > VS.matchScore[1]) p1Color = 'var(--gold)';
      else if (VS.matchScore[1] > VS.matchScore[0]) p2Color = 'var(--gold)';
  } else {
      if (td1 < td2) p1Color = 'var(--gold)';
      else if (td2 < td1) p2Color = 'var(--gold)';
  }
  
  const getColor = (d) => d < 0 ? 'var(--gold)' : d === 0 ? 'var(--c-fwyl)' : '#e05252';

  let p1PillContent = VS.format === 'match' ? `<span style="font-size:26px;line-height:1;">${VS.matchScore[0]}</span>` : `TOTAL: ${fmtD(td1)}`;
  let p2PillContent = VS.format === 'match' ? `<span style="font-size:26px;line-height:1;">${VS.matchScore[1]}</span>` : `TOTAL: ${fmtD(td2)}`;

  let p1PillColor = VS.format === 'match' ? (VS.matchScore[0] > VS.matchScore[1] ? 'var(--gold)' : 'var(--text)') : getColor(td1);
  let p2PillColor = VS.format === 'match' ? (VS.matchScore[1] > VS.matchScore[0] ? 'var(--gold)' : 'var(--text)') : getColor(td2);

  // Build pill background based on relative standing
  const p1PillBg = VS.format === 'match'
    ? (VS.matchScore[0] > VS.matchScore[1] ? 'rgba(58,155,82,.35)' : VS.matchScore[0] < VS.matchScore[1] ? 'rgba(192,80,80,.25)' : 'rgba(255,255,255,.07)')
    : (td1 < td2 ? 'rgba(58,155,82,.35)' : td1 > td2 ? 'rgba(192,80,80,.25)' : 'rgba(255,255,255,.07)');
  const p2PillBg = VS.format === 'match'
    ? (VS.matchScore[1] > VS.matchScore[0] ? 'rgba(58,155,82,.35)' : VS.matchScore[1] < VS.matchScore[0] ? 'rgba(192,80,80,.25)' : 'rgba(255,255,255,.07)')
    : (td2 < td1 ? 'rgba(58,155,82,.35)' : td2 > td1 ? 'rgba(192,80,80,.25)' : 'rgba(255,255,255,.07)');

  const hcCard = document.querySelector('.hc-card');
  ['hcIcon', 'hcTitle', 'hcSub', 'hcTot'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.display = 'none';
  });

  let vsContainer = document.getElementById('hcVsContainer');
  if (!vsContainer) {
      vsContainer = document.createElement('div');
      vsContainer.id = 'hcVsContainer';
      hcCard.appendChild(vsContainer);
  }
  vsContainer.style.display = 'block';
  const fmtScore = (d) => d===0?'E':d>0?`+${d}`:`${d}`;
  const matchFmt1 = VS.format === 'match' ? `${VS.matchScore[0]}` : fmtScore(td1);
  const matchFmt2 = VS.format === 'match' ? `${VS.matchScore[1]}` : fmtScore(td2);
  const p1NameHtml = escapeHtml(p1.name);
  const p2NameHtml = escapeHtml(p2.name);
  const p1IconHtml = escapeHtml(p1.icon);
  const p2IconHtml = escapeHtml(p2.icon);
  const centerTextHtml = escapeHtml(centerText);
  vsContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:10px;padding:4px 0;">
        <span style="font-size:28px;line-height:1;flex-shrink:0;">${p1IconHtml}</span>
        <span style="flex:1;font-family:'Bebas Neue',cursive;font-size:26px;letter-spacing:1px;color:${p1Color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">${p1NameHtml}</span>
        <div style="background:var(--course-panel-strong);border:1px solid ${p1PillBg.includes('58,155') ? 'rgba(58,155,82,.5)' : p1PillBg.includes('192,80') ? 'rgba(192,80,80,.5)' : 'var(--border)'};border-radius:12px;padding:6px 14px;font-family:'Bebas Neue',cursive;font-size:26px;min-width:52px;text-align:center;color:${p1PillColor};flex-shrink:0;line-height:1;">${matchFmt1}</div>
      </div>
      <div style="height:1px;background:var(--border);margin:0 4px;"></div>
      <div style="display:flex;align-items:center;gap:10px;padding:4px 0;">
        <span style="font-size:28px;line-height:1;flex-shrink:0;">${p2IconHtml}</span>
        <span style="flex:1;font-family:'Bebas Neue',cursive;font-size:26px;letter-spacing:1px;color:${p2Color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">${p2NameHtml}</span>
        <div style="background:var(--course-panel-strong);border:1px solid ${p2PillBg.includes('58,155') ? 'rgba(58,155,82,.5)' : p2PillBg.includes('192,80') ? 'rgba(192,80,80,.5)' : 'var(--border)'};border-radius:12px;padding:6px 14px;font-family:'Bebas Neue',cursive;font-size:26px;min-width:52px;text-align:center;color:${p2PillColor};flex-shrink:0;line-height:1;">${matchFmt2}</div>
      </div>
    </div>
    <div style="font-family:'Sen',sans-serif;font-size:11px;color:var(--text);text-align:center;letter-spacing:1px;background:rgba(255,255,255,.05);padding:6px;border-radius:8px;">${centerTextHtml}</div>
  `;

  // Restore the shared shot trail/detail cards for VS
  const shotTrailCardVs = document.getElementById('hcShotTrailCard');
  const shotDetailCardVs = document.getElementById('hcShotDetailCard');
  if(shotTrailCardVs) shotTrailCardVs.style.display = '';
  if(shotDetailCardVs) shotDetailCardVs.style.display = '';
  const shotTrailVs = document.getElementById('hcShotTrail');
  const shotDetailVs = document.getElementById('hcShotDetail');
  if(shotTrailVs) shotTrailVs.style.display = 'flex';
  if(shotDetailVs) shotDetailVs.style.display = 'flex';
  const statsContainer = document.getElementById('hcVsStats');
  if (statsContainer) statsContainer.style.display = 'none';
  const hcDiffSub = document.getElementById('hcDiffSub');
  if (hcDiffSub) hcDiffSub.style.display = 'none';
  const hcXpWrap = document.getElementById('hcXpWrap');
  if (hcXpWrap) hcXpWrap.style.display = 'none';
  const roundXpWrap = document.getElementById('hcRoundXpWrap');
  if (roundXpWrap) roundXpWrap.style.display = 'none';

  const secTitles = document.querySelectorAll('#hcScreen .sec-title');
  const replayTitle = secTitles[0];
  const scorecardTitle = secTitles[1];
  if(replayTitle) replayTitle.style.display = 'none'; // vsToggleRow replaces SHOT REPLAY header
  if(scorecardTitle){
      scorecardTitle.style.display = 'flex';
      scorecardTitle.textContent = 'SCORECARD';
  }
  const scWrap = document.querySelector('#hcScreen .sc-wrap');
  if (scWrap) scWrap.style.display = '';

  // Build / refresh vsToggleRow (shows SHOT REPLAY label + player toggle pills)
  let vsToggle = document.getElementById('vsToggleRow');
  if (!vsToggle) {
      vsToggle = document.createElement('div');
      vsToggle.id = 'vsToggleRow';
      const trailCard = document.getElementById('hcShotTrailCard');
      if(trailCard) trailCard.parentNode.insertBefore(vsToggle, trailCard);
  }
  vsToggle.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-shrink:0;';
  vsToggle.innerHTML = `
    <div style="font-family:'Sen',sans-serif;font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;flex-shrink:0;">SHOT REPLAY</div>
    <div style="flex:1;height:1px;background:var(--border);"></div>
    <div style="display:flex;gap:6px;flex-shrink:0;">
      <button id="vsPill0" onclick="renderVsReplayAndScoreboard(0)" style="background:var(--c-fwy);color:#fff;border:1px solid var(--c-fwyl);border-radius:14px;padding:5px 11px;font-family:'Sen',sans-serif;font-size:10px;font-weight:bold;cursor:pointer;">${escapeHtml(p1.name.substring(0,8))}</button>
      <button id="vsPill1" onclick="renderVsReplayAndScoreboard(1)" style="background:rgba(255,255,255,.05);color:var(--muted);border:1px solid var(--border);border-radius:14px;padding:5px 11px;font-family:'Sen',sans-serif;font-size:10px;font-weight:bold;cursor:pointer;">${escapeHtml(p2.name.substring(0,8))}</button>
    </div>
  `;

  try { renderVsReplayAndScoreboard(0); } catch(_){}

  const openVsFinalResults = () => {
      _setNavDir('forward');
      setMainAppConcealed(true);
      hideMainAppImmediate();
      swapHcScreenContentForward(()=>vsShowFinal());
  };

  const btn = document.getElementById('hcBtn');
  if (matchClinched) {
      btn.textContent = 'FINAL RESULTS';
      btn.onclick = openVsFinalResults;
  } else if (S.holeIdx >= S.endIdx && S.currentRound < S.totalRounds) {
      btn.textContent = `START ROUND ${S.currentRound + 1}`;
      btn.onclick = () => {
          vsStartNextRound();
      };
  } else if (S.holeIdx >= S.endIdx) {
      btn.textContent = 'FINAL RESULTS';
      btn.onclick = openVsFinalResults;
  } else {
      btn.textContent = 'NEXT HOLE';
      btn.onclick = () => {
          hcScreen.classList.remove('show');
          S.holeIdx++;
          vsShowTurnScreen();
      };
  }

  setMainAppConcealed(true);
  hcScreen.classList.add('show');
}

function vsStartNextRound(){
  const hcScreen = document.getElementById('hcScreen');
  if(hcScreen) hcScreen.classList.remove('show');
  S.currentRound++;
  S.holeIdx = S.startIdx;
  vsSyncScorecardMirror(VS.currentPlayer);
  showWcToast(`⛳ ROUND ${S.currentRound} STARTED!`);
  saveGameState();
  vsShowTurnScreen();
}

function vsShowFinal(){
  if(!VS.completionRecorded){
    incrementCompletedGameCounters({versus:true});
    VS.completionRecorded = true;
    clearSavedGame();
  }
  const totals1 = vsStrokeTotals(0, S.totalRounds);
  const totals2 = vsStrokeTotals(1, S.totalRounds);
  const t1 = totals1.total;
  const t2 = totals2.total;
  const par = totals1.par;
  const p1=VS.players[0],p2=VS.players[1];
  const fmtD=(d)=>d===0?'E':d>0?'+'+d:''+d;
  const d1=t1-par,d2=t2-par;
  let completedHoles = 0;
  for(let r = 0; r < S.totalRounds; r++){
    for(let i = S.startIdx; i <= S.endIdx; i++){
      if(vsGetHistory(0, i, r) || vsGetHistory(1, i, r)) completedHoles++;
    }
  }
  const vsXpAward = awardRoundExperience({
    source: 'versus',
    title: 'GAINED XP',
    holesPlayed: Math.max(1, completedHoles),
    roundDiff: 0,
    gameDiff: VS.setup?.diff || GAME_DIFF,
    scoreMultiplier: 1,
    scoreMultiplierLabel: 'x1.00'
  });
  
  let winnerText = '';
  let p1Color = 'var(--text)', p2Color = 'var(--text)';
  
  if (VS.format === 'match') {
      if (VS.matchScore[0] > VS.matchScore[1]) {
          const lead = VS.matchScore[0] - VS.matchScore[1];
          const holesLeft = Math.max(0, S.endIdx - S.holeIdx);
          if (holesLeft > 0 && lead > holesLeft) {
              winnerText = `${p1.name} WINS ${lead}&${holesLeft}!`;
          } else {
              winnerText = `${p1.name} WINS!`;
          }
          p1Color = 'var(--gold)';
      } else if (VS.matchScore[1] > VS.matchScore[0]) {
          const lead = VS.matchScore[1] - VS.matchScore[0];
          const holesLeft = Math.max(0, S.endIdx - S.holeIdx);
          if (holesLeft > 0 && lead > holesLeft) {
              winnerText = `${p2.name} WINS ${lead}&${holesLeft}!`;
          } else {
              winnerText = `${p2.name} WINS!`;
          }
          p2Color = 'var(--gold)';
      } else {
          winnerText = "IT'S A TIE!";
      }
  } else {
      if (t1 < t2) { winnerText = `${p1.name} WINS!`; p1Color = 'var(--gold)'; }
      else if (t2 < t1) { winnerText = `${p2.name} WINS!`; p2Color = 'var(--gold)'; }
      else { winnerText = "IT'S A TIE!"; }
  }
  
  const hcScreen = document.getElementById('hcScreen');
  const hcTitle = document.getElementById('hcHoleTitle');
  if(hcTitle){
    hcTitle.style.display = 'none';
    hcTitle.textContent = '';
  }
  document.getElementById('hcRndBadge').style.display = 'none';
  const hcDiffSub = document.getElementById('hcDiffSub');
  if (hcDiffSub) hcDiffSub.style.display = 'none';
  const hcXpWrap = document.getElementById('hcXpWrap');
  if (hcXpWrap) hcXpWrap.style.display = 'none';
  const roundXpWrapFinal = ensureRoundXpPanel();

  const getColor = (d) => d < 0 ? 'var(--gold)' : d === 0 ? 'var(--c-fwyl)' : '#e05252';
  const p1TotalLabel = VS.format === 'match' ? VS.matchScore[0] : fmtD(d1);
  const p2TotalLabel = VS.format === 'match' ? VS.matchScore[1] : fmtD(d2);
  const diffNames = {1:'EASY', 2:'MEDIUM', 3:'HARD'};
  const diffLabel = diffNames[VS.setup?.diff || GAME_DIFF] || 'MEDIUM';
  const winnerTextHtml = escapeHtml(winnerText);
  const p1NameHtml = escapeHtml(p1.name);
  const p2NameHtml = escapeHtml(p2.name);
  const p1IconHtml = escapeHtml(p1.icon);
  const p2IconHtml = escapeHtml(p2.icon);

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
  const p1BoxColor = VS.format==='match'?(VS.matchScore[0]>VS.matchScore[1]?'var(--gold)':'var(--text)'):getColor(d1);
  const p2BoxColor = VS.format==='match'?(VS.matchScore[1]>VS.matchScore[0]?'var(--gold)':'var(--text)'):getColor(d2);
  const titleColor = (p1Color==='var(--gold)'||p2Color==='var(--gold)') ? 'var(--gold)' : 'var(--text)';
  const scoreBoxStyle = 'background:var(--course-panel-strong);border:1px solid var(--border);border-radius:10px;padding:6px 10px;min-width:52px;display:flex;align-items:center;justify-content:center;font-family:\'Bebas Neue\',cursive;font-size:24px;letter-spacing:1px;line-height:1;flex-shrink:0;';
  const totalHeader = VS.format==='match' ? '' : `
        <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
          <span style="font-family:'Sen',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;min-width:52px;text-align:center;">TOTAL</span>
        </div>`;
  vsContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="font-family:'Bebas Neue',cursive;font-size:30px;letter-spacing:2px;color:${titleColor};line-height:1;text-align:center;">${winnerTextHtml}</div>
      ${totalHeader}
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;flex-shrink:0;">${p1IconHtml}</span>
          <span style="flex:1;font-family:'Bebas Neue',cursive;font-size:20px;letter-spacing:1px;color:${p1Color};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p1NameHtml}</span>
          <div style="${scoreBoxStyle}color:${p1BoxColor};">${p1TotalLabel}</div>
        </div>
        <div style="height:1px;background:var(--border);"></div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;flex-shrink:0;">${p2IconHtml}</span>
          <span style="flex:1;font-family:'Bebas Neue',cursive;font-size:20px;letter-spacing:1px;color:${p2Color};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p2NameHtml}</span>
          <div style="${scoreBoxStyle}color:${p2BoxColor};">${p2TotalLabel}</div>
        </div>
      </div>
    </div>
  `;

  const midSection = document.getElementById('hcMidSection');
  if(midSection) midSection.style.display = 'none';
  const statsContainer = document.getElementById('hcVsStats');
  if(statsContainer) statsContainer.style.display = 'none';
  const vsToggle = document.getElementById('vsToggleRow');
  if(vsToggle) vsToggle.style.display = 'none';

  if(roundXpWrapFinal){
    roundXpWrapFinal.innerHTML = vsXpAward ? renderXpAwardCardHtml(vsXpAward) : '';
    roundXpWrapFinal.style.display = vsXpAward ? 'block' : 'none';
    if(vsXpAward) animateXpBars(roundXpWrapFinal);
  }

  const btn = document.getElementById('hcBtn');
  btn.style.flexShrink = '0';
  btn.textContent = 'NEXT';
  btn.onclick = () => {
    _vsSummaryPlayer = 0;
    setSummaryContext({ mode:'versus', playerIdx:0 });
    openSummaryFromRoundComplete(S.currentRound);
  };

  setMainAppConcealed(true);
  hcScreen.classList.add('show');
}

function vsGetGridKey(){
  return `${S.holeIdx}_${S.shotNum}_${S.zone}_${S.yrdRemain>200?'far':S.yrdRemain>80?'mid':'short'}`;
}
function vsCacheGrid(grid){
  if(!VS.active) return;
  if(VS.currentPlayer === 0) VS.sharedGrids[vsGetGridKey()] = grid.map(r=>[...r]);
}
function vsGetCachedGrid(){
  if(!VS.active || VS.currentPlayer !== 1) return null;
  return VS.sharedGrids[vsGetGridKey()] || null;
}

function openModeInfo(type){
  const id = type === 'play' ? 'playModeInfoOverlay' : 'versusModeInfoOverlay';
  const el = document.getElementById(id);
  if(!el) return;
  if(el._closeTimer){
    clearTimeout(el._closeTimer);
    el._closeTimer = null;
  }
  el.classList.remove('closing');
  el.classList.add('show');
}
function closeModeInfo(type){
  const id = type === 'play' ? 'playModeInfoOverlay' : 'versusModeInfoOverlay';
  const el = document.getElementById(id);
  if(!el || !el.classList.contains('show') || el.classList.contains('closing')) return;
  el.classList.add('closing');
  if(el._closeTimer) clearTimeout(el._closeTimer);
  el._closeTimer = setTimeout(()=>{
    el.classList.remove('closing');
    el.classList.remove('show');
    el._closeTimer = null;
    // Force synchronous repaint on any setup back buttons that sit beneath
    // this overlay so they don't require a touch to reappear.
    document.querySelectorAll('.setup-back-btn').forEach(b=>{
      b.style.visibility='visible';b.style.pointerEvents='';void b.offsetHeight;
    });
  }, 210);
}
