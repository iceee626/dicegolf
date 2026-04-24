// Experience, Rank Progression, and XP Reward Modal

const XP_MAX_LEVEL = 40;
const XP_ACH_UNLOCK_BONUS = 40;
const XP_BASE_PER_HOLE = 10;
let LAST_XP_AWARD = null;
const _xpPendingAchBonus = {};

function getActiveProfileContextAny(){
  const profiles = loadProfiles();
  if(!profiles.length) return null;
  const idx = Math.min(getActiveProfileIdx(), profiles.length - 1);
  const p = profiles[idx];
  if(!p) return null;
  ensureProfileDefaults(p);
  return { profiles, idx, p };
}

function xpToNextLevel(level){
  if(level >= XP_MAX_LEVEL) return 0;
  return 120 + ((level - 1) * 22);
}

function xpTotalForLevel(level){
  let total = 0;
  for(let lvl = 1; lvl < Math.max(1, Math.min(level, XP_MAX_LEVEL)); lvl++){
    total += xpToNextLevel(lvl);
  }
  return total;
}

function getXpSnapshot(xpTotal){
  let level = 1;
  let remaining = Math.max(0, Math.floor(xpTotal || 0));
  while(level < XP_MAX_LEVEL){
    const need = xpToNextLevel(level);
    if(remaining < need) break;
    remaining -= need;
    level++;
  }
  const need = xpToNextLevel(level);
  const progressPct = level >= XP_MAX_LEVEL ? 100 : Math.max(0, Math.min(100, (remaining / Math.max(1, need)) * 100));
  return { level, xpIntoLevel: remaining, need, progressPct };
}

function getRankLabelForLevel(level){
  if(level >= 40) return 'Golf Legend';
  if(level >= 35) return 'Major Champion';
  if(level >= 30) return 'Tournament Winner';
  if(level >= 25) return 'Tour Pro';
  if(level >= 20) return 'Journeyman';
  if(level >= 15) return 'Local Star';
  if(level >= 10) return 'Rising Talent';
  if(level >= 5) return 'Sunday Golfer';
  return 'Rookie';
}

function getDifficultyMultiplier(diff){
  if(diff === 3) return 1.4;
  if(diff === 2) return 1.2;
  return 1.0;
}

function getDifficultyLabel(diff){
  if(diff === 3) return 'Hard';
  if(diff === 2) return 'Medium';
  return 'Easy';
}

function getScoreMultiplier(roundDiff, holesPlayed){
  const perHole = (roundDiff || 0) / Math.max(1, holesPlayed || 1);
  if(perHole <= -0.60) return 1.35;
  if(perHole <= -0.30) return 1.2;
  if(perHole < 0) return 1.1;
  if(perHole === 0) return 1.0;
  if(perHole <= 0.30) return 0.9;
  if(perHole <= 0.60) return 0.8;
  return 0.7;
}

function _queueAchievementXp(idx, amount){
  if(!amount || amount <= 0) return;
  if(!_xpPendingAchBonus[idx]) _xpPendingAchBonus[idx] = { xp: 0, count: 0 };
  _xpPendingAchBonus[idx].xp += amount;
  _xpPendingAchBonus[idx].count += Math.max(1, Math.round(amount / XP_ACH_UNLOCK_BONUS));
}

function consumePendingAchievementXp(idx){
  const row = _xpPendingAchBonus[idx] || { xp: 0, count: 0 };
  _xpPendingAchBonus[idx] = { xp: 0, count: 0 };
  return row;
}

function incrementCompletedGameCounters(options = {}){
  const ctx = getActiveProfileContextAny();
  if(!ctx) return;
  ctx.p.gamesCompleted = (ctx.p.gamesCompleted || 0) + 1;
  if(options.versus){
    ctx.p.versusPlayed = (ctx.p.versusPlayed || 0) + 1;
  }
  ctx.profiles[ctx.idx] = ctx.p;
  saveProfiles(ctx.profiles);
}

function applyRoundScoreBuckets(profile, roundIdx){
  if(TUT.active) return;
  const histRow = (S.histories[roundIdx] || []);
  for(let i = S.startIdx; i <= S.endIdx; i++){
    const hist = histRow[i];
    if(!hist) continue;
    const d = hist.strokes - hist.par;
    if(hist.par === 3 && hist.strokes === 1) profile.scoreBuckets.aces++;
    else if(d <= -2) profile.scoreBuckets.eaglesPlus++;
    else if(d === -1) profile.scoreBuckets.birdies++;
    else if(d === 0) profile.scoreBuckets.pars++;
    else if(d === 1) profile.scoreBuckets.bogeys++;
    else profile.scoreBuckets.doublePlus++;
  }
}

function captureXpHighlightSnapshot(profile = null){
  const p = profile || getActiveProfile();
  if(!p) return null;
  ensureProfileDefaults(p);
  return {
    bestBirdieStreak: p.bestBirdieStreak || 0,
    bestUnderParStreak: p.bestUnderParStreak || 0,
    maxWcOneRound: p.maxWcOneRound || 0,
    timesInWater: p.timesInWater || 0
  };
}

