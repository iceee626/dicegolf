// Profiles, Settings, Achievements, XP, and Player History
// PROFILES
// ═══════════════════════════════════════
const MAX_PROFILES=3;
const PROFILE_EMOJIS=[
  '🏌️','🏌️‍♀️','⛳','🏆','🎯','⚡','🔥','🌟','💪',
  '🦅','🐯','🦁','🐺','🦊','🐻','🦝','🐸',
  '🎲','🃏','🏅','🥇','🎖️','👑','💎','🍀',
  '⚽','🏀','🎾','🏈','⚾','🥊','🎿','🏄',
  '🌊','🌈','🐤','☀️','🌙','🌴','🌵','🍁',
  '😎','🤠','🧢','🕶️','🥸','😤','😈','🤩',
];
const AVATARS=['🏌️','⛳','🏆']; 

function getProfileIcon(p, idx){
  return p.icon || AVATARS[idx] || '👤';
}

function loadProfiles(){
  try{
    const profiles = JSON.parse(localStorage.getItem('gg_profiles')||'[]');
    if(!Array.isArray(profiles)) return [];
    let dirty = false;
    profiles.forEach((p, idx)=>{
      const before = JSON.stringify(p);
      ensureProfileDefaults(p);
      if(JSON.stringify(p) !== before) dirty = true;
      if(typeof p.name !== 'string') profiles[idx].name = `PLAYER ${idx+1}`;
    });
    if(dirty) saveProfiles(profiles);
    return profiles;
  }catch{return [];}
}
function saveProfiles(p){localStorage.setItem('gg_profiles',JSON.stringify(p));}
function getActiveProfileIdx(){
  return parseInt(localStorage.getItem('gg_active_profile')||'0');
}
function setActiveProfileIdx(i){localStorage.setItem('gg_active_profile',String(i));}

function getActiveProfile(){
  const profiles=loadProfiles();
  if(!profiles.length)return null;
  const idx=Math.min(getActiveProfileIdx(), profiles.length-1);
  return profiles[idx]||null;
}

