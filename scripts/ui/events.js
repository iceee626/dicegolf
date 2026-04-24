// Central Event Binding for Markup That No Longer Uses Inline Handlers

function bindClick(id, handler){
  const el = document.getElementById(id);
  if(el && typeof handler === 'function') el.addEventListener('click', handler);
}

function bindStaticUiEvents(){
  bindClick('tutOverlayBtn', tutNext);
  bindClick('tutPromptPlayBtn', startTutorial);
  bindClick('tutPromptSkipBtn', skipTutorial);

  bindClick('onboardStartBtn', createFirstProfile);
  bindClick('activeProfileBtn', openProfileModal);
  bindClick('menuContinueBtn', continueGame);
  bindClick('menuPlayBtn', navToPlayMode);
  bindClick('menuVersusBtn', navToVersusSetup);
  bindClick('menuSettingsBtn', openSettings);

  bindClick('versusSetupBackBtn', () => navBack('menuScreen'));
  bindClick('versusModeInfoBtn', () => openModeInfo('versus'));
  bindClick('vs1Icon', () => toggleVsEmoji(1));
  bindClick('vs2Icon', () => toggleVsEmoji(2));
  bindClick('versusSetupNextBtn', navToVsOptions);
  bindClick('versusOptionsBackBtn', () => navBack('versusSetupScreen'));
  bindClick('vsFormatStroke', () => vsSetFormat('stroke'));
  bindClick('vsFormatMatch', () => vsSetFormat('match'));
  bindClick('vsR-1', () => vsSetRounds(1));
  bindClick('vsR-2', () => vsSetRounds(2));
  bindClick('vsR-3', () => vsSetRounds(3));
  bindClick('vsR-4', () => vsSetRounds(4));
  bindClick('vsH-18', () => vsSetHoles('18'));
  bindClick('vsH-front', () => vsSetHoles('front'));
  bindClick('vsH-back', () => vsSetHoles('back'));
  bindClick('vsDiff-1', () => vsSetDiff(1));
  bindClick('vsDiff-2', () => vsSetDiff(2));
  bindClick('vsDiff-3', () => vsSetDiff(3));
  bindClick('versusOptionsNextBtn', vsStartFromOptions);

  bindClick('playModeBackBtn', () => navBack('menuScreen'));
  bindClick('playModeInfoBtn', () => openModeInfo('play'));
  bindClick('singleModeBtn', () => navToModeDifficulty('single'));
  bindClick('tournamentModeBtn', () => navToModeDifficulty('tournament'));
  bindClick('customModeBtn', navToCustom);
  bindClick('customBackBtn', () => navBack('playModeScreen'));
  bindClick('cr-1', () => setCustomRounds(1));
  bindClick('cr-2', () => setCustomRounds(2));
  bindClick('cr-3', () => setCustomRounds(3));
  bindClick('cr-4', () => setCustomRounds(4));
  bindClick('ch-18', () => setCustomHoles('18'));
  bindClick('ch-front', () => setCustomHoles('front'));
  bindClick('ch-back', () => setCustomHoles('back'));
  bindClick('cdiff-btn-1', () => setCustomDiff(1));
  bindClick('cdiff-btn-2', () => setCustomDiff(2));
  bindClick('cdiff-btn-3', () => setCustomDiff(3));
  bindClick('customNextBtn', () => navToCourse('custom'));
  bindClick('courseBackBtn', navBackFromCourse);
  bindClick('courseLittlePinesBtn', () => selectCourse('little-pines'));
  bindClick('coursePacificBeachBtn', () => selectCourse('pacific-beach'));
  bindClick('courseDesertLinksBtn', () => selectCourse('desert-golf-links'));
  bindClick('courseSeptembraNationalBtn', () => selectCourse('septembra-national'));
  bindClick('vsCourseTeeOffBtn', teeOffFromCourse);
  bindClick('diffBackBtn', () => navBack('playModeScreen'));
  bindClick('diff-btn-1', () => setDiff(1));
  bindClick('diff-btn-2', () => setDiff(2));
  bindClick('diff-btn-3', () => setDiff(3));
  bindClick('diffNextBtn', showCourseAfterDiff);

  bindClick('vsTurnBtn', vsStartTurn);
  bindClick('singleRoundReadyBtn', startSingleRoundFromSplash);
  bindClick('gameBackBtn', openGameScreenMenu);
  bindClick('gameSettingsBtn', () => openSettings(true));
  bindClick('rollBtn', doRoll);
  bindClick('nextShotBtn', doNextShot);
  bindClick('legendToggleBtn', toggleLegend);
  bindClick('gameMenuResumeBtn', resumeGameScreenMenu);
  bindClick('gameMenuSaveBtn', saveAndMenuFromGameScreen);
  bindClick('gameMenuAbandonBtn', abandonFromGameScreenMenu);
  bindClick('sumBackBtn', summaryGoBack);
  bindClick('ovSummaryBtn', () => openSummaryTransition(S.currentRound, 'overlay'));
  bindClick('histCloseBtn', closeHist);

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
  bindClick('settingsCloseBtn', closeSettings);
  bindClick('settingsTutorialPlayBtn', () => closeSettings(startTutorialFromSettings));
  bindClick('editProfileCloseBtn', closeEditProfile);
  bindClick('editProfileIconPreview', focusIconPicker);
  bindClick('editProfileSaveBtn', saveEditProfile);
  bindClick('editProfileCancelBtn', closeEditProfile);
  bindClick('profileModalCloseBtn', closeProfileModal);
  bindClick('profileCreateBtn', saveNewProfile);
  bindClick('profileCreateCancelBtn', cancelNewProfile);
  bindClick('profileHubBackBtn', profileHubBackToHome);
  bindClick('profileHubCloseBtn', closeProfileModal);

  bindClick('wcFab', openWcDrawer);
  bindClick('wcBackdrop', closeWcDrawer);
  bindClick('wcInfoOpenBtn', openWcInfo);
  bindClick('wcDrawerCloseBtn', closeWcDrawer);
  bindClick('wcInfoBackBtn', closeWcInfo);
  bindClick('wcCardWrap', revealWcCard);
  bindClick('wcEquipBtn', equipWildcard);
  bindClick('hioRollBtn', doHioRoll);
  bindClick('confirmNoBtn', closeConfirm);
  bindClick('alertOkBtn', () => document.getElementById('alertModal').classList.remove('show'));
  bindClick('playModeInfoOverlay', () => closeModeInfo('play'));
  bindClick('playModeInfoCard', (event) => event.stopPropagation());
  bindClick('playModeInfoCloseBtn', () => closeModeInfo('play'));
  bindClick('versusModeInfoOverlay', () => closeModeInfo('versus'));
  bindClick('versusModeInfoCard', (event) => event.stopPropagation());
  bindClick('versusModeInfoCloseBtn', () => closeModeInfo('versus'));
}

document.addEventListener('DOMContentLoaded', bindStaticUiEvents);
