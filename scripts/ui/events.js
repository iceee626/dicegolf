// Central Event Binding for Markup That No Longer Uses Inline Handlers

function bindClick(id, handler){
  const el = document.getElementById(id);
  if(el && typeof handler === 'function') el.addEventListener('click', handler);
}

function bindStaticUiEvents(){
  bindClick('tutOverlayBtn', tutNext);

  bindClick('onboardStartBtn', createFirstProfile);
  bindClick('activeProfileBtn', openProfileModal);
  bindClick('menuContinueBtn', continueGame);
  bindClick('menuPlayBtn', navToPlayMode);
  bindClick('menuVersusBtn', navToVersusSetup);
  bindClick('menuSettingsBtn', openSettings);

  bindClick('vsTurnBtn', vsStartTurn);
  bindClick('singleRoundReadyBtn', startSingleRoundFromSplash);
  bindClick('gameBackBtn', openGameScreenMenu);
  bindClick('gameSettingsBtn', () => openSettings(true));
  bindClick('rollBtn', doRoll);
  bindClick('nextShotBtn', doNextShot);
  bindClick('legendToggleBtn', toggleLegend);

  bindClick('themeBtn-dark', () => setTheme('dark'));
  bindClick('themeBtn-light', () => setTheme('light'));
  bindClick('themeBtn-system', () => setTheme('system'));
  bindClick('soundToggle', () => setSoundPref(!soundEnabled()));
  bindClick('vibToggle', () => setVibPref(!vibEnabled()));
  bindClick('shakeToggle', () => setRollMode(getRollMode()==='haptic'?'classic':'haptic'));
  bindClick('wcToggle', () => setWcPref(!wcEnabled()));
  bindClick('zoneLegendToggle', () => setLegendPref(!legendHiddenEnabled()));
  bindClick('metricsToggle', () => setMetricsPref(getMetrics()==='yards'?'meters':'yards'));
  bindClick('labelsToggle', () => setCellLabelModeDirect(getCellLabelMode()==='tap'?'always':'tap'));

  bindClick('wcFab', openWcDrawer);
  bindClick('wcBackdrop', closeWcDrawer);
  bindClick('wcInfoBackBtn', closeWcInfo);
  bindClick('wcCardWrap', revealWcCard);
  bindClick('wcEquipBtn', equipWildcard);
  bindClick('hioRollBtn', doHioRoll);
}

document.addEventListener('DOMContentLoaded', bindStaticUiEvents);