function createProfileId(){
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function ensureProfileDefaults(p){
  if(!p || typeof p !== 'object') return p;
  if(typeof p.id !== 'string' || !p.id.trim()) p.id = createProfileId();
  if(!Array.isArray(p.achievements)) p.achievements = [];
  const numericDefaults = {
    gamesPlayed: 0,
    holesPlayed: 0,
    birdies: 0,
    eagles: 0,
    holeInOnes: 0,
    wildcardsUsed: 0,
    bestBirdieStreak: 0,
    bestUnderParStreak: 0,
    bogeyFreeRounds: 0,
    perfectRounds: 0,
    maxWcOneRound: 0,
    easyUnderPar: 0,
    medUnderPar: 0,
    hardRounds: 0,
    hardUnderPar: 0,
    wcDiscardedRound: 0,
    tripleTroubles: 0,
    tutorialCompleted: 0,
    shakeRolls: 0,
    customGamesCompleted: 0,
    tournamentCompletions: 0,
    gamesCompleted: 0,
    versusPlayed: 0,
    majorLikeFinishes: 0,
    par3SpecialistRounds: 0,
    rollercoasterRounds: 0,
    iceVeinsRounds: 0,
    scubaDiverRounds: 0,
    timesInWater: 0,
    beachBumRounds: 0,
    lumberjackRounds: 0,
    scramblerRounds: 0,
    wcDiscardedTotal: 0,
    xpTotal: 0,
    achievementXpEarned: 0,
    totalStrokes: 0,
    totalPar: 0
  };
  Object.keys(numericDefaults).forEach(k=>{
    if(typeof p[k] !== 'number' || !isFinite(p[k])) p[k] = numericDefaults[k];
  });
  if(!p.scoreBuckets || typeof p.scoreBuckets !== 'object') p.scoreBuckets = {};
  const scoreDefaults = { aces:0, eaglesPlus:0, birdies:0, pars:0, bogeys:0, doublePlus:0 };
  Object.keys(scoreDefaults).forEach(k=>{
    if(typeof p.scoreBuckets[k] !== 'number' || !isFinite(p.scoreBuckets[k])) p.scoreBuckets[k] = scoreDefaults[k];
  });
  const bucketTotal = (p.scoreBuckets.aces||0) + (p.scoreBuckets.eaglesPlus||0) + (p.scoreBuckets.birdies||0) + (p.scoreBuckets.pars||0) + (p.scoreBuckets.bogeys||0) + (p.scoreBuckets.doublePlus||0);
  if(bucketTotal === 0 && ((p.holeInOnes||0) > 0 || (p.eagles||0) > 0 || (p.birdies||0) > 0)){
    p.scoreBuckets.aces = Math.max(0, p.holeInOnes || 0);
    p.scoreBuckets.eaglesPlus = Math.max(0, (p.eagles || 0) - p.scoreBuckets.aces);
    p.scoreBuckets.birdies = Math.max(0, p.birdies || 0);
  }
  if(p.bestDiff !== undefined && (typeof p.bestDiff !== 'number' || !isFinite(p.bestDiff))) p.bestDiff = undefined;
  return p;
}

function createDefaultProfile(name){
  const p = { name, bestDiff: undefined, achievements: [] };
  return ensureProfileDefaults(p);
}

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

function updateProfileAfterRound(score, par){
  if(TUT.active) return;
  const profiles=loadProfiles();
  if(!profiles.length)return;
  const idx=Math.min(getActiveProfileIdx(), profiles.length-1);
  const p=profiles[idx];
  if(!p)return;
  p.gamesPlayed=(p.gamesPlayed||0)+1;
  HOLES.forEach((h,i)=>{
    const hist=S.histories[S.currentRound-1][i]; // FIXED
    if(!hist)return;
    p.holesPlayed=(p.holesPlayed||0)+1;
    const d=hist.strokes-hist.par;
    if(h.par===3&&hist.strokes===1) p.holeInOnes=(p.holeInOnes||0)+1;
    else if(d<=-2) p.eagles=(p.eagles||0)+1;
    else if(d===-1) p.birdies=(p.birdies||0)+1;
  });
  const diff=score-par;
  if(p.bestDiff===undefined||diff<p.bestDiff) p.bestDiff=diff;
  saveProfiles(profiles);
}

function renderProfileSlots(){
  const profiles=loadProfiles();
  const activeIdx=Math.min(getActiveProfileIdx(), Math.max(0,profiles.length-1));
  const el=document.getElementById('profileSlots');
  el.innerHTML='';

  profiles.forEach((p,i)=>{
    const slot=document.createElement('div');
    slot.className='profile-slot'+(i===activeIdx?' active-profile':'');
    const profileIconHtml = escapeHtml(getProfileIcon(p,i));
    const profileNameHtml = escapeHtml(p.name);
    slot.innerHTML=`
      <div class="profile-avatar">${profileIconHtml}</div>
      <div class="profile-info">
        <div class="profile-name">${profileNameHtml}</div>
      </div>
      <div class="profile-actions">
        <button class="profile-action-btn" onclick="openEditProfile(${i});event.stopPropagation();">EDIT</button>
        <button class="profile-action-btn" onclick="showProfileStats(${i});event.stopPropagation();">STATS</button>
        <button class="profile-action-btn del" onclick="deleteProfile(${i});event.stopPropagation();">✕</button>
      </div>
    `;
    slot.onclick=()=>selectProfile(i);
    el.appendChild(slot);
  });

  if(profiles.length<MAX_PROFILES){
    const add=document.createElement('div');
    add.className='profile-slot empty';
    add.style.cssText='cursor:pointer;border-style:dashed;justify-content:center;color:var(--muted);gap:6px;';
    add.innerHTML=`<span style="font-size:18px;">+</span><span style="font-family:'Sen', sans-serif;font-size:11px;letter-spacing:1px;">NEW PROFILE</span><span style="font-family:'Sen', sans-serif;font-size:9px;color:var(--muted);margin-left:4px;">(max. 3)</span>`;
    add.onclick=()=>showNewProfileForm();
    add.style.cursor='pointer';
    el.appendChild(add);
  }
}

function selectProfile(i){
  const activeIdx=getActiveProfileIdx();
  if(i===activeIdx){
    setTimeout(()=>closeProfileModal(),200);
    return;
  }
  const profiles=loadProfiles();
  const p=profiles[i];
  if(!p)return;
  setActiveProfileIdx(i);
  PLAYER_NAME=p.name.toUpperCase();
  renderProfileSlots();
  updateMenuProfileDisplay();
  setTimeout(()=>closeProfileModal(),150);
  setTimeout(()=>showToast('PROFILE CHANGED'),300);
}

function deleteProfile(i){
  const profiles=loadProfiles();
  const profileName=profiles[i]?.name||'this profile';
  const profileId=profiles[i]?.id||'';
  showConfirm('Remove ' + profileName + '?', ()=>{
    const profiles=loadProfiles();
    if(profileId) clearSavedGameForProfileId(profileId);
    profiles.splice(i,1);
    saveProfiles(profiles);
    if(!profiles.length){
      try{localStorage.removeItem('gg_tutorial_done');}catch{}
      try{localStorage.removeItem(PROFILE_SAVE_KEY);}catch{}
      try{localStorage.removeItem(LEGACY_SAVE_KEY);}catch{}
      closeProfileModal();
      hideScreen('menuScreen');
      const oi=document.getElementById('onboardInput');
      if(oi)oi.value='';
      const ob=document.getElementById('onboardScreen');
      if(ob){
        ob.style.display='flex';
        void ob.offsetWidth;
        ob.classList.add('visible');
      }
      const el=document.getElementById('menuActiveProfile');
      if(el)el.textContent='';
      return;
    }
    const activeIdx=getActiveProfileIdx();
    if(activeIdx>=profiles.length) setActiveProfileIdx(Math.max(0,profiles.length-1));
    const newActive=getActiveProfile();
    if(newActive) PLAYER_NAME=newActive.name.toUpperCase();
    updateMenuProfileDisplay();
    renderProfileSlots();
  });
}

function showNewProfileForm(){
  document.getElementById('profileNewForm').classList.add('show');
  document.getElementById('profileNewInput').focus();
}

function cancelNewProfile(){
  document.getElementById('profileNewForm').classList.remove('show');
  document.getElementById('profileNewInput').value='';
}

function saveNewProfile(){
  const val=sanitizeName(document.getElementById('profileNewInput').value,10);
  if(!val)return;
  const profiles=loadProfiles();
  if(profiles.length>=MAX_PROFILES)return;
  profiles.push(createDefaultProfile(val));
  saveProfiles(profiles);
  const newIdx=profiles.length-1;
  setActiveProfileIdx(newIdx);
  PLAYER_NAME=val;
  updateMenuProfileDisplay();
  cancelNewProfile();
  renderProfileSlots();
  closeProfileModal();
}

function openEditProfile(i){
  const profiles=loadProfiles();
  const p=profiles[i];
  if(!p)return;
  document.getElementById('editProfileModal').dataset.editIdx=i;
  document.getElementById('editProfileName').value=p.name;
  const currentIcon=getProfileIcon(p,i);
  document.getElementById('editProfileIconPreview').textContent=currentIcon;
  document.getElementById('editProfileIconPreview').dataset.selectedIcon=currentIcon;
  const grid=document.getElementById('editProfileEmojiGrid');
  grid.innerHTML='';
  PROFILE_EMOJIS.forEach(emoji=>{
    const btn=document.createElement('button');
    btn.textContent=emoji;
    btn.style.cssText=`font-size:22px;background:${emoji===currentIcon?'rgba(78,158,66,.25)':'rgba(255,255,255,.04)'};border:${emoji===currentIcon?'1px solid var(--c-fwyl)':'1px solid var(--border)'};border-radius:8px;padding:5px;cursor:pointer;transition:all .12s;line-height:1;`;
    btn.onclick=()=>{
      document.getElementById('editProfileIconPreview').textContent=emoji;
      document.getElementById('editProfileIconPreview').dataset.selectedIcon=emoji;
      grid.querySelectorAll('button').forEach(b=>{
        const isSelected=b.textContent===emoji;
        b.style.background=isSelected?'rgba(78,158,66,.25)':'rgba(255,255,255,.04)';
        b.style.borderColor=isSelected?'var(--c-fwyl)':'var(--border)';
      });
    };
    grid.appendChild(btn);
  });
  const backdrop=document.getElementById('profileModal');
  const editModal=document.getElementById('editProfileModal');
  backdrop.classList.remove('show');
  editModal.classList.add('show');
}

function focusIconPicker(){
  const grid=document.getElementById('editProfileEmojiGrid');
  if(grid)grid.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function closeEditProfile(){
  const editModal=document.getElementById('editProfileModal');
  const profileModal=document.getElementById('profileModal');
  if(editModal) editModal.classList.remove('show');
  if(profileModal) profileModal.classList.add('show');
  renderProfileSlots();
}

function saveEditProfile(){
  const idx=parseInt(document.getElementById('editProfileModal').dataset.editIdx||'0');
  const name=sanitizeName(document.getElementById('editProfileName').value,10);
  const icon=document.getElementById('editProfileIconPreview').dataset.selectedIcon||'🏌️';
  if(!name)return;
  const profiles=loadProfiles();
  if(!profiles[idx])return;
  profiles[idx].name=name;
  profiles[idx].icon=icon;
  saveProfiles(profiles);
  const activeIdx=getActiveProfileIdx();
  if(idx===activeIdx){
    PLAYER_NAME=name;
    updateMenuProfileDisplay();
    // Live update the TV Banner if playing
    const tvName = document.getElementById('tvName');
    if (tvName) tvName.textContent = name;
  }
  renderProfileSlots();
  closeEditProfile();
}

function openProfileModal(){
  _profileHubEditing = false;
  _profileHubEmoji = null;
  _profileHubCreateOpen = false;
  renderProfileHub('home', { animateRing:true });
  const modal = document.getElementById('profileHubModal');
  if(modal) modal.classList.add('show');
}
function closeProfileModal(){
  _closeProfileLikeModal('profileHubModal');
  _closeProfileLikeModal('profileModal');
}

function autoLoadProfile(){
  const profiles=loadProfiles();
  if(!profiles.length){
    const obs=document.getElementById('onboardScreen');
    if(obs){obs.style.display='flex';void obs.offsetWidth;obs.classList.add('visible');}
    document.getElementById('menuScreen').style.display='none';
  } else {
    const p=getActiveProfile();
    if(p) PLAYER_NAME=p.name.toUpperCase();
    document.getElementById('onboardScreen').style.display='none';
    showScreen('menuScreen','flex');
    updateMenuProfileDisplay();
    updateMenuContinueBtn();
  }
}

function createFirstProfile(){
  const val=sanitizeName(document.getElementById('onboardInput').value,12);
  if(!val){document.getElementById('onboardInput').focus();return;}
  const profiles=loadProfiles();
  profiles.push(createDefaultProfile(val));
  saveProfiles(profiles);
  setActiveProfileIdx(0);
  PLAYER_NAME=val;
  hideScreen('onboardScreen');
  updateMenuProfileDisplay();
  setTimeout(()=>{
    maybeTutorialPrompt();
  }, 300);
}

function resetProfileStats(i){
  showConfirm('Reset stats?', ()=>{
    const profiles=loadProfiles();
    if(!profiles[i])return;
    const name=profiles[i].name;
    const icon=profiles[i].icon;
    const profileId = profiles[i].id;
    profiles[i]=createDefaultProfile(name);
    if(profileId) profiles[i].id = profileId;
    if(icon) profiles[i].icon = icon;
    saveProfiles(profiles);
    const sp=document.getElementById('profileStatsPanel');
    if(sp)sp.remove();
    renderProfileSlots();
    showProfileStats(i);
  });
}
function showProfileStats(i){
  const profiles=loadProfiles();
  const p=profiles[i];
  if(!p)return;
  
  const slotsContainer = document.getElementById('profileSlots');
  const allBtns = slotsContainer.querySelectorAll('.profile-action-btn');
  
  const existing=document.getElementById('profileStatsPanel');
  if(existing){
    const isSame = existing.dataset.profileIdx === String(i);
    existing.remove();
    allBtns.forEach(b => b.classList.remove('active-action'));
    if(isSame) return; // If clicking the same one, just close it and return
  }
  
  // Highlight the clicked STATS button
  const slotDivs = slotsContainer.querySelectorAll('.profile-slot:not(.empty)');
  if (slotDivs[i]) {
      const statsBtn = slotDivs[i].querySelectorAll('.profile-action-btn')[1];
      if (statsBtn) statsBtn.classList.add('active-action');
  }

  const panel=document.createElement('div');
  panel.id='profileStatsPanel';
  panel.dataset.profileIdx = String(i);
  panel.style.cssText='background:rgba(255,255,255,.04);border:1px solid var(--c-fwyl);border-radius:10px;padding:12px;margin-top:6px;animation:fadein .2s ease;max-height:60vh;overflow-y:auto;';
  
  const bestStr=p.bestDiff===undefined?'—':p.bestDiff===0?'E':p.bestDiff>0?`+${p.bestDiff}`:`${p.bestDiff}`;
  const rows=[
    ['Games Played', p.gamesPlayed||0],['Holes Played', p.holesPlayed||0],
    ['Birdies', p.birdies||0],['Eagles', p.eagles||0],
    ['Hole-in-Ones', p.holeInOnes||0],['Wildcards Used', p.wildcardsUsed||0],['Best Score', bestStr],
  ];
  const earned=p.achievements||[];
  const total=ACHIEVEMENTS.length;
  const count=ACHIEVEMENTS.filter(a=>earned.includes(a.id)).length;

  const statsHTML=rows.map(([label,val])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-family:'Sen',sans-serif;font-size:12px;"><span style="color:var(--muted);">${label}</span><span style="color:var(--text);font-weight:600;">${val}</span></div>`).join('');
  const achListHTML=ACHIEVEMENTS.map(a=>{
    const yes=earned.includes(a.id);
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);opacity:${yes?1:.35};">
      <span style="font-size:16px;flex-shrink:0;">${a.icon}</span>
      <div style="flex:1;min-width:0;"><div style="font-family:'Bebas Neue',cursive;font-size:12px;letter-spacing:1px;color:${yes?'var(--gold)':'var(--muted)'};">${a.name}</div><div style="font-family:'Sen', sans-serif;font-size:10px;color:var(--muted);">${a.desc}</div></div>
      <span style="font-size:11px;">${yes?'✅':'🔒'}</span>
    </div>`;
  }).join('');

  panel.innerHTML=
    `<div style="font-family:Bebas Neue,cursive;font-size:14px;letter-spacing:2px;color:var(--c-fwyl);margin-bottom:8px;">${escapeHtml(p.name.toUpperCase())} — STATS</div>`+
    statsHTML+
    `<button id="achToggleBtn" onclick="(function(){
      const l=document.getElementById('achList');
      const open=l.style.display!=='none';
      l.style.display=open?'none':'block';
      document.getElementById('achToggleArrow').textContent=open?'▸':'▾';
    })()" style="width:100%;background:transparent;border:none;border-top:1px solid var(--border);color:var(--c-fwyl);font-family:'Bebas Neue',cursive;font-size:13px;letter-spacing:2px;cursor:pointer;text-align:left;padding:8px 0 4px;display:flex;justify-content:space-between;align-items:center;">
      <span>ACHIEVEMENTS — ${count}/${total} (${Math.round(count/total*100)}%)</span><span id="achToggleArrow">▾</span>
    </button>`+
    `<div id="achList" style="display:block;">${achListHTML}</div>`+
    `<div style="margin-top:10px;"><button onclick="resetProfileStats(${i})" style="width:100%;background:rgba(255,82,82,.12);color:#ff8080;border:1px solid rgba(255,82,82,.3);border-radius:7px;padding:7px;font-family:'Sen',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;">RESET STATS</button></div>`;
  
  slotsContainer.parentNode.insertBefore(panel, slotsContainer.nextSibling);
}
function updateMenuProfileDisplay(){
  const p=getActiveProfile();
  const el=document.getElementById('menuActiveProfile');
  if(el)el.textContent=''; 
  const nameEl=document.getElementById('menuProfileName');
  if(nameEl)nameEl.textContent=p?p.name.toUpperCase():'';
  const iconBtn=document.getElementById('menuProfileIconBtn');
  if(iconBtn){
    const idx=getActiveProfileIdx();
    iconBtn.textContent=p?getProfileIcon(p,idx):'👤';
  }
  const tvIcon=document.querySelector('.tv-icon-box');
  if(tvIcon&&p){const idx=getActiveProfileIdx();tvIcon.textContent=getProfileIcon(p,idx);}
  updateMenuContinueBtn();
}

let _profileHubView = 'home';
let _profileHubEditing = false;
let _profileHubEmoji = null;
let _profileHubCreateOpen = false;

function profileHubSwitchView(view){
  _profileHubView = view;
  ['home','stats','achievements'].forEach(v=>{
    const el = document.getElementById(`profileHubView${v.charAt(0).toUpperCase()+v.slice(1)}`);
    if(el) el.classList.toggle('active', v === view);
  });
}

function profileHubBackToHome(){
  renderProfileHub('home');
}

function profileHubGetCtx(){
  const profiles = loadProfiles();
  if(!profiles.length) return null;
  const activeIdx = Math.min(getActiveProfileIdx(), profiles.length - 1);
  const p = profiles[activeIdx];
  if(!p) return null;
  ensureProfileDefaults(p);
  return { profiles, activeIdx, p };
}

function renderProfileHub(view = _profileHubView, opts = {}){
  const ctx = profileHubGetCtx();
  const home = document.getElementById('profileHubViewHome');
  const stats = document.getElementById('profileHubViewStats');
  const ach = document.getElementById('profileHubViewAchievements');
  if(!home || !stats || !ach) return;
  if(!ctx){
    home.innerHTML = '';
    stats.innerHTML = '';
    ach.innerHTML = '';
    profileHubSwitchView('home');
    return;
  }

  const totalAch = ACHIEVEMENTS.length;
  const earned = ctx.p.achievements || [];
  const earnedCount = ACHIEVEMENTS.filter(a=>earned.includes(a.id)).length;
  const bestStr = ctx.p.bestDiff===undefined ? '—' : ctx.p.bestDiff===0 ? 'E' : ctx.p.bestDiff>0 ? `+${ctx.p.bestDiff}` : `${ctx.p.bestDiff}`;
  const xp = getXpSnapshot(ctx.p.xpTotal || 0);
  const animateRing = !!opts.animateRing;
  const ringCirc = 2 * Math.PI * 34;
  const ringOffset = ringCirc * (1 - (xp.progressPct / 100));
  const rank = getRankLabelForLevel(xp.level);
  const activeIcon = getProfileIcon(ctx.p, ctx.activeIdx);
  const nameVal = String(ctx.p.name || '').toUpperCase();
  const nameHtml = escapeHtml(nameVal);
  const activeIconHtml = escapeHtml(activeIcon);
  const buckets = ctx.p.scoreBuckets || { aces:0, eaglesPlus:0, birdies:0, pars:0, bogeys:0, doublePlus:0 };
  const acesTotal = Math.max(buckets.aces || 0, ctx.p.holeInOnes || 0);
  const eaglesPlusTotal = Math.max(buckets.eaglesPlus || 0, Math.max(0, (ctx.p.eagles || 0) - acesTotal));

  const emojis = PROFILE_EMOJIS.slice(0, 32);
  const emojiGrid = emojis.map(emoji=>{
    const selected = (_profileHubEmoji || activeIcon) === emoji;
    return `<button class="ph-emoji${selected?' sel':''}" onclick="profileHubSelectEmoji('${emoji.replace(/'/g, "\\'")}')">${emoji}</button>`;
  }).join('');

  const inactiveCards = ctx.profiles
    .map((p, i)=>({p, i}))
    .filter(row=>row.i !== ctx.activeIdx)
    .map(({p, i})=>{
      const s = getXpSnapshot(p.xpTotal || 0);
      const miniName = escapeHtml(String(p.name || '').toUpperCase());
      const miniIcon = escapeHtml(getProfileIcon(p, i));
      return `
        <button class="ph-mini-card" onclick="profileHubSelectProfile(${i})">
          <div class="ph-mini-avatar">${miniIcon}</div>
          <div style="min-width:0;text-align:left;">
            <div class="ph-mini-name">${miniName}</div>
            <div class="ph-mini-sub">LVL ${s.level} · ${getRankLabelForLevel(s.level)}</div>
          </div>
          <div class="ph-mini-arrow">›</div>
        </button>
      `;
    }).join('');

  const createBlock = _profileHubCreateOpen ? `
    <div class="ph-new-row">
      <input class="profile-new-input" id="profileHubNewInput" placeholder="YOUR NAME" maxlength="10" autocomplete="off" spellcheck="false" style="margin:0;">
      <button class="ph-btn primary" style="flex:0 0 auto;min-width:92px;" onclick="profileHubCreateProfile()">Create</button>
      <button class="ph-btn" style="flex:0 0 auto;min-width:84px;" onclick="profileHubToggleCreate(false)">Cancel</button>
    </div>
  ` : (ctx.profiles.length < MAX_PROFILES ? `
    <button class="ph-btn" style="width:100%;margin-top:10px;" onclick="profileHubToggleCreate(true)">+ New Profile (max. 3)</button>
  ` : '');

  home.innerHTML = `
    <div class="ph-main-card${_profileHubEditing ? ' editing' : ''}">
      <div class="ph-main-top">
        <div class="ph-ring-wrap glow">
          <svg class="ph-ring-svg" viewBox="0 0 82 82">
            <circle class="ph-ring-bg" cx="41" cy="41" r="34"></circle>
            <circle class="ph-ring-fill" id="profileHubRingFill" cx="41" cy="41" r="34" style="stroke-dasharray:${ringCirc};stroke-dashoffset:${animateRing ? ringCirc : ringOffset};"></circle>
          </svg>
          <div class="ph-avatar">${_profileHubEditing ? escapeHtml(_profileHubEmoji || activeIcon) : activeIconHtml}</div>
        </div>
        <div class="ph-main-info">
          ${_profileHubEditing
            ? `<input class="profile-new-input" id="profileHubNameInput" maxlength="10" autocomplete="off" spellcheck="false" value="${nameHtml}" style="margin-bottom:6px;">`
            : `<div class="ph-name">${nameHtml}</div>`
          }
          <div class="ph-sub">LVL ${xp.level} · ${rank}</div>
          <div class="ph-xp">${xp.level >= XP_MAX_LEVEL ? 'MAX LEVEL' : `${Math.max(0, Math.ceil(xp.need - xp.xpIntoLevel))} XP LEFT TO LEVEL UP`}</div>
        </div>
      </div>
      <div class="ph-stats6">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.gamesPlayed||0}</div><div class="ph-stat-lbl">Rounds</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${bestStr}</div><div class="ph-stat-lbl">Best Score</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${earnedCount}</div><div class="ph-stat-lbl">Achievements</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.birdies||0}</div><div class="ph-stat-lbl">Birdies</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${eaglesPlusTotal}</div><div class="ph-stat-lbl">Eagles+</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${acesTotal}</div><div class="ph-stat-lbl">Aces</div></div>
      </div>
      <div class="ph-actions ph-actions-main">
        <button class="ph-btn" onclick="profileHubToggleEdit(true)">Edit</button>
        <button class="ph-btn primary" onclick="profileHubSwitchTo('stats')">Full Stats</button>
      </div>
      <div class="ph-actions ph-actions-ach">
        <button class="ph-btn gold" onclick="profileHubSwitchTo('achievements')">Achievements</button>
      </div>
      <div class="ph-edit-block">
        <div class="ph-edit-grid">${emojiGrid}</div>
      </div>
      <div class="ph-actions ph-actions-edit">
        <button class="ph-btn" onclick="profileHubToggleEdit(false)">Cancel</button>
        <button class="ph-btn primary" onclick="profileHubSaveEdit()">Save</button>
      </div>
      <div class="ph-delete-wrap">
        <button class="ph-btn danger" style="width:100%;" onclick="profileHubDeleteActive()">Delete Profile</button>
      </div>
    </div>
    <div class="ph-mini-list">
      ${inactiveCards}
    </div>
    ${createBlock}
  `;

  const totalParAll = ctx.p.totalPar || 0;
  const totalStrokesAll = ctx.p.totalStrokes || 0;
  const avgDiff = totalParAll > 0 ? ((totalStrokesAll - totalParAll) / Math.max(1, ctx.p.gamesPlayed || 1)) : 0;
  const avgDiffText = totalParAll > 0 ? (avgDiff===0?'E':avgDiff>0?`+${avgDiff.toFixed(1)}`:`${avgDiff.toFixed(1)}`) : '—';
  const distRows = [
    { key: 'aces', label: 'Ace', cls: 'eagle', value: acesTotal },
    { key: 'eaglesPlus', label: 'Eagle+', cls: 'eagle', value: eaglesPlusTotal },
    { key: 'birdies', label: 'Birdie', cls: 'birdie', value: buckets.birdies || 0 },
    { key: 'pars', label: 'Par', cls: 'par', value: buckets.pars || 0 },
    { key: 'bogeys', label: 'Bogey', cls: 'bogey', value: buckets.bogeys || 0 },
    { key: 'doublePlus', label: 'Double+', cls: 'double', value: buckets.doublePlus || 0 }
  ];
  const distMax = Math.max(1, ...distRows.map(r=>r.value || 0));
  stats.innerHTML = `
    <div class="ph-section">
      <div class="ph-sec-title" style="margin:0 0 8px;">FULL STATS</div>
      <div class="ph-kv-grid">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.gamesPlayed||0}</div><div class="ph-stat-lbl">Rounds</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.holesPlayed||0}</div><div class="ph-stat-lbl">Holes</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${totalStrokesAll||0}</div><div class="ph-stat-lbl">Total Strokes</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${avgDiffText}</div><div class="ph-stat-lbl">Avg vs Par</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.xpTotal||0}</div><div class="ph-stat-lbl">Total XP</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${earnedCount}</div><div class="ph-stat-lbl">Achievements</div></div>
      </div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Score Distribution</div>
      <div class="ph-dist-list">
        ${distRows.map(row=>{
          const pct = Math.round((row.value / distMax) * 100);
          return `
            <div class="ph-dist-row">
              <div class="ph-dist-lbl">${row.label}</div>
              <div class="ph-dist-track"><div class="ph-dist-fill ${row.cls}" data-to="${pct}" style="width:0%;"></div></div>
              <div class="ph-dist-val">${row.value}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Streaks & Specials</div>
      <div class="ph-kv-grid">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.bestBirdieStreak||0}</div><div class="ph-stat-lbl">Best Birdie Streak</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.bestUnderParStreak||0}</div><div class="ph-stat-lbl">Best Under-Par Streak</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.bogeyFreeRounds||0}</div><div class="ph-stat-lbl">Bogey-Free Rounds</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.gamesCompleted||0}</div><div class="ph-stat-lbl">Games Completed</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.versusPlayed||0}</div><div class="ph-stat-lbl">Versus Played</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.tournamentCompletions||0}</div><div class="ph-stat-lbl">Tournaments</div></div>
      </div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Wildcards & Hazards</div>
      <div class="ph-kv-grid">
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.wildcardsUsed||0}</div><div class="ph-stat-lbl">Wildcards Used</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.maxWcOneRound||0}</div><div class="ph-stat-lbl">Max WC / Round</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.wcDiscardedTotal||0}</div><div class="ph-stat-lbl">WC Discarded</div></div>
        <div class="ph-stat-tile"><div class="ph-stat-num">${ctx.p.timesInWater||0}</div><div class="ph-stat-lbl">Times in Water</div></div>
      </div>
    </div>
    <div style="padding:0 2px 2px;">
      <button class="ph-btn danger" style="width:100%;" onclick="profileHubResetStats()">RESET STATS</button>
    </div>
  `;

  const progressPct = totalAch > 0 ? Math.round((earnedCount / totalAch) * 100) : 0;
  const unlockedList = ACHIEVEMENTS.filter(a=>earned.includes(a.id));
  const lockedList = ACHIEVEMENTS.filter(a=>!earned.includes(a.id));
  const renderAchItem = (a, locked) => `
    <div class="ph-ach-item${locked?' locked':''}">
      <div class="ph-ach-icon">${a.icon}</div>
      <div style="min-width:0;">
        <div class="ph-ach-name">${a.name}</div>
        <div class="ph-ach-desc">${a.desc}</div>
      </div>
      <div class="ph-ach-xp">+${XP_ACH_UNLOCK_BONUS} XP</div>
    </div>
  `;
  ach.innerHTML = `
    <div class="ph-section">
      <div class="ph-sec-title" style="margin:0 0 8px;">ACHIEVEMENTS</div>
      <div class="xp-bar-track"><div class="xp-bar-fill" data-from="0" data-to="${progressPct}" style="width:0%;"></div></div>
      <div class="xp-bar-meta" style="margin-top:6px;"><span>${earnedCount} / ${totalAch} unlocked</span><span>${progressPct}%</span></div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Unlocked</div>
      <div class="ph-ach-list">${unlockedList.map(a=>renderAchItem(a, false)).join('') || `<div class="ph-ach-desc">No achievements yet.</div>`}</div>
    </div>
    <div class="ph-section">
      <div class="ph-sec-title">Locked</div>
      <div class="ph-ach-list">${lockedList.map(a=>renderAchItem(a, true)).join('')}</div>
    </div>
  `;

  profileHubSwitchView(view);
  const hubBack = document.getElementById('profileHubBackBtn');
  if(hubBack){
    const showBack = view !== 'home';
    hubBack.style.visibility = showBack ? 'visible' : 'hidden';
    hubBack.style.pointerEvents = showBack ? 'auto' : 'none';
  }
  const ring = document.getElementById('profileHubRingFill');
  if(ring){
    if(animateRing){
      requestAnimationFrame(()=>{ ring.style.strokeDashoffset = String(ringOffset); });
    } else {
      ring.style.transition = 'none';
      ring.style.strokeDashoffset = String(ringOffset);
      requestAnimationFrame(()=>{ ring.style.transition = ''; });
    }
  }
  if(view === 'stats') animateProfileDistBars(stats);
  animateXpBars(ach);
}

function animateProfileDistBars(root){
  const scope = root || document;
  scope.querySelectorAll('.ph-dist-fill[data-to]').forEach(fill=>{
    const to = Math.max(0, Math.min(100, parseFloat(fill.dataset.to || '0')));
    fill.style.width = '0%';
    requestAnimationFrame(()=>{ fill.style.width = `${to}%`; });
  });
}

function profileHubSwitchTo(view){
  renderProfileHub(view, { animateRing:false });
}

function profileHubToggleEdit(editing){
  _profileHubEditing = !!editing;
  if(!_profileHubEditing) _profileHubEmoji = null;
  renderProfileHub('home');
}

function profileHubSelectEmoji(emoji){
  _profileHubEmoji = emoji;
  _profileHubEditing = true;
  const home = document.getElementById('profileHubViewHome');
  const avatar = home ? home.querySelector('.ph-avatar') : null;
  if(avatar) avatar.textContent = emoji;
  if(home){
    home.querySelectorAll('.ph-emoji').forEach(btn=>{
      btn.classList.toggle('sel', btn.textContent === emoji);
    });
  }
}

function profileHubSaveEdit(){
  const ctx = profileHubGetCtx();
  if(!ctx) return;
  const input = document.getElementById('profileHubNameInput');
  const name = sanitizeName(input ? input.value : ctx.p.name, 10);
  if(!name) return;
  ctx.p.name = name;
  if(_profileHubEmoji) ctx.p.icon = _profileHubEmoji;
  ctx.profiles[ctx.activeIdx] = ctx.p;
  saveProfiles(ctx.profiles);
  PLAYER_NAME = name.toUpperCase();
  updateMenuProfileDisplay();
  const tvName = document.getElementById('tvName');
  if(tvName) tvName.textContent = name;
  _profileHubEditing = false;
  _profileHubEmoji = null;
  renderProfileHub('home');
}

function profileHubSelectProfile(i){
  const profiles = loadProfiles();
  if(!profiles[i]) return;
  setActiveProfileIdx(i);
  PLAYER_NAME = String(profiles[i].name || '').toUpperCase();
  updateMenuProfileDisplay();
  const tvName = document.getElementById('tvName');
  if(tvName) tvName.textContent = String(profiles[i].name || '');
  _profileHubEditing = false;
  _profileHubEmoji = null;
  _profileHubCreateOpen = false;
  renderProfileHub('home', { animateRing:true });
  showToast('PROFILE CHANGED');
}

function profileHubToggleCreate(open){
  _profileHubCreateOpen = !!open;
  renderProfileHub('home');
  if(_profileHubCreateOpen){
    const input = document.getElementById('profileHubNewInput');
    if(input) input.focus();
  }
}

function profileHubCreateProfile(){
  const input = document.getElementById('profileHubNewInput');
  const val = sanitizeName(input ? input.value : '', 10);
  if(!val) return;
  const profiles = loadProfiles();
  if(profiles.length >= MAX_PROFILES) return;
  profiles.push(createDefaultProfile(val));
  saveProfiles(profiles);
  setActiveProfileIdx(profiles.length - 1);
  PLAYER_NAME = val.toUpperCase();
  updateMenuProfileDisplay();
  const tvName = document.getElementById('tvName');
  if(tvName) tvName.textContent = val;
  _profileHubCreateOpen = false;
  renderProfileHub('home', { animateRing:true });
}

function profileHubResetStats(){
  const ctx = profileHubGetCtx();
  if(!ctx) return;
  showConfirm('ARE YOU SURE YOU WANT TO RESET YOUR CURRENT STATS AND LEVEL?', ()=>{
    const name = String(ctx.p.name || '').trim() || 'PLAYER';
    const icon = ctx.p.icon;
    const profileId = ctx.p.id;
    ctx.profiles[ctx.activeIdx] = createDefaultProfile(name);
    if(profileId) ctx.profiles[ctx.activeIdx].id = profileId;
    if(icon) ctx.profiles[ctx.activeIdx].icon = icon;
    saveProfiles(ctx.profiles);
    PLAYER_NAME = name.toUpperCase();
    updateMenuProfileDisplay();
    const tvName = document.getElementById('tvName');
    if(tvName) tvName.textContent = name;
    renderProfileHub('stats', { animateRing:true });
  });
}

function profileHubDeleteActive(){
  const ctx = profileHubGetCtx();
  if(!ctx) return;
  const name = ctx.p.name || 'this profile';
  const profileId = ctx.p.id || '';
  showConfirm(`Remove ${name}?`, ()=>{
    const profiles = loadProfiles();
    const idx = Math.min(getActiveProfileIdx(), profiles.length - 1);
    if(profileId) clearSavedGameForProfileId(profileId);
    profiles.splice(idx, 1);
    saveProfiles(profiles);
    if(!profiles.length){
      try{localStorage.removeItem('gg_tutorial_done');}catch{}
      try{localStorage.removeItem(PROFILE_SAVE_KEY);}catch{}
      try{localStorage.removeItem(LEGACY_SAVE_KEY);}catch{}
      closeProfileModal();
      hideScreen('menuScreen');
      const oi=document.getElementById('onboardInput');
      if(oi)oi.value='';
      const ob=document.getElementById('onboardScreen');
      if(ob){ob.style.display='flex';void ob.offsetWidth;ob.classList.add('visible');}
      return;
    }
    if(getActiveProfileIdx() >= profiles.length) setActiveProfileIdx(Math.max(0, profiles.length - 1));
    const p = getActiveProfile();
    if(p) PLAYER_NAME = String(p.name || '').toUpperCase();
    updateMenuProfileDisplay();
    _profileHubEditing = false;
    _profileHubEmoji = null;
    renderProfileHub('home');
  });
}

// ═══════════════════════════════════════
// LEGEND TOGGLE
// ═══════════════════════════════════════
let _legendVisible=true;
function legendHiddenEnabled(){
  if(TUT.active) return false;
  try{return localStorage.getItem('gg_hide_legend')==='yes';}catch{return false;}
}
function setLegendHiddenEnabled(v){try{localStorage.setItem('gg_hide_legend',v?'yes':'no');}catch{}}
function toggleLegend(){
  if(legendHiddenEnabled()) return;
  _legendVisible=!_legendVisible;
  updateLegendVisibility();
}
function updateLegendVisibility(){
  const el=document.getElementById('legend');
  const btn=document.getElementById('legendToggleBtn');
  const arrow=document.getElementById('legendArrow');
  const hiddenBySetting=legendHiddenEnabled();
  if(btn)btn.style.display=hiddenBySetting?'none':'flex';
  if(el)el.style.display=!hiddenBySetting&&_legendVisible?'grid':'none';
  if(arrow)arrow.textContent=_legendVisible?'▾':'▸';
}
function setLegendPref(v){
  setLegendHiddenEnabled(v);
  updateLegendSettingUI();
  updateLegendVisibility();
}
function updateLegendSettingUI(){
  const el=document.getElementById('zoneLegendToggle');
  if(el)el.classList.toggle('on', legendHiddenEnabled());
}

function gridFocusEnabled(){
  // Feature removed: auto-focus on grid is always off now
  return false;
}
function setGridFocusEnabled(v){try{localStorage.setItem('gg_focus_grid',v?'on':'off');}catch{}}
function setGridFocusPref(v){
  setGridFocusEnabled(v);
  updateGridFocusSettingUI();
}
function updateGridFocusSettingUI(){
  const el=document.getElementById('gridFocusToggle');
  if(el)el.classList.toggle('on', gridFocusEnabled());
}

// ═══════════════════════════════════════
// CELL LABELS SETTING
// ═══════════════════════════════════════
function getCellLabelMode(){try{return localStorage.getItem('gg_celllabels')||'tap';}catch{return 'tap';}}
function setCellLabelMode(m){try{localStorage.setItem('gg_celllabels',m);}catch{}}
function toggleCellLabels(){
  const cur=getCellLabelMode();
  const next=cur==='tap'?'always':'tap';
  setCellLabelMode(next);
  updateCellLabelUI();
  if(S.currentGrid)renderGrid();
}
function updateCellLabelUI(){
  const m=getCellLabelMode();
  const el=document.getElementById('labelsToggle');
  if(el)el.classList.toggle('on', m==='always');
}

function setCellLabelModeDirect(mode){
  setCellLabelMode(mode);
  updateCellLabelUI();
  if(S.currentGrid)renderGrid();
}

// ═══════════════════════════════════════
// ACHIEVEMENTS SYSTEM
// ═══════════════════════════════════════
const ACHIEVEMENTS=[
  {id:'mini_tiger',            icon:'🐯', name:'Mini-Tiger',               desc:'Complete the tutorial'},
  {id:'first_round',           icon:'⛳', name:'First Round',              desc:'Complete your first round'},
  {id:'hard_finish',           icon:'💪', name:'Hard Mode',                desc:'Complete a full round on Hard difficulty'},
  {id:'architect',             icon:'🛠️', name:'The Architect',            desc:'Complete a round in Custom Game mode with your own specific settings'},
  {id:'participation_award',   icon:'🏅', name:'Participation award',      desc:'Complete a full 4-Round Tournament mode game'},
  {id:'feels_like_major',      icon:'🏆', name:'Feels like a Major',       desc:'Complete a Tournament on Hard and score Even Par (E) or better in all 4 rounds'},
  {id:'ten_rounds',            icon:'🫡', name:'Veteran',                  desc:'Play 10 complete rounds'},
  {id:'fifty_rounds',          icon:'🏌️', name:'Tour Pro',                 desc:'Play 50 complete rounds'},
  {id:'bogey_free',            icon:'🚫', name:'Bogey Free',               desc:'Complete a round with zero bogeys'},
  {id:'under_par',             icon:'📉', name:'Under Par',                desc:'Finish any round under par'},
  {id:'grand_slam',            icon:'👑', name:'Grand Slam',               desc:'Finish under par on all 3 difficulties'},
  {id:'par_3_specialist',      icon:'🏝️', name:'Par 3 Specialist',         desc:'Play a full 18-hole round and score Par or better on every Par 3 hole'},
  {id:'perfect_round',         icon:'🌟', name:'Perfect Round',            desc:'Par or better on every hole in a round'},
  {id:'first_birdie',          icon:'🐦', name:'First Birdie',             desc:'Score your first Birdie'},
  {id:'eagle',                 icon:'🦅', name:'Eagle Eye',                desc:'Score an Eagle on any hole'},
  {id:'hole_in_one',           icon:'🕳️', name:'Ace!',                     desc:'Hole-in-one on a par 3'},
  {id:'on_a_roll',             icon:'📈', name:'On A Roll',                desc:'Go under par for 3 consecutive holes'},
  {id:'birdie_streak',         icon:'🔥', name:'Birdie Jockey',            desc:'5 Birdies in a single round'},
  {id:'rollercoaster',         icon:'🎢', name:'Rollercoaster Round',      desc:'Score a Birdie (or better) and a Double Bogey (or worse) in the same round'},
  {id:'ice_veins',             icon:'🥶', name:'Ice in the Veins',         desc:'Score a Birdie or better immediately following a hole where you scored a Double Bogey or worse'},
  {id:'triple_trouble',        icon:'💀', name:'Triple Trouble',           desc:'Score +3 or worse on a single hole'},
  {id:'scuba_diver',           icon:'🤿', name:'Scuba Diver',              desc:'Hit into the Water hazard twice during the round'},
  {id:'beach_bum',             icon:'🏖️', name:'Beach Bum',                desc:'Land in the Sand zone 5 times in a single round'},
  {id:'lumberjack',            icon:'🪵', name:'Lumberjack',               desc:'Land in the Rough zone 10 times in a single round'},
  {id:'first_wc',              icon:'🃏', name:'Card Shark',               desc:'Use your first Wildcard'},
  {id:'high_roller',           icon:'🎰', name:'High Roller',              desc:'Use 10 Wildcards in a single round'},
  {id:'not_hungry',            icon:'🙅‍♂️', name:'MOM, I\'M NOT HUNGRY',     desc:'Discard 5 Wildcards during a single round'},
  {id:'hoarder',               icon:'🎒', name:'Hoarder',                  desc:'Have 3 Wildcards equipped in your drawer at the exact same time'},
  {id:'my_precious',           icon:'🤩', name:'My precious!',             desc:'Find the legendary Wildcard'},
  {id:'thanks_but_no_thanks',  icon:'🗑️', name:'Thanks, But No Thanks',    desc:'Discard an Epic or Legendary wildcard from the reveal screen'},
  {id:'calculated_adjustment', icon:'🧤', name:'Calculated Adjustment',    desc:'Use Precision Grip to manually save yourself from a penalty'},
  {id:'express_route',         icon:'⚡', name:'Taking the Express Route', desc:'Use the Shortcut Wildcard on a Par 5 to skip directly to the Chip zone after the tee shot'},
  {id:'magnetic_personality',  icon:'🧲', name:'Magnetic Personality',     desc:'Have the Cup Magnet Wildcard actively turn a missed putt into a 1-Putt'},
  {id:'rocket_approach',       icon:'🚀', name:'Rocket Approach',          desc:'Activate Birdie Boost from the Rough/Sand and successfully land on a Green cell'},
  {id:'landscaper',            icon:'🚜', name:'The Landscaper',           desc:'With Mower\'s Revenge active, convert two Rough results into a Fairway on a single hole'},
  {id:'eyes_closed',           icon:'👀', name:'Eyes closed, mouth shut',  desc:'Use the Mulligan/Precision Grip/Tailwind on the Putting Grid to score Birdie or better'},
  {id:'scrambler',             icon:'🛟', name:'The Scrambler',            desc:'Save Par after hitting a hazard without using Lucky Bounce or Phantom Stroke'},
  {id:'sniper',                icon:'🎯', name:'Sniper',                   desc:'Hole out from off the green (Chip/Sand)'},
  {id:'weasel_way_out',        icon:'🦡', name:'Weasel Way Out',           desc:'Sink a shot directly from the greenside bunker using The Ferrett Wildcard'},
  {id:'get_the_cameras',       icon:'🎥', name:'Get the Cameras!',         desc:'With the help of Highlight Reel Wildcard, successfully land on a "Hole In!" cell from a Chip zone'},
];

const ACHIEVEMENT_RULES = {
  mini_tiger: p => (p.tutorialCompleted||0) >= 1,
  first_round: p => (p.gamesPlayed||0) >= 1,
  hard_finish: p => (p.hardRounds||0) >= 1,
  architect: p => (p.customGamesCompleted||0) >= 1,
  participation_award: p => (p.tournamentCompletions||0) >= 1,
  feels_like_major: p => (p.majorLikeFinishes||0) >= 1,
  ten_rounds: p => (p.gamesPlayed||0) >= 10,
  fifty_rounds: p => (p.gamesPlayed||0) >= 50,
  bogey_free: p => (p.bogeyFreeRounds||0) >= 1,
  under_par: p => p.bestDiff!==undefined && p.bestDiff < 0,
  grand_slam: p => (p.easyUnderPar||0)>=1 && (p.medUnderPar||0)>=1 && (p.hardUnderPar||0)>=1,
  par_3_specialist: p => (p.par3SpecialistRounds||0) >= 1,
  perfect_round: p => (p.perfectRounds||0) >= 1,
  first_birdie: p => (p.birdies||0) >= 1,
  eagle: p => (p.eagles||0) >= 1,
  hole_in_one: p => (p.holeInOnes||0) >= 1,
  on_a_roll: () => false,
  birdie_streak: p => (p.bestBirdieStreak||0) >= 5,
  rollercoaster: p => (p.rollercoasterRounds||0) >= 1,
  ice_veins: p => (p.iceVeinsRounds||0) >= 1,
  triple_trouble: p => (p.tripleTroubles||0) >= 1,
  scuba_diver: p => (p.scubaDiverRounds||0) >= 1,
  beach_bum: p => (p.beachBumRounds||0) >= 1,
  lumberjack: p => (p.lumberjackRounds||0) >= 1,
  first_wc: p => (p.wildcardsUsed||0) >= 1,
  high_roller: p => (p.maxWcOneRound||0) >= 10,
  not_hungry: p => (p.wcDiscardedRound||0) >= 5,
  scrambler: p => (p.scramblerRounds||0) >= 1
};

function isAchievementContextEligible(){
  if (TUT.active) return false;
  if (VS.active) return false;
  return true;
}

function _getAchievementContext(){
  if(!isAchievementContextEligible()) return null;
  const profiles=loadProfiles();
  if(!profiles.length) return null;
  const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
  const p=profiles[idx];
  if(!p) return null;
  ensureProfileDefaults(p);
  return {profiles, idx, p};
}

function _findAchievementById(id){
  return ACHIEVEMENTS.find(a=>a.id===id) || null;
}

function grantAchievementXpForProfile(ctx, count){
  const grants = Math.max(0, count || 0);
  if(!ctx || !ctx.p || !grants) return;
  const add = grants * XP_ACH_UNLOCK_BONUS;
  _queueAchievementXp(ctx.idx, add);
}

function hasAchievement(id, p){
  const prof = p || getActiveProfile();
  if(!prof) return false;
  return (prof.achievements||[]).includes(id);
}

function unlockAchievement(id){
  const ach = _findAchievementById(id);
  if(!ach) return false;
  const ctx = _getAchievementContext();
  if(!ctx) return false;
  if((ctx.p.achievements||[]).includes(id)) return false;
  ctx.p.achievements.push(id);
  grantAchievementXpForProfile(ctx, 1);
  ctx.profiles[ctx.idx]=ctx.p;
  saveProfiles(ctx.profiles);
  showAchievementPopup(ach);
  return true;
}

function maybeUnlockHoarder(){
  if(Array.isArray(WCS.equipped) && WCS.equipped.length >= 3){
    unlockAchievement('hoarder');
  }
}

function trackImmediateRoundAchievementProgress(resolvedOutcome, isPenalty){
  if(isPenalty){
    if(resolvedOutcome === 'h2o'){
      S._roundWaterHits = (S._roundWaterHits || 0) + 1;
      if(S._roundWaterHits >= 2) unlockAchievement('scuba_diver');
    }
    return;
  }
  if(resolvedOutcome === 'sand'){
    S._roundSandHits = (S._roundSandHits || 0) + 1;
    if(S._roundSandHits >= 5) unlockAchievement('beach_bum');
    return;
  }
  if(resolvedOutcome === 'rgh'){
    S._roundRoughHits = (S._roundRoughHits || 0) + 1;
    if(S._roundRoughHits >= 10) unlockAchievement('lumberjack');
  }
}

function handleShotAchievementOutcome(resolvedOutcome, prevZone){
  if(S._rocketApproachPending){
    if(resolvedOutcome === 'grn') unlockAchievement('rocket_approach');
    S._rocketApproachPending = false;
  }
  if(resolvedOutcome === 'hole' && (prevZone === 'chip' || prevZone === 'sand')){
    unlockAchievement('sniper');
    if(prevZone === 'sand' && S._ferrettArmedShot) unlockAchievement('weasel_way_out');
    if(prevZone === 'chip' && S._highlightReelArmedShot) unlockAchievement('get_the_cameras');
  }
  S._ferrettArmedShot = false;
  S._highlightReelArmedShot = false;
}

function checkAndAwardAchievements(options = {}){
  const ctx = _getAchievementContext();
  if(!ctx) return [];
  const newlyEarned=[];
  ACHIEVEMENTS.forEach(a=>{
    const rule = ACHIEVEMENT_RULES[a.id];
    if(!rule) return;
    if((ctx.p.achievements||[]).includes(a.id)) return;
    if(rule(ctx.p)){
      ctx.p.achievements.push(a.id);
      newlyEarned.push(a);
    }
  });
  if(!newlyEarned.length) return [];
  grantAchievementXpForProfile(ctx, newlyEarned.length);
  ctx.profiles[ctx.idx]=ctx.p;
  saveProfiles(ctx.profiles);
  if(!options.silent){
    newlyEarned.forEach((a,i)=>setTimeout(()=>showAchievementPopup(a),i*2000));
  }
  return newlyEarned;
}

function applyCompletionModeAchievements(){
  if(!isAchievementContextEligible()) return;
  if(S.currentRound !== S.totalRounds) return;
  const ctx = _getAchievementContext();
  if(!ctx) return;
  if(S.mode === 'custom'){
    ctx.p.customGamesCompleted = (ctx.p.customGamesCompleted||0) + 1;
  }
  if(S.mode === 'tournament' && S.totalRounds === 4){
    ctx.p.tournamentCompletions = (ctx.p.tournamentCompletions||0) + 1;
    const allEvenOrBetter = Array.from({length:S.totalRounds}, (_,rIdx)=>{
      const sc = S.scorecards[rIdx] || [];
      let total=0, par=0;
      let complete=true;
      for(let i=S.startIdx;i<=S.endIdx;i++){
        const v=sc[i];
        if(v===null || v===undefined){ complete=false; break; }
        total += v;
        par += HOLES[i].par;
      }
      if(!complete) return false;
      return (total - par) <= 0;
    }).every(Boolean);
    if(GAME_DIFF===3 && allEvenOrBetter){
      ctx.p.majorLikeFinishes = (ctx.p.majorLikeFinishes||0) + 1;
    }
  }
  ctx.profiles[ctx.idx]=ctx.p;
  saveProfiles(ctx.profiles);
}

function showAchievementPopup(a){
  if(!document.getElementById('achStyles')){
    const s=document.createElement('style');s.id='achStyles';
    s.textContent='@keyframes achIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes achOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(120%)}}';
    document.head.appendChild(s);
  }
  const el=document.createElement('div');
  el.style.cssText='position:fixed;top:calc(env(safe-area-inset-top) + 60px);right:16px;background:linear-gradient(135deg,#2a1a40,#1a3020);border:1px solid var(--gold);border-radius:14px;padding:12px 16px;z-index:999;display:flex;align-items:center;gap:12px;box-shadow:0 4px 24px rgba(0,0,0,.6);max-width:260px;animation:achIn .4s cubic-bezier(.34,1.56,.64,1) forwards;';
  el.innerHTML=`<div style="font-size:28px;flex-shrink:0;">${a.icon}</div><div><div style="font-family:'Sen',sans-serif;font-size:9px;letter-spacing:2px;color:var(--gold);margin-bottom:2px;">ACHIEVEMENT UNLOCKED</div><div style="font-family:'Bebas Neue',cursive;font-size:16px;letter-spacing:2px;color:#fff;line-height:1;">${a.name}</div><div style="font-family:'Sen',sans-serif;font-size:9px;color:rgba(255,255,255,.6);margin-top:2px;">${a.desc}</div></div>`;
  document.body.appendChild(el);
  let _achStartX=0,_achDismissed=false;
  el.addEventListener('touchstart',e=>{_achStartX=e.touches[0].clientX;},{passive:true});
  el.addEventListener('touchmove',e=>{
    const dx=e.touches[0].clientX-_achStartX;
    if(dx>0)el.style.transform=`translateX(${dx}px)`;
  },{passive:true});
  el.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-_achStartX;
    if(dx>60&&!_achDismissed){_achDismissed=true;el.style.animation='achOut .3s ease forwards';setTimeout(()=>el.remove(),320);}
    else{el.style.transform='';}
  },{passive:true});
  el.addEventListener('click',()=>{if(!_achDismissed){_achDismissed=true;el.style.animation='achOut .3s ease forwards';setTimeout(()=>el.remove(),320);}});
  const _achTimer=setTimeout(()=>{if(!_achDismissed){_achDismissed=true;el.style.animation='achOut .5s ease forwards';setTimeout(()=>el.remove(),520);}},3500);
}

function updateProfileStatsAfterRound(score,par,wcUsedThisRound){
  if(TUT.active) return;
  const profiles=loadProfiles();
  const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
  const p=profiles[idx];if(!p)return;
  ensureProfileDefaults(p);
  let maxStreak=0,curStreak=0,bogeyFree=true,allParOrBetter=true,underParStreak=0,maxUnderParStreak=0;
  let hasBirdieOrBetter=false;
  let hasDoubleOrWorse=false;
  let iceArmed=false;
  let iceTriggered=false;
  let waterHits=0;
  let sandHits=0;
  let roughHits=0;
  let scramblerQualified=false;
  HOLES.forEach((h,i)=>{
    const hist=S.histories[S.currentRound-1][i];
    if(!hist)return;
    const d=hist.strokes-hist.par;
    if(d===-1){curStreak++;}else{maxStreak=Math.max(maxStreak,curStreak);curStreak=0;}
    if(d>=1)bogeyFree=false;
    if(d>0)allParOrBetter=false;
    if(d<0){underParStreak++;maxUnderParStreak=Math.max(maxUnderParStreak,underParStreak);}else{underParStreak=0;}
    if(d<=-1){
      hasBirdieOrBetter=true;
      if(iceArmed) iceTriggered=true;
    }
    if(d>=2){
      hasDoubleOrWorse=true;
      iceArmed=true;
    }
    (hist.log||[]).forEach(e=>{
      if(e.pen && e.zk==='h2o') waterHits++;
      if(!e.pen && e.zk==='sand') sandHits++;
      if(!e.pen && e.zk==='rgh') roughHits++;
    });
    const wcsUsed = hist.wcsUsed || [];
    const usedDisallowed = wcsUsed.some(n=>n==='Lucky Bounce' || n==='Phantom Stroke');
    const hadHazPenalty = (hist.log||[]).some(e=>e.pen && (e.zk==='h2o' || e.zk==='ob'));
    if(hadHazPenalty && !usedDisallowed && d<=0) scramblerQualified=true;
  });
  maxStreak=Math.max(maxStreak,curStreak);
  p.bestBirdieStreak=Math.max(p.bestBirdieStreak||0,maxStreak);
  p.bestUnderParStreak=Math.max(p.bestUnderParStreak||0,maxUnderParStreak);
  p._curUnderParStreak=0; 
  if(bogeyFree)p.bogeyFreeRounds=(p.bogeyFreeRounds||0)+1;
  if(allParOrBetter)p.perfectRounds=(p.perfectRounds||0)+1;
  p.maxWcOneRound=Math.max(p.maxWcOneRound||0,wcUsedThisRound||0);
  const diff=score-par;
  if(GAME_DIFF===1&&diff<0)p.easyUnderPar=(p.easyUnderPar||0)+1;
  if(GAME_DIFF===2&&diff<0)p.medUnderPar=(p.medUnderPar||0)+1;
  if(GAME_DIFF===3){p.hardRounds=(p.hardRounds||0)+1;if(diff<0)p.hardUnderPar=(p.hardUnderPar||0)+1;}
  if(hasBirdieOrBetter && hasDoubleOrWorse) p.rollercoasterRounds=(p.rollercoasterRounds||0)+1;
  if(iceTriggered) p.iceVeinsRounds=(p.iceVeinsRounds||0)+1;
  p.timesInWater = (p.timesInWater || 0) + waterHits;
  if(waterHits>=2) p.scubaDiverRounds=(p.scubaDiverRounds||0)+1;
  if(sandHits>=5) p.beachBumRounds=(p.beachBumRounds||0)+1;
  if(roughHits>=10) p.lumberjackRounds=(p.lumberjackRounds||0)+1;
  if(scramblerQualified) p.scramblerRounds=(p.scramblerRounds||0)+1;
  if(S.startIdx===0 && S.endIdx===17){
    const par3Indices = HOLES.map((h, i)=>h.par===3 ? i : -1).filter(i=>i>=0);
    const par3Specialist = par3Indices.length>0 && par3Indices.every(i=>{
      const hist = S.histories[S.currentRound-1][i];
      return !!hist && hist.strokes <= hist.par;
    });
    if(par3Specialist) p.par3SpecialistRounds=(p.par3SpecialistRounds||0)+1;
  }
  profiles[idx]=p;saveProfiles(profiles);
}

function getRoundStats(roundIdx){
  let stats = [
    { label: 'Total Strokes', val: 0 },
    { label: 'Hole in One', val: 0 },
    { label: 'Eagles+', val: 0 },
    { label: 'Birdies', val: 0 },
    { label: 'Pars', val: 0 },
    { label: 'Bogeys', val: 0 },
    { label: 'Double Bogeys+', val: 0 },
    { label: 'Penalties', val: 0 },
    { label: 'Wildcards Used', val: 0 }
  ];

  const rounds = roundIdx === 'overall'
    ? Array.from({length:S.currentRound}, (_,i)=>i)
    : [roundIdx - 1];

  rounds.forEach(rndIdx => {
    const sc = S.scorecards[rndIdx] || [];
    sc.forEach((score, i) => {
      if(score === null || score === undefined) return;
      const h = HOLES[i];
      const hist = (S.histories[rndIdx] || [])[i];
      if(!h || !hist) return;

      stats[0].val += score;
      const d = score - h.par;
      if (h.par === 3 && score === 1) stats[1].val++;
      else if (d <= -2) stats[2].val++;
      else if (d === -1) stats[3].val++;
      else if (d === 0) stats[4].val++;
      else if (d === 1) stats[5].val++;
      else if (d >= 2) stats[6].val++;

      stats[7].val += hist.log.filter(l => l.pen).length;
      stats[8].val += (hist.wcsUsed ? hist.wcsUsed.length : 0);
    });
  });

  if(!wcEnabled()) stats = stats.filter(s => s.label !== 'Wildcards Used');
  return stats;
}

function getVsRoundStats(playerIdx, roundIdx){
  let stats = [
    { label: 'Total Strokes', val: 0 },
    { label: 'Hole in One', val: 0 },
    { label: 'Eagles+', val: 0 },
    { label: 'Birdies', val: 0 },
    { label: 'Pars', val: 0 },
    { label: 'Bogeys', val: 0 },
    { label: 'Double Bogeys+', val: 0 },
    { label: 'Penalties', val: 0 },
    { label: 'Wildcards Used', val: 0 }
  ];
  let holesWon = 0;
  const rounds = roundIdx === 'overall'
    ? Array.from({length:Math.max(1, S.totalRounds || 1)}, (_,i)=>i)
    : [Math.max(0, (roundIdx || 1) - 1)];
  rounds.forEach(rndIdx=>{
    for(let i = S.startIdx; i <= S.endIdx; i++){
      const h = HOLES[i];
      const hist = vsGetHistory(playerIdx, i, rndIdx);
      if(!h || !hist || hist.strokes === null || hist.strokes === undefined) continue;
      const score = hist.strokes;
      stats[0].val += score;
      const d = score - h.par;
      if(h.par === 3 && score === 1) stats[1].val++;
      else if(d <= -2) stats[2].val++;
      else if(d === -1) stats[3].val++;
      else if(d === 0) stats[4].val++;
      else if(d === 1) stats[5].val++;
      else if(d >= 2) stats[6].val++;
      stats[7].val += (hist.log || []).filter(l=>l.pen).length;
      stats[8].val += (hist.wcsUsed ? hist.wcsUsed.length : 0);

      if(VS.format === 'match'){
        const opp = vsGetHistory(playerIdx === 0 ? 1 : 0, i, rndIdx);
        if(opp && opp.strokes !== null && opp.strokes !== undefined && score < opp.strokes) holesWon++;
      }
    }
  });
  if(VS.format === 'match'){
    stats.unshift({ label: 'Holes Won', val: holesWon });
  }
  if(!wcEnabled()) stats = stats.filter(s => s.label !== 'Wildcards Used');
  return stats;
}

function getVsSummaryComparisonRows(roundIdx){
  const leftStats = getVsRoundStats(0, roundIdx);
  const rightStats = getVsRoundStats(1, roundIdx);
  const rightMap = new Map(rightStats.map(s => [s.label, Number(s.val || 0)]));
  const rows = leftStats.map(s => ({
    label: s.label,
    left: Number(s.val || 0),
    right: Number(rightMap.get(s.label) || 0)
  }));
  rightStats.forEach(s=>{
    if(!rows.some(r=>r.label === s.label)){
      rows.push({ label: s.label, left: 0, right: Number(s.val || 0) });
    }
  });
  return rows;
}

function getVsSummaryStatColors(label, left, right){
  const neutral = 'var(--text)';
  if(left === right) return { leftColor: neutral, rightColor: neutral };
  const higherBetter = new Set(['Holes Won', 'Hole in One', 'Eagles+', 'Birdies', 'Pars']);
  const lowerBetter = new Set(['Total Strokes', 'Bogeys', 'Double Bogeys+', 'Penalties', 'Wildcards Used']);
  if(higherBetter.has(label)){
    return left > right
      ? { leftColor: 'var(--c-fwyl)', rightColor: '#e05252' }
      : { leftColor: '#e05252', rightColor: 'var(--c-fwyl)' };
  }
  if(lowerBetter.has(label)){
    return left < right
      ? { leftColor: 'var(--c-fwyl)', rightColor: '#e05252' }
      : { leftColor: '#e05252', rightColor: 'var(--c-fwyl)' };
  }
  return { leftColor: neutral, rightColor: neutral };
}

function setVsSummaryPlayer(playerIdx, viewRound = S.currentRound, backTarget = _summaryBackTarget){
  _vsSummaryPlayer = Math.max(0, Math.min(1, playerIdx || 0));
  if(_summaryContext && _summaryContext.mode === 'versus'){
    _summaryContext.playerIdx = _vsSummaryPlayer;
  }
  const body=document.getElementById('sumBody');
  const savedScroll = body ? body.scrollTop : 0;
  _vsSummaryPreserveScroll = true;
  openVersusSummary(viewRound, backTarget);
  _vsSummaryPreserveScroll = false;
  if(body) requestAnimationFrame(()=>{ body.scrollTop = savedScroll; });
}

let _vsSummaryPreserveScroll = false;
function openVersusSummary(viewRound = S.currentRound, backTarget = _summaryBackTarget){
  document.getElementById('overlay').classList.remove('show');
  if(backTarget === 'hcScreen'){
    setMainAppConcealed(true);
    hideMainAppImmediate();
  } else {
    concealMainApp();
  }
  _summaryBackTarget = backTarget || null;
  closeSummaryHoleModal();
  const body=document.getElementById('sumBody');
  body.innerHTML='';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.flex = '1';
  body.style.minHeight = '0';
  if(!_vsSummaryPreserveScroll) body.scrollTop = 0;
  const backBtn=document.getElementById('sumBackBtn');
  const backSpacer=document.getElementById('sumHeadSpacer');
  if(backBtn){ backBtn.style.display='flex'; backBtn.style.visibility = _summaryBackTarget ? 'visible' : 'hidden'; }
  if(backSpacer){ backSpacer.style.display='block'; backSpacer.style.visibility = _summaryBackTarget ? 'hidden' : 'visible'; }
  document.getElementById('sumTitle').textContent='SUMMARY';

  if (S.totalRounds > 1) {
    const tabs = document.createElement('div');
    tabs.className = 'sum-tabs';
    tabs.style.position = 'static';
    for(let r=1; r<=S.totalRounds; r++){
      const tab = document.createElement('button');
      tab.className = `sum-tab ${r === viewRound ? 'active' : ''}`;
      tab.textContent = `ROUND ${r}`;
      tab.onclick = () => openVersusSummary(r, backTarget);
      tabs.appendChild(tab);
    }
    body.appendChild(tabs);
  }

  const playerIdx = Math.max(0, Math.min(1, _vsSummaryPlayer || 0));
  setSummaryContext({ mode:'versus', playerIdx });
  const player = VS.players[playerIdx] || { name:'PLAYER' };
  const scData = vsRoundScores(playerIdx, viewRound - 1) || Array(18).fill(null);
  const histData = vsRoundHistories(playerIdx, viewRound - 1) || Array(18).fill(null);
  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);
  const roundTotal = scData.reduce((a,b)=>a+(b||0),0);
  const roundPar = activeHoles.reduce((a,h)=>a+h.par,0);
  const roundDiff = roundTotal - roundPar;
  const totals = vsStrokeTotals(playerIdx, S.totalRounds);
  const gDiffStr = totals.diff===0 ? 'E' : totals.diff>0 ? `+${totals.diff}` : `${totals.diff}`;
  const compareRows = getVsSummaryComparisonRows(viewRound);

  const statsHead = document.createElement('div');
  statsHead.className = 'sum-section-head';
  statsHead.innerHTML = `<div class="ttl">STATISTICS</div><div class="line"></div>`;
  body.appendChild(statsHead);
  const statsList = document.createElement('div');
  statsList.className = 'sum-stats-list';
  compareRows.forEach(s=>{
    const colors = getVsSummaryStatColors(s.label, s.left, s.right);
    const row = document.createElement('div');
    row.className = 'sum-vs-stats-row';
    row.innerHTML = `
      <div class="l" style="color:${colors.leftColor};">${s.left}</div>
      <div class="m">${s.label}</div>
      <div class="r" style="color:${colors.rightColor};">${s.right}</div>
    `;
    statsList.appendChild(row);
  });
  body.appendChild(statsList);

  const scoreHead = document.createElement('div');
  scoreHead.className = 'sum-section-head';
  scoreHead.innerHTML = `<div class="ttl">SCORECARD</div><div class="line"></div>`;
  const pillWrap = document.createElement('div');
  pillWrap.style.cssText = 'display:flex;gap:6px;overflow-x:auto;';
  VS.players.forEach((pl, idx)=>{
    const btn = document.createElement('button');
    const isActive = idx === playerIdx;
    btn.style.cssText = `background:${isActive?'var(--c-fwy)':'rgba(255,255,255,.05)'};color:${isActive?'#fff':'var(--muted)'};border:1px solid ${isActive?'var(--c-fwyl)':'var(--border)'};border-radius:14px;padding:6px 12px;font-family:'Sen',sans-serif;font-size:10px;font-weight:bold;cursor:pointer;white-space:nowrap;transition:all .2s;`;
    btn.textContent = String(pl.name || `P${idx+1}`).toUpperCase().slice(0, 10);
    btn.onclick = ()=>setVsSummaryPlayer(idx, viewRound, backTarget);
    pillWrap.appendChild(btn);
  });
  scoreHead.appendChild(pillWrap);
  body.appendChild(scoreHead);

  let tournamentTotalBox = null;
  if (S.totalRounds > 1) {
    tournamentTotalBox = document.createElement('div');
    tournamentTotalBox.style.cssText = 'background:var(--summary-chip-bg);border:1px solid var(--summary-chip-border);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;';
    tournamentTotalBox.innerHTML = `
      <div><div style="font-family:'Sen',sans-serif;font-size:10px;color:var(--gold);letter-spacing:1px;">TOURNAMENT TOTAL</div><div style="font-family:'Sen',sans-serif;font-size:12px;color:var(--text);">${totals.total} strokes</div></div>
      <div style="font-family:'Bebas Neue',cursive;font-size:28px;color:var(--gold);">${gDiffStr}</div>
    `;
  }

  const sc=document.createElement('div');
  sc.className = 'sc-table-wrapper';
  sc.style.cssText='display:block;overflow-x:auto;overflow-y:hidden;flex-shrink:0;margin-bottom:14px;background:var(--card);border:1px solid var(--border);border-radius:10px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:none;transform:translateZ(0);';
  const table=document.createElement('table');
  const minW = activeHoles.length <= 9 ? '100%' : `${Math.max(320, (activeHoles.length + 2) * 34)}px`;
  table.style.cssText=`width:100%;min-width:${minW};border-collapse:collapse;font-family:"Sen",sans-serif;font-size:10px;`;
  const td=(txt,styles='')=>{
    const c=document.createElement('td'); c.textContent=txt;
    c.style.cssText='padding:5px 3px;text-align:center;border:1px solid var(--border);'+styles;
    return c;
  };

  const headRow=document.createElement('tr');
  headRow.style.background='var(--c-fwy)';
  ['HOLE', ...activeHoles.map((_,i)=>S.startIdx+i+1), 'TOT'].forEach((v,i)=>{
    headRow.appendChild(td(v,'color:#fff;font-weight:600;font-size:10px;letter-spacing:1px;'+(i===0?'text-align:left;padding-left:8px;':'')+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);':'')));
  });
  table.appendChild(headRow);

  const parRow=document.createElement('tr');
  parRow.style.background='rgba(255,255,255,.04)';
  ['PAR', ...activeHoles.map(h=>h.par), roundPar].forEach((v,i)=>{
    parRow.appendChild(td(v,'color:var(--muted);'+(i===0?'text-align:left;padding-left:8px;color:var(--text);':'')+(i===activeHoles.length+1?'font-weight:600;color:var(--text);':'')));
  });
  table.appendChild(parRow);

  const scoreRow=document.createElement('tr');
  scoreRow.style.background='rgba(255,255,255,.03)';
  const playerLabel = String(player.name || '').toUpperCase();
  const scoreCells=[playerLabel, ...activeHoles.map((h,i)=>scData[S.startIdx+i] !== null ? scData[S.startIdx+i] : '–'), roundTotal];
  scoreCells.forEach((v,i)=>{
    const cell=document.createElement('td');
    cell.style.cssText='padding:3px 2px;text-align:center;border:1px solid var(--border);font-size:11px;font-weight:700;'+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);':'');
    if(i===0){
      cell.textContent=v;
      cell.style.cssText+='text-align:left;padding-left:8px;font-family:"Bebas Neue",cursive;font-size:13px;letter-spacing:1px;';
    } else if(i===activeHoles.length+1){
      cell.textContent=v;
      cell.style.color=roundDiff<0?'var(--gold)':roundDiff>0?'#e05252':'var(--c-fwyl)';
    } else {
      const score=scData[S.startIdx + i - 1];
      const h=activeHoles[i-1];
      if(score===null){cell.textContent='–';cell.style.color='var(--muted)';}
      else {
        const d=score-h.par;
        const span=document.createElement('span');
        span.textContent=v;
        span.className = 'sc-sym';
        if(d<=-2)       span.classList.add('sc-sym-eagle');
        else if(d===-1) span.classList.add('sc-sym-birdie');
        else if(d===1)  span.classList.add('sc-sym-bogey');
        else if(d>=2)   span.classList.add('sc-sym-double');
        cell.appendChild(span);
      }
    }
    scoreRow.appendChild(cell);
  });
  table.appendChild(scoreRow);

  const diffRow=document.createElement('tr');
  diffRow.style.background='rgba(0,0,0,.15)';
  let runningDiff=0;
  ['±',...activeHoles.map((h,i)=>{
    const score=scData[S.startIdx+i];
    if(score===null)return null;
    runningDiff+=score-h.par; return runningDiff;
  }),roundDiff].forEach((v,i)=>{
    const cell=document.createElement('td');
    cell.style.cssText='padding:4px 2px;text-align:center;border:1px solid var(--border);font-family:"Sen",sans-serif;font-size:9px;'+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);font-weight:700;':'')+(i===0?'text-align:left;padding-left:8px;':'');
    if(i===0 || v===null){cell.textContent=v===null?'–':'±';cell.style.color='var(--muted)';diffRow.appendChild(cell);return;}
    const txt=v===0?'E':v>0?`+${v}`:`${v}`;
    cell.textContent=txt;
    if(v<0)cell.style.color='var(--gold)'; else if(v===0)cell.style.color='var(--c-fwyl)'; else cell.style.color='#e05252';
    diffRow.appendChild(cell);
  });
  table.appendChild(diffRow);
  sc.appendChild(table);
  body.appendChild(sc);
  if(tournamentTotalBox) body.appendChild(tournamentTotalBox);

  const detailSec=document.createElement('div');
  detailSec.className = 'sum-detail-hint';
  detailSec.textContent='Tap a hole for details';
  body.appendChild(detailSec);

  const holeList=document.createElement('div');
  holeList.className='sum-hole-list';
  activeHoles.forEach((h,i)=>{
    const absoluteIdx = S.startIdx + i;
    const hist=histData[absoluteIdx];
    if(!hist)return;
    const d=hist.strokes-hist.par;
    let numColor='var(--text)';
    if(h.par===3 && hist.strokes===1) numColor='var(--gold)';
    else if(d<=-2) numColor='var(--gold)';
    else if(d===-1) numColor='#52c87a';
    else if(d===0) numColor='var(--text)';
    else if(d===1) numColor='#e05252';
    else numColor='#c04444';
    const row=document.createElement('div');
    row.className = 'sum-hole-pill';
    row.dataset.holeIdx=String(absoluteIdx);
    row.style.background = 'rgba(255,255,255,.07)';
    row.style.position = 'relative';
    row.style.overflow = 'hidden';
    const hasWcVs = hist.wcsUsed && hist.wcsUsed.length > 0;
    row.innerHTML=`<div class="shp-num" style="color:${numColor};">${absoluteIdx+1}</div>${hasWcVs?'<div style="position:absolute;top:4px;right:4px;font-size:7px;line-height:1;pointer-events:none;opacity:.9;">🃏</div>':''}`;
    row.onclick=()=>{
      if(!Array.isArray(S.histories[viewRound - 1])) S.histories[viewRound - 1] = Array(18).fill(null);
      for(let hIdx = S.startIdx; hIdx <= S.endIdx; hIdx++){
        S.histories[viewRound - 1][hIdx] = histData[hIdx] || null;
      }
      openHistInline(absoluteIdx, holeList, row, viewRound);
    };
    holeList.appendChild(row);
  });
  body.appendChild(holeList);

  const spacer=document.createElement('div');
  spacer.style.cssText='flex:1 1 auto;min-height:8px;';
  body.appendChild(spacer);

  const btnRow=document.createElement('div');
  btnRow.className = 'sum-btn-row';
  btnRow.style.flexShrink = '0';
  const returnBtn=document.createElement('button');
  returnBtn.style.cssText='width:100%;background:var(--c-fwy);color:#fff;border:none;border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
  returnBtn.textContent='RETURN TO MAIN MENU';
  returnBtn.onclick=()=>summaryReturnToMenu();
  btnRow.appendChild(returnBtn);
  const playAgainBtn=document.createElement('button');
  playAgainBtn.style.cssText='width:100%;background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
  playAgainBtn.textContent='PLAY AGAIN';
  playAgainBtn.onclick=()=>summaryPlayAgain();
  btnRow.appendChild(playAgainBtn);
  body.appendChild(btnRow);

  const summaryModal = document.getElementById('summaryModal');
  summaryModal.scrollTop = 0;
  summaryModal.classList.add('show');
}

function renderTournamentStatsPanel(selectedKey=S.currentRound){
  const statsContainer = document.getElementById('hcVsStats');
  if(!statsContainer) return;

  const rounds = Array.from({ length: Math.max(1, S.currentRound || 1) }, (_,i)=>i+1);
  const showRoundPills = S.mode === 'tournament' && rounds.length > 1;
  const selectedRound = (typeof selectedKey === 'number' && rounds.includes(selectedKey))
    ? selectedKey
    : rounds[rounds.length - 1];
  const pills = showRoundPills ? rounds : [selectedRound];
  const stats = getRoundStats(selectedRound);

  let html = `
    <div style="display:flex;flex-direction:column;min-height:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-shrink:0;padding:8px 0 0;">
      <div style="font-family:'Sen',sans-serif;font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;">STATISTICS</div>
      <div style="flex:1;height:1px;background:var(--border);"></div>
      <div style="display:flex;gap:6px;overflow-x:auto;${showRoundPills ? '' : 'display:none;'}">
  `;
  pills.forEach(key => {
    const isActive = key === selectedRound;
    html += `<button onclick="renderTournamentStatsPanel(${key})" style="background:${isActive?'var(--c-fwy)':'rgba(255,255,255,.05)'};color:${isActive?'#fff':'var(--muted)'};border:1px solid ${isActive?'var(--c-fwyl)':'var(--border)'};border-radius:14px;padding:6px 12px;font-family:'Sen',sans-serif;font-size:10px;font-weight:bold;cursor:pointer;white-space:nowrap;transition:all 0.2s;">R${key}</button>`;
  });
  html += `</div></div>`;

  const hideLastDivider = S.mode === 'single';
  stats.forEach((s, idx) => {
    const isLast = idx === stats.length - 1;
    const rowBorder = hideLastDivider && isLast ? 'none' : '1px solid rgba(255,255,255,.05)';
    html += `
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;column-gap:12px;padding:8px 12px;border-bottom:${rowBorder};font-family:'Sen',sans-serif;font-size:11px;">
        <div style="color:var(--muted);min-width:0;">${s.label}</div>
        <div style="color:var(--text);font-weight:bold;text-align:center;">${s.val}</div>
      </div>
    `;
  });

  html += `</div>`;
  statsContainer.innerHTML = html;
  statsContainer.style.display = 'block';
}

function startNextRound() {
  S.currentRound++;
  S.scorecards.push(Array(18).fill(null));
  S.histories.push(Array(18).fill(null));
  S.holeIdx = S.startIdx;
  S._wcUsedThisRound = 0;
  S._wcDiscardedThisRound = 0; 
  S._roundWaterHits = 0;
  S._roundSandHits = 0;
  S._roundRoughHits = 0;
  S._roundPrevWasDoubleOrWorse = false;
  S._roundIceTriggered = false;
  S._roundEndProcessed = false;
  S._roundEndMeta = null;
  _summaryBackTarget = null;
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('summaryModal').classList.remove('show');
  const hc=document.getElementById('hcScreen');
  if(hc) hc.classList.remove('show');
  setMainAppConcealed(true);
  hideMainAppImmediate();
  loadHole();
  saveGameState();
  showSingleRoundSplash();
}

// ═══════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════
function getThemeSetting(){
  try{return localStorage.getItem('gg_theme')||'dark';}catch{return 'dark';}
}
function setThemeSetting(v){
  try{localStorage.setItem('gg_theme',v);}catch{}
}
function syncThemeAssets(){
  const isLight = document.body.classList.contains('theme-light');
  const menuLogoSrc = isLight ? 'assets/dice-light-logo.png' : 'assets/dicegolf-logo.png';
  document.querySelectorAll('#menuScreen .menu-logo .brand-logo-img').forEach(img=>{
    if(img.getAttribute('src') !== menuLogoSrc) img.setAttribute('src', menuLogoSrc);
  });
}
function applyTheme(setting){
  const body=document.body;
  body.classList.remove('theme-light','theme-dark');
  if(setting==='light'){
    body.classList.add('theme-light');
  } else if(setting==='dark'){
    body.classList.add('theme-dark'); 
  } else {
    const prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
    if(!prefersDark) body.classList.add('theme-light');
  }
  syncThemeAssets();
}
function _applyThemeWithCrossfade(setting){
  const body=document.body;
  if(!body){
    applyTheme(setting);
    return;
  }
  body.classList.add('theme-swapping');
  requestAnimationFrame(()=>{
    applyTheme(setting);
    setTimeout(()=>body.classList.remove('theme-swapping'),260);
  });
}
function initTheme(){
  applyTheme(getThemeSetting());
  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{
      if(getThemeSetting()==='system') _applyThemeWithCrossfade('system');
    });
  }
}

function getRollMode(){
  try{return localStorage.getItem('gg_rollmode')||'classic';}catch{return 'classic';}
}
function setRollMode(mode){
  try{localStorage.setItem('gg_rollmode',mode);}catch{}
  // If enabling shake and iOS requires explicit permission, request it now.
  // This is called directly from the toggle onclick, so we are inside a user gesture —
  // the only context iOS allows requestPermission() to be called from.
  if(mode==='haptic'
      && typeof DeviceMotionEvent!=='undefined'
      && typeof DeviceMotionEvent.requestPermission==='function'){
    _loadShakePermission();
    if(!_shakePermissionGranted){
      // Show in-app pre-prompt first; the Allow button calls requestPermission()
      // from its own click handler so the user-gesture context is preserved for iOS.
      updateRollModeUI('haptic');
      _showShakePrePrompt();
      return;
    }
  }
  applyRollMode(mode);
  updateRollModeUI(mode);
}
function updateRollModeUI(mode){
  _setToggle('shakeToggle',mode==='haptic');
}

let _shakeLastTime=0, _shakeLastX=0, _shakeLastY=0, _shakeLastZ=0;
let _shakeListener=null;
let _shakePermissionGranted=false;

function _loadShakePermission(){
  // Removed localStorage cache so WebKit/iOS can natively handle its own permission prompts on toggle
  _shakePermissionGranted = false; 
}
function _saveShakePermission(){
  // Removed
}

function applyRollMode(mode){
  if(_shakeListener){
    window.removeEventListener('devicemotion',_shakeListener);
    _shakeListener=null;
  }
  const rollBtn=document.getElementById('rollBtn');
  if(mode==='haptic'){
    if(rollBtn) rollBtn.textContent='ROLL';
    _loadShakePermission();
    if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){
      if(_shakePermissionGranted){
        // Permission was granted in a prior session — start listener directly.
        _startShakeListener();
      }
      // If not granted, setRollMode handles it from the toggle user-gesture context.
    } else if(typeof DeviceMotionEvent!=='undefined'){
      _startShakeListener();
    }
  } else {
    if(rollBtn) rollBtn.textContent='ROLL';
  }
}

function _showShakePrePrompt(){
  const old = document.getElementById('shakePrePrompt');
  if(old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'shakePrePrompt';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,11,15,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:900;display:flex;align-items:flex-end;justify-content:center;padding:0 0 env(safe-area-inset-bottom,0);animation:fadeIn .22s ease;';
  modal.innerHTML = `
    <div style="background:#161c24;border:1px solid var(--border);border-radius:20px 20px 0 0;max-width:460px;width:100%;padding:24px 22px 28px;text-align:center;animation:slideUp .32s cubic-bezier(.34,1.56,.64,1);">
      <div style="width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);margin:0 auto 18px;"></div>
      <div style="font-size:36px;line-height:1;margin-bottom:10px;">📳</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:22px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">SHAKE TO ROLL</div>
      <div style="font-family:'Sen',sans-serif;font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:20px;">DiceGolf needs access to your device motion so you can shake to roll the dice. Tap <b style="color:var(--text);">Allow Motion</b> to continue.</div>
      <div style="display:flex;gap:8px;flex-direction:column;">
        <button id="shakePreAllow" style="background:var(--c-fwy);color:#fff;border:none;border-radius:12px;padding:14px;font-family:'Bebas Neue',cursive;font-size:17px;letter-spacing:2px;cursor:pointer;transition:transform .2s cubic-bezier(.34,1.56,.64,1);">ALLOW MOTION</button>
        <button id="shakePreCancel" style="background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:12px;padding:12px;font-family:'Sen',sans-serif;font-size:12px;letter-spacing:1px;cursor:pointer;">USE TAP TO ROLL</button>
      </div>
    </div>`;
  if(!document.getElementById('shakeSlideUpStyle')){
    const s = document.createElement('style');
    s.id = 'shakeSlideUpStyle';
    s.textContent = '@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(modal);
  const close = () => { modal.style.animation = 'fadeOut .18s ease forwards'; setTimeout(()=>modal.remove(), 180); };
  modal.querySelector('#shakePreCancel').onclick = () => {
    try{localStorage.setItem('gg_rollmode','classic');}catch{}
    updateRollModeUI('classic');
    close();
  };
  modal.querySelector('#shakePreAllow').onclick = () => {
    close();
    if(typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
      DeviceMotionEvent.requestPermission().then(r => {
        if(r === 'granted'){
          _shakePermissionGranted = true;
          _saveShakePermission();
          _startShakeListener();
          try{localStorage.setItem('gg_rollmode','haptic');}catch{}
          updateRollModeUI('haptic');
          if(typeof showWcToast === 'function') showWcToast('📳 Shake mode active!');
        } else {
          try{localStorage.setItem('gg_rollmode','classic');}catch{}
          updateRollModeUI('classic');
          _showShakePermissionDeniedUI();
        }
      }).catch(() => {
        try{localStorage.setItem('gg_rollmode','classic');}catch{}
        updateRollModeUI('classic');
        _showShakePermissionDeniedUI();
      });
    }
  };
}

function _showShakePermissionDeniedUI(){
  // Remove any existing modal first
  const old=document.getElementById('shakeDeniedModal');
  if(old) old.remove();
  const modal=document.createElement('div');
  modal.id='shakeDeniedModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(7,11,15,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .22s ease;';
  modal.innerHTML=`
    <div style="background:#1a1a2e;border:1px solid var(--border);border-radius:18px;max-width:340px;width:100%;padding:22px 22px 18px;text-align:center;animation:popin .34s cubic-bezier(.34,1.56,.64,1);">
      <div style="font-size:38px;line-height:1;margin-bottom:10px;">📳</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:22px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">MOTION ACCESS NEEDED</div>
      <div style="font-family:'Sen',sans-serif;font-size:13px;color:var(--muted);line-height:1.45;margin-bottom:14px;">
        Shake‑to‑roll needs permission to read device motion. You can grant it now, or enable it later in iOS&nbsp;Settings → Safari → Motion&nbsp;&amp;&nbsp;Orientation&nbsp;Access.
      </div>
      <div style="display:flex;gap:8px;flex-direction:column;">
        <button id="shakeDeniedTry" style="background:var(--c-fwy);color:#fff;border:none;border-radius:10px;padding:12px;font-family:'Bebas Neue',cursive;font-size:16px;letter-spacing:2px;cursor:pointer;">TRY AGAIN</button>
        <button id="shakeDeniedClose" style="background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:10px;font-family:'Sen',sans-serif;font-size:12px;letter-spacing:2px;cursor:pointer;">USE TAP TO ROLL</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close=()=>{ modal.style.animation='fadeOut .2s ease forwards'; setTimeout(()=>modal.remove(),200); };
  modal.querySelector('#shakeDeniedClose').onclick=close;
  modal.querySelector('#shakeDeniedTry').onclick=()=>{
    // Must be re-requested from a user gesture — this click counts.
    if(typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function'){
      DeviceMotionEvent.requestPermission().then(r=>{
        if(r==='granted'){
          _shakePermissionGranted=true;
          _saveShakePermission();
          _startShakeListener();
          try{localStorage.setItem('gg_rollmode','haptic');}catch{}
          updateRollModeUI('haptic');
          close();
          if(typeof showWcToast==='function') showWcToast('📳 Shake mode active!');
        } else {
          // Still denied — keep modal up but nudge to Settings
          const sub=modal.querySelector('div[style*="color:var(--muted)"]');
          if(sub) sub.innerHTML='Still blocked. Open iOS&nbsp;Settings → Safari → <b>Motion &amp; Orientation Access</b> and toggle it on, then return here.';
        }
      }).catch(()=>close());
    } else { close(); }
  };
}
function _showShakePermissionBanner(){
  const existing=document.getElementById('shakePermBanner');
  if(existing)existing.remove();
  const banner=document.createElement('div');
  banner.id='shakePermBanner';
  banner.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:1px solid var(--gold);border-radius:12px;padding:12px 18px;z-index:90;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5);max-width:280px;';
  banner.innerHTML=`
    <div style="font-family:'Sen', sans-serif;font-size:10px;color:var(--gold);letter-spacing:2px;margin-bottom:6px;">📳 SHAKE MODE</div>
    <div style="font-family:'Sen', sans-serif;font-size:10px;color:var(--muted);margin-bottom:10px;">Tap to allow motion access</div>
    <button onclick="requestShakePermission()" style="background:var(--c-fwy);color:#fff;border:none;border-radius:8px;padding:9px 20px;font-family:'Bebas Neue',cursive;font-size:15px;letter-spacing:2px;cursor:pointer;width:100%;">ALLOW MOTION</button>
  `;
  document.body.appendChild(banner);
}

