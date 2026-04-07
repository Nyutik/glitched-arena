// ============================================
// 04-COMBAT.JS — Боевая система
// ============================================
// За что отвечает:
// - handleDamage, triggerDeath, processRevive
// - playerShoot, useOverdrive
// - startBossFight, bossShoot, hitBoss, showBossPhrase
// - spawnMinion, minionExplode
// - spawnItem, collectItem, spawnObstacle
// ============================================

function handleDamage(scene, dmg) {
    if (isDead || isVictory || !isStarted) return;
    combo = 0;
    let isCrit = playerHealth < 20;
    let dColor = isCrit ? '#ff0055' : '#ff0000';
    let dSize = isCrit ? '26px' : '18px';
    showDamageText(scene, player.x, player.y, dmg, dColor, dSize);
    if (isShieldActive) {
        isShieldActive = false;
        saveProgress();
        scene.cameras.main.flash(200, 0, 255, 255);
        return;
    }
    if (playerHealth - dmg <= 0 && (bossHealth <= 0 || isVictory)) {
        playerHealth = 1;
        glitchText.setText(TRANSLATIONS[lang].heroic_survival).setFill("#ffff00");
        scene.cameras.main.flash(500, 255, 255, 0, 0.8);
        scene.physics.world.timeScale = 2;
        scene.time.delayedCall(1000, () => { scene.physics.world.timeScale = 1; glitchText.setText(""); });
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        return;
    }
    playerHealth -= dmg;
    scene.cameras.main.flash(200, 255, 0, 0, 0.5);
    scene.cameras.main.shake(200, 0.02);
    if (playerHealth < maxPlayerHealth * 0.4) {
        glitchText.setText(TRANSLATIONS[lang].sys_failure).setFill("#ff0000");
        scene.time.delayedCall(1000, () => glitchText.setText(""));
    }
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    if (playerHealth <= 0) triggerDeath(scene);
}

