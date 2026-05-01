// Save, Continue, Resume, and Legacy Save Migration
// SAVE / CONTINUE SYSTEM
// ═══════════════════════════════════════
const PROFILE_SAVE_KEY = 'gg_saves_by_profile';
const LEGACY_SAVE_KEY = 'gg_save';

function getActiveProfileId(){
  const p = getActiveProfile();
  if(!p || typeof p.id !== 'string') return '';
  return p.id;
}

function readProfileSaveStore(){
  try{
    const raw = JSON.parse(localStorage.getItem(PROFILE_SAVE_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  }catch{
    return {};
  }
}

function writeProfileSaveStore(store){
  try{
    localStorage.setItem(PROFILE_SAVE_KEY, JSON.stringify(store || {}));
  }catch{}
}

function migrateLegacySaveToActiveProfile(){
  try{
    const raw = localStorage.getItem(LEGACY_SAVE_KEY);
    if(!raw) return;
    const legacy = JSON.parse(raw || 'null');
    if(!legacy || typeof legacy !== 'object'){
      localStorage.removeItem(LEGACY_SAVE_KEY);
      return;
    }
    const profileId = getActiveProfileId();
    if(!profileId) return;
    const store = readProfileSaveStore();
    if(!store[profileId]){
      store[profileId] = { ...legacy, profileId };
      writeProfileSaveStore(store);
    }
    localStorage.removeItem(LEGACY_SAVE_KEY);
  }catch{}
}

function getSavedGameForActiveProfile(){
  migrateLegacySaveToActiveProfile();
  const profileId = getActiveProfileId();
  if(!profileId) return null;
  const store = readProfileSaveStore();
  const save = store[profileId];
  if(!save || typeof save !== 'object') return null;
  if(save.profileId && save.profileId !== profileId) return null;
  return save;
}

function setSavedGameForActiveProfile(save){
  const profileId = getActiveProfileId();
  if(!profileId || !save) return;
  const store = readProfileSaveStore();
  store[profileId] = { ...save, profileId };
  writeProfileSaveStore(store);
}

function clearSavedGameForProfileId(profileId){
  if(!profileId) return;
  const store = readProfileSaveStore();
  if(Object.prototype.hasOwnProperty.call(store, profileId)){
    delete store[profileId];
    writeProfileSaveStore(store);
  }
}

function saveGameState(){
  if(!S||S.holeIdx===undefined || TUT.active)return;
  if(!VS.active && S.holeDone && S.holeIdx >= S.endIdx && S.currentRound >= S.totalRounds){
    clearSavedGame();
    return;
  }
  const vsTurnPending = !!(VS.active && document.getElementById('vsTurnScreen')?.classList.contains('show'));
  const save={
    mode:S.mode, totalRounds:S.totalRounds, currentRound:S.currentRound, holesConfig:S.holesConfig,
    courseId: normalizeCourseId(S.courseId || selectedCourseIdForFlow()),
    startIdx:S.startIdx, endIdx:S.endIdx,
    cpuMode:!!S.cpuMode,
    cpuField:(S.cpuMode && typeof snapshotCpuField === 'function') ? snapshotCpuField(S.cpuField) : null,
    holeIdx:S.holeIdx, zone:S.zone, strokes:S.strokes, shotNum:S.shotNum, log:S.log,
    scorecards:S.scorecards, histories:S.histories,
    holeDone:S.holeDone, yrdRemain:S.yrdRemain, yrdTotal:S.yrdTotal, fwyVisits:S.fwyVisits, prevZone:S.prevZone, shotCount:S.shotCount,
    _gameUnderParStreak:S._gameUnderParStreak||0,
    _wcUsedThisRound:S._wcUsedThisRound||0,
    _wcDiscardedThisRound:S._wcDiscardedThisRound||0,
    _wcsUsedThisHole:S._wcsUsedThisHole||[], _wcNextShotNote:S._wcNextShotNote||null,
    _eyesClosedArmed:!!S._eyesClosedArmed,
    _landscaperRoughFixes:S._landscaperRoughFixes||0,
    _rocketApproachPending:!!S._rocketApproachPending,
    _ferrettArmedShot:!!S._ferrettArmedShot,
    _highlightReelArmedShot:!!S._highlightReelArmedShot,
    _roundWaterHits:S._roundWaterHits||0,
    _roundSandHits:S._roundSandHits||0,
    _roundRoughHits:S._roundRoughHits||0,
    _roundPrevWasDoubleOrWorse:!!S._roundPrevWasDoubleOrWorse,
    _roundIceTriggered:!!S._roundIceTriggered,
    _roundEndProcessed:!!S._roundEndProcessed,
    _roundEndMeta:S._roundEndMeta||null,
    _roundEndAchievementPopupsShown:!!S._roundEndAchievementPopupsShown,
    _cpuRoundCompleteForSummary:S._cpuRoundCompleteForSummary||null,
    _waitingForNextShot:isShotBtnShown('nextShotBtn'),
    _pendingPuttResult:S._pendingPuttResult||null,
    _pendingHoleFinish:S._pendingHoleFinish||null,
    _forceP1PuttGrid:!!S._forceP1PuttGrid,
    currentGrid:S.currentGrid,
    wcsEquipped:WCS.equipped, wcsActive:WCS.active,
    wcsLuckyBounce:WCS.luckyBounceActive, wcsIronWill:WCS.ironWillActive, 
    wcsGreenReadActive:WCS.greenReadActive, wcsGreenReadQueued:WCS.greenReadQueued,
    wcsBounceBackPending:WCS.bounceBackPending, wcsBounceBackReady:WCS.bounceBackReady,
    wcsBogeyShield:WCS.bogeyShieldActive,
    wcsMowersRevenge:WCS.mowersRevengeActive, wcsMowersRevengeQueued:WCS.mowersRevengeQueued,
    wcsBirdieBoost:WCS.birdieBoostActive, wcsHoleWall:WCS.holeWallActive,
    wcsSandWedgePro:WCS.sandWedgeProActive, wcsCupMagnet:WCS.cupMagnetActive,
    wcsGoldenPutter:WCS.goldenPutterActive, wcsFerrett:WCS.ferrettActive,
    wcsHio:WCS.hioActive, wcsHighlightReel:WCS.highlightReelActive, wcsShortcut:WCS.shortcutActive,
    gameDiff:GAME_DIFF, playerName:PLAYER_NAME, timestamp:Date.now(),
    vsTurnPending,
    vsState: VS.active ? {
        format: VS.format,
        players: VS.players,
        currentPlayer: VS.currentPlayer,
        scores: VS.scores,
        histories: VS.histories,
        matchScore: VS.matchScore,
        sharedGrids: VS.sharedGrids,
        setup: VS.setup,
        wcs: VS.wcs
    } : null
  };
  setSavedGameForActiveProfile(save);
}

function hasSavedGame(){
  try{
    const s = getSavedGameForActiveProfile();
    if(s && !s.vsState && s.holeDone && s.holeIdx >= s.endIdx && (s.currentRound||1) >= (s.totalRounds||1)) return false;
    if(!s || !s.scorecards) return false;
    const firstRound = Array.isArray(s.scorecards[0]) ? s.scorecards[0] : [];
    const isFreshStartedRound = !s.holeDone && s.holeIdx===s.startIdx && (s.strokes||0)===0 && (s.shotNum||1)===1;
    return !!s.vsState || isFreshStartedRound || firstRound.some(v=>v!==null) || (s.holeIdx>s.startIdx) || ((s.strokes||0)>0&&(s.shotNum||1)>1) || (s.currentRound||1) > 1;
  }catch{return false;}
}

function clearSavedGame(){
  const profileId = getActiveProfileId();
  if(profileId) clearSavedGameForProfileId(profileId);
  try{localStorage.removeItem(LEGACY_SAVE_KEY);}catch{}
}

function continueDiffFromScorecards(scorecards, holes){
  let totalScore = 0;
  let totalPar = 0;
  if(Array.isArray(scorecards)){
    scorecards.forEach(sc => {
      if(!Array.isArray(sc)) return;
      sc.forEach((s, i) => {
        if(s !== null && s !== undefined){
          totalScore += s;
          totalPar += (holes[i]?.par ?? HOLES[i]?.par ?? 4);
        }
      });
    });
  }
  const diff = totalScore - totalPar;
  return diff > 0 ? `+${diff}` : diff === 0 ? 'E' : `${diff}`;
}

function getCpuContinueButtonContent(save){
  const courseId = normalizeCourseId(save.courseId || DEFAULT_COURSE_ID);
  const courseCfg = getCourseConfig(courseId);
  const courseHoles = courseCfg.holes || HOLES;
  const cName = courseCfg.shortName || courseCfg.name;
  const holeDisplay = (save.holeIdx || 0) + 1;
  const rnd = save.currentRound || 1;
  const diffStr = continueDiffFromScorecards(save.scorecards, courseHoles);
  let pos = '';
  if(save.cpuField && typeof getCpuLeaderboardRows === 'function'){
    const rows = getCpuLeaderboardRows(save.cpuField, {
      holes: courseHoles,
      playerName: save.playerName || PLAYER_NAME || 'YOU',
      playerScores: save.scorecards || [],
      currentRound: rnd
    });
    const playerRow = rows.find(row => row.isPlayer);
    pos = playerRow && playerRow.pos ? playerRow.pos : '';
  }
  return {
    title: 'CONTINUE',
    meta: [cName, `R${rnd}`, `H${holeDisplay}`, diffStr, pos].filter(Boolean).join(' · ')
  };
}

function continueGame(){
  try{
    const save = getSavedGameForActiveProfile();
    if(!save)return;
    const savedCourseId = normalizeCourseId(
      save.courseId || save.vsState?.setup?.course || DEFAULT_COURSE_ID
    );
    _skipGridScrollOnce = true;
    clearTutorialUiState();
    applyCourse(savedCourseId);
    applyCourseVisualTheme(savedCourseId);
    restoreBaseHoles();
    resetResult();
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('summaryModal').classList.remove('show');
    const hc=document.getElementById('hcScreen'); if(hc) hc.classList.remove('show');
    document.querySelectorAll('.celebration-overlay').forEach(el=>el.remove());
    PLAYER_NAME=save.playerName||PLAYER_NAME;
    GAME_DIFF=save.gameDiff||1;
    const diffMap={ 1: [1, 1, 2], 2: [1, 2, 3], 3: [2, 3, 3] };
    HOLES.forEach(h=>{ h.diff=diffMap[h.baseDiff][GAME_DIFF-1]; });
    
    S.mode=save.mode||'single'; S.totalRounds=save.totalRounds||1; S.currentRound=save.currentRound||1;
    S.courseId=savedCourseId;
    S.holesConfig=save.holesConfig||'18'; S.startIdx=save.startIdx||0; S.endIdx=save.endIdx||17;
    S.cpuMode=!!save.cpuMode;
    S.cpuField=(S.cpuMode && typeof restoreCpuFieldSnapshot === 'function') ? restoreCpuFieldSnapshot(save.cpuField) : null;
    SETUP.opponent = S.cpuMode ? 'cpu' : 'solo';
    S.holeIdx=save.holeIdx; S.zone=save.zone; S.strokes=save.strokes; S.shotNum=save.shotNum; S.log=save.log||[];
    S.currentGrid=save.currentGrid||null;
    
    if(save.scorecard && !save.scorecards) {
       S.scorecards = [Array(18).fill(null)];
       for(let i=0; i<9; i++) S.scorecards[0][i] = save.scorecard[i];
       S.histories = [Array(18).fill(null)];
       for(let i=0; i<9; i++) S.histories[0][i] = save.history[i];
    } else {
       S.scorecards=save.scorecards; S.histories=save.histories;
    }
    
    S.holeDone=save.holeDone||false; S.yrdRemain=save.yrdRemain; S.yrdTotal=save.yrdTotal; S.fwyVisits=save.fwyVisits||0;
    S.prevZone=save.prevZone; S.shotCount=save.shotCount||0; 
    S._gameUnderParStreak=save._gameUnderParStreak||0;
    S._wcUsedThisRound=save._wcUsedThisRound||0;
    S._wcDiscardedThisRound=save._wcDiscardedThisRound||0; 
    S._wcsUsedThisHole=save._wcsUsedThisHole||[]; S._wcNextShotNote=save._wcNextShotNote||null;
    S._eyesClosedArmed=!!save._eyesClosedArmed;
    S._landscaperRoughFixes=save._landscaperRoughFixes||0;
    S._rocketApproachPending=!!save._rocketApproachPending;
    S._ferrettArmedShot=!!save._ferrettArmedShot;
    S._highlightReelArmedShot=!!save._highlightReelArmedShot;
    S._roundWaterHits=save._roundWaterHits||0;
    S._roundSandHits=save._roundSandHits||0;
    S._roundRoughHits=save._roundRoughHits||0;
    S._roundPrevWasDoubleOrWorse=!!save._roundPrevWasDoubleOrWorse;
    S._roundIceTriggered=!!save._roundIceTriggered;
    S._roundEndProcessed=!!save._roundEndProcessed;
    S._roundEndMeta=save._roundEndMeta||null;
    S._roundEndAchievementPopupsShown=!!save._roundEndAchievementPopupsShown;
    S._cpuRoundCompleteForSummary=save._cpuRoundCompleteForSummary||null;
    S._pendingPuttResult=save._pendingPuttResult||null;
    S._pendingHoleFinish=save._pendingHoleFinish||null;
    S._forceP1PuttGrid=!!save._forceP1PuttGrid;
    const waitingForNextShot=save._waitingForNextShot||false;
    
    WCS.equipped=(save.wcsEquipped||[]).filter(wc=>wc && WILDCARDS.some(def=>def.id===wc.id)); WCS.active=save.wcsActive||null;
    if(WCS.active && !['mulligan','tailwind','precision_grip'].includes(WCS.active)) WCS.active = null;
    WCS.luckyBounceActive=save.wcsLuckyBounce||false; WCS.ironWillActive=save.wcsIronWill||false;
    WCS.greenReadActive=save.wcsGreenReadActive||false; WCS.greenReadQueued=save.wcsGreenReadQueued||false;
    WCS.bounceBackPending=save.wcsBounceBackPending||false; WCS.bounceBackReady=save.wcsBounceBackReady||false;
    WCS.bogeyShieldActive=save.wcsBogeyShield||false;
    WCS.mowersRevengeActive=save.wcsMowersRevenge||false; WCS.mowersRevengeQueued=save.wcsMowersRevengeQueued||false;
    WCS.birdieBoostActive=save.wcsBirdieBoost||false; WCS.holeWallActive=save.wcsHoleWall||false;
    WCS.sandWedgeProActive=save.wcsSandWedgePro||false; WCS.cupMagnetActive=save.wcsCupMagnet||false;
    WCS.goldenPutterActive=save.wcsGoldenPutter||false; WCS.ferrettActive=save.wcsFerrett||false;
    WCS.hioActive=save.wcsHio||false; WCS.highlightReelActive=save.wcsHighlightReel||false;
    WCS.shortcutActive=save.wcsShortcut||false;
    
    if(save.vsState) {
        VS.active = true;
        VS.format = save.vsState.format;
        VS.players = save.vsState.players;
        VS.currentPlayer = save.vsState.currentPlayer;
        VS.scores = save.vsState.scores;
        VS.histories = save.vsState.histories;
        VS.matchScore = save.vsState.matchScore;
        VS.sharedGrids = save.vsState.sharedGrids || {};
        VS.setup = {
          ...VS.setup,
          ...(save.vsState.setup || {}),
          course: normalizeCourseId(save.vsState?.setup?.course || savedCourseId),
          courseSelected: true,
          rounds: (save.vsState.setup && save.vsState.setup.rounds) ? save.vsState.setup.rounds : 1
        };
        VS.lastStrokeRounds = (save.vsState.format === 'stroke' && VS.setup.rounds > 1) ? VS.setup.rounds : (VS.lastStrokeRounds || 1);
        VS.wcs = save.vsState.wcs;
        if(VS.format === 'match'){
          VS.setup.rounds = 1;
          S.totalRounds = 1;
          S.currentRound = 1;
        }
    } else {
        VS.active = false;
        maybeUnlockHoarder();
    }
    const resumeIntoOverlay = S.holeDone || !!save.vsTurnPending;
    
    if(VS.active) vsSyncScorecardMirror(VS.currentPlayer);
    hideScreen('menuScreen');
    showMainApp(); // Trigger immediately for a perfect CSS crossfade
    setMainAppConcealed(resumeIntoOverlay);
    buildLegend();buildScorecard();
    const h=HOLES[S.holeIdx];
    document.getElementById('holeName').textContent=h.name;
    document.getElementById('holeYards').textContent=fmtYds(h.yards);
    document.getElementById('holeStars').innerHTML=starsHTML(h.baseDiff);
    document.getElementById('holePar').textContent=h.par;
    
    if (S.currentGrid) renderGrid(); else buildGrid();
    if(WCS&&typeof applyPendingGridWildcardsToCurrentGrid==='function')applyPendingGridWildcardsToCurrentGrid();
    
    updateZonePill();updateYrd();renderLog();updateFloat();updateTVBanner();
    
    if (S._pendingPuttResult || S._pendingHoleFinish) {
        const nextBtn = document.getElementById('nextShotBtn');
        if(nextBtn){
            nextBtn.textContent='FINISH HOLE';
            nextBtn.style.background='var(--c-tee)';
            nextBtn.onclick=()=>{
                if(_rerollChoiceActive) return;
                const b=document.getElementById('puttWcBtn');if(b)b.remove();
                S._pendingHoleFinish=null;
                if(typeof freezeCurrentGridForFinish === 'function') freezeCurrentGridForFinish();
                _holdFinishBtn=true;
                S.holeDone=true;
                nextBtn.disabled=true;
                nextBtn.style.pointerEvents='none';
                updateTVBanner();
                try{ saveGameState(); }catch{}
                setTimeout(()=>{ completeHole(); try{ saveGameState(); }catch{} },200);
            };
        }
        showNextShotBtn();
    } else if (S.holeDone && !VS.active) {
        // Hole already finished on last exit — lock controls, overlay handles advancement below
        showNextShotBtn(true);
        const nextBtn = document.getElementById('nextShotBtn');
        if(nextBtn){ nextBtn.disabled=true; nextBtn.style.pointerEvents='none'; }
    } else if (waitingForNextShot && !S.holeDone) {
        showNextShotBtn();
    } else {
        hideNextShotBtn(true);
        startDiceIdle();
    }

    if (VS.active) {
        const tvIcon = document.querySelector('.tv-icon-box');
        if(tvIcon) tvIcon.textContent = VS.players[VS.currentPlayer].icon;
        document.getElementById('tvName').textContent = VS.players[VS.currentPlayer].name;
        PLAYER_NAME = VS.players[VS.currentPlayer].name;
        if (save.vsTurnPending) {
            hideNextShotBtn(true);
            setTimeout(()=>vsShowTurnScreen(),40);
        } else if (S.holeDone) {
            showNextShotBtn();
            if (VS.currentPlayer === 1) vsShowHoleComparison();
            else vsShowTurnScreen();
        } else {
            renderWcFab();
        }
    } else if(S.holeDone) {
        // Defensive: if hole was marked done but scorecard wasn't filled (exit between
        // FINISH HOLE click and completeHole timeout), backfill it now before overlay.
        const _curSc = S.scorecards && S.scorecards[S.currentRound - 1];
        if(_curSc && _curSc[S.holeIdx] == null){
          S._skipCelebration = true;
          try{ completeHole(); }catch(e){ console.error('completeHole backfill failed', e); }
          try{ saveGameState(); }catch{}
          return;
        }
        showNextShotBtn();
        if (S.holeIdx >= S.endIdx && S.currentRound === S.totalRounds) {
            showRoundEnd();
        } else if (S.holeIdx >= S.endIdx) {
            showRoundEnd();
        } else {
            S._skipCelebration = true;
            S._resumeCompletedHolePanel = true;
            try{ completeHole(); }catch(e){ console.error('completed-hole resume failed', e); }
            finally{ S._resumeCompletedHolePanel = false; }
        }
    } else {
        renderWcFab();
    }
    maybeShowShakeBanner();
  }catch(e){console.error('Continue failed:',e);}
}

function abandonCurrentGame(){
  showConfirm('ARE YOU SURE YOU WANT TO ABANDON THIS GAME?', () => {
    clearSavedGame();
    returnToMenu();
    updateMenuContinueBtn();
  });
}

function returnToMenuSave(opts={}){
  const preserveSummary = !!opts.preserveSummary;
  const roundFinished = !VS.active && S.holeDone && S.holeIdx >= S.endIdx && S.currentRound >= S.totalRounds;
  const vsTurnPending = !!document.getElementById('vsTurnScreen')?.classList.contains('show');
  if(VS.active && !vsTurnPending){
    if(!VS.wcs) VS.wcs = [{}, {}];
    VS.wcs[VS.currentPlayer] = { ...WCS, equipped:[...WCS.equipped] };
  }
  if(roundFinished) clearSavedGame();
  else if(!TUT.active) saveGameState();
  VS.active = false;
  _courseScreenFlow = 'single';
  TUT.active = false;
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
  updateMenuContinueBtn();
}

function updateMenuContinueBtn(){
  const btn=document.getElementById('menuContinueBtn');
  if(!btn)return;
  btn.classList.remove('menu-glow');
  if(hasSavedGame()){
    const save = getSavedGameForActiveProfile();
    if(!save){
      btn.style.display='none';
      return;
    }
    
    if (save.vsState) {
        const p1 = save.vsState.players[0].name;
        const p2 = save.vsState.players[1].name;
        const p1Html = escapeHtml(p1);
        const p2Html = escapeHtml(p2);
        const holeDisplay = save.holeIdx + 1;
        const format = save.vsState.format === 'match' ? 'MATCH PLAY' : 'STROKE PLAY';
        btn.innerHTML=`<div class="menu-continue-title"><span class="menu-continue-icon" aria-hidden="true"></span> CONTINUE VERSUS</div><div style="font-family:'Sen', sans-serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:normal;margin-top:4px;">${format} · H${holeDisplay} · ${p1Html} vs ${p2Html}</div>`;
        btn.style.display='flex';
        btn.classList.add('menu-glow');
    } else if (save.cpuMode) {
        const content = getCpuContinueButtonContent(save);
        btn.innerHTML=`<div class="menu-continue-title"><span class="menu-continue-icon" aria-hidden="true"></span> ${escapeHtml(content.title)}</div><div style="font-family:'Sen', sans-serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:normal;margin-top:4px;">${escapeHtml(content.meta)}</div>`;
        btn.style.display='flex';
        btn.classList.add('menu-glow');
    } else {
        const courseId = normalizeCourseId(save.courseId || save.vsState?.setup?.course || DEFAULT_COURSE_ID);
        const courseCfg = getCourseConfig(courseId);
        const courseHoles = courseCfg.holes;
        let totalScore = 0; let totalPar = 0;
        if (save.scorecards) {
           save.scorecards.forEach(sc => sc.forEach((s, i) => {
             if(s!==null){
               totalScore+=s;
               totalPar += (courseHoles[i]?.par ?? HOLES[i]?.par ?? 4);
             }
           }));
        } else if (save.scorecard) {
           save.scorecard.forEach((s, i) => {
             if(s!==null){
               totalScore+=s;
               totalPar += (courseHoles[i]?.par ?? HOLES[i]?.par ?? 4);
             }
           });
        }
        
        const diff = totalScore - totalPar;
        const diffStr = diff > 0 ? `+${diff}` : diff === 0 ? 'E' : `${diff}`;
        const rnd = save.currentRound || 1;
        const cName = courseCfg.shortName || courseCfg.name;
        const holeDisplay = save.holeIdx + 1;
        
        btn.innerHTML=`<div class="menu-continue-title"><span class="menu-continue-icon" aria-hidden="true"></span> CONTINUE</div><div style="font-family:'Sen', sans-serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:normal;margin-top:4px;">${cName} · R${rnd} · H${holeDisplay} · ${diffStr}</div>`;
        btn.style.display='flex';
        btn.classList.add('menu-glow');
    }
  } else {
    btn.style.display='none';
  }
}
