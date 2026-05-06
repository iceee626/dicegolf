// VS CPU background field generation, scoring, progression, and leaderboard rows

const CPU_FIELD_SIZE = 9;
const CPU_SURNAMES = [
  'RAHMIREZ','FOREST','DESHAMBO','HOLYWOOD','FALDOUGH','NICKELSON','SINGLES','BROOKS','YOONG','WONG',
  'NAKAMURA','LOWRIE','CANTWELL','KUCHARSKI','SCHEFFIELD','ROSS','NIGHT','FITZGERALD','THOMASON'
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

function cpuScoreClass(diff){
  return diff < 0 ? 'good' : diff > 0 ? 'bad' : 'even';
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

function cpuRoundGrossLabel(scores, holes, startIdx, endIdx){
  const round = cpuRoundScoresTotal(scores || [], holes || [], startIdx, endIdx);
  const totalHoles = Math.max(0, (endIdx || 0) - (startIdx || 0) + 1);
  return round.thru >= totalHoles && totalHoles > 0 ? String(round.total) : String(round.thru);
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
    paceOffset,
    targetDiff: null
  };
}

function cpuExpectedDelta(weights, deltas){
  return weights.reduce((sum, weight, idx) => sum + weight * deltas[idx], 0);
}

function cpuRoundTargetBounds(gameDiff, holeCount){
  const scale = Math.max(0.45, (holeCount || 18) / 18);
  const raw = {
    1: { center:-2.5, min:-7, max:10 },
    2: { center:1, min:-6, max:12 },
    3: { center:3.8, min:-3, max:14 }
  }[Math.max(1, Math.min(3, gameDiff || 1))];
  return {
    center: raw.center * scale,
    min: Math.round(raw.min * scale),
    max: Math.round(raw.max * scale)
  };
}

function cpuEnsureRoundTarget(field, opp, roundIdx, holes, gameDiff){
  const roundState = opp && opp.rounds ? opp.rounds[roundIdx] : null;
  if(!roundState) return 0;
  if(typeof roundState.targetDiff === 'number') return roundState.targetDiff;
  const activeCount = Math.max(1, (field.endIdx || 17) - (field.startIdx || 0) + 1);
  const bounds = cpuRoundTargetBounds(gameDiff || field.gameDiff, activeCount);
  const cpuNum = Number(String(opp.id || '').replace('cpu','')) || 1;
  const random = seededRandom((field.seed || 1) + roundIdx * 7001 + cpuNum * 331 + 91);
  const bell = (random() + random() + random() + random() - 2) * 2.8;
  const traits = opp.traits || {};
  const fit = traits.courseFit && field.courseId ? (traits.courseFit[field.courseId] || 0) : 0;
  const skill =
    ((traits.par3Skill || 0) * 0.55) +
    ((traits.par5Skill || 0) * 0.55) +
    ((traits.putting || 0) * 0.75) +
    ((traits.recovery || 0) * 0.45) +
    ((traits.consistency || 0) * 0.35) +
    (fit * 0.75) +
    ((traits.pressure || 0) * 0.25);
  const target = Math.round(cpuClamp(bounds.center + bell - skill * 0.75, bounds.min, bounds.max));
  roundState.targetDiff = target;
  return target;
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

const CPU_SCORE_WEIGHTS = {
  1: {
    par3: { deltas:[-2,-1,0,1,2,3,4], weights:[0.004,0.18,0.54,0.22,0.045,0.009,0.002] },
    par4: { deltas:[-1,0,1,2,3,4], weights:[0.24,0.50,0.20,0.045,0.012,0.003] },
    par5: { deltas:[-2,-1,0,1,2,3,4], weights:[0.035,0.30,0.43,0.17,0.045,0.015,0.005] }
  },
  2: {
    par3: { deltas:[-2,-1,0,1,2,3,4], weights:[0.002,0.12,0.52,0.28,0.06,0.014,0.004] },
    par4: { deltas:[-1,0,1,2,3,4], weights:[0.16,0.50,0.25,0.065,0.02,0.005] },
    par5: { deltas:[-2,-1,0,1,2,3,4], weights:[0.020,0.24,0.45,0.22,0.055,0.012,0.003] }
  },
  3: {
    par3: { deltas:[-2,-1,0,1,2,3,4], weights:[0.001,0.08,0.48,0.34,0.075,0.019,0.005] },
    par4: { deltas:[-1,0,1,2,3,4], weights:[0.10,0.47,0.31,0.085,0.027,0.008] },
    par5: { deltas:[-2,-1,0,1,2,3,4], weights:[0.012,0.18,0.45,0.27,0.065,0.018,0.005] }
  }
};

function cpuScoreModelForHole(hole, gameDiff){
  const par = (hole && hole.par) || 4;
  const key = par <= 3 ? 'par3' : par >= 5 ? 'par5' : 'par4';
  const model = CPU_SCORE_WEIGHTS[Math.max(1, Math.min(3, gameDiff || 1))][key];
  return {
    deltas: model.deltas.slice(),
    weights: cpuNormalizeWeights(model.weights.slice())
  };
}

function cpuNearestDeltaIndex(deltas, targetDelta, preferWorse){
  let bestIdx = 0;
  let bestDistance = Infinity;
  for(let i = 0; i < deltas.length; i++){
    const distance = Math.abs(deltas[i] - targetDelta);
    const tieBreak = distance === bestDistance
      && (preferWorse ? deltas[i] > deltas[bestIdx] : deltas[i] < deltas[bestIdx]);
    if(distance < bestDistance || tieBreak){
      bestDistance = distance;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function cpuShiftWeights(weights, deltas, amount){
  const next = weights.slice();
  if(!Array.isArray(deltas) || !deltas.length) return cpuNormalizeWeights(next);
  const step = Math.abs(amount || 0);
  if(amount > 0){
    const sources = deltas.map((delta, idx) => ({ delta, idx })).filter(row => row.delta <= 0);
    for(const { delta, idx } of sources){
      const move = Math.min(next[idx] * 0.45, step / Math.max(1, sources.length));
      const targetIdx = cpuNearestDeltaIndex(deltas, delta + 2, true);
      if(targetIdx === idx) continue;
      next[idx] -= move;
      next[targetIdx] += move;
    }
  } else if(amount < 0){
    const sources = deltas.map((delta, idx) => ({ delta, idx })).filter(row => row.delta >= 1);
    for(const { delta, idx } of sources){
      const move = Math.min(next[idx] * 0.45, step / Math.max(1, sources.length));
      const targetIdx = cpuNearestDeltaIndex(deltas, delta - 2, false);
      if(targetIdx === idx) continue;
      next[idx] -= move;
      next[targetIdx] += move;
    }
  }
  return cpuNormalizeWeights(next);
}

function cpuMoveWeightByDelta(weights, deltas, fromPredicate, targetForDelta, amount){
  const next = weights.slice();
  const sources = deltas.map((delta, idx) => ({ delta, idx })).filter(row => fromPredicate(row.delta));
  if(!sources.length || amount <= 0) return cpuNormalizeWeights(next);
  for(const { delta, idx } of sources){
    const move = Math.min(next[idx] * 0.5, amount / sources.length);
    const targetDelta = targetForDelta(delta);
    const targetIdx = cpuNearestDeltaIndex(deltas, targetDelta, targetDelta > delta);
    if(targetIdx === idx) continue;
    next[idx] -= move;
    next[targetIdx] += move;
  }
  return cpuNormalizeWeights(next);
}

function cpuApplyRecovery(weights, deltas, recovery){
  const amount = Math.abs(cpuClamp(recovery, -1, 1)) * 0.035;
  if(recovery > 0) return cpuMoveWeightByDelta(weights, deltas, delta => delta >= 2, delta => delta - 1.5, amount);
  if(recovery < 0) return cpuMoveWeightByDelta(weights, deltas, delta => delta >= 0 && delta <= 1, delta => delta + 2, amount);
  return cpuNormalizeWeights(weights);
}

function cpuApplyConsistency(weights, deltas, consistency){
  const amount = Math.abs(cpuClamp(consistency, -1, 1)) * 0.045;
  if(consistency > 0) return cpuMoveWeightByDelta(weights, deltas, delta => delta <= -1 || delta >= 3, delta => delta < 0 ? 0 : 1, amount);
  if(consistency < 0) return cpuMoveWeightByDelta(weights, deltas, delta => delta === 0 || delta === 1, delta => delta === 0 ? -1 : 3, amount);
  return cpuNormalizeWeights(weights);
}

function cpuPickWeightedDelta(weights, deltas, random){
  let roll = random();
  for(let i = 0; i < weights.length; i++){
    roll -= weights[i];
    if(roll <= 0) return deltas[i];
  }
  return deltas[deltas.length - 1];
}

function cpuCandidateDeltasByPreference(deltas, proposedDelta){
  return deltas.slice().sort((a, b) => {
    const da = Math.abs(a - proposedDelta);
    const db = Math.abs(b - proposedDelta);
    if(da !== db) return da - db;
    const aw = a > proposedDelta;
    const bw = b > proposedDelta;
    if(aw !== bw) return aw ? -1 : 1;
    return a - b;
  });
}

function cpuScoreHole(options){
  const hole = options.hole || { par:4, baseDiff:2 };
  const gameDiff = Math.max(1, Math.min(3, options.gameDiff || 1));
  const traits = options.traits || {};
  const random = options.random || Math.random;
  const par = hole.par || 4;
  const model = cpuScoreModelForHole(hole, gameDiff);
  const deltas = model.deltas;
  let weights = model.weights;

  const baseDiffShift = ((hole.baseDiff || 2) - 2) * 0.07;
  weights = cpuShiftWeights(weights, deltas, baseDiffShift);

  let skillShift = 0;
  if(par === 3) skillShift -= (traits.par3Skill || 0) * 0.03;
  if(par >= 5) skillShift -= (traits.par5Skill || 0) * 0.035;
  skillShift -= (traits.putting || 0) * 0.025;
  const fit = traits.courseFit && options.courseId ? (traits.courseFit[options.courseId] || 0) : 0;
  skillShift -= fit * 0.025;
  skillShift -= (traits.pressure || 0) * (options.pressureWeight || 0);
  weights = cpuShiftWeights(weights, deltas, skillShift);
  weights = cpuApplyRecovery(weights, deltas, traits.recovery || 0);
  weights = cpuApplyConsistency(weights, deltas, traits.consistency || 0);
  weights = cpuShiftWeights(weights, deltas, options.compression || 0);

  const target = options.targetContext;
  if(target && typeof target.targetDiff === 'number' && target.remainingHoles > 0){
    const needed = target.targetDiff - (target.currentDiff || 0);
    if(target.remainingHoles <= 1){
      const targetDelta = deltas[cpuNearestDeltaIndex(deltas, Math.round(needed), needed >= 0)];
      if(random() < 0.65) return Math.max(1, par + targetDelta);
    } else {
      const desiredDelta = needed / target.remainingHoles;
      const expectedDelta = cpuExpectedDelta(weights, deltas);
      weights = cpuShiftWeights(weights, deltas, cpuClamp((desiredDelta - expectedDelta) * 0.28, -0.24, 0.24));
    }
  }

  return Math.max(1, par + cpuPickWeightedDelta(weights, deltas, random));
}

function cpuIsFinalRound(field, roundIdx){
  return !!field && roundIdx >= Math.max(1, field.totalRounds || 1) - 1;
}

function cpuCompletedWinnerDiffs(field, holes, roundIdx, playerScores, excludeOppId){
  const totalHoles = Math.max(0, (field.endIdx == null ? 17 : field.endIdx) - (field.startIdx || 0) + 1);
  const currentRound = roundIdx + 1;
  const rows = [];
  const player = cpuPlayerCumulative(playerScores || [], holes, field.startIdx, field.endIdx, currentRound);
  if(player.thru >= totalHoles) rows.push({ id:'player', diff: player.diff });
  field.opponents.forEach(other => {
    if(!other || other.id === excludeOppId) return;
    const score = cpuOpponentCumulative(other, holes, field.startIdx, field.endIdx, currentRound);
    if(score.thru >= totalHoles) rows.push({ id:other.id, diff: score.diff });
  });
  if(!rows.length) return [];
  const best = Math.min(...rows.map(row => row.diff));
  return rows.filter(row => row.diff === best).map(row => row.diff);
}

function cpuAvoidFinalCpuWinnerTie(field, opp, roundIdx, absIdx, proposedScore, holes, playerScores){
  if(!field || !opp || !cpuIsFinalRound(field, roundIdx)) return proposedScore;
  const finalIdx = field.endIdx == null ? 17 : field.endIdx;
  if(absIdx !== finalIdx) return proposedScore;
  const totalHoles = Math.max(0, finalIdx - (field.startIdx || 0) + 1);
  const roundState = opp.rounds && opp.rounds[roundIdx];
  if(!roundState || roundState.thru !== totalHoles - 1) return proposedScore;

  const completedWinnerDiffs = cpuCompletedWinnerDiffs(field, holes, roundIdx, playerScores || [], opp.id);
  if(!completedWinnerDiffs.length) return proposedScore;

  const par = (holes[absIdx] && holes[absIdx].par) || 4;
  const currentDiff = cpuOpponentCumulative(opp, holes, field.startIdx, finalIdx, roundIdx + 1).diff;
  const proposedDelta = proposedScore - par;
  const proposedDiff = currentDiff + proposedDelta;
  const completedBest = Math.min(...completedWinnerDiffs);
  if(proposedDiff !== completedBest) return proposedScore;

  const deltas = cpuScoreModelForHole(holes[absIdx] || { par }, field.gameDiff).deltas;
  for(const delta of cpuCandidateDeltasByPreference(deltas, proposedDelta)){
    const candidateDiff = currentDiff + delta;
    const allDiffs = completedWinnerDiffs.concat(candidateDiff);
    const best = Math.min(...allDiffs);
    const winnerCount = allDiffs.filter(diff => diff === best).length;
    if(winnerCount === 1) return Math.max(1, par + delta);
  }
  return proposedScore;
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
    return 0.15 * progressFactor;
  }
  if(playerLead >= 4 && rank >= 0 && rank < 5){
    return -0.18 * progressFactor;
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

function cpuShouldHoldFinalContender(field, opp, context, roundIdx, playerThru, totalHoles){
  if(!cpuIsFinalRound(field, roundIdx) || playerThru >= totalHoles) return false;
  if(!context || !Array.isArray(context.rows)) return false;
  const rank = context.rows.findIndex(row => row.opp.id === opp.id);
  if(rank >= 0 && rank < 4) return true;
  const playerDiff = context.player ? context.player.diff : 0;
  const row = context.rows.find(item => item.opp.id === opp.id);
  return !!(row && row.score.diff <= playerDiff + 2);
}

function cpuTargetThru(field, opp, roundState, playerThru, totalHoles, context, roundIdx){
  if(opp.id === field.pairedOpponentId) return playerThru;
  const cpuNum = Number(String(opp.id || '').replace('cpu','')) || 1;
  const order = typeof roundState.order === 'number' ? roundState.order : cpuNum - 1;
  const groupSeed = Math.max(0, opp.id === field.pairedOpponentId ? 0 : Math.floor(Math.max(0, order - 1) / 2));
  const groupOffsets = [-2, -1, 1, 2];
  const offset = groupOffsets[groupSeed % groupOffsets.length];
  let targetThru = cpuClamp(playerThru + offset, 0, totalHoles);
  if(cpuShouldHoldFinalContender(field, opp, context, roundIdx, playerThru, totalHoles)){
    targetThru = Math.min(targetThru, Math.max(0, totalHoles - 1));
  }
  return targetThru;
}

function cpuHoleRandom(field, roundIdx, opp, absIdx){
  const cpuNum = Number(String(opp.id || '').replace('cpu','')) || 1;
  return seededRandom((field.seed || 1) + roundIdx * 10007 + cpuNum * 1009 + absIdx * 7919 + 173);
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
    const targetThru = cpuTargetThru(field, opp, roundState, playerThru, totalHoles, context, roundIdx);
    while(roundState.thru < targetThru){
      const absIdx = activeIndexes[roundState.thru];
      const random = cpuHoleRandom(field, roundIdx, opp, absIdx);
      const compression = cpuCompressionForOpponent(field, opp, context, holeProgress);
      let roundTargetDiff = cpuEnsureRoundTarget(field, opp, roundIdx, holes, options.gameDiff || field.gameDiff);
      if(cpuIsFinalRound(field, roundIdx) && holeProgress > 0.72){
        const currentRoundDiff = cpuRoundScoresTotal(roundState.scores, holes, field.startIdx, field.endIdx).diff;
        const currentTotalDiff = cpuOpponentCumulative(opp, holes, field.startIdx, field.endIdx, roundIdx + 1).diff;
        const projectedTotalDiff = currentTotalDiff - currentRoundDiff + roundTargetDiff;
        const completedWinnerDiffs = cpuCompletedWinnerDiffs(field, holes, roundIdx, options.playerScores || [], opp.id);
        if(completedWinnerDiffs.includes(projectedTotalDiff)) roundTargetDiff += 1;
      }
      const currentDiff = cpuRoundScoresTotal(roundState.scores, holes, field.startIdx, field.endIdx).diff;
      const latePressure = roundIdx === field.totalRounds - 1 && holeProgress > 0.72
        ? Math.max(0, (opp.traits.pressure || 0)) * 0.015
        : 0;
      let score = cpuScoreHole({
        hole: holes[absIdx],
        gameDiff: options.gameDiff || field.gameDiff,
        traits: opp.traits,
        courseId: options.courseId || field.courseId,
        random,
        compression,
        pressureWeight: latePressure,
        targetContext: {
          targetDiff: roundTargetDiff,
          currentDiff,
          remainingHoles: totalHoles - roundState.thru
        }
      });
      score = cpuAvoidFinalCpuWinnerTie(field, opp, roundIdx, absIdx, score, holes, options.playerScores || []);
      roundState.scores[absIdx] = score;
      roundState.thru++;
    }
    roundState.complete = roundState.thru >= totalHoles;
  });
  if(playerThru >= totalHoles){
    completeCpuFieldRound(field, {
      holes,
      currentRound: roundIdx + 1,
      gameDiff: options.gameDiff || field.gameDiff,
      courseId: options.courseId || field.courseId,
      playerScores: options.playerScores || []
    });
  }
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
      const random = cpuHoleRandom(field, roundIdx, opp, absIdx);
      let roundTargetDiff = cpuEnsureRoundTarget(field, opp, roundIdx, holes, options.gameDiff || field.gameDiff);
      const totalHoles = activeIndexes.length;
      const holeProgress = totalHoles ? roundState.thru / totalHoles : 1;
      if(cpuIsFinalRound(field, roundIdx) && holeProgress > 0.72){
        const currentRoundDiff = cpuRoundScoresTotal(roundState.scores, holes, field.startIdx, field.endIdx).diff;
        const currentTotalDiff = cpuOpponentCumulative(opp, holes, field.startIdx, field.endIdx, roundIdx + 1).diff;
        const projectedTotalDiff = currentTotalDiff - currentRoundDiff + roundTargetDiff;
        const completedWinnerDiffs = cpuCompletedWinnerDiffs(field, holes, roundIdx, options.playerScores || [], opp.id);
        if(completedWinnerDiffs.includes(projectedTotalDiff)) roundTargetDiff += 1;
      }
      const currentDiff = cpuRoundScoresTotal(roundState.scores, holes, field.startIdx, field.endIdx).diff;
      let score = cpuScoreHole({
        hole: holes[absIdx],
        gameDiff: options.gameDiff || field.gameDiff,
        traits: opp.traits,
        courseId: options.courseId || field.courseId,
        random,
        targetContext: {
          targetDiff: roundTargetDiff,
          currentDiff,
          remainingHoles: activeIndexes.length - roundState.thru
        }
      });
      score = cpuAvoidFinalCpuWinnerTie(field, opp, roundIdx, absIdx, score, holes, options.playerScores || []);
      roundState.scores[absIdx] = score;
      roundState.thru++;
    }
    roundState.complete = true;
  });
  resolveCpuFinalWinnerTies(field, {
    holes,
    currentRound: roundIdx + 1,
    playerScores: options.playerScores || []
  });
  return field;
}

function resolveCpuFinalWinnerTies(field, options){
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
  const totalHoles = Math.max(0, (field.endIdx || 17) - (field.startIdx || 0) + 1);
  const rows = [];
  const player = cpuPlayerCumulative(options.playerScores || [], holes, field.startIdx, field.endIdx, currentRound);
  const playerRoundScores = (options.playerScores || [])[currentRound - 1] || [];
  const playerNotStarted = player.thru === 0;
  const playerRoundComplete = totalHoles > 0 && player.thru >= totalHoles;
  rows.push({
    id: 'player',
    name: options.playerName || 'YOU',
    isPlayer: true,
    thru: player.thru,
    thruLabel: cpuRoundGrossLabel(playerRoundScores, holes, field.startIdx, field.endIdx),
    roundComplete: playerRoundComplete,
    total: player.total,
    par: player.par,
    diff: player.diff,
    totalLabel: playerNotStarted ? '-' : cpuFormatDiff(player.diff),
    totalClass: playerNotStarted ? '' : cpuScoreClass(player.diff)
  });
  field.opponents.forEach(opp => {
    const score = cpuOpponentCumulative(opp, holes, field.startIdx, field.endIdx, currentRound);
    const roundState = opp.rounds[currentRound - 1] || {};
    const notStarted = score.thru === 0;
    const roundComplete = totalHoles > 0 && score.thru >= totalHoles;
    rows.push({
      id: opp.id,
      name: opp.name,
      isPlayer: false,
      thru: score.thru,
      thruLabel: notStarted ? (roundState.teeTime || '') : cpuRoundGrossLabel(roundState.scores || [], holes, field.startIdx, field.endIdx),
      roundComplete,
      total: score.total,
      par: score.par,
      diff: score.diff,
      totalLabel: notStarted ? '-' : cpuFormatDiff(score.diff),
      totalClass: notStarted ? '' : cpuScoreClass(score.diff),
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

function cpuContainScrollBounce(scroll){
  if(!scroll || scroll._cpuBounceBound) return;
  scroll._cpuBounceBound = true;
  let startY = 0;
  scroll.addEventListener('touchstart', e => {
    if(e.touches && e.touches.length) startY = e.touches[0].clientY;
  }, { passive:true });
  scroll.addEventListener('touchmove', e => {
    if(!e.touches || !e.touches.length) return;
    const dy = e.touches[0].clientY - startY;
    const atTop = scroll.scrollTop <= 0;
    const atBottom = Math.ceil(scroll.scrollTop + scroll.clientHeight) >= scroll.scrollHeight;
    if((atTop && dy > 0) || (atBottom && dy < 0)){
      e.preventDefault();
    }
  }, { passive:false });
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
      <td class="${row.roundComplete ? 'thru-complete' : ''}">${cpuEscapeHtml(row.thruLabel)}</td>
      <td class="${row.totalClass || ''}">${cpuEscapeHtml(row.totalLabel)}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroll.appendChild(table);
  block.appendChild(scroll);
  cpuContainScrollBounce(scroll);
  return block;
}

function renderCpuLeaderboardInto(container, options){
  if(!container || !options || !options.field) return null;
  container.querySelectorAll('.cpu-lb-block').forEach(el => el.remove());
  const block = renderCpuLeaderboardBlock(options);
  if(block) container.appendChild(block);
  return block;
}