function triggerDeath(scene) {
    if (isDead || isVictory) return;
    cleanupScreenFx(scene);
    isMagnetActive = false; isGlitchMode = false; coinsThisRun = 0;
    scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins}`);
    for(let i = 0; i < 25; i++) {
        let frag = scene.add.rectangle(player.x, player.y, 5, 5, currentExplosionColor).setDepth(20);
        scene.physics.add.existing(frag);
        frag.body.setVelocity(Phaser.Math.Between(-400, 400), Phaser.Math.Between(-400, 400));
        scene.tweens.add({ targets: frag, alpha: 0, scale: 0, duration: 1000, onComplete: () => frag.destroy() });
    }
    scene.cameras.main.shake(300, 0.03);
    if (Math.floor(distance) > bestDistance) bestDistance = Math.floor(distance);
    submitScore();
    lastRunState = { isDead: true, pendingDeath: true };
    if (scene.ovrText) { scene.ovrText.destroy(); scene.ovrText = null; }
    player.setVisible(false); player.setTint(0x333333); trailEmitter.stop();
    saveProgress();
    if (glitchText) glitchText.setText("").setBackgroundColor(null);
    scene.physics.pause();
    if (scene.obstacleTimer) scene.obstacleTimer.remove();
    if (scene.shootEvent) scene.shootEvent.remove();
    const overlay = scene.add.container(0, 0).setDepth(5000);
    const deathBg = scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667);
    deathBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 375, 667), Phaser.Geom.Rectangle.Contains);
    overlay.add(deathBg);
    overlay.add(scene.add.graphics().fillStyle(0x000000, 0.9).fillRect(0, 0, 375, 667));
    overlay.add(scene.add.text(187, 150, TRANSLATIONS[lang].lost, { fontSize: '32px', fill: '#ff0000', fontWeight: 'bold' }).setOrigin(0.5));
    const btn = (y, txt, color, act) => {
        let b = scene.add.text(187, y, txt, { fontSize: '18px', fill: '#fff', backgroundColor: color, padding: 15 }).setOrigin(0.5).setInteractive().on('pointerdown', act);
        overlay.add(b);
    };
    btn(280, `${TRANSLATIONS[lang].revive_label} [100]`, coins >= 100 ? '#004444' : '#222', () => {
        if (coins >= 100) { coins -= 100; playerHealth = maxPlayerHealth; isDead = false;
            lastRunState = { isDead: false, pendingDeath: false }; shouldAutoStart = true; scene.scene.restart(); }
    });
    btn(360, level <= 3 ? TRANSLATIONS[lang].revive_label : TRANSLATIONS[lang].watch_ad_label, '#444400', () => {
        if (level <= 3) { processRevive(scene); return; }
        const currentAds = window.adController;
        if (!currentAds) { console.log("Adsgram missing - silent bypass"); processRevive(scene); return; }
        currentAds.show().then((result) => {
            if (result && result.done) processRevive(scene);
            else alert(lang === 'ru' ? "Нужно досмотреть до конца!" : "Watch till the end!");
        }).catch((err) => { console.log("Adsgram failure - silent bypass:", err); processRevive(scene); });
    });
    btn(440, TRANSLATIONS[lang].hard_reboot_label, '#440000', () => {
        level = 1; coins = 0; upgradeLevels = { fire: 0, ultra: 0, speed: 0, health: 0, shield: 0 };
        isDead = false; isPhase2 = false; isPhase3 = false; shouldAutoStart = true;
        lastRunState = { isDead: false, pendingDeath: false }; saveProgress(); scene.scene.restart();
    });
    btn(520, TRANSLATIONS[lang].share_duel, '#004488', () => { shareDuel('loss'); });
}

function processRevive(scene) {
    lastRunState.pendingDeath = false; isDead = false; isVictory = false;
    playerHealth = maxPlayerHealth; saveProgress(); shouldAutoStart = true; scene.scene.restart();
}

function playerShoot() {
    if (isShopOpen || isDead || !isStarted || isPaused) return;
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
    const bColor = skin.bullet;
    if(upgradeLevels.fire > 0) {
        playerBullets.create(player.x-18, player.y, 'pixel').setVelocityY(-750).setTint(bColor);
        playerBullets.create(player.x+18, player.y, 'pixel').setVelocityY(-750).setTint(bColor);
    }
    playerBullets.create(player.x, player.y-20, 'pixel').setVelocityY(-750).setTint(bColor);
}

function useOverdrive() {
    if (overdrive < 100 || isVictory || !isBossFight || !boss || !boss.active) return;
    overdrive = 0; ultraLaserTickAt = 0;
    playSound(this, 'sfx_ultra', { volume: 0.9 });
    if (ultraLaser && ultraLaser.active) { ultraLaser.destroy(); ultraLaser = null; }
    let victoryTriggeredByLaser = false;
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
    ultraLaser = this.add.sprite(player.x, player.y - 300, 'laser').setTint(skin.bullet).setBlendMode(Phaser.BlendModes.ADD).setDepth(6).setAlpha(0.98).setScale(1.35);
    this.cameras.main.flash(200, 255, 255, 255, 0.3);
    this.cameras.main.shake(1200, 0.02);
    this.tweens.add({
        targets: ultraLaser, scaleX: 64, alpha: 0, duration: 1350,
        onUpdate: () => {
            if (victoryTriggeredByLaser || !ultraLaser || !ultraLaser.active || !boss || !boss.active || isVictory || !isBossFight) return;
            ultraLaser.x = player.x + (Math.random() * 10 - 5);
            ultraLaser.y = player.y - 300 + (Math.random() * 4 - 2);
            ultraLaser.alpha = 0.8 + Math.random() * 0.2;
            const now = this.time.now;
            if (now < ultraLaserTickAt) return;
            ultraLaserTickAt = now + 55;
            if (Math.abs(ultraLaser.x - boss.x) <= 125) {
                let laserDamage = level >= 55 ? 38 : level >= 50 ? 35 : level >= 45 ? 31 : level >= 35 ? 27 : level >= 25 ? 23 : 18;
                laserDamage *= currentStats.atk;
                if (isPhase2) laserDamage *= 0.96;
                if (isPhase3) laserDamage *= 0.94;
                bossHealth -= laserDamage;
                if (bossHealth <= 0) {
                    bossHealth = 0; victoryTriggeredByLaser = true;
                    if (ultraLaser && ultraLaser.active) { ultraLaser.destroy(); ultraLaser = null; }
                    triggerVictory(this); return;
                }
            }
        },
        onComplete: () => { if (ultraLaser && ultraLaser.active) { ultraLaser.destroy(); ultraLaser = null; } }
    });
}

function startBossFight(scene) {
    resetBossPhrase(scene); clearBattleTexts(scene);
    obstacles.clear(true, true); bullets.clear(true, true); isBossFight = true;
    scene.cameras.main.shake(1000, 0.02); scene.cameras.main.flash(500, 255, 0, 255, 0.3);
    let alertText = scene.add.text(187, 333, TRANSLATIONS[lang].warning_boss, { fontSize: '32px', fontFamily: 'Arial', fontWeight: 'bold', fill: '#ff0000', align: 'center' }).setOrigin(0.5).setDepth(1000);
    scene.tweens.add({ targets: alertText, alpha: 0, duration: 200, yoyo: true, repeat: 5, onComplete: () => alertText.destroy() });
    boss.setVisible(true).setY(-100);
    scene.tweens.add({ targets: boss, y: 100, duration: 2000, ease: 'Back.easeOut' });
    bossTrail.setVisible(true); distanceText.setText("");
    if (scene.obstacleTimer) scene.obstacleTimer.remove();
    if (level >= 15) {
        glitchText.setText(TRANSLATIONS[lang].boss_detected).setFill("#ff00ff");
        bossTurretL = scene.add.rectangle(boss.x - 40, boss.y, 20, 20, 0x00ffff).setDepth(4);
        bossTurretR = scene.add.rectangle(boss.x + 40, boss.y, 20, 20, 0x00ffff).setDepth(4);
        scene.turretShootEvent = scene.time.addEvent({ delay: 1500, callback: () => {
            if (!isVictory && !isDead) {
                [bossTurretL, bossTurretR].forEach(t => {
                    if (t && t.active) { let b = bullets.create(t.x, t.y, 'pixel').setTint(0x00ffff); scene.physics.moveToObject(b, player, 300); }
                });
            }
        }, loop: true });
    }
    if (level >= 20) {
        bossShields.clear(true, true);
        for(let i = 0; i < 4; i++) { let s = bossShields.create(boss.x, boss.y, 'pixel').setTint(0xff00ff).setScale(4).setAlpha(0.7); s.body.setImmovable(true); }
        glitchText.setText(TRANSLATIONS[lang].defense_engaged).setFill("#ff00ff");
    }
    scene.bossShootEvent = scene.time.addEvent({ delay: isPhase2 ? Math.max(800, 1300 - level * 30) : 1200, callback: bossShoot, callbackScope: scene, loop: true });
    scene.phraseTimer = scene.time.addEvent({ delay: 3800, loop: true, callback: () => {
        if (!isBossFight || isVictory || isDead) return;
        const pool = isPhase2 ? TRANSLATIONS[lang].p2 : TRANSLATIONS[lang].p1;
        const msg = Phaser.Utils.Array.GetRandom(pool);
        const color = isPhase3 ? '#ffffff' : isPhase2 ? '#ff0033' : '#ff00ff';
        const bg = isPhase3 ? '#440000' : null;
        showBossPhrase(scene, msg, color, bg, 2500);
    }});
    scene.minionTimer = scene.time.addEvent({ delay: 4000, callback: spawnMinion, callbackScope: scene, loop: true });
    if (level >= 10) { scene.tweens.add({ targets: boss, scale: { from: 1.2, to: 1.5 }, duration: 800, yoyo: true, repeat: -1, ease: 'Quad.easeInOut' }); } else { boss.setScale(1); }
    if (level >= 35) {
        boss.setTint(0x00ff00).setScale(1.4); if (bossTrail) bossTrail.setParticleTint(0x00ff00);
        glitchText.setText(TRANSLATIONS[lang].quantum_alert).setFill("#00ff00").setBackgroundColor("#002200");
        scene.tweens.add({ targets: boss, x: '+=3', duration: 50, yoyo: true, repeat: -1 });
        scene.teleportEvent = scene.time.addEvent({ delay: 1500, callback: () => {
            if (isBossFight && !isVictory && !isDead && !isPaused) {
                let trap = obstacles.create(boss.x, boss.y, 'pixel').setTint(0xff0000).setScale(4); trap.setData('isTrap', true);
                scene.tweens.add({ targets: trap, alpha: {from: 1, to: 0.2}, duration: 2000, onComplete: () => trap.destroy() });
                let ghost = scene.add.sprite(boss.x, boss.y, 'boss').setTint(0x00ff00).setAlpha(0.6);
                scene.tweens.add({ targets: ghost, scale: 2, alpha: 0, duration: 400, onComplete: () => ghost.destroy() });
                boss.x = Phaser.Math.Between(50, 325); boss.y = Phaser.Math.Between(100, 250);
                scene.cameras.main.flash(150, 0, 255, 0, 0.3);
            }
        }, loop: true });
    } else if (level >= 30) { boss.setTint(0xffffff); if (bossTrail) bossTrail.setParticleTint(0xff00ff); glitchText.setText(TRANSLATIONS[lang].boss_detected).setFill("#ff00ff"); }
}

function bossShoot() {
    if (isShopOpen || isDead || !isBossFight || isPaused || bullets.getLength() > 200) return;
    let baseBullets = 10 + Math.floor(level / 2);
    let count = isPhase3 ? 32 : (isPhase2 ? Math.min(26, baseBullets + 6) : Math.min(22, baseBullets));
    let speed = isPhase3 ? 400 : (280 + level * 7);
    let patternType = Math.floor(this.time.now / 5000) % 2;
    let isSniperLevel = (level % 5 === 0);
    if (isSniperLevel && !isPhase3) { speed += 120; patternType = 1; }
    if (level >= 20 && Math.random() > 0.92 && !this.isSilenceEvent) {
        this.isSilenceEvent = true; let bgm = this.sound.get('bgm');
        if (bgm && isSoundOn) bgm.pause();
        showBossPhrase(this, TRANSLATIONS[lang].audio_glitch, "#ff0000", "#440000", 2000);
        this.cameras.main.flash(500, 255, 0, 0, 0.2);
        this.time.delayedCall(2000, () => {
            if (bgm && isSoundOn) bgm.resume();
            let angleToPlayer = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
            for (let i = -5; i <= 5; i++) { let angle = angleToPlayer + (i * 0.1); bullets.create(boss.x, boss.y, 'pixel').setVelocity(Math.cos(angle) * 550, Math.sin(angle) * 550).setScale(2).setTint(0xff0000); }
            this.isSilenceEvent = false;
        });
        return;
    }
    let bulletColor = level >= 35 ? 0x00ff00 : (isPhase2 ? 0xff0000 : 0xff00ff);
    if (isPhase3) { for (let i = 0; i < count; i++) { let angle = i * (Math.PI * 2 / count) + Math.sin(this.time.now * 0.001) * 2; bullets.create(boss.x, boss.y, 'pixel').setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed).setScale(2).setTint(bulletColor); } }
    else if (patternType === 0) { for (let i = 0; i < count; i++) { let angle = i * (Math.PI * 2 / count); bullets.create(boss.x, boss.y, 'pixel').setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed).setScale(1.5).setTint(bulletColor); } }
    else { let angleToPlayer = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y); let spread = Math.max(0.2, 0.5 - level * 0.02); for (let i = -2; i <= 2; i++) { let angle = angleToPlayer + (i * spread); bullets.create(boss.x, boss.y, 'pixel').setVelocity(Math.cos(angle) * (speed + 40), Math.sin(angle) * (speed + 40)).setScale(1.5).setTint(bulletColor); } }
}

function hitBoss(b, bullet) {
    if (isVictory) return;
    if (bullet) bullet.destroy();
    let dmg = 10 * currentStats.atk; bossHealth -= dmg;
    const hitX = bullet ? bullet.x : boss.x; const hitY = bullet ? bullet.y : boss.y;
    if (bullet) bullet.destroy();
    showDamageText(this, hitX, hitY, dmg, '#00ff00', '16px');
    coinsThisRun += 2; scoreText.setText(`${TRANSLATIONS[lang].credits}: ${coins + coinsThisRun}`);
    let chargeBonus = 2 + (upgradeLevels.ultra * 1.5); overdrive = Math.min(100, overdrive + chargeBonus);
    boss.setTint(0x00ff00);
    this.time.delayedCall(80, () => { if (boss && !isDead) { if (level >= 35) boss.setTint(0x00ff00); else isPhase2 ? boss.setTint(0xff0000) : boss.clearTint(); } });
    let hM = level > 30 ? (13.5 + (level - 30) * 0.22) : (level * 0.45); let maxB = 400 * (1 + hM);
    if (bossHealth <= maxB / 2 && !isPhase2) {
        isPhase2 = true; resetBossPhrase(this); this.phraseTimer = safeRemoveTimer(this.phraseTimer);
        this.time.delayedCall(300, () => {
            if (!isBossFight || isVictory || isDead) return;
            this.phraseTimer = this.time.addEvent({ delay: 3800, loop: true, callback: () => {
                if (!isBossFight || isVictory || isDead) return;
                const pool = isPhase2 ? TRANSLATIONS[lang].p2 : TRANSLATIONS[lang].p1;
                const msg = Phaser.Utils.Array.GetRandom(pool);
                const color = isPhase3 ? '#ffffff' : isPhase2 ? '#ff0000' : '#ff00ff';
                const bg = isPhase3 ? '#440000' : null;
                showBossPhrase(this, msg, color, bg, 2500);
            }});
        });
        boss.setTint(0xff0000); bHealthLabel.setFill('#ff0000'); glitchText.setText(TRANSLATIONS[lang].critical_race).setFill('#ff0000'); if (bossTrail) bossTrail.setParticleTint(0xff0000);
    }
    if (level >= 30 && bossHealth <= maxB * 0.25 && !isPhase3) {
        isPhase3 = true; resetBossPhrase(this);
        glitchText.setText(TRANSLATIONS[lang].system_halt).setFill('#ffffff').setBackgroundColor('#440000').setAlpha(1);
        this.cameras.main.shake(500, 0.05);
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
    if (bossHealth <= 0) { bossHealth = 0; triggerVictory(this); }
}

function showBossPhrase(scene, msg, color = '#ff00ff', bgColor = null, duration = 2600) {
    if (!scene || !isBossFight || isVictory || isDead || !msg) return;
    bossPhraseHideCall = safeRemoveTimer(bossPhraseHideCall);
    if (!bossPhraseText || !bossPhraseText.active) {
        bossPhraseText = scene.add.text(187, 250, '', { fontFamily: 'Arial, sans-serif', fontSize: '20px', fill: color, fontWeight: 'bold', stroke: '#000000', strokeThickness: 6, align: 'center', wordWrap: { width: 300, useAdvancedWrap: true }, lineSpacing: 4 }).setOrigin(0.5).setDepth(130);
    }
    safeKillTweens(scene, bossPhraseText);
    bossPhraseText.setText(msg).setFill(color).setBackgroundColor(bgColor).setAlpha(1).setVisible(true).setScale(1.1);
    scene.tweens.add({ targets: bossPhraseText, scale: 1, duration: 100, ease: 'Back.easeOut' });
    const jitter = scene.time.addEvent({ delay: 50, loop: true, callback: () => { if (!bossPhraseText || !bossPhraseText.active) return; bossPhraseText.setX(187 + (Math.random() * 4 - 2)); } });
    bossPhraseHideCall = scene.time.delayedCall(duration, () => {
        if (jitter) jitter.remove();
        if (!bossPhraseText || !bossPhraseText.active) return;
        scene.tweens.add({ targets: bossPhraseText, alpha: 0, duration: 200, onComplete: () => { if (bossPhraseText && bossPhraseText.active) bossPhraseText.setVisible(false).setX(187); } });
    });
}

function spawnMinion() {
    if (isVictory || isDead || isPaused || !isBossFight) return;
    let minion = minions.create(boss.x, boss.y, 'pixel'); minion.setTint(0x00ff00).setScale(2).setDepth(4); minion.setData('state', 'hunting');
    this.time.delayedCall(1500, () => { if (minion.active) minion.setData('state', 'attacking'); });
    this.time.addEvent({ delay: 800, callback: () => { if (minion.active && minion.y < player.y) { let mb = minionBullets.create(minion.x, minion.y, 'pixel'); mb.setTint(0x00ff00).setVelocityY(450).setScale(1.2); } }, repeat: 4 });
    minion.setVelocity(Phaser.Math.Between(-100, 100), 200);
}

function minionExplode(scene, x, y) {
    let blast = scene.add.circle(x, y, 10, 0x00ff00, 0.4).setDepth(4);
    scene.tweens.add({ targets: blast, radius: 100, alpha: 0, duration: 400, onUpdate: () => {
        bullets.children.each(b => { if (b && b.active) { let dist = Phaser.Math.Distance.Between(x, y, b.x, b.y); if (dist < blast.radius) { b.destroy(); coinsThisRun += 1; } } });
    }, onComplete: () => blast.destroy() });
    if (upgradeLevels.omega > 0) { overdrive = Math.min(100, overdrive + 20); let chargeFlash = scene.add.circle(player.x, player.y, 40, 0xffff00, 0.5); scene.tweens.add({ targets: chargeFlash, scale: 2, alpha: 0, duration: 300, onComplete: () => chargeFlash.destroy() }); }
    for(let i = 0; i < 15; i++) { let p = scene.add.rectangle(x, y, 4, 4, 0x00ff00); scene.physics.add.existing(p); p.body.setVelocity(Phaser.Math.Between(-300, 300), Phaser.Math.Between(-300, 300)); scene.time.delayedCall(400, () => p.destroy()); }
}

function spawnItem() {
    if (!isStarted || isBossFight || isShopOpen || isPaused) return;
    let x = Phaser.Math.Between(50, 320); let rand = Math.random(); let type = 'coin';
    if (rand > 0.92) type = 'nuke';
    else if (rand > 0.84) type = 'magnet';
    else if (rand > 0.74) type = 'slowmo';
    else { let baseHeartChance = level >= 30 ? 0.40 : (level >= 25 ? 0.25 : 0.01); let actualHeartChance = (playerHealth < 40) ? 0.45 : baseHeartChance; if (Math.random() < actualHeartChance) type = 'heart'; else type = 'coin'; }
    let item = items.create(x, -20, type === 'heart' ? 'heart' : 'pixel');
    if (type === 'heart') { item.setTint(0xff0088).setScale(1.2); this.tweens.add({ targets: item, scale: 1.6, duration: 400, yoyo: true, repeat: -1 }); }
    else if (type === 'coin') { item.setTint(0xffff00).setData('type', 'coin').setScale(1.5); this.tweens.add({ targets: item, alpha: 0.5, duration: 200, yoyo: true, repeat: -1 }); }
    else if (type === 'slowmo') item.setTint(0x00ff00).setData('type', 'slowmo').setScale(2.5);
    else if (type === 'nuke') item.setTint(0xff00ff).setData('type', 'nuke').setScale(3).setAngle(45);
    else if (type === 'magnet') item.setTint(0xff00ff).setData('type', 'magnet').setScale(2).setAngle(180);
    item.setData('type', type); item.setVelocityY(250 + (level * 15));
}

function collectItem(p, item) {
    const type = item.getData('type'); item.destroy();
    if (type === 'magnet') { isMagnetActive = true; glitchText.setText(TRANSLATIONS[lang].magnet_on).setFill('#ff00ff'); this.time.delayedCall(8000, () => { isMagnetActive = false; if (glitchText?.active && glitchText.text === TRANSLATIONS[lang].magnet_on) glitchText.setText(''); }); return; }
    if (type === 'heart') { playerHealth = Math.min(maxPlayerHealth, playerHealth + 25); let txt = this.add.text(player.x, player.y, '+25 ' + TRANSLATIONS[lang].hp_label, { fontFamily: 'Arial, sans-serif', fontSize: '18px', fill: '#00ff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 3 }).setDepth(100); this.tweens.add({ targets: txt, y: player.y - 100, alpha: 0, duration: 800, onComplete: () => txt.destroy() }); glitchText.setText(TRANSLATIONS[lang].integrity_restored).setFill('#ff0088'); this.time.delayedCall(1000, () => { if (glitchText?.active && glitchText.text === TRANSLATIONS[lang].integrity_restored) glitchText.setText(''); }); this.cameras.main.flash(300, 255, 0, 136, 0.4); return; }
    if (type === 'nuke') { playSound(this, 'sfx_nuke', { volume: 0.5, stopOnTerminate: true }); this.time.delayedCall(2000, () => { this.sound.stopByKey('sfx_nuke'); }); let wave = this.add.circle(player.x, player.y, 20, 0xff00ff, 0.7).setDepth(2000); this.tweens.add({ targets: wave, radius: 1100, alpha: 0, duration: 1000, ease: 'Expo.easeOut', onComplete: () => wave.destroy() }); this.cameras.main.flash(500, 255, 0, 255, 0.4); this.cameras.main.shake(850, 0.035); obstacles.children.each(obs => { if (!obs || !obs.active) return; for (let i = 0; i < 10; i++) { let frag = this.add.rectangle(obs.x, obs.y, Phaser.Math.Between(4, 9), Phaser.Math.Between(4, 9), 0xff00ff).setDepth(5); this.physics.add.existing(frag); frag.body.setVelocity(Phaser.Math.Between(-650, 650), Phaser.Math.Between(-650, 650)); frag.body.setAngularVelocity(Phaser.Math.Between(-500, 500)); this.tweens.add({ targets: frag, alpha: 0, scaleX: 0, scaleY: 0, duration: Phaser.Math.Between(650, 1100), ease: 'Quad.easeOut', onComplete: () => frag.destroy() }); } }); obstacles.clear(true, true); glitchText.setText(TRANSLATIONS[lang].purified).setFill('#ff00ff'); this.time.delayedCall(1500, () => { if (glitchText?.active && glitchText.text === TRANSLATIONS[lang].purified) glitchText.setText(''); }); return; }
    if (type === 'coin') { coinsThisRun += isGlitchMode ? 30 : 10; updateHudTexts(); return; }
    if (type === 'slowmo') { glitchText.setText(TRANSLATIONS[lang].time_warp).setFill('#00ff00'); this.physics.world.timeScale = 2; this.time.delayedCall(3000, () => { this.physics.world.timeScale = 1; if (glitchText?.active && glitchText.text === TRANSLATIONS[lang].time_warp) glitchText.setText(''); }); return; }
}

function spawnObstacle() {
    if (!isStarted || isBossFight || isShopOpen || isPaused || isVictory || isDead) return;
    if (!obstacles) return;
    const laneXs = [55, 120, 187, 255, 320];
    const baseSpeed = level >= 55 ? 440 : level >= 45 ? 425 : level >= 35 ? 400 : level >= 25 ? 375 : level >= 15 ? 345 : 315;
    const spawnWall = (x, y = -30, scaleX = 1, scaleY = 1, tint = 0xff0000) => { const obstacle = obstacles.create(x, y, 'wall'); obstacle.setTint(tint); obstacle.setScale(scaleX, scaleY); obstacle.setVelocityY(baseSpeed); obstacle.setData('isDrone', false); obstacle.setData('missed', false); return obstacle; };
    const spawnDrone = (x, y = -30) => { const obstacle = obstacles.create(x, y, 'wall'); obstacle.setTint(0xffaa00); obstacle.setScale(0.72, 0.9); obstacle.setVelocityY(baseSpeed + 15); obstacle.setData('isDrone', true); obstacle.setData('missed', false); return obstacle; };
    const patterns = {
        single: () => { spawnWall(Phaser.Utils.Array.GetRandom(laneXs), -30, 0.95, 1); },
        staggered: () => { let a = Phaser.Math.Between(0, laneXs.length - 1); let b = Phaser.Math.Between(0, laneXs.length - 1); while (b === a) b = Phaser.Math.Between(0, laneXs.length - 1); spawnWall(laneXs[a], -30, 0.95, 1); spawnWall(laneXs[b], -130, 0.95, 1); },
        wideGate: () => { const safeLeftIndex = Phaser.Math.Between(0, laneXs.length - 2); laneXs.forEach((x, i) => { if (i !== safeLeftIndex && i !== safeLeftIndex + 1) spawnWall(x, -30, 0.82, 1); }); },
        tripleFair: () => { const safeLeftIndex = Phaser.Math.Between(0, laneXs.length - 2); laneXs.forEach((x, i) => { if (i < safeLeftIndex || i > safeLeftIndex + 1) spawnWall(x, -30, 0.8, 1); }); },
        droneFair: () => { const safeIndex = Phaser.Math.Between(0, laneXs.length - 1); laneXs.forEach((x, i) => { if (i !== safeIndex && Math.random() < 0.5) spawnDrone(x, i % 2 === 0 ? -30 : -110); }); },
        doubleGap: () => { const safeIndex = Phaser.Math.Between(0, laneXs.length - 1); laneXs.forEach((x, i) => { if (i !== safeIndex) spawnWall(x, -30, 0.82, 0.95); }); }
    };
    const pickPattern = (pool) => { let filtered = pool; const densePatterns = ['doubleGap', 'tripleFair', 'droneFair']; if (densePatterns.includes(lastObstaclePattern)) { filtered = pool.filter(p => !densePatterns.includes(p)); if (!filtered.length) filtered = pool; } const next = Phaser.Utils.Array.GetRandom(filtered); lastObstaclePattern = next; return next; };
    let pool;
    if (level < 8) pool = ['single', 'single', 'staggered'];
    else if (level < 20) pool = ['single', 'single', 'staggered', 'wideGate', 'droneFair'];
    else if (level < 35) pool = ['single', 'staggered', 'wideGate', 'tripleFair', 'droneFair'];
    else pool = ['single', 'staggered', 'wideGate', 'tripleFair', 'droneFair', 'doubleGap'];
    const chosen = pickPattern(pool); patterns[chosen]();
}