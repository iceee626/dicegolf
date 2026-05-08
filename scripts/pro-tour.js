(function(){
  const Core = window.ProTourCore;
  const STORAGE_KEY = 'dicegolf_pro_tour_store_v1';
  const VIEW_IDS = [
    'proTourSlotScreen',
    'proTourCreateCareerScreen',
    'proTourSeasonStartScreen',
    'proTourCutMissedScreen',
    'proTourCareerScreen',
    'proTourLeaderboardScreen',
    'proTourEventResultsScreen',
    'proTourStatsScreen',
    'proTourTrophyScreen',
    'proTourSeasonFinaleScreen'
  ];
  const PANEL_ICONS = { leaderboard:'\u{1F4CB}', stats:'\u{1F4CA}', trophy:'\u{1F3C6}' };

  let store = loadStore();
  let activeSlot = null;
  let activeCareer = null;
  let pendingCreateSlot = null;
  let selectedCareerType = 'long';
  let selectedDifficulty = 1;
  let seasonIntroTimer = null;

  const $ = id => document.getElementById(id);

  function profileId(){
    return (typeof getActiveProfileId === 'function' && getActiveProfileId()) || 'default';
  }

  function loadStore(){
    try{
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : Core.createEmptyStore();
    }catch{
      return Core.createEmptyStore();
    }
  }

  function saveStore(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }catch{}
  }

  function hideShellScreens(){
    [
      'menuScreen','playModeScreen','customScreen','courseScreen','diffScreen',
      'versusSetupScreen','vsOptionsScreen'
    ].forEach(id => hideScreen(id));
  }

  function showTourView(screenId, direction){
    if(typeof forceHideGame === 'function') forceHideGame();
    if(typeof clearCourseVisualTheme === 'function') clearCourseVisualTheme();
    if(typeof _setNavDir === 'function') _setNavDir(direction === 'back' ? 'back' : 'forward');
    hideShellScreens();
    VIEW_IDS.forEach(id => {
      const el = $(id);
      if(!el) return;
      if(id === screenId){
        el.style.display = 'flex';
        requestAnimationFrame(() => el.classList.add('visible'));
      } else {
        el.classList.remove('visible');
        setTimeout(() => {
          if(!el.classList.contains('visible')) el.style.display = 'none';
        }, 260);
      }
    });
  }

  function closeTourViews(){
    VIEW_IDS.forEach(id => {
      const el = $(id);
      if(!el) return;
      el.classList.remove('visible');
      el.style.display = 'none';
    });
  }

  function saveActiveCareer(){
    if(!activeCareer || !activeSlot) return;
    store = Core.saveCareerSlot(store, profileId(), activeSlot, activeCareer);
    saveStore();
  }

  function renderSlots(){
    store = loadStore();
    activeCareer = null;
    activeSlot = null;
    const grid = $('proTourSlotsGrid');
    if(!grid) return;
    const slots = Core.listCareerSlots(store, profileId());
    const occupied = slots.filter(slot => !slot.empty);
    const firstEmpty = slots.find(slot => slot.empty);
    grid.innerHTML = '';

    occupied.forEach(slot => {
      const node = $('proTourSlotTemplate').content.firstElementChild.cloneNode(true);
      const copy = node.querySelector('.pt-slot-copy');
      const actions = node.querySelector('.pt-slot-actions');
      const position = slot.positionLabel && slot.positionLabel !== '-' ? slot.positionLabel : '-';
      copy.innerHTML = `
        <div class="pt-slot-title">
          <strong>SLOT ${slot.slotIndex}</strong>
          <span class="pt-slot-summary">${formatDot(escapeHtml(slot.playerName), `SEASON ${slot.season}`, position)}</span>
        </div>
      `;
      actions.innerHTML = `
        <button class="menu-btn-play continue-state" type="button">CONTINUE</button>
        <button class="ph-btn danger" type="button">DELETE</button>
      `;
      actions.children[0].addEventListener('click', () => openCareer(slot.slotIndex));
      actions.children[1].addEventListener('click', () => {
        showConfirm('ARE YOU SURE YOU WANT TO DELETE THIS SAVE?', () => {
          store = Core.deleteCareerSlot(store, profileId(), slot.slotIndex);
          saveStore();
          renderSlots();
        });
      });
      grid.appendChild(node);
    });

    if(firstEmpty){
      const add = document.createElement('button');
      add.className = 'pt-slot-card pt-add-slot-card';
      add.type = 'button';
      add.innerHTML = `<strong>NEW CAREER</strong><span>MAX. 3 SLOTS</span>`;
      add.addEventListener('click', () => openCreateCareer(firstEmpty.slotIndex));
      grid.appendChild(add);
    }

    showTourView('proTourSlotScreen', 'forward');
  }

  function openCreateCareer(slotIndex){
    pendingCreateSlot = slotIndex;
    selectedCareerType = 'long';
    selectedDifficulty = 1;
    const profile = typeof getActiveProfile === 'function' ? getActiveProfile() : null;
    $('proTourCreateCareerName').value = profile && profile.name ? profile.name.toUpperCase().slice(0, 12) : 'PLAYER';
    updateChoiceButtons();
    showTourView('proTourCreateCareerScreen', 'forward');
    setTimeout(() => $('proTourCreateCareerName').focus(), 280);
  }

  function updateChoiceButtons(){
    document.querySelectorAll('[data-pro-tour-career-type]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.proTourCareerType === selectedCareerType);
    });
    document.querySelectorAll('[data-pro-tour-difficulty]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.proTourDifficulty) === selectedDifficulty);
    });
  }

  function createCareerFromForm(){
    if(!pendingCreateSlot) return;
    const playerName = $('proTourCreateCareerName').value || 'PLAYER';
    const career = Core.createCareer({
      slotId:pendingCreateSlot,
      playerName,
      difficulty:selectedDifficulty,
      careerType:selectedCareerType,
      seed:Date.now() + pendingCreateSlot
    });
    store = Core.saveCareerSlot(store, profileId(), pendingCreateSlot, career);
    saveStore();
    openCareer(pendingCreateSlot);
  }

  function openCareer(slotIndex, direction='forward'){
    activeSlot = slotIndex;
    activeCareer = Core.loadCareerSlot(store, profileId(), slotIndex);
    normalizeLegacyCareer();
    renderCareer();
    const intro = Core.getSeasonIntro(activeCareer);
    if(intro.shouldShow){
      renderSeasonIntro(intro);
      showTourView('proTourSeasonStartScreen', direction);
      scheduleSeasonIntroDismiss();
      return;
    }
    showTourView('proTourCareerScreen', direction);
  }

  function normalizeLegacyCareer(){
    if(!activeCareer) return;
    if(!activeCareer.careerType) activeCareer.careerType = 'long';
    if(!activeCareer.roundsPerEvent) activeCareer.roundsPerEvent = 4;
    if(!activeCareer.cutAfterRound) activeCareer.cutAfterRound = 2;
    if(!activeCareer.trophies) activeCareer.trophies = { eventWins:[], seasonTitles:[] };
    if(activeCareer.activeRoundSave === undefined) activeCareer.activeRoundSave = null;
    if(activeCareer.currentSeason && typeof activeCareer.currentSeason.seasonIntroSeen !== 'boolean'){
      activeCareer.currentSeason.seasonIntroSeen = (activeCareer.currentSeason.eventsCompleted || 0) > 0 || !!activeCareer.activeEvent;
    }
  }

  function distributeRoundScore(grossScore, holes){
    const row = Array(18).fill(null);
    const active = Array.isArray(holes) && holes.length ? holes : [];
    if(!active.length) return row;
    active.forEach((hole, idx) => { row[idx] = Math.max(1, Number(hole && hole.par) || 4); });
    let remaining = Math.round(Number(grossScore) || active.reduce((sum, hole) => sum + (Number(hole && hole.par) || 4), 0))
      - active.reduce((sum, hole) => sum + (Number(hole && hole.par) || 4), 0);
    if(remaining > 0){
      for(let idx = active.length - 1; remaining > 0; idx = (idx - 1 + active.length) % active.length){
        row[idx] += 1;
        remaining--;
      }
    } else if(remaining < 0){
      for(let idx = active.length - 1; remaining < 0; idx = (idx - 1 + active.length) % active.length){
        if(row[idx] <= 1) continue;
        row[idx] -= 1;
        remaining++;
      }
    }
    return row;
  }

  function buildPreviousScorecards(event){
    if(!event || !Array.isArray(event.userRounds)) return [];
    const course = typeof getCourseConfig === 'function' ? getCourseConfig(event.courseId) : null;
    const holes = course && Array.isArray(course.holes) ? course.holes : [];
    return event.userRounds.map(round => distributeRoundScore(round.score, holes));
  }

  function buildProTourCpuOpponents(career){
    return (career.field || [])
      .filter(player => !player.isUser)
      .map(player => ({
        id:player.id,
        careerPlayerId:player.id,
        name:player.name
      }));
  }

  function buildProTourCpuRoundScores(event){
    const out = {};
    if(!event || !event.rounds) return out;
    Object.keys(event.rounds).forEach(playerId => {
      if(playerId === 'user') return;
      const scores = event.rounds[playerId];
      if(Array.isArray(scores)) out[playerId] = scores.slice();
    });
    return out;
  }

  function collectCurrentCpuRoundScores(){
    if(!S || !S.cpuField || !Array.isArray(S.cpuField.opponents) || typeof cpuRoundScoresTotal !== 'function') return null;
    const out = {};
    const roundIdx = Math.max(0, (S.currentRound || 1) - 1);
    S.cpuField.opponents.forEach(opp => {
      const careerId = opp.careerPlayerId || opp.id;
      const state = opp.rounds && opp.rounds[roundIdx];
      if(!careerId || !state) return;
      const total = cpuRoundScoresTotal(state.scores || [], HOLES, S.startIdx, S.endIdx).total;
      if(total > 0) out[careerId] = total;
    });
    return Object.keys(out).length ? out : null;
  }

  function renderCareer(){
    if(!activeCareer) return;
    normalizeLegacyCareer();
    const dashboard = Core.getDashboard(activeCareer);
    const hasCompletedEvent = activeCareer.currentSeason.eventsCompleted > 0;
    $('proTourCareerTitle').textContent = activeCareer.playerName;
    $('proTourCareerMeta').innerHTML = `<span class="pt-season-pill">SEASON ${dashboard.seasonNumber}</span>`;

    const pastCard = $('proTourPastEventCard');
    const dashboardGrid = $('proTourDashboardGrid');
    if(dashboard.pastEvent){
      pastCard.style.display = '';
      if(dashboardGrid) dashboardGrid.classList.remove('single-next');
      $('proTourPastEventTitle').textContent = dashboard.pastEvent.courseName;
      $('proTourPastEventMeta').textContent = formatDot(dashboard.pastEvent.userPositionLabel, dashboard.pastEvent.userDiffLabel, `${dashboard.pastEvent.userPoints} PTS`);
      $('proTourPastEventEmoji').textContent = courseEmoji(dashboard.pastEvent.courseId, dashboard.pastEvent.courseName);
      pastCard.classList.add('has-results');
      pastCard.setAttribute('tabindex', '0');
      pastCard.setAttribute('role', 'button');
    } else {
      pastCard.style.display = hasCompletedEvent ? '' : 'none';
      if(dashboardGrid) dashboardGrid.classList.toggle('single-next', !hasCompletedEvent);
      $('proTourPastEventTitle').textContent = 'None yet';
      $('proTourPastEventMeta').textContent = 'Begin your first event.';
      $('proTourPastEventEmoji').textContent = '';
      pastCard.classList.remove('has-results');
      pastCard.removeAttribute('tabindex');
      pastCard.removeAttribute('role');
    }

    $('proTourNextEventLabel').textContent = dashboard.nextEvent && dashboard.nextEvent.inProgress ? 'Current Event' : 'Next Event';
    $('proTourNextEventTitle').textContent = dashboard.nextEvent ? dashboard.nextEvent.courseName : 'Season Complete';
    $('proTourNextEventMeta').textContent = dashboard.nextEvent ? dashboard.nextEvent.label : `Start Season ${activeCareer.currentSeason.number + 1}`;
    $('proTourNextEventEmoji').textContent = dashboard.nextEvent ? courseEmoji('', dashboard.nextEvent.courseName) : '\u26f3';
    $('proTourSeasonStanding').innerHTML = dashboard.userStanding ? renderStandingLine(dashboard.userStanding.positionLabel, dashboard.userStanding.points) : '-';
    $('proTourSeasonStanding').closest('.pt-standing-card').style.display = hasCompletedEvent ? '' : 'none';
    if(dashboard.visibleLeader){
      $('proTourLeaderStandingBlock').style.display = '';
      $('proTourSeasonLeader').innerHTML = renderStandingLine(dashboard.visibleLeader.name, dashboard.visibleLeader.points);
    } else {
      $('proTourLeaderStandingBlock').style.display = 'none';
      $('proTourSeasonLeader').textContent = '';
    }
    const activeRoundSave = Core.getActiveRoundSave(activeCareer);
    const actionLabel = activeRoundSave ? 'CONTINUE' : dashboard.actionLabel;
    $('proTourMainActionBtn').textContent = actionLabel;
    $('proTourMainActionBtn').classList.toggle('continue-state', actionLabel === 'CONTINUE');
    setTimeout(maybeShowSeasonFinale, 320);
  }

  function saveCurrentRoundToCareer(){
    if(!S || S.mode !== 'pro-tour') return false;
    if(S._proTourRoundSubmitted && !S.proTourPostRound) return false;
    const context = S.proTour || window.PRO_TOUR_PENDING_ROUND;
    if(!context || !context.slotId) return false;
    if(typeof createCurrentGameSaveSnapshot !== 'function') return false;
    const gameSave = createCurrentGameSaveSnapshot();
    if(!gameSave) return false;
    activeSlot = context.slotId;
    store = loadStore();
    activeCareer = Core.loadCareerSlot(store, profileId(), activeSlot);
    if(!activeCareer) return false;
    activeCareer = Core.saveActiveRound(activeCareer, context, gameSave);
    saveActiveCareer();
    return true;
  }

  function restoreActiveRound(){
    if(!activeCareer) return false;
    const savedRound = Core.getActiveRoundSave(activeCareer);
    if(!savedRound) return false;
    closeTourViews();
    window.PRO_TOUR_PENDING_ROUND = { ...savedRound.context };
    if(typeof restoreGameFromSaveSnapshot !== 'function') return false;
    restoreGameFromSaveSnapshot(savedRound.gameSave);
    S.mode = 'pro-tour';
    S.proTour = { ...savedRound.context };
    S._proTourRoundSubmitted = !!savedRound.gameSave._proTourRoundSubmitted;
    S.proTourPostRound = savedRound.gameSave.proTourPostRound || null;
    return true;
  }

  function launchCurrentRound(){
    if(!activeCareer || !activeCareer.activeEvent) return;
    const event = activeCareer.activeEvent;
    const roundNumber = event.currentRound || ((event.userRounds ? event.userRounds.length : 0) + 1);
    saveActiveCareer();
    closeTourViews();
    SETUP.mode = 'pro-tour';
    SETUP.rounds = event.roundsPerEvent || activeCareer.roundsPerEvent || 4;
    SETUP.startRound = roundNumber;
    SETUP.holesConfig = '18';
    SETUP.opponent = 'cpu';
    SETUP.course = event.courseId;
    SETUP.courseSelected = true;
    GAME_DIFF = activeCareer.difficulty || 1;
    window.PRO_TOUR_PREVIOUS_SCORECARDS = buildPreviousScorecards(event);
    window.PRO_TOUR_CPU_FIELD_OPTIONS = {
      totalRounds:SETUP.rounds,
      seed:(activeCareer.seed || Date.now()) + (event.seasonNumber * 1000) + (event.eventIndex * 97),
      opponents:buildProTourCpuOpponents(activeCareer),
      roundScoresByOpponentId:buildProTourCpuRoundScores(event)
    };
    window.PRO_TOUR_PENDING_ROUND = {
      slotId:activeSlot,
      eventId:event.id,
      roundNumber
    };
    startGame();
    S.mode = 'pro-tour';
    S.proTour = { ...window.PRO_TOUR_PENDING_ROUND };
    S._proTourRoundSubmitted = false;
    S.proTourPostRound = null;
    saveCurrentRoundToCareer();
  }

  function mainAction(){
    if(!activeCareer) return;
    if(Core.getActiveRoundSave(activeCareer)){
      restoreActiveRound();
      return;
    }
    if(activeCareer.currentSeason.status === 'complete'){
      activeCareer = Core.startNextSeason(activeCareer);
      saveActiveCareer();
      renderSeasonIntro(Core.getSeasonIntro(activeCareer));
      showTourView('proTourSeasonStartScreen', 'forward');
      scheduleSeasonIntroDismiss();
      return;
    }
    if(!activeCareer.activeEvent){
      activeCareer = Core.startCurrentEvent(activeCareer);
      saveActiveCareer();
      renderCareer();
    }
    launchCurrentRound();
  }

  function handleRoundCompleteFromGame(){
    if(!S || S.mode !== 'pro-tour' || S._proTourRoundSubmitted) return false;
    const context = S.proTour || window.PRO_TOUR_PENDING_ROUND;
    if(!context || !context.slotId) return false;
    const roundScores = S.scorecards && S.scorecards[S.currentRound - 1] ? S.scorecards[S.currentRound - 1] : [];
    const roundTotal = roundScores.reduce((sum, score) => sum + (Number(score) || 0), 0);
    if(!roundTotal) return false;
    activeSlot = context.slotId;
    store = loadStore();
    activeCareer = Core.loadCareerSlot(store, profileId(), activeSlot);
    if(!activeCareer) return false;
    activeCareer = Core.submitUserRound(activeCareer, roundTotal, {
      wildcardsUsed:S._wcUsedThisRound || 0,
      wildcardsDiscarded:S._wcDiscardedThisRound || 0,
      cpuScores:collectCurrentCpuRoundScores()
    });
    activeCareer = Core.clearActiveRoundSave(activeCareer);
    S._proTourRoundSubmitted = true;
    S.proTourPostRound = {
      slotId:activeSlot,
      eventId:context.eventId,
      roundNumber:context.roundNumber || S.currentRound,
      eventComplete:!activeCareer.activeEvent,
      missedCut:!!(activeCareer.pastEvent && activeCareer.pastEvent.eventId === context.eventId && activeCareer.pastEvent.userMadeCut === false),
      nextRound:activeCareer.activeEvent ? activeCareer.activeEvent.currentRound : null
    };
    saveActiveCareer();
    return S.proTourPostRound;
  }

  function saveAndReturnFromGameMenu(){
    const context = S && (S.proTour || window.PRO_TOUR_PENDING_ROUND);
    if(!context || !context.slotId) return false;
    if(!saveCurrentRoundToCareer()) return false;
    const hc = $('hcScreen');
    if(hc) hc.classList.remove('show');
    document.getElementById('overlay')?.classList.remove('show');
    document.getElementById('summaryModal')?.classList.remove('show');
    document.getElementById('gameMenuModal')?.classList.remove('show');
    document.getElementById('vsTurnScreen')?.classList.remove('show');
    clearRoundStartSplash();
    setMainAppConcealed(true);
    hideMainApp();
    clearCourseVisualTheme();
    window.PRO_TOUR_PENDING_ROUND = null;
    S.proTour = null;
    activeSlot = context.slotId;
    store = loadStore();
    activeCareer = Core.loadCareerSlot(store, profileId(), activeSlot);
    openCareer(activeSlot, 'back');
    return true;
  }

  function returnFromRoundComplete(){
    const hc = $('hcScreen');
    if(hc) hc.classList.remove('show');
    S.proTour = null;
    window.PRO_TOUR_PENDING_ROUND = null;
    if(activeSlot){
      openCareer(activeSlot, 'back');
    } else {
      renderSlots();
    }
  }

  function backToCareerFromPanel(){
    if(activeCareer) renderCareer();
    showTourView('proTourCareerScreen', 'back');
  }

  function showMissedCutSplash(){
    const post = S && S.proTourPostRound;
    if(!post || !post.slotId) return false;
    activeSlot = post.slotId;
    store = loadStore();
    activeCareer = Core.loadCareerSlot(store, profileId(), activeSlot);
    if(!activeCareer || !activeCareer.pastEvent) return false;
    if(typeof closeSummaryHoleModal === 'function') closeSummaryHoleModal();
    document.getElementById('summaryModal')?.classList.remove('show');
    $('proTourCutMissedBody').innerHTML = `
      <div class="pt-season-golfer" aria-hidden="true">\u26F3</div>
      <strong>${escapeHtml(activeCareer.pastEvent.courseName || 'EVENT')}</strong>
      <small>${escapeHtml(formatDot(activeCareer.pastEvent.userPositionLabel, activeCareer.pastEvent.userDiffLabel))}</small>
    `;
    showTourView('proTourCutMissedScreen', 'forward');
    return true;
  }

  function openLatestEventResults(direction='forward'){
    const post = S && S.proTourPostRound;
    if(post && post.slotId) activeSlot = post.slotId;
    if(activeSlot){
      store = loadStore();
      activeCareer = Core.loadCareerSlot(store, profileId(), activeSlot);
    }
    if(!activeCareer || !activeCareer.pastEvent) return false;
    document.getElementById('summaryModal')?.classList.remove('show');
    const hc = $('hcScreen');
    if(hc) hc.classList.remove('show');
    openPastEventResults(direction);
    return true;
  }

  function openLeaderboard(){
    if(!activeCareer) return;
    const rows = Core.getTourLeaderboard(activeCareer);
    $('proTourLeaderboardBody').innerHTML = renderResultsTable(rows.map(row => ({
      name:row.name,
      positionLabel:row.positionLabel,
      diffLabel:'',
      points:row.points,
      isUser:row.isUser,
      madeCut:true
    })), true);
    showTourView('proTourLeaderboardScreen', 'forward');
  }

  function openPastEventResults(direction='forward'){
    if(!activeCareer || !activeCareer.pastEvent) return;
    const result = Core.getPastEventResults(activeCareer);
    if(!result) return;
    $('proTourEventResultsBody').innerHTML = `
      <div class="pt-section">
        <div class="pt-event-result-head">
          <strong>${escapeHtml(result.courseName)}</strong>
          <small>${escapeHtml(formatDot(result.userPositionLabel, result.userDiffLabel, `${result.userPoints || 0} PTS`))}</small>
        </div>
        ${renderResultsTable(result.finalStandings || [], false)}
      </div>
    `;
    showTourView('proTourEventResultsScreen', direction);
  }

  function openStats(){
    if(!activeCareer) return;
    const stats = Core.getCareerStats(activeCareer);
    $('proTourStatsBody').innerHTML = `
      <div class="pt-section">
        <div class="pt-section-title">THIS SEASON</div>
        ${renderStatsGrid(stats.thisSeason)}
        ${renderDistribution(stats.thisSeason.scoreBuckets)}
      </div>
      <div class="pt-section">
        <div class="pt-section-title">ALL TIME</div>
        ${renderStatsGrid(stats.allTime)}
        ${renderDistribution(stats.allTime.scoreBuckets)}
      </div>
    `;
    showTourView('proTourStatsScreen', 'forward');
    requestAnimationFrame(() => animateDistBars($('proTourStatsBody')));
  }

  function openTrophies(){
    if(!activeCareer) return;
    const eventWins = Core.getGroupedEventWins(activeCareer);
    const seasonTitles = activeCareer.trophies.seasonTitles || [];
    $('proTourTrophyBody').innerHTML = `
      <div class="pt-section">
        <div class="pt-section-title">EVENT WINS</div>
        ${eventWins.length ? eventWins.map(group => `
          <div class="pt-trophy-card">
            <div class="pt-trophy-stack">
              <div class="pt-trophy-icon">\u{1F947}</div>
              ${group.count > 1 ? `<div class="pt-win-count">x${group.count}</div>` : ''}
            </div>
            <div>
              <strong>${escapeHtml(group.courseName)}</strong>
              ${group.rows.map(row => `<small>${escapeHtml(formatDot(`SEASON ${row.seasonNumber}`, row.scoreLabel))}</small>`).join('')}
            </div>
          </div>
        `).join('') : '<div class="pt-empty">No event wins yet</div>'}
      </div>
      <div class="pt-section">
        <div class="pt-section-title">PRO TOUR CHAMPIONSHIPS</div>
        ${seasonTitles.length ? seasonTitles.map(title => `
          <div class="pt-trophy-card">
            <div class="pt-trophy-icon">\u{1F3C6}</div>
            <div><strong>Season ${title.seasonNumber}</strong><small>${title.points} pts</small></div>
          </div>
        `).join('') : '<div class="pt-empty">No championships yet</div>'}
      </div>
    `;
    showTourView('proTourTrophyScreen', 'forward');
  }

  function maybeShowSeasonFinale(){
    if(!activeCareer || !activeSlot) return;
    const finale = Core.getSeasonFinale(activeCareer);
    if(!finale.shouldShow) return;
    activeCareer = Core.markSeasonFinaleSeen(activeCareer);
    saveActiveCareer();
    renderSeasonFinale(finale);
    showTourView('proTourSeasonFinaleScreen', 'forward');
  }

  function renderSeasonFinale(finale){
    const posText = finale.userPosition === 1 ? 'TOUR CHAMPION' : `SEASON PODIUM ${Core.positionLabel(finale.userPosition)}`;
    $('proTourSeasonFinaleBody').innerHTML = `
      <div class="pt-finale-celebration">
        <div class="pt-finale-burst">\u{1F3C6}</div>
        <div class="pt-section-title">SEASON ${finale.seasonNumber}</div>
        <strong>${posText}</strong>
      </div>
      <div class="pt-finale-podium">
        ${finale.podium.map(row => `
          <div class="pt-podium-place ${row.position === 2 ? 'second' : ''} ${row.position === 3 ? 'third' : ''} ${row.isUser ? 'you-row' : ''}">
            <span>${row.positionLabel}</span>
            <strong>${escapeHtml(row.name)}</strong>
            <small>${row.points} pts.</small>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderSeasonIntro(intro){
    const safeIntro = intro || Core.getSeasonIntro(activeCareer);
    $('proTourSeasonStartTitle').textContent = `SEASON ${safeIntro.seasonNumber || 1}`;
    $('proTourSeasonStartPlayer').innerHTML = `
      <div class="pt-season-golfer" aria-hidden="true">\u{1F3CC}\uFE0F</div>
      <strong>${escapeHtml(activeCareer ? activeCareer.playerName : 'PLAYER')}</strong>
    `;
    $('proTourSeasonStartScreen').classList.remove('pt-season-exit');
  }

  function scheduleSeasonIntroDismiss(){
    clearTimeout(seasonIntroTimer);
    seasonIntroTimer = setTimeout(() => {
      $('proTourSeasonStartScreen').classList.add('pt-season-exit');
      setTimeout(startSeasonFromSplash, 260);
    }, 2000);
  }

  function startSeasonFromSplash(){
    if(!activeCareer) return;
    clearTimeout(seasonIntroTimer);
    activeCareer = Core.markSeasonIntroSeen(activeCareer);
    saveActiveCareer();
    renderCareer();
    showTourView('proTourCareerScreen', 'forward');
  }

  function closeSeasonFinale(){
    renderCareer();
    showTourView('proTourCareerScreen', 'back');
  }

  function renderResultsTable(rows, pointsOnly){
    if(!rows || !rows.length) return '<div class="pt-empty">No results yet.</div>';
    return `
      <table class="pt-table">
        <thead><tr><th>Pos</th><th>Player</th>${pointsOnly ? '' : '<th>Total</th>'}<th>Pts</th></tr></thead>
        <tbody>
          ${rows.map(row => `
            <tr class="${row.isUser ? 'you-row' : ''} ${row.madeCut ? '' : 'cut-row'}">
              <td>${row.positionLabel}</td>
              <td>${escapeHtml(row.name)}</td>
              ${pointsOnly ? '' : `<td>${row.diffLabel}</td>`}
              <td>${row.points || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderStatsGrid(stats){
    const rows = [
      ['Events', stats.eventsPlayed || 0],
      ['Wins', stats.wins || 0],
      ['Cuts Made', stats.cutsMade || 0],
      ['Cuts Missed', stats.cutsMissed || 0],
      ['Points', stats.pointsEarned || 0],
      ['Best Finish', stats.bestFinishLabel || '-'],
      ['Wildcards Used', stats.wildcardsUsed || 0],
      ['WC Discarded', stats.wildcardsDiscarded || 0]
    ];
    return `<div class="pt-stat-grid">${rows.map(([label, value]) => `
      <div class="ph-stat-tile"><div class="ph-stat-num">${value}</div><div class="ph-stat-lbl">${label}</div></div>
    `).join('')}</div>`;
  }

  function renderDistribution(buckets){
    const safe = buckets || {};
    const rows = [
      { label:'Ace', cls:'eagle', value:safe.aces || 0 },
      { label:'Eagle+', cls:'eagle', value:safe.eaglesPlus || 0 },
      { label:'Birdie', cls:'birdie', value:safe.birdies || 0 },
      { label:'Par', cls:'par', value:safe.pars || 0 },
      { label:'Bogey', cls:'bogey', value:safe.bogeys || 0 },
      { label:'Double+', cls:'double', value:safe.doublePlus || 0 }
    ];
    const max = Math.max(1, ...rows.map(row => row.value));
    return `
      <div class="ph-dist-list">
        ${rows.map(row => {
          const pct = Math.round((row.value / max) * 100);
          return `
            <div class="ph-dist-row">
              <div class="ph-dist-lbl">${row.label}</div>
              <div class="ph-dist-track"><div class="ph-dist-fill ${row.cls}" data-to="${pct}" style="width:0%;"></div></div>
              <div class="ph-dist-val">${row.value}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function animateDistBars(root){
    root.querySelectorAll('.ph-dist-fill[data-to]').forEach(fill => {
      const to = Math.max(0, Math.min(100, Number(fill.dataset.to) || 0));
      fill.style.width = '0%';
      requestAnimationFrame(() => { fill.style.width = `${to}%`; });
    });
  }

  function courseEmoji(courseId, courseName){
    const course = Core.COURSES.find(item => item.id === courseId || item.name === courseName);
    return course ? course.emoji : '';
  }

  function renderStandingLine(label, points){
    return `<span class="pt-standing-line"><span>${escapeHtml(label)}</span><span>${Number(points) || 0} pts.</span></span>`;
  }

  function formatDot(){
    return Array.from(arguments).filter(part => part != null && String(part).trim() !== '').join(' \u00B7 ');
  }

  function openInfo(){
    const el = $('proTourInfoOverlay');
    if(!el) return;
    if(el._closeTimer){
      clearTimeout(el._closeTimer);
      el._closeTimer = null;
    }
    el.classList.remove('closing');
    el.classList.add('show');
  }

  function closeInfo(){
    const el = $('proTourInfoOverlay');
    if(!el || !el.classList.contains('show') || el.classList.contains('closing')) return;
    el.classList.add('closing');
    if(el._closeTimer) clearTimeout(el._closeTimer);
    el._closeTimer = setTimeout(() => {
      el.classList.remove('closing');
      el.classList.remove('show');
      el._closeTimer = null;
    }, 210);
  }

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    })[char]);
  }

  function bind(){
    if(!$('proTourModeBtn')) return;
    $('proTourModeBtn').addEventListener('click', renderSlots);
    $('proTourInfoBtn')?.addEventListener('click', openInfo);
    $('proTourInfoOverlay')?.addEventListener('click', closeInfo);
    $('proTourInfoCard')?.addEventListener('click', event => event.stopPropagation());
    $('proTourInfoCloseBtn')?.addEventListener('click', closeInfo);
    $('proTourSlotBackBtn').addEventListener('click', () => {
      closeTourViews();
      showScreen('playModeScreen', 'flex');
    });
    $('proTourCreateBackBtn').addEventListener('click', renderSlots);
    $('proTourCreateCareerNextBtn').addEventListener('click', createCareerFromForm);
    document.querySelectorAll('[data-pro-tour-career-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCareerType = btn.dataset.proTourCareerType || 'long';
        updateChoiceButtons();
      });
    });
    document.querySelectorAll('[data-pro-tour-difficulty]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedDifficulty = Number(btn.dataset.proTourDifficulty) || 1;
        updateChoiceButtons();
      });
    });
    $('proTourBackToCareersBtn').addEventListener('click', renderSlots);
    $('proTourCareerSettingsBtn').addEventListener('click', () => openSettings(false));
    $('proTourPastEventCard').addEventListener('click', openPastEventResults);
    $('proTourPastEventCard').addEventListener('keydown', event => {
      if(event.key === 'Enter' || event.key === ' ') openPastEventResults();
    });
    $('proTourMainActionBtn').addEventListener('click', mainAction);
    $('proTourLeaderboardPanelBtn').textContent = PANEL_ICONS.leaderboard;
    $('proTourStatsPanelBtn').textContent = PANEL_ICONS.stats;
    $('proTourTrophyPanelBtn').textContent = PANEL_ICONS.trophy;
    $('proTourLeaderboardPanelBtn').addEventListener('click', openLeaderboard);
    $('proTourStatsPanelBtn').addEventListener('click', openStats);
    $('proTourTrophyPanelBtn').addEventListener('click', openTrophies);
    $('proTourLeaderboardBackBtn').addEventListener('click', backToCareerFromPanel);
    $('proTourEventResultsBackBtn').addEventListener('click', backToCareerFromPanel);
    $('proTourStatsBackBtn').addEventListener('click', backToCareerFromPanel);
    $('proTourTrophyBackBtn').addEventListener('click', backToCareerFromPanel);
    $('proTourSeasonFinaleContinueBtn').addEventListener('click', closeSeasonFinale);
    $('proTourCutMissedFinishBtn')?.addEventListener('click', () => openLatestEventResults('forward'));
  }

  window.ProTour = {
    open: renderSlots,
    handleRoundCompleteFromGame,
    returnFromRoundComplete,
    saveCurrentRoundToCareer,
    saveAndReturnFromGameMenu,
    showMissedCutSplash,
    openLatestEventResults
  };

  document.addEventListener('DOMContentLoaded', bind);
})();