function buildXpHighlightRows(before, after, achievementCount = 0){
  if(!before || !after) return [];
  const rows = [];
  if((after.bestBirdieStreak || 0) > (before.bestBirdieStreak || 0)){
    rows.push({ label:'New Best Birdie Streak', value: after.bestBirdieStreak || 0 });
  }
  if((after.bestUnderParStreak || 0) > (before.bestUnderParStreak || 0)){
    rows.push({ label:'New Best Under-Par Streak', value: after.bestUnderParStreak || 0 });
  }
  if((after.maxWcOneRound || 0) > (before.maxWcOneRound || 0)){
    rows.push({ label:'Max WC / Round', value: after.maxWcOneRound || 0 });
  }
  const waterDelta = Math.max(0, (after.timesInWater || 0) - (before.timesInWater || 0));
  if(waterDelta > 0){
    rows.push({ label:'Times in Water', value: waterDelta });
  }
  if(achievementCount > 0){
    rows.push({ label:'New Achievements', value: achievementCount });
  }
  return rows;
}

function renderXpAwardCardHtml(award){
  if(!award) return '';
  const scoreMulText = award.scoreMultiplierOverride
    ? award.scoreMultiplierOverride
    : `x${award.scoreMultiplier.toFixed(2)}`;
  const finalToNext = award.after.level >= XP_MAX_LEVEL
    ? 'MAX LEVEL'
    : `${Math.max(0, Math.ceil(award.after.need - award.after.xpIntoLevel))} XP TO LEVEL UP`;
  return `
    <div class="xp-award-card">
      <div class="xp-award-head">
        <div class="xp-award-title">${award.title || 'GAINED XP'}</div>
      </div>
      <div class="xp-award-rows">
        <div class="xp-award-row"><span class="xp-award-lbl">Completed Round</span><span class="xp-award-val">${award.baseXp} XP</span></div>
        <div class="xp-award-row"><span class="xp-award-lbl">Difficulty Multiplier</span><span class="xp-award-val">x${award.difficultyMultiplier.toFixed(2)}</span></div>
        <div class="xp-award-row"><span class="xp-award-lbl">Score Multiplier</span><span class="xp-award-val">${scoreMulText}</span></div>
        ${award.achievementBonus > 0 ? `<div class="xp-award-row"><span class="xp-award-lbl">Achievement Bonus</span><span class="xp-award-val">${award.achievementBonus} XP</span></div>` : ''}
        ${award.tutorialBonus > 0 ? `<div class="xp-award-row"><span class="xp-award-lbl">Tutorial Completion Bonus</span><span class="xp-award-val">${award.tutorialBonus} XP</span></div>` : ''}
        <div class="xp-award-row"><span class="xp-award-lbl">Total XP</span><span class="xp-award-val total">${award.totalXp} XP</span></div>
      </div>
      <div class="xp-bar-wrap">
        <div class="xp-bar-track"><div class="xp-bar-fill" data-start="${award.beforeTotal}" data-end="${award.afterTotal}" data-from="${award.before.progressPct.toFixed(2)}" data-to="${award.after.progressPct.toFixed(2)}" style="width:${award.before.progressPct.toFixed(2)}%;"></div></div>
        <div class="xp-bar-meta">
          <span class="xp-level-live">LEVEL ${award.before.level}</span>
          <span class="xp-to-next-live">${finalToNext}</span>
        </div>
      </div>
    </div>
  `;
}