function requestShakePermission(){
  const banner=document.getElementById('shakePermBanner');
  DeviceMotionEvent.requestPermission().then(r=>{
    if(r==='granted'){
      _shakePermissionGranted=true;
      _saveShakePermission(); 
      _startShakeListener();
      if(banner)banner.remove();
      showWcToast('📳 Shake mode active!');
    } else {
      if(banner)banner.innerHTML='<div style="font-family:Sen,sans-serif;font-size:10px;color:#e05252;padding:8px;">Motion access denied. Go to Settings → Safari → Motion & Orientation Access to enable.</div>';
      setTimeout(()=>{if(banner)banner.remove();},5000);
    }
  }).catch(()=>{
    if(banner)banner.remove();
  });
}

function _startShakeListener(){
  const SHAKE_THRESHOLD=15; 
  const SHAKE_COOLDOWN=600;
  _shakeListener=function(e){
    const now=Date.now();
    if(now-_shakeLastTime<SHAKE_COOLDOWN)return;
    const acc=e.accelerationIncludingGravity||e.acceleration;
    if(!acc)return;
    const dx=Math.abs((acc.x||0)-_shakeLastX);
    const dy=Math.abs((acc.y||0)-_shakeLastY);
    const dz=Math.abs((acc.z||0)-_shakeLastZ);
    _shakeLastX=acc.x||0;_shakeLastY=acc.y||0;_shakeLastZ=acc.z||0;
    if(dx+dy+dz>SHAKE_THRESHOLD){
      _shakeLastTime=now;
      const hioOverlay=document.getElementById('hioOverlay');
      const hioBtn=document.getElementById('hioRollBtn');
      if(hioOverlay&&hioOverlay.classList.contains('show')&&hioBtn&&!hioBtn.disabled){
        doHioRoll();
        return;
      }
      if(!S.rolling&&!S.holeDone&&isShotBtnShown('rollBtn')){
        const profiles=loadProfiles();
        const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
        if(profiles[idx]){profiles[idx].shakeRolls=(profiles[idx].shakeRolls||0)+1;saveProfiles(profiles);}
        doRoll();
      }
    }
  };
  window.addEventListener('devicemotion',_shakeListener,{passive:true});
  let _motionVerified=false;
  const _motionCheck=window.addEventListener('devicemotion',()=>{
    _motionVerified=true;
    window.removeEventListener('devicemotion',_motionCheck);
  },{once:true,passive:true});
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&getRollMode()==='haptic'&&_shakePermissionGranted&&!_shakeListener){
    _startShakeListener();
  }
});

