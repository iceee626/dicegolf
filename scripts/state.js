// Global Runtime State, Setup Defaults, and Navigation State
// STATE & CONFIG
// ═══════════════════════════════════════
let SETUP={ mode:'single', rounds:1, holesConfig:'18', opponent:'solo', course:null, courseSelected:false };

let S={
  mode: 'single', totalRounds: 1, currentRound: 1, holesConfig: '18', startIdx: 0, endIdx: 17,
  courseId: DEFAULT_COURSE_ID,
  holeIdx:0, zone:'tee', strokes:0, shotNum:1, log:[], 
  scorecards: [Array(18).fill(null)], histories: [Array(18).fill(null)],
  currentGrid:null, holeDone:false, rolling:false,
  yrdRemain:0, yrdTotal:0, fwyVisits:0, prevZone:null, shotCount:0,
  _nextShotTransitioning:false,
  _gameUnderParStreak:0,
  _wcUsedThisRound:0, _skipCelebration:false, _preserveGrid:false, _forceGrid:false, _forceP1PuttGrid:false,
  _mulliganJustFired:false, _puttWcUsed:false, _pendingPuttResult:null, _pendingHoleFinish:null,
  _eyesClosedArmed:false, _landscaperRoughFixes:0, _rocketApproachPending:false,
  _pendingGridWildcardCommit:null,
  _ferrettArmedShot:false, _highlightReelArmedShot:false,
  _lastShotOriginZone:null, _lastShotResultZone:null, _lastShotHoleIdx:null,
  _roundWaterHits:0, _roundSandHits:0, _roundRoughHits:0,
  _roundPrevWasDoubleOrWorse:false, _roundIceTriggered:false,
  cpuMode:false, cpuField:null
};

// ── Menu Navigation ──
let _lastMenuScreen = 'menuScreen';
let _courseScreenFlow = 'single';

function forceHideGame() {
  const app = document.getElementById('mainApp');
  if (app?.classList.contains('visible')) {
    setMainAppConcealed(true);
    hideMainApp();
  } else {
    hideMainAppImmediate();
  }
  const tv = document.getElementById('tvBar');
  if (tv) tv.classList.remove('show');
  const fab = document.getElementById('wcFab');
  if (fab) fab.classList.remove('visible');
}

function navBack(to) {
  forceHideGame();
  _setNavDir('back');
  const target = to === 'mode' ? (SETUP.mode === 'custom' ? 'customScreen' : 'playModeScreen') : to;
  const screens = ['menuScreen','playModeScreen','customScreen','courseScreen','diffScreen','versusSetupScreen','vsOptionsScreen'];
  screens.forEach(id => { if (id !== target) hideScreen(id); });
  showScreen(target, 'flex');
}

function navToPlayMode() {
  forceHideGame();
  VS.active = false;
  _courseScreenFlow = 'single';
  if(VS.setup){ VS.setup.courseSelected = false; VS.setup.course = null; }
  _lastMenuScreen = 'playModeScreen';
  hideScreen('menuScreen');
  showScreen('playModeScreen', 'flex');
}

function navToModeDifficulty(mode){
  forceHideGame();
  VS.active = false;
  _courseScreenFlow = mode;
  if(VS.setup){ VS.setup.courseSelected = false; VS.setup.course = null; }
  SETUP.courseSelected = false;
  SETUP.course = null;
  if(mode === 'single'){
    SETUP.mode = 'single';
    SETUP.rounds = 1;
    SETUP.holesConfig = '18';
  }
  if(mode === 'tournament'){
    SETUP.mode = 'tournament';
    SETUP.rounds = 4;
    SETUP.holesConfig = '18';
  }
  setDiff(1);
  _lastMenuScreen = 'playModeScreen';
  hideScreen('playModeScreen');
  showScreen('diffScreen', 'flex');
}

function navToCustom() { 
  forceHideGame();
  VS.active = false;
  _courseScreenFlow = 'custom';
  if(VS.setup){ VS.setup.courseSelected = false; VS.setup.course = null; }
  SETUP.courseSelected = false;
  SETUP.course = null;
  _lastMenuScreen = 'customScreen'; 
  SETUP.mode = 'custom';
  setCustomOpponent('solo');
  setCustomRounds(1);
  setCustomHoles('18');
  setCustomDiff(1);
  hideScreen('playModeScreen'); 
  showScreen('customScreen', 'flex'); 
}

