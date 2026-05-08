(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  root.ProTourCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  const COURSES = [
    { id:'little-pines', name:'Little Pines Open', shortName:'Little Pines', par:72, emoji:'🌲' },
    { id:'pacific-beach', name:'Pacific Beach Classic', shortName:'Pacific Beach', par:72, emoji:'🌊' },
    { id:'gator-creek', name:'Gator Creek Invitational', shortName:'Gator Creek', par:72, emoji:'🐊' },
    { id:'septembra-national', name:'Septembra National Championship', shortName:'Septembra National', par:72, emoji:'🌺', finale:true }
  ];

  const POINTS_TABLE = [500, 350, 275, 220, 175, 140, 110, 85, 65, 50];
  const SLOT_COUNT = 3;
  const CUT_SIZE = 10;
  const FIELD_SIZE = 20;
  const USER_ID = 'user';
  const CAREER_TYPES = {
    long: { key:'long', label:'Long Career', roundsPerEvent:4, cutAfterRound:2 },
    short: { key:'short', label:'Short Career', roundsPerEvent:2, cutAfterRound:1 }
  };

  const CPU_NAMES = [
    'RAHMIREZ','FOREST','DESHAMBO','HOLYWOOD','FALDOUGH','NICKELSON','SINGLES','BROOKS','YOONG',
    'WONG','NAKAMURA','LOWRIE','CANTWELL','KUCHARSKI','SCHEFFIELD','ROSS','NIGHT','FITZGERALD','THOMASON'
  ];

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function normalizeSlotIndex(slotIndex){
    const n = Number(slotIndex);
    return Number.isFinite(n) ? clamp(Math.floor(n), 1, SLOT_COUNT) : 1;
  }

  function createEmptyStore(){
    return { version:1, profiles:{} };
  }

  function ensureProfileSlots(store, profileId){
    const next = store && typeof store === 'object' ? clone(store) : createEmptyStore();
    if(!next.profiles || typeof next.profiles !== 'object') next.profiles = {};
    if(!next.profiles[profileId]) next.profiles[profileId] = { slots:Array(SLOT_COUNT).fill(null) };
    if(!Array.isArray(next.profiles[profileId].slots)) next.profiles[profileId].slots = Array(SLOT_COUNT).fill(null);
    while(next.profiles[profileId].slots.length < SLOT_COUNT) next.profiles[profileId].slots.push(null);
    next.profiles[profileId].slots = next.profiles[profileId].slots.slice(0, SLOT_COUNT);
    return next;
  }

  function listCareerSlots(store, profileId){
    const next = ensureProfileSlots(store, profileId || 'default');
    return next.profiles[profileId || 'default'].slots.map((career, index) => {
      if(!career) return { slotIndex:index + 1, empty:true };
      const standings = getTourLeaderboard(career);
      const user = standings.find(row => row.isUser);
      return {
        slotIndex:index + 1,
        empty:false,
        playerName:career.playerName,
        difficulty:career.difficulty,
        careerType:career.careerType || 'long',
        season:career.currentSeason.number,
        status:career.currentSeason.status,
        currentEventIndex:career.currentSeason.currentEventIndex,
        eventsCompleted:career.currentSeason.eventsCompleted,
        position:user ? user.position : null,
        positionLabel:user ? user.positionLabel : '-',
        points:user ? user.points : 0
      };
    });
  }

  function saveCareerSlot(store, profileId, slotIndex, career){
    const next = ensureProfileSlots(store, profileId || 'default');
    next.profiles[profileId || 'default'].slots[normalizeSlotIndex(slotIndex) - 1] = clone(career);
    return next;
  }

  function loadCareerSlot(store, profileId, slotIndex){
    const next = ensureProfileSlots(store, profileId || 'default');
    const career = next.profiles[profileId || 'default'].slots[normalizeSlotIndex(slotIndex) - 1];
    return career ? clone(career) : null;
  }

  function deleteCareerSlot(store, profileId, slotIndex){
    const next = ensureProfileSlots(store, profileId || 'default');
    next.profiles[profileId || 'default'].slots[normalizeSlotIndex(slotIndex) - 1] = null;
    return next;
  }

  function seededRandom(seed){
    let s = (Number(seed) >>> 0) || 1;
    return function(){
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function hashString(value){
    const str = String(value || '');
    let hash = 2166136261;
    for(let i = 0; i < str.length; i++){
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function formatDiff(total, par){
    const diff = total - par;
    if(diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : String(diff);
  }

  function positionLabel(position){
    return position ? `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}` : '-';
  }

  function scoreBucketTemplate(){
    return { aces:0, eaglesPlus:0, birdies:0, pars:0, bogeys:0, doublePlus:0 };
  }

  function cloneScoreBuckets(source){
    const out = scoreBucketTemplate();
    Object.keys(out).forEach(key => {
      out[key] = Number(source && source[key]) || 0;
    });
    return out;
  }

  function addScoreBucket(target, score, par){
    const buckets = target.scoreBuckets || (target.scoreBuckets = scoreBucketTemplate());
    const diff = score - par;
    if(score === 1) buckets.aces += 1;
    else if(diff <= -2) buckets.eaglesPlus += 1;
    else if(diff === -1) buckets.birdies += 1;
    else if(diff === 0) buckets.pars += 1;
    else if(diff === 1) buckets.bogeys += 1;
    else buckets.doublePlus += 1;
  }

  function normalizeCareerType(value){
    const key = String(value || 'long').toLowerCase();
    return CAREER_TYPES[key] || CAREER_TYPES.long;
  }

  function createField(playerName, difficulty, seed){
    const field = [{
      id:USER_ID,
      name:String(playerName || 'PLAYER').trim().toUpperCase().slice(0, 12) || 'PLAYER',
      isUser:true,
      seedOrder:0,
      points:0,
      allTimePoints:0
    }];
    const random = seededRandom(seed);
    CPU_NAMES.forEach((name, index) => {
      const skill = Math.round(((random() * 2 - 1) * 1.1) * 100) / 100;
      const consistency = Math.round(((random() * 2 - 1) * 0.9) * 100) / 100;
      const pressure = Math.round(((random() * 2 - 1) * 0.9) * 100) / 100;
      const courseFit = {};
      COURSES.forEach(course => {
        courseFit[course.id] = Math.round(((random() * 2 - 1) * 1.2) * 100) / 100;
      });
      field.push({
        id:`cpu-${index + 1}`,
        name,
        isUser:false,
        seedOrder:index + 1,
        skill,
        consistency,
        pressure,
        courseFit,
        points:0,
        allTimePoints:0
      });
    });
    return field.map(player => ({ ...player, difficulty }));
  }

  function createSeason(number, field){
    return {
      number:number || 1,
      status:'active',
      seasonIntroSeen:false,
      currentEventIndex:0,
      eventsCompleted:0,
      points:Object.fromEntries(field.map(player => [player.id, 0])),
      results:[]
    };
  }

  function createAllTime(){
    return {
      seasonsCompleted:0,
      eventsPlayed:0,
      wins:0,
      cutsMade:0,
      cutsMissed:0,
      pointsEarned:0,
      bestFinish:null,
      seasonTitles:0,
      wildcardsUsed:0,
      wildcardsDiscarded:0,
      scoreBuckets:scoreBucketTemplate()
    };
  }

  function createCareer(options){
    const seed = Number(options && options.seed) || Date.now();
    const difficulty = clamp(Number(options && options.difficulty) || 2, 1, 3);
    const playerName = String(options && options.playerName || 'PLAYER').trim().toUpperCase().slice(0, 12) || 'PLAYER';
    const careerType = normalizeCareerType(options && options.careerType);
    const field = createField(playerName, difficulty, seed);
    return {
      version:1,
      slotId:normalizeSlotIndex(options && options.slotId),
      playerName,
      difficulty,
      careerType:careerType.key,
      roundsPerEvent:careerType.roundsPerEvent,
      cutAfterRound:careerType.cutAfterRound,
      seed,
      field,
      currentSeason:createSeason(1, field),
      activeEvent:null,
      pastEvent:null,
      allTime:createAllTime(),
      trophies:{ eventWins:[], seasonTitles:[] },
      finaleSeenSeason:null
    };
  }

  function currentCourse(career){
    return COURSES[clamp(career.currentSeason.currentEventIndex || 0, 0, COURSES.length - 1)];
  }

  function makeEvent(career){
    const course = currentCourse(career);
    return {
      id:`s${career.currentSeason.number}-e${career.currentSeason.currentEventIndex + 1}`,
      seasonNumber:career.currentSeason.number,
      eventIndex:career.currentSeason.currentEventIndex,
      courseId:course.id,
      courseName:course.name,
      par:course.par,
      status:'in_progress',
      currentRound:1,
      roundsPerEvent:career.roundsPerEvent || CAREER_TYPES.long.roundsPerEvent,
      cutAfterRound:career.cutAfterRound || CAREER_TYPES.long.cutAfterRound,
      userRounds:[],
      rounds:Object.fromEntries(career.field.map(player => [player.id, []])),
      cutPlayerIds:null,
      userMadeCut:null,
      finalStandings:null
    };
  }

  function startCurrentEvent(career){
    const next = clone(career);
    if(next.currentSeason.status === 'complete') return next;
    if(next.activeEvent && next.activeEvent.status === 'in_progress') return next;
    next.activeEvent = makeEvent(next);
    return next;
  }

  function saveActiveRound(career, context, gameSave){
    const next = clone(career);
    next.activeRoundSave = {
      context:clone(context || {}),
      gameSave:clone(gameSave || {}),
      savedAt:Date.now()
    };
    return next;
  }

  function clearActiveRoundSave(career){
    const next = clone(career);
    next.activeRoundSave = null;
    return next;
  }

  function getActiveRoundSave(career){
    if(!career || !career.activeRoundSave || typeof career.activeRoundSave !== 'object') return null;
    if(!career.activeRoundSave.context || !career.activeRoundSave.gameSave) return null;
    return clone(career.activeRoundSave);
  }

  function cpuRoundScore(career, player, event, roundNumber){
    const courseFit = player.courseFit && player.courseFit[event.courseId] ? player.courseFit[event.courseId] : 0;
    const seed = hashString(`${career.seed}:${event.seasonNumber}:${event.eventIndex}:${roundNumber}:${player.id}`);
    const random = seededRandom(seed);
    const noise = (random() + random() + random() + random() - 2) * 4.2;
    const difficultyPush = (career.difficulty - 2) * 1.2;
    const pressurePush = roundNumber > (event.cutAfterRound || 2) ? -(player.pressure || 0) * 0.8 : 0;
    const raw = event.par + difficultyPush + noise - ((player.skill || 0) * 2.4) - (courseFit * 1.2) + pressurePush;
    return clamp(Math.round(raw), event.par - 8, event.par + 14);
  }

  function roundCountForPlayer(event, playerId){
    const rounds = event.rounds[playerId] || [];
    return rounds.filter(score => typeof score === 'number').length;
  }

  function eventRows(career, event, throughRound){
    const maxRounds = event.roundsPerEvent || career.roundsPerEvent || 4;
    const roundLimit = clamp(Number(throughRound) || maxRounds, 1, maxRounds);
    return career.field.map(player => {
      const rounds = (event.rounds[player.id] || []).slice(0, roundLimit);
      const total = rounds.reduce((sum, score) => sum + (typeof score === 'number' ? score : 0), 0);
      const played = rounds.filter(score => typeof score === 'number').length;
      return {
        playerId:player.id,
        name:player.name,
        isUser:!!player.isUser,
        total,
        par:event.par * played,
        diff:total - (event.par * played),
        rounds,
        seedOrder:player.seedOrder,
        madeCut:event.cutPlayerIds ? event.cutPlayerIds.includes(player.id) : null
      };
    });
  }

  function sortStandings(rows){
    return rows.slice().sort((a, b) => {
      if(a.total !== b.total) return a.total - b.total;
      return (a.seedOrder || 0) - (b.seedOrder || 0);
    }).map((row, index) => ({ ...row, position:index + 1 }));
  }

  function applyStrictCut(standings, cutSize){
    const sorted = sortStandings(standings);
    const madeCut = sorted.slice(0, cutSize || CUT_SIZE).map(row => ({ ...row, madeCut:true }));
    const missedCut = sorted.slice(cutSize || CUT_SIZE).map(row => ({ ...row, madeCut:false }));
    return { madeCut, missedCut, cutIds:madeCut.map(row => row.playerId) };
  }

  function assignTourPoints(standings){
    return sortStandings(standings).map((row, index) => ({
      ...row,
      position:index + 1,
      points:index < POINTS_TABLE.length ? POINTS_TABLE[index] : 0
    }));
  }

  function simulateCpuRoundForEligible(career, event, roundNumber){
    career.field.forEach(player => {
      if(player.isUser) return;
      if(event.cutPlayerIds && !event.cutPlayerIds.includes(player.id)) return;
      const rounds = event.rounds[player.id] || [];
      if(typeof rounds[roundNumber - 1] === 'number') return;
      rounds[roundNumber - 1] = cpuRoundScore(career, player, event, roundNumber);
      event.rounds[player.id] = rounds;
    });
  }

  function submitCpuRoundScoresForEligible(career, event, roundNumber, cpuScores){
    const scores = cpuScores && typeof cpuScores === 'object' ? cpuScores : null;
    career.field.forEach(player => {
      if(player.isUser) return;
      if(event.cutPlayerIds && !event.cutPlayerIds.includes(player.id)) return;
      const rounds = event.rounds[player.id] || [];
      if(typeof rounds[roundNumber - 1] === 'number') return;
      const submitted = scores ? Number(scores[player.id]) : NaN;
      rounds[roundNumber - 1] = Number.isFinite(submitted)
        ? clamp(Math.round(submitted), event.par - 18, event.par + 36)
        : cpuRoundScore(career, player, event, roundNumber);
      event.rounds[player.id] = rounds;
    });
  }

  function finalizeEvent(career, event){
    const roundsPerEvent = event.roundsPerEvent || career.roundsPerEvent || 4;
    let finalRows = eventRows(career, event, roundsPerEvent);
    finalRows = finalRows.map(row => {
      const madeCut = event.cutPlayerIds ? event.cutPlayerIds.includes(row.playerId) : true;
      return { ...row, madeCut };
    });
    const finalists = finalRows.filter(row => row.madeCut);
    const missed = finalRows.filter(row => !row.madeCut);
    const finalistPoints = assignTourPoints(finalists);
    const missedWithPoints = sortStandings(missed).map(row => ({ ...row, points:0, position:null }));
    const combined = finalistPoints.concat(missedWithPoints);
    const pointsById = Object.fromEntries(combined.map(row => [row.playerId, row.points || 0]));
    const user = combined.find(row => row.isUser);
    const winner = combined.find(row => row.position === 1);
    const course = COURSES[event.eventIndex];

    event.status = 'complete';
    event.currentRound = roundsPerEvent;
    event.userMadeCut = !!(user && user.madeCut);
    event.finalStandings = combined.map(row => ({
      ...row,
      diffLabel:formatDiff(row.total, row.par || course.par * row.rounds.length),
      positionLabel:row.position ? positionLabel(row.position) : 'CUT'
    }));

    career.currentSeason.eventsCompleted += 1;
    career.currentSeason.results.push({
      eventId:event.id,
      seasonNumber:event.seasonNumber,
      courseId:event.courseId,
      courseName:event.courseName,
      winnerId:winner ? winner.playerId : null,
      winnerName:winner ? winner.name : null,
      userPosition:user ? user.position : null,
      userPositionLabel:user && user.position ? positionLabel(user.position) : 'CUT',
      userMadeCut:event.userMadeCut,
      userPoints:pointsById[USER_ID] || 0,
      userTotal:user ? user.total : null,
      userDiffLabel:user ? formatDiff(user.total, user.par) : '-',
      userRounds:clone(event.userRounds || []),
      userWildcardsUsed:(event.userRounds || []).reduce((sum, round) => sum + (Number(round.wildcardsUsed) || 0), 0),
      userWildcardsDiscarded:(event.userRounds || []).reduce((sum, round) => sum + (Number(round.wildcardsDiscarded) || 0), 0),
      finalStandings:event.finalStandings
    });

    career.field.forEach(player => {
      const eventPoints = pointsById[player.id] || 0;
      career.currentSeason.points[player.id] = (career.currentSeason.points[player.id] || 0) + eventPoints;
      player.points = career.currentSeason.points[player.id];
      player.allTimePoints = (player.allTimePoints || 0) + eventPoints;
    });

    career.allTime.eventsPlayed += user ? 1 : 0;
    career.allTime.pointsEarned += pointsById[USER_ID] || 0;
    career.allTime.wildcardsUsed = (career.allTime.wildcardsUsed || 0) + (event.userRounds || []).reduce((sum, round) => sum + (Number(round.wildcardsUsed) || 0), 0);
    career.allTime.wildcardsDiscarded = (career.allTime.wildcardsDiscarded || 0) + (event.userRounds || []).reduce((sum, round) => sum + (Number(round.wildcardsDiscarded) || 0), 0);
    career.allTime.scoreBuckets = cloneScoreBuckets(career.allTime.scoreBuckets);
    (event.userRounds || []).forEach(round => {
      addScoreBucket(career.allTime, Number(round.score) || event.par, event.par);
    });
    if(event.userMadeCut) career.allTime.cutsMade += 1;
    else career.allTime.cutsMissed += 1;
    if(user && user.position === 1){
      career.allTime.wins += 1;
      career.trophies.eventWins.push({
        seasonNumber:event.seasonNumber,
        eventIndex:event.eventIndex,
        courseId:event.courseId,
        courseName:event.courseName,
        points:pointsById[USER_ID] || 0,
        scoreLabel:formatDiff(user.total, user.par)
      });
    }
    if(user && (career.allTime.bestFinish == null || user.position < career.allTime.bestFinish)){
      career.allTime.bestFinish = user.position;
    }

    career.pastEvent = career.currentSeason.results[career.currentSeason.results.length - 1];
    if(career.currentSeason.eventsCompleted >= COURSES.length){
      completeSeason(career);
    } else {
      career.currentSeason.currentEventIndex = clamp(career.currentSeason.currentEventIndex + 1, 0, COURSES.length - 1);
    }
    career.activeEvent = null;
  }

  function completeSeason(career){
    const leaderboard = getTourLeaderboard(career);
    const champion = leaderboard[0];
    career.currentSeason.status = 'complete';
    career.currentSeason.championId = champion ? champion.playerId : null;
    career.currentSeason.championName = champion ? champion.name : null;
    career.currentSeason.userPosition = leaderboard.find(row => row.isUser)?.position || null;
    career.allTime.seasonsCompleted += 1;
    if(champion && champion.isUser){
      career.allTime.seasonTitles += 1;
      career.trophies.seasonTitles.push({
        seasonNumber:career.currentSeason.number,
        points:champion.points,
        championName:champion.name
      });
    }
  }

  function submitUserRound(career, grossScore, options){
    const next = clone(career);
    if(!next.activeEvent || next.activeEvent.status !== 'in_progress') return next;
    const event = next.activeEvent;
    const roundNumber = event.userRounds.length + 1;
    const roundsPerEvent = event.roundsPerEvent || next.roundsPerEvent || 4;
    const cutAfterRound = event.cutAfterRound || next.cutAfterRound || 2;
    if(roundNumber > roundsPerEvent) return next;
    const score = clamp(Math.round(Number(grossScore) || event.par), event.par - 18, event.par + 36);
    const wildcardsUsed = clamp(Math.round(Number(options && options.wildcardsUsed) || 0), 0, 99);
    const wildcardsDiscarded = clamp(Math.round(Number(options && options.wildcardsDiscarded) || 0), 0, 99);

    event.userRounds.push({ round:roundNumber, score, wildcardsUsed, wildcardsDiscarded });
    event.rounds[USER_ID][roundNumber - 1] = score;
    submitCpuRoundScoresForEligible(next, event, roundNumber, options && options.cpuScores);

    if(roundNumber === cutAfterRound){
      const cut = applyStrictCut(eventRows(next, event, cutAfterRound), CUT_SIZE);
      event.cutPlayerIds = cut.cutIds;
      event.userMadeCut = event.cutPlayerIds.includes(USER_ID);
      if(!event.userMadeCut){
        for(let r = cutAfterRound + 1; r <= roundsPerEvent; r++){
          simulateCpuRoundForEligible(next, event, r);
        }
        finalizeEvent(next, event);
        return next;
      }
      event.currentRound = Math.min(roundsPerEvent, roundNumber + 1);
      return next;
    }

    if(roundNumber >= roundsPerEvent){
      finalizeEvent(next, event);
      return next;
    }

    event.currentRound = roundNumber + 1;
    return next;
  }

  function advanceAfterCompletedEvent(career){
    const next = clone(career);
    if(!next.activeEvent || next.activeEvent.status !== 'complete') return next;
    if(next.currentSeason.status === 'complete') return next;
    next.currentSeason.currentEventIndex = clamp(next.currentSeason.currentEventIndex + 1, 0, COURSES.length - 1);
    next.activeEvent = null;
    return next;
  }

  function startNextSeason(career){
    const next = clone(career);
    if(next.currentSeason.status !== 'complete') return next;
    next.field.forEach(player => {
      player.points = 0;
    });
    next.currentSeason = createSeason((next.currentSeason.number || 1) + 1, next.field);
    next.activeEvent = null;
    next.pastEvent = null;
    next.finaleSeenSeason = null;
    return next;
  }

  function getSeasonIntro(career){
    if(!career || !career.currentSeason || career.currentSeason.status === 'complete'){
      return { shouldShow:false, courses:[] };
    }
    return {
      shouldShow:!career.currentSeason.seasonIntroSeen
        && !career.activeEvent
        && (career.currentSeason.eventsCompleted || 0) === 0,
      seasonNumber:career.currentSeason.number,
      courses:COURSES.map(course => ({
        id:course.id,
        name:course.shortName || course.name,
        fullName:course.name,
        emoji:course.emoji
      }))
    };
  }

  function markSeasonIntroSeen(career){
    const next = clone(career);
    if(next.currentSeason) next.currentSeason.seasonIntroSeen = true;
    return next;
  }

  function getGroupedEventWins(career){
    const wins = career && career.trophies && Array.isArray(career.trophies.eventWins)
      ? career.trophies.eventWins
      : [];
    const currentResults = career && career.currentSeason && Array.isArray(career.currentSeason.results)
      ? career.currentSeason.results
      : [];
    const groups = new Map();
    wins.forEach(win => {
      const course = COURSES.find(item => item.id === win.courseId || item.name === win.courseName) || {};
      const key = win.courseId || course.id || win.courseName || 'unknown';
      if(!groups.has(key)){
        groups.set(key, {
          courseId:key,
          courseName:win.courseName || course.name || 'Event Win',
          eventIndex:Number.isFinite(Number(win.eventIndex)) ? Number(win.eventIndex) : (COURSES.findIndex(item => item.id === key)),
          count:0,
          rows:[]
        });
      }
      const group = groups.get(key);
      const seasonNumber = Number(win.seasonNumber) || 1;
      const fallback = currentResults.find(result => {
        const sameSeason = Number(result.seasonNumber) === seasonNumber || (!result.seasonNumber && career.currentSeason.number === seasonNumber);
        return sameSeason && (result.courseId === win.courseId || result.courseName === win.courseName);
      });
      group.count += 1;
      group.rows.push({
        seasonNumber,
        scoreLabel:win.scoreLabel || (fallback && fallback.userDiffLabel) || '-'
      });
    });
    return Array.from(groups.values())
      .map(group => ({
        ...group,
        rows:group.rows.sort((a, b) => a.seasonNumber - b.seasonNumber)
      }))
      .sort((a, b) => {
        const ai = a.eventIndex == null || a.eventIndex < 0 ? 999 : a.eventIndex;
        const bi = b.eventIndex == null || b.eventIndex < 0 ? 999 : b.eventIndex;
        if(ai !== bi) return ai - bi;
        return String(a.courseName).localeCompare(String(b.courseName));
      });
  }

  function getTourLeaderboard(career){
    const points = career.currentSeason && career.currentSeason.points ? career.currentSeason.points : {};
    return career.field.map(player => ({
      playerId:player.id,
      name:player.name,
      isUser:!!player.isUser,
      points:points[player.id] || 0,
      seedOrder:player.seedOrder
    })).sort((a, b) => {
      if(b.points !== a.points) return b.points - a.points;
      return (a.seedOrder || 0) - (b.seedOrder || 0);
    }).map((row, index) => ({ ...row, position:index + 1, positionLabel:positionLabel(index + 1) }));
  }

  function getCurrentSeasonStats(career){
    const results = career.currentSeason.results || [];
    const userResults = results.filter(result => typeof result.userPoints === 'number');
    const scoreBuckets = scoreBucketTemplate();
    let wildcardsUsed = 0;
    let wildcardsDiscarded = 0;
    userResults.forEach(result => {
      wildcardsUsed += Number(result.userWildcardsUsed) || 0;
      wildcardsDiscarded += Number(result.userWildcardsDiscarded) || 0;
      (result.userRounds || []).forEach(round => {
        addScoreBucket({ scoreBuckets }, Number(round.score) || 72, 72);
      });
    });
    const bestFinish = userResults.reduce((best, result) => {
      if(!result.userPosition) return best;
      return best == null ? result.userPosition : Math.min(best, result.userPosition);
    }, null);
    return {
      eventsPlayed:userResults.length,
      wins:userResults.filter(result => result.userPosition === 1).length,
      cutsMade:userResults.filter(result => result.userMadeCut).length,
      cutsMissed:userResults.filter(result => !result.userMadeCut).length,
      pointsEarned:userResults.reduce((sum, result) => sum + (result.userPoints || 0), 0),
      bestFinish,
      bestFinishLabel:bestFinish ? positionLabel(bestFinish) : '-',
      wildcardsUsed,
      wildcardsDiscarded,
      scoreBuckets
    };
  }

  function getCareerStats(career){
    const allTime = career.allTime || createAllTime();
    return {
      thisSeason:getCurrentSeasonStats(career),
      allTime:{
        eventsPlayed:allTime.eventsPlayed || 0,
        wins:allTime.wins || 0,
        cutsMade:allTime.cutsMade || 0,
        cutsMissed:allTime.cutsMissed || 0,
        pointsEarned:allTime.pointsEarned || 0,
        bestFinish:allTime.bestFinish || null,
        bestFinishLabel:allTime.bestFinish ? positionLabel(allTime.bestFinish) : '-',
        wildcardsUsed:allTime.wildcardsUsed || 0,
        wildcardsDiscarded:allTime.wildcardsDiscarded || 0,
        scoreBuckets:cloneScoreBuckets(allTime.scoreBuckets)
      }
    };
  }

  function getDashboard(career){
    const leaderboard = getTourLeaderboard(career);
    const user = leaderboard.find(row => row.isUser);
    const activeEvent = career.activeEvent && career.activeEvent.status !== 'complete' ? career.activeEvent : null;
    const nextEventIndex = career.currentSeason.currentEventIndex;
    const nextCourse = career.currentSeason.status === 'complete' ? null : COURSES[nextEventIndex];
    const visibleLeader = leaderboard[0] && !leaderboard[0].isUser ? leaderboard[0] : null;
    return {
      playerName:career.playerName,
      seasonNumber:career.currentSeason.number,
      seasonStatus:career.currentSeason.status,
      pastEvent:career.pastEvent,
      nextEvent:activeEvent ? {
        courseName:activeEvent.courseName,
        label:`Round ${activeEvent.currentRound} of ${activeEvent.roundsPerEvent || career.roundsPerEvent || 4}`,
        inProgress:true
      } : nextCourse ? {
        courseName:nextCourse.name,
        label:`Event ${nextEventIndex + 1} of ${COURSES.length}`,
        inProgress:false
      } : null,
      actionLabel:career.currentSeason.status === 'complete'
        ? 'START NEXT SEASON'
        : activeEvent ? 'CONTINUE' : 'NEXT EVENT',
      userStanding:user || null,
      leader:leaderboard[0] || null,
      visibleLeader
    };
  }

  function getPastEventResults(career){
    if(!career || !career.pastEvent) return null;
    const event = clone(career.pastEvent);
    const course = COURSES.find(item => item.id === event.courseId);
    event.emoji = course ? course.emoji : '';
    return event;
  }

  function getCurrentEventResults(career){
    if(!career || !career.activeEvent || career.activeEvent.status !== 'in_progress') return null;
    const event = career.activeEvent;
    const userRounds = Array.isArray(event.userRounds) ? event.userRounds : [];
    const throughRound = userRounds.filter(round => typeof round.score === 'number').length;
    if(throughRound <= 0) return null;
    const rows = eventRows(career, event, throughRound);
    let standings;
    if(event.cutPlayerIds && Array.isArray(event.cutPlayerIds)){
      const finalists = rows.filter(row => event.cutPlayerIds.includes(row.playerId)).map(row => ({ ...row, madeCut:true }));
      const missed = rows.filter(row => !event.cutPlayerIds.includes(row.playerId)).map(row => ({ ...row, madeCut:false }));
      standings = assignTourPoints(finalists).concat(
        sortStandings(missed).map(row => ({ ...row, points:0, position:null }))
      );
    } else {
      standings = assignTourPoints(rows).map(row => ({ ...row, madeCut:true }));
    }
    const mapped = standings.map(row => ({
      ...row,
      diffLabel:row.total > 0 ? formatDiff(row.total, row.par || event.par * row.rounds.length) : '-',
      positionLabel:row.position ? positionLabel(row.position) : 'CUT',
      points:row.points || 0
    }));
    const user = mapped.find(row => row.isUser);
    const course = COURSES.find(item => item.id === event.courseId);
    return {
      eventId:event.id,
      courseId:event.courseId,
      courseName:event.courseName,
      emoji:course ? course.emoji : '',
      throughRound,
      roundLabel:`Through Round ${throughRound}`,
      userPositionLabel:user ? user.positionLabel : '-',
      userDiffLabel:user ? user.diffLabel : '-',
      userPoints:user ? user.points || 0 : 0,
      finalStandings:mapped
    };
  }

  function getSeasonFinale(career){
    if(!career || !career.currentSeason || career.currentSeason.status !== 'complete') {
      return { shouldShow:false, podium:[] };
    }
    const leaderboard = getTourLeaderboard(career);
    const user = leaderboard.find(row => row.isUser);
    const userPosition = user ? user.position : null;
    const seasonNumber = career.currentSeason.number;
    const alreadySeen = Number(career.finaleSeenSeason) === Number(seasonNumber);
    const podium = leaderboard.slice(0, 3);
    return {
      shouldShow:!!(userPosition && userPosition <= 3 && !alreadySeen),
      seasonNumber,
      userPosition,
      user,
      champion:leaderboard[0] || null,
      podium
    };
  }

  function markSeasonFinaleSeen(career){
    const next = clone(career);
    if(next.currentSeason && next.currentSeason.status === 'complete'){
      next.finaleSeenSeason = next.currentSeason.number;
    }
    return next;
  }

  return {
    COURSES,
    CAREER_TYPES,
    POINTS_TABLE,
    SLOT_COUNT,
    CUT_SIZE,
    FIELD_SIZE,
    USER_ID,
    createEmptyStore,
    listCareerSlots,
    saveCareerSlot,
    loadCareerSlot,
    deleteCareerSlot,
    createCareer,
    startCurrentEvent,
    saveActiveRound,
    clearActiveRoundSave,
    getActiveRoundSave,
    submitUserRound,
    advanceAfterCompletedEvent,
    startNextSeason,
    applyStrictCut,
    assignTourPoints,
    getTourLeaderboard,
    getCareerStats,
    getDashboard,
    getPastEventResults,
    getCurrentEventResults,
    getSeasonFinale,
    markSeasonFinaleSeen,
    getSeasonIntro,
    markSeasonIntroSeen,
    getGroupedEventWins,
    formatDiff,
    positionLabel
  };
});