function maybeShowShakeBanner(){
  // No-op: permission is now requested inline from the toggle user-gesture, no banner needed.
}

// ═══════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════
function toggleVibSetting(){
  const nowOn=!vibEnabled();
  setVibEnabled(nowOn);
  updateSettingsUI();
  if(nowOn){
    if(navigator.vibrate){
      navigator.vibrate([40,30,40]);
    } else {
      showWcToast('📳 Vibration not supported on this device');
    }
  }
}
function setVibPref(on){setVibEnabled(on);updateSettingsUI();}
function setSoundPref(on){setSoundEnabled(on);updateSettingsUI();}
function setWcPref(on){setWcEnabled(on);updateSettingsUI();}

function _setToggle(id,isOn){
  const el=document.getElementById(id);
  if(el)el.classList.toggle('on',isOn);
}
function updateSettingsUI(){
  _setToggle('soundToggle',soundEnabled());
  _setToggle('vibToggle',vibEnabled());
  _setToggle('wcToggle',wcEnabled());
  _setToggle('shakeToggle',getRollMode()==='haptic');
  updateMetricsUI();
  updateCellLabelUI();
  updateGridFocusSettingUI();
  updateLegendSettingUI();
  updateLegendVisibility();
  
  const _appDisp = document.getElementById('mainApp').style.display;
  const isGameActive = _appDisp && _appDisp !== 'none';
  
  const wcToggle = document.getElementById('wcToggle');
  if (wcToggle) {
      if (isGameActive || hasSavedGame()) {
          wcToggle.style.opacity = '0.4';
          wcToggle.style.pointerEvents = 'none';
      } else {
          wcToggle.style.opacity = '1';
          wcToggle.style.pointerEvents = 'auto';
      }
  }
  
  const tutRow = document.getElementById('settingsTutorialRow');
  if (tutRow) {
      tutRow.style.display = isGameActive ? 'none' : 'flex';
  }
}