function navToCourse(mode) {
  forceHideGame();
  _courseScreenFlow = mode;
  VS.active = false;
  if(VS.setup){
    VS.setup.courseSelected = false;
    VS.setup.course = null;
  }
  SETUP.courseSelected = false;
  SETUP.course = null;
  if (mode === 'single') { SETUP.mode = 'single'; SETUP.rounds = 1; SETUP.holesConfig = '18'; setDiff(1); _lastMenuScreen = 'playModeScreen'; }
  if (mode === 'tournament') { SETUP.mode = 'tournament'; SETUP.rounds = 4; SETUP.holesConfig = '18'; setDiff(1); _lastMenuScreen = 'playModeScreen'; }
  if (mode === 'custom') { _lastMenuScreen = 'customScreen'; }
  if(VS.setup) VS.setup.courseSelected = false;
  hideScreen(_lastMenuScreen); 
  showScreen('courseScreen', 'flex');
  updateCourseScreenModeUI();
}

function navToDiff() { 
  forceHideGame();
  const vsCourseFlow = _courseScreenFlow === 'versus';
  if (vsCourseFlow) {
    updateCourseScreenModeUI();
    return;
  }
  hideScreen('courseScreen'); 
  showScreen('diffScreen', 'flex'); 
}

function showCourseAfterDiff(){
  SETUP.courseSelected = false;
  SETUP.course = null;
  hideScreen('diffScreen');
  showScreen('courseScreen', 'flex');
  updateCourseScreenModeUI();
}

function updateCourseScreenModeUI(){
  const tee=document.getElementById('vsCourseTeeOffBtn');
  const selectedCourseId = _courseScreenFlow === 'versus'
    ? (VS.setup && VS.setup.courseSelected ? normalizeCourseId(VS.setup.course) : null)
    : (SETUP.courseSelected ? normalizeCourseId(SETUP.course) : null);
  const courseFlowActive = ['versus','custom','single','tournament'].includes(_courseScreenFlow);
  const selected = !!selectedCourseId;
  if(tee) tee.style.display = courseFlowActive ? 'block' : 'none';
  if(tee) tee.disabled = !selected;
  if(tee) tee.style.opacity = selected ? '1' : '.45';
  if(tee) tee.style.pointerEvents = selected ? 'auto' : 'none';
  document.querySelectorAll('#courseScreen .course-btn[data-course-id]').forEach(btn=>{
    btn.classList.toggle('selected', btn.dataset.courseId === selectedCourseId);
  });
}

function selectCourse(courseId){
  const normalizedCourse = normalizeCourseId(courseId);
  if(_courseScreenFlow === 'versus'){
    if(VS.setup){
      VS.setup.course = normalizedCourse;
      VS.setup.courseSelected = true;
    }
  } else {
    SETUP.course = normalizedCourse;
    SETUP.courseSelected = true;
  }
  updateCourseScreenModeUI();
}

function teeOffFromCourse(){
  if(_courseScreenFlow === 'versus'){
    if(!VS.setup.courseSelected) return;
    setMainAppConcealed(true);
    hideMainAppImmediate();
    startGame();
    return;
  }
  if(!SETUP.courseSelected) return;
  setMainAppConcealed(true);
  hideMainAppImmediate();
  startGame();
}

function setCustomRounds(r) {
  SETUP.rounds=r;
  [1,2,3,4].forEach(i=>document.getElementById(`cr-${i}`)?.classList.toggle('active', i===r));
}
function setCustomHoles(h) {
  SETUP.holesConfig=h;
  ['18','front','back'].forEach(i=>document.getElementById(`ch-${i}`)?.classList.toggle('active', i===h));
}
function setCustomOpponent(opponent) {
  SETUP.opponent = opponent === 'cpu' ? 'cpu' : 'solo';
  document.getElementById('customOpponentSolo')?.classList.toggle('active', SETUP.opponent === 'solo');
  document.getElementById('customOpponentCpu')?.classList.toggle('active', SETUP.opponent === 'cpu');
}