function animateXpBars(root){
  const scope = root || document;
  scope.querySelectorAll('.xp-bar-fill[data-to]').forEach(fill=>{
    const startTotalRaw = fill.dataset.start;
    const endTotalRaw = fill.dataset.end;
    if(startTotalRaw !== undefined && endTotalRaw !== undefined){
      const startTotal = parseFloat(startTotalRaw || '0');
      const endTotal = parseFloat(endTotalRaw || '0');
      const card = fill.closest('.xp-award-card');
      const lvlEl = card ? card.querySelector('.xp-level-live') : null;
      const toNextEl = card ? card.querySelector('.xp-to-next-live') : null;
      const startSnap = getXpSnapshot(startTotal);
      const endSnap = getXpSnapshot(endTotal);
      const levelUps = Math.max(0, endSnap.level - startSnap.level);
      const duration = Math.min(6800, 2400 + (levelUps * 1400));
      const t0 = performance.now();
      let lastLevel = startSnap.level;
      const step = (now)=>{
        const t = Math.max(0, Math.min(1, (now - t0) / duration));
        const eased = 0.5 - (Math.cos(Math.PI * t) / 2);
        const currentTotal = startTotal + ((endTotal - startTotal) * eased);
        const snap = getXpSnapshot(currentTotal);
        fill.style.width = `${Math.max(0, Math.min(100, snap.progressPct))}%`;
        if(lvlEl){
          if(snap.level > lastLevel){
            lvlEl.classList.remove('level-up-glow');
            void lvlEl.offsetWidth;
            lvlEl.classList.add('level-up-glow');
            if(lvlEl._lvlGlowTimer) clearTimeout(lvlEl._lvlGlowTimer);
            lvlEl._lvlGlowTimer = setTimeout(()=>{
              lvlEl.classList.remove('level-up-glow');
            }, 920);
          }
          lvlEl.textContent = `LEVEL ${snap.level}`;
          lastLevel = snap.level;
        }
        if(toNextEl){
          toNextEl.textContent = snap.level >= XP_MAX_LEVEL
            ? 'MAX LEVEL'
            : `${Math.max(0, Math.ceil(snap.need - snap.xpIntoLevel))} XP TO LEVEL UP`;
        }
        if(t < 1){
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
      return;
    }
    const to = parseFloat(fill.dataset.to || '0');
    requestAnimationFrame(()=>{
      fill.style.width = `${Math.max(0, Math.min(100, to))}%`;
    });
  });
}

function awardRoundExperience(options = {}){
  const ctx = options.profileCtx || getActiveProfileContextAny();
  if(!ctx) return null;
  const holesPlayed = Math.max(1, options.holesPlayed || (S.endIdx - S.startIdx + 1));
  const difficultyMultiplier = getDifficultyMultiplier(options.gameDiff || GAME_DIFF);
  const scoreMultiplier = typeof options.scoreMultiplier === 'number'
    ? options.scoreMultiplier
    : getScoreMultiplier(options.roundDiff || 0, holesPlayed);

  const baseXp = Math.round(Math.max(1, holesPlayed * XP_BASE_PER_HOLE));
  const gameplayXp = Math.max(1, Math.round(baseXp * difficultyMultiplier * scoreMultiplier));

  const ach = options.includeAchievementBonus === false
    ? { xp: 0, count: 0 }
    : consumePendingAchievementXp(ctx.idx);
  let achievementBonus = Math.max(0, ach.xp || 0);
  let tutorialBonus = Math.max(0, options.tutorialBonus || 0);

  const before = getXpSnapshot(ctx.p.xpTotal || 0);
  const beforeTotal = Math.max(0, ctx.p.xpTotal || 0);
  let totalXp = gameplayXp + achievementBonus + tutorialBonus;
  if(options.ensureLevel2 && before.level < 2){
    // Guarantee player reaches level 2; top-up is silent — does not change the
    // displayed tutorialBonus so the shown value stays exactly as passed (40).
    const need = Math.max(0, xpTotalForLevel(2) - (ctx.p.xpTotal || 0));
    if(totalXp < need) totalXp = need;
  }

  ctx.p.xpTotal = Math.max(0, (ctx.p.xpTotal || 0) + totalXp);
  ctx.p.achievementXpEarned = Math.max(0, (ctx.p.achievementXpEarned || 0) + achievementBonus);
  const afterTotal = ctx.p.xpTotal;
  if(typeof options.roundTotal === 'number') ctx.p.totalStrokes += Math.max(0, options.roundTotal);
  if(typeof options.roundPar === 'number') ctx.p.totalPar += Math.max(0, options.roundPar);
  if(typeof options.roundIdx === 'number') applyRoundScoreBuckets(ctx.p, options.roundIdx);
  ctx.profiles[ctx.idx] = ctx.p;
  saveProfiles(ctx.profiles);

  const afterBase = getXpSnapshot(ctx.p.xpTotal || 0);
  const after = { ...afterBase, rank: getRankLabelForLevel(afterBase.level) };
  const summary = {
    title: options.title || 'GAINED XP',
    baseXp,
    gameplayXp,
    totalXp,
    difficultyMultiplier,
    scoreMultiplier,
    scoreMultiplierOverride: options.scoreMultiplierLabel || '',
    achievementBonus,
    achievementCount: ach.count || 0,
    tutorialBonus,
    events: Array.isArray(options.events) ? options.events : [],
    beforeTotal,
    afterTotal,
    before: { ...before, rank: getRankLabelForLevel(before.level) },
    after
  };
  LAST_XP_AWARD = {
    ...summary,
    source: options.source || 'round',
    round: typeof options.roundNumber === 'number' ? options.roundNumber : S.currentRound
  };
  return summary;
}

function closeXpRewardModal(){
  _closeProfileLikeModal('xpRewardModal');
}

function xpRewardContinue(){
  const cb = window.__xpAfterClose;
  window.__xpAfterClose = null;
  closeXpRewardModal();
  if(typeof cb === 'function') cb();
}

function showXpRewardModal(title, award, buttonText = 'CONTINUE', afterClose = null){
  const modal = document.getElementById('xpRewardModal');
  const titleEl = document.getElementById('xpRewardTitle');
  const body = document.getElementById('xpRewardBody');
  if(!modal || !titleEl || !body || !award) return;
  titleEl.textContent = title;
  body.innerHTML = `
    ${renderXpAwardCardHtml(award)}
    <div style="margin-top:12px;">
      <button class="menu-btn-play" style="width:100%;" onclick="xpRewardContinue()">${buttonText}</button>
    </div>
  `;
  window.__xpAfterClose = typeof afterClose === 'function' ? afterClose : null;
  modal.classList.add('show');
  animateXpBars(body);
}
