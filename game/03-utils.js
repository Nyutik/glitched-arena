// ============================================
// 03-UTILS.JS — Утилиты и сохранения
// ============================================
// За что отвечает:
// - playSound, safeHaptic, safeKillTweens, safeRemoveTimer
// - ensureBgm, cleanupScreenFx, clearBattleTexts, resetBossPhrase
// - hasTelegramUser, getTelegramUser
// - saveProgress, loadProgress
// ============================================

function playSound(scene, key, config = {}) {
    if (!scene || !scene.sound || !scene.cache.audio.exists(key)) return false;
    scene.sound.play(key, config);
    return true;
}

function hasTelegramUser() {
    return !!window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
}

function getTelegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

function safeHaptic(type = 'impact', style = 'medium') {
    try {
        const tg = window.Telegram?.WebApp;
        if (!tg || !tg.HapticFeedback) return;
        if (type === 'impact' && tg.HapticFeedback.impactOccurred) { tg.HapticFeedback.impactOccurred(style); return; }
        if (type === 'notification' && tg.HapticFeedback.notificationOccurred) { tg.HapticFeedback.notificationOccurred(style); return; }
    } catch (e) {}
}

function safeKillTweens(scene, target) {
    if (!scene || !scene.tweens || !target) return;
    try { scene.tweens.killTweensOf(target); } catch (e) {}
}

function safeRemoveTimer(timer) {
    if (!timer) return null;
    try { timer.remove(false); } catch (e) {}
    return null;
}

function ensureBgm(scene) {
    if (!scene || !scene.sound) return;
    const bgm = scene.sound.get('bgm');
    if (!isSoundOn) { if (bgm) bgm.stop(); return; }
    if (!bgm) { scene.sound.play('bgm', { loop: true, volume: 0.15 }); return; }
    if (bgm.isPaused) { bgm.resume(); return; }
    if (!bgm.isPlaying) bgm.play({ loop: true, volume: 0.15 });
}

function cleanupScreenFx(scene) {
    const safeDestroy = (target) => {
        if (!target) return;
        try { safeKillTweens(scene, target); if (target.active || target.scene) target.destroy(); } catch (e) {}
    };
    safeDestroy(ultraLaser); ultraLaser = null;
    if (scene?.ovrText) { safeDestroy(scene.ovrText); scene.ovrText = null; }
    if (Array.isArray(victoryFx)) { victoryFx.forEach(obj => safeDestroy(obj)); victoryFx = []; }
    if (scene?.children?.list?.length) {
        scene.children.list.filter(obj => obj && obj.active && obj.texture && obj.texture.key === 'laser').forEach(obj => safeDestroy(obj));
    }
}

function clearBattleTexts(scene) {
    bossPhraseHideCall = safeRemoveTimer(bossPhraseHideCall);
    victoryTextJitter = safeRemoveTimer(victoryTextJitter);
    if (bossPhraseText) {
        safeKillTweens(scene, bossPhraseText);
        if (bossPhraseText.active) bossPhraseText.setText('').setAlpha(0).setVisible(false).setBackgroundColor(null);
    }
    if (glitchText) {
        safeKillTweens(scene, glitchText);
        if (glitchText.active) glitchText.setText('').setAlpha(1).setVisible(false).setBackgroundColor(null);
    }
}

function resetBossPhrase(scene) {
    bossPhraseHideCall = safeRemoveTimer(bossPhraseHideCall);
    if (!bossPhraseText || !bossPhraseText.active) return;
    safeKillTweens(scene, bossPhraseText);
    bossPhraseText.setText('').setAlpha(0).setVisible(false).setBackgroundColor(null).setScale(1).setY(250);
}

// --- СИСТЕМА СОХРАНЕНИЙ ---

function saveProgress() {
    let currentDist = Math.floor(distance);
    if (currentDist > bestDistance) bestDistance = currentDist;
    localStorage.setItem('GLITCHED_ARENA_MASTER_SAVE_V2', JSON.stringify({
        level, lang, upgradeLevels, bestLevel, coins, bestDistance, maxPlayerHealth,
        isShieldActive, yOffset, currentShape, currentSkin, isDeadInSave: isDead,
        totalDistance, bossesKilled, achievements, currentExplosionColor, lastRunState
    }));
}

function loadProgress() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
        lang = (window.Telegram.WebApp.initDataUnsafe.user.language_code === 'ru') ? 'ru' : 'en';
    }
    const saved = localStorage.getItem('GLITCHED_ARENA_MASTER_SAVE_V2');
    if (saved) {
        const p = JSON.parse(saved);
        if (p.lang) lang = p.lang;
        level = p.level || 1; bestLevel = p.bestLevel || 1; bestDistance = p.bestDistance || 0;
        coins = p.coins || 0; totalDistance = p.totalDistance || 0; bossesKilled = p.bossesKilled || 0;
        achievements = p.achievements || { flawless: false, rich: false, marathon: false };
        maxPlayerHealth = p.maxPlayerHealth || 100; isShieldActive = p.isShieldActive || false;
        currentShape = p.currentShape || 'classic'; currentSkin = p.currentSkin || 'classic';
        yOffset = p.yOffset !== undefined ? p.yOffset : -50; isDead = p.isDeadInSave || false;
        lastRunState = p.lastRunState || { isDead: false, pendingDeath: false };
        currentExplosionColor = p.currentExplosionColor || 0xff0000;
        upgradeLevels = { ...upgradeLevels, ...p.upgradeLevels };
        runGoal = 700 + (level - 1) * 100;
    }
}

// Adsgram init
window.addEventListener('load', () => {
    if (window.Adsgram) {
        adController = window.Adsgram.init({ blockId: "25945" });
    }
});