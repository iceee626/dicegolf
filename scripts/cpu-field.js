// VS CPU background field generation, scoring, progression, and leaderboard rows

const CPU_FIELD_SIZE = 9;
const CPU_SURNAMES = [
  'STONE','GRANT','VALE','BROOKS','REED','COLE','HART','FOX','PARK','BELL',
  'WEST','HALE','PRICE','BLAKE','KNIGHT','ROSS','BANKS','LANE','WOLFE','CHASE',
  'BURNS','FROST','CLARK','HAYES','MILLS','RHODES','SHAW','PIERCE','FORD','ELLIS'
];

function seededRandom(seed){
  let s = Number(seed) || 1;
  s = (s >>> 0) || 1;
  return function(){
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function cpuClamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

function cpuClone(value){
  return JSON.parse(JSON.stringify(value));
}

function cpuActiveHoleIndexes(startIdx, endIdx){
  const out = [];
  for(let i = startIdx; i <= endIdx; i++) out.push(i);
  return out;
}

function cpuTotalPar(holes, startIdx, endIdx){
  return cpuActiveHoleIndexes(startIdx, endIdx).reduce((sum, idx) => sum + ((holes[idx] && holes[idx].par) || 4), 0);
}

function cpuRoundScoresTotal(scores, holes, startIdx, endIdx){
  let total = 0;
  let par = 0;
  let thru = 0;
  for(let i = startIdx; i <= endIdx; i++){
    const score = scores && scores[i];
    if(score == null) continue;
    total += score;
    par += (holes[i] && holes[i].par) || 4;
    thru++;
  }
  return { total, par, diff: total - par, thru };
}

function cpuPlayerCumulative(playerScores, holes, startIdx, endIdx, currentRound){
  let total = 0;
  let par = 0;
  let currentThru = 0;
  const rounds = Math.max(1, currentRound || 1);
  for(let r = 0; r < rounds; r++){
    const scores = (playerScores && playerScores[r]) || [];
    const round = cpuRoundScoresTotal(scores, holes, startIdx, endIdx);
    total += round.total;
    par += round.par;
    if(r === rounds - 1) currentThru = round.thru;
  }
  return { total, par, diff: total - par, thru: currentThru };
}

function cpuOpponentCumulative(opp, holes, startIdx, endIdx, currentRound){
  let total = 0;
  let par = 0;
  let currentThru = 0;
  const rounds = Math.max(1, currentRound || 1);
  for(let r = 0; r < rounds; r++){
    const roundState = opp.rounds && opp.rounds[r];
    const round = cpuRoundScoresTotal(roundState ? roundState.scores : [], holes, startIdx, endIdx);
    total += round.total;
    par += round.par;
    if(r === rounds - 1) currentThru = roundState ? (roundState.thru || round.thru) : round.thru;
  }
  return { total, par, diff: total - par, thru: currentThru };
}

function cpuFormatDiff(diff){
  if(diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function cpuFormatTeeTime(date, offsetMinutes){
  const base = date instanceof Date ? date : new Date(date || Date.now());
  const minuteOffset = Math.abs(Math.round(offsetMinutes || 0)) % 60;
  let minutes = minuteOffset === 0 ? 8 : minuteOffset;
  if(minutes === 0) minutes = 8;
  const h = String(base.getHours());
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m}`;
}

function cpuPickSurnames(random, count){
  const pool = CPU_SURNAMES.slice();
  const out = [];
  while(out.length < count && pool.length){
    const idx = Math.floor(random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function cpuMakeTraits(random, courseId){
  const trait = () => Math.round((random() * 2 - 1) * 100) / 100;
  const fit = {};
  ['little-pines','pacific-beach','gator-creek','septembra-national'].forEach(id => {
    fit[id] = Math.round((random() * 2 - 1) * 100) / 100;
  });
  if(courseId && fit[courseId] != null){
    fit[courseId] = cpuClamp(fit[courseId] + (random() - 0.5) * 0.55, -1, 1);
  }
  return {
    par3Skill: trait(),
    par5Skill: trait(),
    putting: trait(),
    recovery: trait(),
    consistency: trait(),
    courseFit: fit,
    pressure: trait()
  };
}

function cpuMakeRoundState(roundIdx, order, teeTime, paceOffset){
  return {
    roundIdx,
    scores: Array(18).fill(null),
    thru: 0,
    complete: false,
    order,
    teeTime,
    paceOffset
  };
}

function createCpuField(options){
  const holes = options.holes || [];
  const startIdx = options.startIdx == null ? 0 : options.startIdx;
  const endIdx = options.endIdx == null ? 17 : options.endIdx;
  const totalRounds = Math.max(1, options.totalRounds || 1);
  const seed = options.seed || Date.now();
  const random = seededRandom(seed);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const surnames = cpuPickSurnames(random, CPU_FIELD_SIZE);
  const pacePattern = [-1, 0, 1, 2, -1, 1, 3, 0, -2];
  const opponents = surnames.map((name, idx) => {
    const teeOffset = 8 + idx * 9 + Math.floor(random() * 5);
    const rounds = [];
    for(let r = 0; r < totalRounds; r++){
      rounds.push(cpuMakeRoundState(
        r,
        idx,
        cpuFormatTeeTime(now, teeOffset + r * 18),
        pacePattern[idx % pacePattern.length]
      ));
    }
    return {
      id: `cpu${idx + 1}`,
      name,
      traits: cpuMakeTraits(random, options.courseId),
      rounds
    };
  });
  return {
    version: 1,
    seed,
    courseId: options.courseId || 'little-pines',
    startIdx,
    endIdx,
    totalRounds,
    gameDiff: Math.max(1, Math.min(3, options.gameDiff || 1)),
    pairedOpponentId: opponents[0] ? opponents[0].id : null,
    opponents
  };
}

function cpuNormalizeWeights(weights){
  const sum = weights.reduce((a, b) => a + Math.max(0, b), 0);
  if(sum <= 0) return weights.map(() => 1 / weights.length);
  return weights.map(w => Math.max(0, w) / sum);
}

function cpuShiftWeights(weights, amount){
  const next = weights.slice();
  const good = [0, 1, 2];
  const bad = [3, 4, 5];
  const step = Math.abs(amount);
  if(amount > 0){
    for(const from of good){
      const move = Math.min(next[from] * 0.45, step / good.length);
      next[from] -= move;
      next[Math.min(5, from + 2)] += move;
    }
  } else if(amount < 0){
    for(const from of bad){
      const move = Math.min(next[from] * 0.45, step / bad.length);
      next[from] -= move;
      next[Math.max(0, from - 2)] += move;
    }
  }
  return cpuNormalizeWeights(next);
}

function cpuApplyRecovery(weights, recovery){
  const next = weights.slice();
  const amount = cpuClamp(recovery, -1, 1) * 0.035;
  if(amount > 0){
    const move = Math.min(next[4] + next[5], amount);
    next[4] -= Math.min(next[4], move * 0.65);
    next[5] -= Math.min(next[5], move * 0.35);
    next[3] += move * 0.7;
    next[2] += move * 0.3;
  } else if(amount < 0){
    const move = Math.min(next[2] + next[3], Math.abs(amount));
    next[2] -= Math.min(next[2], move * 0.45);
    next[3] -= Math.min(next[3], move * 0.55);
    next[4] += move * 0.75;
    next[5] += move * 0.25;
  }
  return cpuNormalizeWeights(next);
}

function cpuApplyConsistency(weights, consistency){
  const next = weights.slice();
  const amount = cpuClamp(consistency, -1, 1) * 0.045;
  if(amount > 0){
    const move = Math.min(next[0] + next[5], amount);
    next[0] -= Math.min(next[0], move * 0.45);
    next[5] -= Math.min(next[5], move * 0.55);
    next[2] += move * 0.45;
    next[3] += move * 0.55;
  } else if(amount < 0){
    const move = Math.min(next[2] + next[3], Math.abs(amount));
    next[2] -= Math.min(next[2], move * 0.5);
    next[3] -= Math.min(next[3], move * 0.5);
    next[0] += move * 0.35;
    next[5] += move * 0.65;
  }
  return cpuNormalizeWeights(next);
}

function cpuScoreHole(options){
  const hole = options.hole || { par:4, baseDiff:2 };
  const gameDiff = Math.max(1, Math.min(3, options.gameDiff || 1));
  const traits = options.traits || {};
  const random = options.random || Math.random;
  const deltas = [-2, -1, 0, 1, 2, 3];
  let weights = {
    1: [0.04, 0.27, 0.43, 0.20, 0.05, 0.01],
    2: [0.01, 0.16, 0.43, 0.30, 0.08, 0.02],
    3: [0.005, 0.08, 0.35, 0.39, 0.13, 0.045]
  }[gameDiff].slice();
  if(hole.par <= 3) weights[0] *= 0.25;
  if(hole.par >= 5) weights[0] *= 1.7;
  weights = cpuNormalizeWeights(weights);

  const baseDiffShift = ((hole.baseDiff || 2) - 2) * 0.07;
  weights = cpuShiftWeights(weights, baseDiffShift);

  let skillShift = 0;
  if(hole.par === 3) skillShift -= (traits.par3Skill || 0) * 0.03;
  if(hole.par === 5) skillShift -= (traits.par5Skill || 0) * 0.035;
  skillShift -= (traits.putting || 0) * 0.025;
  const fit = traits.courseFit && options.courseId ? (traits.courseFit[options.courseId] || 0) : 0;
  skillShift -= fit * 0.025;
  skillShift -= (traits.pressure || 0) * (options.pressureWeight || 0);
  weights = cpuShiftWeights(weights, skillShift);
  weights = cpuApplyRecovery(weights, traits.recovery || 0);
  weights = cpuApplyConsistency(weights, traits.consistency || 0);
  weights = cpuShiftWeights(weights, options.compression || 0);

  let roll = random();
  for(let i = 0; i < weights.length; i++){
    roll -= weights[i];
    if(roll <= 0) return Math.max(1, hole.par + deltas[i]);
  }
  return Math.max(1, hole.par + deltas[deltas.length - 1]);
}

function cpuBuildScoresContext(field, holes, playerScores, roundIdx){
  const currentRound = roundIdx + 1;
  const player = cpuPlayerCumulative(playerScores, holes, field.startIdx, field.endIdx, currentRound);
  const rows = field.opponents.map(opp => ({
    opp,
    score: cpuOpponentCumulative(opp, holes, field.startIdx, field.endIdx, currentRound)
  }));
  rows.sort((a, b) => a.score.diff - b.score.diff || b.score.thru - a.score.thru || a.opp.name.localeCompare(b.opp.name));
  return { player, rows };
}

function cpuCompressionForOpponent(field, opp, context, holeProgress){
  const playerDiff = context.player.diff;
  const leaderDiff = context.rows.length ? context.rows[0].score.diff : playerDiff;
  const playerLead = leaderDiff - playerDiff;
  const playerBehind = playerDiff - leaderDiff;
  const progressFactor = holeProgress < 0.75 ? (1 - holeProgress) : 0.12;
  const rank = context.rows.findIndex(row => row.opp.id === opp.id);
  if(playerBehind >= 5 && rank >= 0 && rank < 3){
    return 0.08 * progressFactor;
  }
  if(playerLead >= 4 && rank >= 0 && rank < 5){
    return -0.07 * progressFactor;
  }
  return 0;
}

function cpuFieldLeaderGap(field, options){
  const holes = options.holes || [];
  const roundIdx = options.roundIdx || 0;
  const context = cpuBuildScoresContext(field, holes, options.playerScores || [], roundIdx);
  if(!context.rows.length) return 0;
  return Math.max(0, context.player.diff - context.rows[0].score.diff);
}

function cpuTargetThru(field, opp, roundState, playerThru, totalHoles){
  if(opp.id === field.pairedOpponentId) return playerThru;
  const orderDrag = Math.max(0, (roundState.order || 0) - 5) > 0 ? -1 : 0;
  return cpuClamp(playerThru + (roundState.paceOffset || 0) + orderDrag, 0, totalHoles);
}

function advanceCpuFieldForPlayerHole(field, options){
  if(!field || !Array.isArray(field.opponents)) return field;
  const holes = options.holes || [];
  const roundIdx = Math.max(0, (options.currentRound || 1) - 1);
  const activeIndexes = cpuActiveHoleIndexes(field.startIdx, field.endIdx);
  const totalHoles = activeIndexes.length;
  const completedHoleIdx = options.completedHoleIdx;
  const playerThru = cpuClamp(completedHoleIdx - field.startIdx + 1, 0, totalHoles);
  const context = cpuBuildScoresContext(field, holes, options.playerScores || [], roundIdx);
  const holeProgress = totalHoles ? playerThru / totalHoles : 1;
  field.opponents.forEach(opp => {
    const roundState = opp.rounds[roundIdx];
    if(!roundState) return;
    const targetThru = cpuTargetThru(field, opp, roundState, playerThru, totalHoles);
    while(roundState.thru < targetThru){
      const absIdx = activeIndexes[roundState.thru];
      const random = seededRandom(field.seed + roundIdx * 10000 + Number(opp.id.replace('cpu','')) * 100 + absIdx);
      const compression = cpuCompressionForOpponent(field, opp, context, holeProgress);
      const latePressure = roundIdx === field.totalRounds - 1 && holeProgress > 0.72
        ? Math.max(0, (opp.traits.pressure || 0)) * 0.015
        : 0;
      roundState.scores[absIdx] = cpuScoreHole({
        hole: holes[absIdx],
        gameDiff: options.gameDiff || field.gameDiff,
        traits: opp.traits,
        courseId: options.courseId || field.courseId,
        random,
        compression,
        pressureWeight: latePressure
      });
      roundState.thru++;
    }
    roundState.complete = roundState.thru >= totalHoles;
  });
  return field;
}

function completeCpuFieldRound(field, options){
  if(!field || !Array.isArray(field.opponents)) return field;
  const holes = options.holes || [];
  const roundIdx = Math.max(0, (options.roundIdx == null ? (options.currentRound || 1) - 1 : options.roundIdx));
  const activeIndexes = cpuActiveHoleIndexes(field.startIdx, field.endIdx);
  field.opponents.forEach(opp => {
    const roundState = opp.rounds[roundIdx];
    if(!roundState) return;
    while(roundState.thru < activeIndexes.length){
      const absIdx = activeIndexes[roundState.thru];
      const random = seededRandom(field.seed + roundIdx * 10000 + Number(opp.id.replace('cpu','')) * 100 + absIdx);
      roundState.scores[absIdx] = cpuScoreHole({
        hole: holes[absIdx],
        gameDiff: options.gameDiff || field.gameDiff,
        traits: opp.traits,
        courseId: options.courseId || field.courseId,
        random
      });
      roundState.thru++;
    }
    roundState.complete = true;
  });
  return field;
}

function assignCpuRoundOrder(field, options){
  if(!field || !Array.isArray(field.opponents)) return field;
  const holes = options.holes || [];
  const roundIdx = Math.max(0, options.roundIdx || 0);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const rows = field.opponents.map(opp => ({
    opp,
    score: cpuOpponentCumulative(opp, holes, field.startIdx, field.endIdx, roundIdx)
  }));
  rows.sort((a, b) => b.score.diff - a.score.diff || a.opp.name.localeCompare(b.opp.name));
  rows.forEach((row, idx) => {
    const roundState = row.opp.rounds[roundIdx];
    if(!roundState) return;
    roundState.order = idx;
    roundState.teeTime = cpuFormatTeeTime(now, 8 + idx * 9);
    roundState.paceOffset = field.totalRounds > 1 && roundIdx === field.totalRounds - 1
      ? Math.round((4 - idx) / 2)
      : roundState.paceOffset;
  });
  return field;
}

function getCpuLeaderboardRows(field, options){
  if(!field || !Array.isArray(field.opponents)) return [];
  const holes = options.holes || [];
  const currentRound = Math.max(1, options.currentRound || 1);
  const rows = [];
  const player = cpuPlayerCumulative(options.playerScores || [], holes, field.startIdx, field.endIdx, currentRound);
  rows.push({
    id: 'player',
    name: options.playerName || 'YOU',
    isPlayer: true,
    thru: player.thru,
    thruLabel: String(player.thru),
    total: player.total,
    par: player.par,
    diff: player.diff,
    totalLabel: cpuFormatDiff(player.diff)
  });
  field.opponents.forEach(opp => {
    const score = cpuOpponentCumulative(opp, holes, field.startIdx, field.endIdx, currentRound);
    const roundState = opp.rounds[currentRound - 1] || {};
    const notStarted = score.thru === 0;
    rows.push({
      id: opp.id,
      name: opp.name,
      isPlayer: false,
      thru: score.thru,
      thruLabel: notStarted ? (roundState.teeTime || '') : String(score.thru),
      total: score.total,
      par: score.par,
      diff: score.diff,
      totalLabel: cpuFormatDiff(score.diff),
      notStarted
    });
  });
  rows.sort((a, b) => {
    if(!!a.notStarted !== !!b.notStarted) return a.notStarted ? 1 : -1;
    if(a.notStarted && b.notStarted) return String(a.thruLabel).localeCompare(String(b.thruLabel)) || a.name.localeCompare(b.name);
    return a.diff - b.diff || b.thru - a.thru || (a.isPlayer ? -1 : b.isPlayer ? 1 : a.name.localeCompare(b.name));
  });
  let lastDiff = null;
  let lastPos = 0;
  rows.forEach((row, idx) => {
    if(row.notStarted){
      row.pos = '-';
      return;
    }
    if(row.diff !== lastDiff){
      lastPos = rows.slice(0, idx).filter(r => !r.notStarted).length + 1;
      lastDiff = row.diff;
    }
    const tied = rows.some(other => other !== row && !other.notStarted && other.diff === row.diff);
    row.pos = tied ? `T${lastPos}` : String(lastPos);
  });
  return rows;
}

function snapshotCpuField(field){
  return cpuClone(field || null);
}

function restoreCpuFieldSnapshot(snapshot){
  if(!snapshot || typeof snapshot !== 'object') return null;
  return cpuClone(snapshot);
}

function cpuEscapeHtml(value){
  if(typeof escapeHtml === 'function') return escapeHtml(value);
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[ch]));
}

function renderCpuLeaderboardBlock(options){
  if(typeof document === 'undefined') return null;
  const rows = getCpuLeaderboardRows(options.field, {
    holes: options.holes,
    playerName: options.playerName || 'YOU',
    playerScores: options.playerScores || [],
    currentRound: options.currentRound || 1
  });
  const block = document.createElement('div');
  block.className = 'cpu-lb-block';
  if(options.compact) block.classList.add('compact');
  const title = document.createElement('div');
  title.className = 'sec-title cpu-lb-title';
  title.textContent = 'LEADERBOARD';
  block.appendChild(title);

  const scroll = document.createElement('div');
  scroll.className = 'cpu-lb-scroll';
  const table = document.createElement('table');
  table.className = 'cpu-lb-table';
  table.innerHTML = '<thead><tr><th>POS</th><th>PLAYER</th><th>THRU</th><th>TOTAL</th></tr></thead>';
  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    if(row.isPlayer) tr.className = 'cpu-lb-you';
    tr.innerHTML = `
      <td>${cpuEscapeHtml(row.pos)}</td>
      <td>${cpuEscapeHtml(row.name)}</td>
      <td>${cpuEscapeHtml(row.thruLabel)}</td>
      <td class="${row.diff < 0 ? 'good' : row.diff > 0 ? 'bad' : 'even'}">${cpuEscapeHtml(row.totalLabel)}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroll.appendChild(table);
  block.appendChild(scroll);

  if(!options.compact){
    setTimeout(() => {
      const playerRow = block.querySelector('.cpu-lb-you');
      if(playerRow && scroll) playerRow.scrollIntoView({ block:'nearest', inline:'nearest' });
    }, 50);
  }
  return block;
}

function renderCpuLeaderboardInto(container, options){
  if(!container || !options || !options.field) return null;
  container.querySelectorAll('.cpu-lb-block').forEach(el => el.remove());
  const block = renderCpuLeaderboardBlock(options);
  if(block) container.appendChild(block);
  return block;
}
