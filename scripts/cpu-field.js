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

function cpuDistributeGrossScore(grossScore, holes, startIdx, endIdx){
  const scores = [];
  const activeIndexes = cpuActiveHoleIndexes(startIdx, endIdx);
  activeIndexes.forEach(absIdx => {
    scores[absIdx] = Math.max(1, (holes[absIdx] && holes[absIdx].par) || 4);
  });
  let remaining = Math.round(Number(grossScore) || cpuTotalPar(holes, startIdx, endIdx))
    - cpuTotalPar(holes, startIdx, endIdx);
  if(remaining > 0){
    for(let idx = activeIndexes.length - 1; remaining > 0; idx = (idx - 1 + activeIndexes.length) % activeIndexes.length){
      scores[activeIndexes[idx]] += 1;
      remaining--;
    }
  } else if(remaining < 0){
    for(let idx = activeIndexes.length - 1; remaining < 0; idx = (idx - 1 + activeIndexes.length) % activeIndexes.length){
      const absIdx = activeIndexes[idx];
      if(scores[absIdx] <= 1) continue;
      scores[absIdx] -= 1;
      remaining++;
    }
  }
  return scores;
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

function cpuOpponentNumber(id, fallback){
  const match = String(id || '').match(/\d+/);
  const n = match ? Number(match[0]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
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

const CPU_DIFFICULTY_PROFILES = {
  1: { center:3, spread:5.5, leaderGapCaps:[4,5,6], tailGapCaps:[10,12,14], pressureLimit:0.16 },
  2: { center:2, spread:6.0, leaderGapCaps:[5,6,7], tailGapCaps:[11,13,15], pressureLimit:0.18 },
  3: { center:1, spread:6.5, leaderGapCaps:[6,7,8], tailGapCaps:[12,14,16], pressureLimit:0.20 }
};

function cpuDifficultyProfile(gameDiff){
  return CPU_DIFFICULTY_PROFILES[Math.max(1, Math.min(3, gameDiff || 1))] || CPU_DIFFICULTY_PROFILES[1];
}

function cpuHoleScale(holeCount){
  return Math.max(0.45, (holeCount || 18) / 18);
}

function cpuProgressStage(progress){
  if(progress < 0.34) return 0;
  if(progress < 0.67) return 1;
  return 2;
}

function cpuScaledGapCap(caps, holeCount, progress){
  const list = Array.isArray(caps) && caps.length ? caps : [6,7,8];
  const value = list[Math.min(list.length - 1, cpuProgressStage(progress || 0))];
  return Math.max(3, value * cpuHoleScale(holeCount || 18));
}

function cpuRoundTargetBounds(gameDiff, holeCount){
  const scale = cpuHoleScale(holeCount || 18);
  const profile = cpuDifficultyProfile(gameDiff);
  const center = profile.center * scale;
  const spread = profile.spread * scale;
  return {
    center,
    min: Math.round(center - spread),
    max: Math.round(center + spread)
  };
}

function cpuEnsureRoundTarget(field, opp, roundIdx, holes, gameDiff){
  const roundState = opp && opp.rounds ? opp.rounds[roundIdx] : null;
  if(!roundState) return 0;
  if(typeof roundState.targetDiff === 'number') return roundState.targetDiff;
  const activeCount = Math.max(1, (field.endIdx || 17) - (field.startIdx || 0) + 1);
  const bounds = cpuRoundTargetBounds(gameDiff || field.gameDiff, activeCount);
  const cpuNum = cpuOpponentNumber(opp.id, 1);
  const random = seededRandom((field.seed || 1) + roundIdx * 7001 + cpuNum * 331 + 91);
  const bell = (random() + random() + random() + random() - 2) * 4.1;
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
  const target = Math.round(cpuClamp(bounds.center + bell - skill * 1.15, bounds.min, bounds.max));
  roundState.targetDiff = target;
  return target;
}

function cpuNormalizeRoundScorecard(scorecard){
  if(!Array.isArray(scorecard)) return null;
  const row = Array(18).fill(null);
  let hasScore = false;
  scorecard.slice(0, 18).forEach((score, index) => {
    if(typeof score !== 'number' || !Number.isFinite(score)) return;
    row[index] = Math.max(1, Math.round(score));
    hasScore = true;
  });
  return hasScore ? row : null;
}

function createCpuField(options){
  const holes = options.holes || [];
  const startIdx = options.startIdx == null ? 0 : options.startIdx;
  const endIdx = options.endIdx == null ? 17 : options.endIdx;
  const totalRounds = Math.max(1, options.totalRounds || 1);
  const seed = options.seed || Date.now();
  const random = seededRandom(seed);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const customOpponents = Array.isArray(options.opponents) ? options.opponents.filter(Boolean) : null;
  const surnames = customOpponents ? [] : cpuPickSurnames(random, CPU_FIELD_SIZE);
  const pacePattern = [-1, 0, 1, 2, -1, 1, 3, 0, -2];
  const sourceOpponents = customOpponents || surnames.map((name, index) => ({ id:`cpu${index + 1}`, name }));
  const opponents = sourceOpponents.map((source, idx) => {
    const name = String(source.name || `CPU${idx + 1}`).trim().toUpperCase().slice(0, 14) || `CPU${idx + 1}`;
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
    const sourceKey = source.id || `cpu${idx + 1}`;
    const priorScorecards = options.roundScorecardsByOpponentId && options.roundScorecardsByOpponentId[sourceKey];
    if(Array.isArray(priorScorecards)){
      priorScorecards.forEach((scorecard, roundIdx) => {
        if(roundIdx >= rounds.length) return;
        const row = cpuNormalizeRoundScorecard(scorecard);
        if(!row) return;
        const roundTotal = cpuRoundScoresTotal(row, holes, startIdx, endIdx);
        rounds[roundIdx].scores = row;
        rounds[roundIdx].thru = roundTotal.thru;
        rounds[roundIdx].complete = roundTotal.thru >= cpuActiveHoleIndexes(startIdx, endIdx).length;
      });
    }
    const priorScores = options.roundScoresByOpponentId && options.roundScoresByOpponentId[sourceKey];
    if(Array.isArray(priorScores)){
      priorScores.forEach((gross, roundIdx) => {
        if(roundIdx >= rounds.length || typeof gross !== 'number' || rounds[roundIdx].complete) return;
        rounds[roundIdx].scores = cpuDistributeGrossScore(gross, holes, startIdx, endIdx);
        rounds[roundIdx].thru = cpuActiveHoleIndexes(startIdx, endIdx).length;
        rounds[roundIdx].complete = true;
      });
    }
    return {
      id: sourceKey,
      name,
      traits: source.traits && typeof source.traits === 'object' ? cpuClone(source.traits) : cpuMakeTraits(random, options.courseId),
      careerPlayerId: source.careerPlayerId || source.id || null,
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
    par3: { deltas:[-2,-1,0,1,2,3,4], weights:[0.001,0.11,0.52,0.29,0.06,0.015,0.004] },
    par4: { deltas:[-1,0,1,2,3,4], weights:[0.145,0.50,0.255,0.07,0.023,0.007] },
    par5: { deltas:[-2,-1,0,1,2,3,4], weights:[0.018,0.235,0.46,0.22,0.052,0.012,0.003] }
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
  const compression = options.compression || 0;
  weights = cpuShiftWeights(weights, deltas, compression);
  if(compression > 0.08){
    weights = cpuMoveWeightByDelta(weights, deltas, delta => delta <= 1, delta => delta + 2, (compression - 0.08) * 1.25);
  } else if(compression < -0.08){
    weights = cpuMoveWeightByDelta(weights, deltas, delta => delta >= 0, delta => delta - 1.5, (Math.abs(compression) - 0.08) * 1.0);
  }

  const target = options.targetContext;
  if(target && typeof target.targetDiff === 'number' && target.remainingHoles > 0){
    const needed = target.targetDiff - (target.currentDiff || 0);
    const strength = cpuClamp(Number(target.strength == null ? 1 : target.strength), 0, 1);
    const desiredDelta = needed / Math.max(1, target.remainingHoles);
    const expectedDelta = cpuExpectedDelta(weights, deltas);
    const maxShift = 0.25 * strength;
    weights = cpuShiftWeights(weights, deltas, cpuClamp((desiredDelta - expectedDelta) * 0.45 * strength, -maxShift, maxShift));
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
  return proposedScore;
}

function cpuBuildScoresContext(field, holes, playerScores, roundIdx){
  const currentRound = roundIdx + 1;
  const totalHoles = Math.max(1, (field.endIdx == null ? 17 : field.endIdx) - (field.startIdx || 0) + 1);
  const player = cpuPlayerCumulative(playerScores, holes, field.startIdx, field.endIdx, currentRound);
  const rows = field.opponents.map(opp => ({
    opp,
    score: cpuOpponentCumulative(opp, holes, field.startIdx, field.endIdx, currentRound)
  }));
  rows.sort((a, b) => a.score.diff - b.score.diff || b.score.thru - a.score.thru || a.opp.name.localeCompare(b.opp.name));
  return {
    player,
    playerProjectedDiff: cpuProjectedRoundDiff(player, totalHoles),
    rows: rows.map(row => ({ ...row, projectedDiff: cpuProjectedRoundDiff(row.score, totalHoles) }))
  };
}

function cpuProjectedRoundDiff(score, totalHoles){
  if(!score || !score.thru) return score ? score.diff || 0 : 0;
  return (score.diff / Math.max(1, score.thru)) * Math.max(1, totalHoles || score.thru);
}

function cpuCompressionForOpponent(field, opp, context, holeProgress, totalHoles){
  const profile = cpuDifficultyProfile(field && field.gameDiff);
  const playerProjected = context.playerProjectedDiff == null ? context.player.diff : context.playerProjectedDiff;
  const activeRows = context.rows.filter(row => row.score && row.score.thru > 0);
  const rankedRows = activeRows.length ? activeRows.slice().sort((a, b) => a.projectedDiff - b.projectedDiff) : context.rows;
  const leaderProjected = rankedRows.length ? rankedRows[0].projectedDiff : playerProjected;
  const tailProjected = rankedRows.length ? rankedRows[rankedRows.length - 1].projectedDiff : playerProjected;
  const leaderCap = cpuScaledGapCap(profile.leaderGapCaps, totalHoles, holeProgress);
  const tailCap = cpuScaledGapCap(profile.tailGapCaps, totalHoles, holeProgress);
  const playerLead = leaderProjected - playerProjected;
  const playerBehind = playerProjected - leaderProjected;
  const rank = context.rows.findIndex(row => row.opp.id === opp.id);
  const projectedRow = context.rows.find(row => row.opp.id === opp.id);
  const oppProjected = projectedRow ? projectedRow.projectedDiff : leaderProjected;
  const stageFactor = 0.9 + cpuClamp(holeProgress || 0, 0, 1) * 0.1;
  const severity = value => cpuClamp(value / Math.max(3, leaderCap), 0, 1);
  if(playerBehind > leaderCap && rank >= 0 && rank < 4){
    return profile.pressureLimit * stageFactor * severity(playerBehind - leaderCap);
  }
  if(playerLead > leaderCap && rank >= 0 && rank < 6){
    return -profile.pressureLimit * stageFactor * severity(playerLead - leaderCap);
  }
  const tailGap = tailProjected - playerProjected;
  if(tailGap > tailCap && oppProjected >= playerProjected + tailCap * 0.75){
    return -profile.pressureLimit * 0.65 * stageFactor * severity(tailGap - tailCap);
  }
  if(playerBehind > leaderCap * 1.6 && oppProjected <= playerProjected - leaderCap * 0.6){
    return profile.pressureLimit * 0.75 * stageFactor * severity(playerBehind - leaderCap);
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
  const cpuNum = cpuOpponentNumber(opp.id, 1);
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
  const cpuNum = cpuOpponentNumber(opp.id, 1);
  return seededRandom((field.seed || 1) + roundIdx * 10007 + cpuNum * 1009 + absIdx * 7919 + 173);
}

function cpuTargetStrengthForRemaining(remainingHoles){
  if(remainingHoles <= 1) return 0.35;
  if(remainingHoles <= 3) return 0.55;
  return 0.9;
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
      const compression = cpuCompressionForOpponent(field, opp, context, holeProgress, totalHoles);
      const roundTargetDiff = cpuEnsureRoundTarget(field, opp, roundIdx, holes, options.gameDiff || field.gameDiff);
      const currentDiff = cpuRoundScoresTotal(roundState.scores, holes, field.startIdx, field.endIdx).diff;
      const remainingHoles = totalHoles - roundState.thru;
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
          remainingHoles,
          strength: cpuTargetStrengthForRemaining(remainingHoles)
        }
      });
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
      const roundTargetDiff = cpuEnsureRoundTarget(field, opp, roundIdx, holes, options.gameDiff || field.gameDiff);
      const totalHoles = activeIndexes.length;
      const holeProgress = totalHoles ? roundState.thru / totalHoles : 1;
      const remainingHoles = activeIndexes.length - roundState.thru;
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
          remainingHoles,
          strength: cpuTargetStrengthForRemaining(remainingHoles)
        }
      });
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

function cpuScorecardSegmentTotal(scores, indexes){
  if(!Array.isArray(scores)) return Infinity;
  return indexes.reduce((sum, idx) => {
    const score = scores[idx];
    return sum + (typeof score === 'number' && Number.isFinite(score) ? score : 99);
  }, 0);
}

function cpuTiebreakIndexes(field, kind){
  const active = cpuActiveHoleIndexes(field.startIdx || 0, field.endIdx == null ? 17 : field.endIdx);
  if(kind === 'backHalf') return active.slice(Math.floor(active.length / 2));
  if(kind === 'lastThird') return active.slice(Math.max(0, active.length - Math.ceil(active.length / 3)));
  if(kind === 'last3') return active.slice(Math.max(0, active.length - 3));
  if(kind === 'finalHole') return active.slice(-1);
  return active;
}

function cpuCompareFinalFirstTiebreak(a, b, field, currentRound){
  const finalIdx = Math.max(0, currentRound - 1);
  const segments = ['backHalf', 'lastThird', 'last3', 'finalHole', 'full'];
  for(const segment of segments){
    const indexes = cpuTiebreakIndexes(field, segment);
    const aTotal = cpuScorecardSegmentTotal(a.roundScores && a.roundScores[finalIdx], indexes);
    const bTotal = cpuScorecardSegmentTotal(b.roundScores && b.roundScores[finalIdx], indexes);
    if(aTotal !== bTotal) return aTotal - bTotal;
  }
  for(let round = finalIdx - 1; round >= 0; round--){
    const indexes = cpuTiebreakIndexes(field, 'full');
    const aTotal = cpuScorecardSegmentTotal(a.roundScores && a.roundScores[round], indexes);
    const bTotal = cpuScorecardSegmentTotal(b.roundScores && b.roundScores[round], indexes);
    if(aTotal !== bTotal) return aTotal - bTotal;
  }
  return (a.seedOrder || 0) - (b.seedOrder || 0);
}

function cpuApplyFinalFirstTiebreak(rows, field, currentRound){
  const roundIdx = currentRound - 1;
  if(!cpuIsFinalRound(field, roundIdx)) return rows;
  const playableRows = rows.filter(row => !row.notStarted);
  if(!playableRows.length || playableRows.some(row => !row.roundComplete)) return rows;
  const bestDiff = Math.min(...playableRows.map(row => row.diff));
  const tied = playableRows.filter(row => row.diff === bestDiff);
  if(tied.length <= 1) return rows;
  tied.sort((a, b) => cpuCompareFinalFirstTiebreak(a, b, field, currentRound));
  tied.forEach((row, index) => {
    row.finalFirstTieRank = index + 1;
  });
  return rows.sort((a, b) => {
    if(!!a.notStarted !== !!b.notStarted) return a.notStarted ? 1 : -1;
    if(a.notStarted && b.notStarted) return String(a.thruLabel).localeCompare(String(b.thruLabel)) || a.name.localeCompare(b.name);
    if(a.diff !== b.diff) return a.diff - b.diff;
    if(a.finalFirstTieRank || b.finalFirstTieRank) return (a.finalFirstTieRank || 999) - (b.finalFirstTieRank || 999);
    return b.thru - a.thru || (a.isPlayer ? -1 : b.isPlayer ? 1 : a.name.localeCompare(b.name));
  });
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
    totalClass: playerNotStarted ? '' : cpuScoreClass(player.diff),
    roundScores: options.playerScores || [],
    seedOrder: -1
  });
  field.opponents.forEach((opp, index) => {
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
      notStarted,
      roundScores: opp.rounds ? opp.rounds.map(round => round && Array.isArray(round.scores) ? round.scores : []) : [],
      seedOrder: index
    });
  });
  rows.sort((a, b) => {
    if(!!a.notStarted !== !!b.notStarted) return a.notStarted ? 1 : -1;
    if(a.notStarted && b.notStarted) return String(a.thruLabel).localeCompare(String(b.thruLabel)) || a.name.localeCompare(b.name);
    return a.diff - b.diff || b.thru - a.thru || (a.isPlayer ? -1 : b.isPlayer ? 1 : a.name.localeCompare(b.name));
  });
  cpuApplyFinalFirstTiebreak(rows, field, currentRound);
  let lastDiff = null;
  let lastPos = 0;
  rows.forEach((row, idx) => {
    if(row.notStarted){
      row.pos = '-';
      return;
    }
    if(row.finalFirstTieRank){
      row.pos = String(row.finalFirstTieRank);
      lastDiff = row.diff;
      lastPos = row.finalFirstTieRank;
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