function shouldEnableCpuModeForSetup(setup, isVersusActive, courseScreenFlow) {
  return !isVersusActive
    && courseScreenFlow === 'custom'
    && setup
    && setup.mode === 'custom'
    && setup.opponent === 'cpu';
}

function isCpuLeaderboardEnabled() {
  return !!(S && S.cpuMode && S.cpuField && !VS.active && S.mode === 'custom');
}

function resetGameState(){
  S.mode = SETUP.mode;
  S.totalRounds = SETUP.rounds;
  S.currentRound = 1;
  S.holesConfig = SETUP.holesConfig;
  S.cpuMode = shouldEnableCpuModeForSetup(SETUP, VS.active, _courseScreenFlow);
  S.cpuField = null;
  S.startIdx = S.holesConfig === 'back' ? 9 : 0;
  S.endIdx = S.holesConfig === 'front' ? 8 : 17;
  S.holeIdx = S.startIdx;
  
  S.zone='tee'; S.strokes=0; S.shotNum=1; S._tvShotNum=1; S.log=[];
  S.scorecards = [Array(18).fill(null)];
  S.histories = [Array(18).fill(null)];
  S.currentGrid=null; S.holeDone=false; S.rolling=false;
  S.yrdRemain=0; S.yrdTotal=0; S.fwyVisits=0; S.prevZone=null; S.shotCount=0;
  S._nextShotTransitioning=false;
  S._gameUnderParStreak=0;
  S._wcUsedThisRound=0;
  S._wcDiscardedThisRound=0;
  S._pendingPuttResult=null; S._pendingHoleFinish=null; S._forceP1PuttGrid=false;
  S._eyesClosedArmed=false; S._landscaperRoughFixes=0; S._rocketApproachPending=false;
  S._pendingGridWildcardCommit=null;
  S._ferrettArmedShot=false; S._highlightReelArmedShot=false;
  S._lastShotOriginZone=null; S._lastShotResultZone=null; S._lastShotHoleIdx=null;
  S._roundWaterHits=0; S._roundSandHits=0; S._roundRoughHits=0;
  S._roundPrevWasDoubleOrWorse=false; S._roundIceTriggered=false;
  S._roundEndProcessed=false; S._roundEndMeta=null; S._roundEndAchievementPopupsShown=false;
  if(typeof wcReset==='function')wcReset();
}

const ROUND_SPLASH_REPLAY_CLASS = 'vs-turn-replay';

function getSplashReplayElements(screenId){
  const screen = document.getElementById(screenId);
  if(!screen) return [];
  return [
    screen.querySelector('.vs-turn-icon'),
    screen.querySelector('.vs-turn-name'),
    screen.querySelector('.vs-turn-sub'),
    screen.querySelector('.vs-turn-meta'),
    screen.querySelector('.vs-turn-btn')
  ].filter(Boolean);
}

function resetSplashReplay(screenId){
  getSplashReplayElements(screenId).forEach(el=>el.classList.remove(ROUND_SPLASH_REPLAY_CLASS));
}

function replaySplashAnimation(screenId){
  const screen = document.getElementById(screenId);
  const els = getSplashReplayElements(screenId);
  els.forEach(el=>el.classList.remove(ROUND_SPLASH_REPLAY_CLASS));
  void screen?.offsetWidth;
  els.forEach(el=>el.classList.add(ROUND_SPLASH_REPLAY_CLASS));
}

function getRoundStartSplashReplayElements(){
  return getSplashReplayElements('roundStartScreen');
}

function resetRoundStartSplashReplay(){
  resetSplashReplay('roundStartScreen');
}

function replayRoundStartSplashAnimation(){
  replaySplashAnimation('roundStartScreen');
}

function resetVersusTurnSplashReplay(){
  resetSplashReplay('vsTurnScreen');
}