function openSettings(fromGame){
  updateSettingsUI();
  const theme=getThemeSetting();
  ['dark','light','system'].forEach(t=>{
    const b=document.getElementById('themeBtn-'+t);
    if(b){
      b.style.background=theme===t?'var(--c-fwy)':'rgba(255,255,255,.08)';
      b.style.borderColor=theme===t?'var(--c-fwyl)':'var(--border)';
      b.style.color=theme===t?'#fff':'var(--muted)';
    }
  });
  // Hide the TUTORIAL header only when opened from the gamescreen gear icon
  const tutHdr=document.getElementById('settingsTutorialHdr');
  if(tutHdr) tutHdr.style.display = fromGame ? 'none' : '';
  document.getElementById('settingsModal').classList.add('show');
}
function _closeProfileLikeModal(id, afterClose){
  const modal=document.getElementById(id);
  if(!modal){
    if(typeof afterClose==='function') afterClose();
    return;
  }
  modal.classList.remove('show');
  if(typeof afterClose==='function'){
    setTimeout(()=>afterClose(),220);
  }
}
function setTheme(t){
  setThemeSetting(t);
  _applyThemeWithCrossfade(t);
  ['dark','light','system'].forEach(id=>{
    const b=document.getElementById('themeBtn-'+id);
    if(b){
      b.style.background=t===id?'var(--c-fwy)':'rgba(255,255,255,.08)';
      b.style.borderColor=t===id?'var(--c-fwyl)':'var(--border)';
      b.style.color=t===id?'#fff':'var(--muted)';
    }
  });
}
function closeSettings(afterClose){_closeProfileLikeModal('settingsModal', afterClose);}
function toggleWcSetting(){
  setWcEnabled(!wcEnabled());
  const btn=document.getElementById('wcToggleBtn');
  if(btn){btn.textContent=wcEnabled()?'ON':'OFF';btn.style.background=wcEnabled()?'var(--c-fwy)':'rgba(255,255,255,.1)';}
}

// ═══════════════════════════════════════════════════════