function replayVersusTurnSplashAnimation(){
  replaySplashAnimation('vsTurnScreen');
}
let _roundStartFadeTimer = null;
let _roundStartFadeHandler = null;
function clearRoundStartSplash(){
  const screen = document.getElementById('roundStartScreen');
  if(!screen) return;
  if(_roundStartFadeTimer){
    clearTimeout(_roundStartFadeTimer);
    _roundStartFadeTimer = null;
  }
  if(_roundStartFadeHandler){
    screen.removeEventListener('animationend', _roundStartFadeHandler);
    _roundStartFadeHandler = null;
  }
  screen.classList.remove('show');
  screen.classList.remove('single-round-start');
  screen.classList.remove('fade-out');
  resetRoundStartSplashReplay();
}

function returnToMenu(opts={}){
  const preserveSummary = !!opts.preserveSummary;
  VS.active = false;
  _courseScreenFlow = 'single';
  clearTutorialUiState();
  document.getElementById('overlay').classList.remove('show');
  const hc = document.getElementById('hcScreen'); if(hc) hc.classList.remove('show');
  if(!preserveSummary) document.getElementById('summaryModal').classList.remove('show');
  setMainAppConcealed(true);
  hideMainApp();
  document.getElementById('vsTurnScreen').classList.remove('show');
  clearRoundStartSplash();
  document.getElementById('gameMenuModal').classList.remove('show');
  const pbRow = document.getElementById('ovPbRow'); if(pbRow) pbRow.remove();
  const ovBtn = document.getElementById('ovBtn');
  if(ovBtn) ovBtn.onclick = ()=>nextHole();
  if(!preserveSummary) clearCourseVisualTheme();
  navBack('menuScreen');
  autoLoadProfile();
}

let _skipGridScrollOnce = false;

function selectedCourseIdForFlow(){
  if(VS.active){
    return normalizeCourseId(VS.setup?.course || DEFAULT_COURSE_ID);
  }
  return normalizeCourseId(SETUP.course || DEFAULT_COURSE_ID);
}

function startGame(){
  setMainAppConcealed(true);
  hideMainAppImmediate();
  clearSavedGame();
  _skipGridScrollOnce = true;
  clearSavedGame();
  resetGameState();
  const courseId = selectedCourseIdForFlow();
  applyCourse(courseId);
  S.courseId = courseId;
  applyCourseVisualTheme(courseId);
  setSummaryContext(null);
  restoreBaseHoles();
  const p=getActiveProfile();
  PLAYER_NAME=p?p.name.toUpperCase():'PLAYER';
  const diffMap={ 1: [1, 1, 2], 2: [1, 2, 3], 3: [2, 3, 3] };
  HOLES.forEach(h=>{ h.diff=diffMap[h.baseDiff][GAME_DIFF-1]; });
  if(S.cpuMode && typeof createCpuField === 'function'){
    S.cpuField = createCpuField({
      holes: HOLES,
      startIdx: S.startIdx,
      endIdx: S.endIdx,
      totalRounds: S.totalRounds,
      gameDiff: GAME_DIFF,
      courseId,
      seed: Date.now(),
      now: new Date()
    });
  }
  hideScreen('diffScreen');
  hideScreen('courseScreen');
  hideMainAppImmediate();
  setMainAppConcealed(true);
  
  if(VS.active){
    // Order matters: init() calls loadHole() → updateTVBanner() which
    // shows the fixed-position tvBar (z-index:50). If that runs AFTER
    // vsShowTurnScreen, the tvBar becomes visible again underneath the
    // vs-turn splash during its 300ms opacity fade-in, causing the
    // gamescreen-glimpse flash. Running init() first lets vsStartGame's
    // tvBar.remove('show') be the final state before the splash appears.
    init();
    vsStartGame();
    return;
  }

  init();
  showSingleRoundSplash();
}

function showSingleRoundSplash(){
  if(TUT.active) return;
  const p = getActiveProfile();
  const icon = p ? getProfileIcon(p, getActiveProfileIdx()) : '🏌️';
  const h = HOLES[S.holeIdx];
  const roundPrefix = S.totalRounds > 1 ? `ROUND ${S.currentRound} · ` : '';
  const screen = document.getElementById('roundStartScreen');
  const rsIcon = document.getElementById('rsTurnIcon');
  const rsName = document.getElementById('rsTurnName');
  const rsSub = document.getElementById('rsTurnSub');
  const rsMeta = document.getElementById('rsTurnMeta');
  if(rsIcon) rsIcon.textContent = icon;
  clearRoundStartSplash();
  if(screen) screen.classList.add('single-round-start');
  if(rsName){
    const splashLines = ['PLEASE WELCOME...', 'NOW, ON THE TEE...', 'DRIVING FROM THE TEE...'];
    rsName.textContent = splashLines[Math.floor(Math.random() * splashLines.length)];
  }
  if(rsSub) rsSub.textContent = `${PLAYER_NAME}!`;
  if(rsMeta) rsMeta.textContent = `${roundPrefix}HOLE ${S.holeIdx + 1} · PAR ${h.par}`;
  setMainAppConcealed(true);
  hideMainAppImmediate();
  replayRoundStartSplashAnimation();
  if(screen) screen.classList.add('show');
}

function startSingleRoundFromSplash(){
  const screen=document.getElementById('roundStartScreen');
  if(screen && screen.classList.contains('show')){
    clearRoundStartSplash();
    const finalize = ()=>clearRoundStartSplash();
    _roundStartFadeHandler=(evt)=>{
      if(evt.target!==screen) return;
      finalize();
    };
    screen.addEventListener('animationend', _roundStartFadeHandler);
    screen.classList.add('show');
    screen.classList.add('single-round-start');
    screen.classList.add('fade-out');
    // Safari standalone can occasionally miss animationend on app-state transitions.
    _roundStartFadeTimer = setTimeout(finalize, 340);
  } else {
    clearRoundStartSplash();
  }
  revealMainApp();
  maybeShowShakeBanner();
}

let _holdFinishBtn=false;
function isShotBtnShown(id){
  const btn=document.getElementById(id);
  return !!(btn && btn.classList.contains('shot-btn-visible'));
}
let _shotBtnSwapTimer = null;

function _setShotBtnState(showNext, immediate=false){
  const roll=document.getElementById('rollBtn');
  const next=document.getElementById('nextShotBtn');
  if(!roll||!next)return;

  const setVisible=(btn, visible, disabled)=>{
    if (immediate) {
        btn.style.transition = 'none';
    } else {
        btn.style.transition = ''; // Ensure CSS handles the smooth crossfade
    }

    btn.classList.toggle('shot-btn-visible', visible);
    btn.classList.toggle('shot-btn-hidden', !visible);

    if (visible) {
        btn.disabled = !!disabled;
        btn.classList.remove('rolling-state');
        // Force immediate hitbox activation (don't wait for opacity fade).
        btn.style.pointerEvents = disabled ? 'none' : 'auto';
    } else {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        btn.blur();
    }

    if (immediate) {
        void btn.offsetWidth; // Flush CSS changes
        btn.style.transition = ''; // Turn transitions back on for the next shot
    }
  };

  if(!showNext && _holdFinishBtn){
    roll.textContent='FINISH HOLE';
    next.textContent='FINISH HOLE';
    roll.classList.add('finish-hole-state');
    next.classList.add('finish-hole-state');
    setVisible(roll, false, true);
    setVisible(next, true, true);
    return;
  }

  const target = showNext ? next : roll;
  const other = showNext ? roll : next;
  const targetDisabled = showNext ? false : !!S.rolling;
  if(!showNext){
    roll.textContent='ROLL';
    roll.classList.remove('finish-hole-state');
    next.classList.remove('finish-hole-state');
  }

  // Fire morph pulse on the wrapping slot when a real swap happens (not an immediate init)
  const isRealSwap = !immediate && other.classList.contains('shot-btn-visible') && !target.classList.contains('shot-btn-visible');
  setVisible(other, false, true);
  setVisible(target, true, targetDisabled);
  if(isRealSwap){
    const slot = roll.parentElement;
    if(slot){
      slot.classList.remove('morphing');
      void slot.offsetWidth;
      slot.classList.add('morphing');
      setTimeout(()=>slot.classList.remove('morphing'), 480);
    }
  }
}

function showNextShotBtn(immediate=false){ _setShotBtnState(true, immediate); }
function hideNextShotBtn(immediate=false){ _setShotBtnState(false, immediate); }
