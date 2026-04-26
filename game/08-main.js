// ============================================
// 08-MAIN.JS — Игровой цикл и запуск
// ============================================
// За что отвечает:
// - preload(), create(), update()
// - startRun(), togglePause(), generatePlayerTexture()
// - syncUserData(), submitScore()
// - loadProgress() + new Phaser.Game()
// ============================================

function preload() {
    this.load.audio('sfx_ultra', ASSETS.SFX_ULTRA); this.load.audio('bgm', ASSETS.BGM); this.load.audio('sfx_combo', ASSETS.SFX_COMBO); this.load.audio('sfx_nuke', ASSETS.SFX_NUKE);
    let g = this.make.graphics({ x: 0, y: 0, add: false });
    g.clear().lineStyle(4, 0xff00ff).strokeCircle(30, 30, 26).lineStyle(2, 0x00ffff).strokeRect(15, 15, 30, 30).fillStyle(0xff00ff, 1).fillTriangle(30, 20, 20, 40, 40, 40); g.generateTexture('boss', 60, 60);
    g.clear().fillStyle(0xffffff).fillRect(0, 0, 8, 8).generateTexture('pixel', 8, 8);
    g.clear().fillStyle(0xffff00).fillRect(0, 0, 25, 600).generateTexture('laser', 25, 600);
    g.clear().fillStyle(0xff0000, 0.9).fillRect(0, 0, 80, 25).generateTexture('wall', 80, 25);
    g.clear().lineStyle(2, 0x00ffff, 0.5).strokeCircle(25, 25, 22).generateTexture('shield_aura', 50, 50);
    g.clear().fillStyle(0xff0088).fillTriangle(15, 10, 5, 20, 25, 20).fillCircle(10, 10, 6).fillCircle(20, 10, 6); g.generateTexture('heart', 30, 30);
    g.clear(); g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 32);
 g.fillStyle(0xffffff, 0.3).fillRect(-1, 2, 4, 28);
    g.clear(); g.fillStyle(0x333333).fillRect(0, 5, 40, 30); g.fillStyle(0x000000).fillRect(4, 9, 32, 22); g.fillStyle(0x00ff00).fillRect(10, 15, 4, 4); g.fillStyle(0x00ff00).fillRect(26, 15, 4, 4); g.lineStyle(2, 0x00ff00).lineBetween(12, 25, 28, 25); g.generateTexture('gary_avatar', 40, 40);
    g.generateTexture('fast_streak', 4, 32); g.destroy();
}

function create() {
    if (window.Telegram?.WebApp) { 
        const tg = window.Telegram.WebApp;
        tg.expand(); 
        tg.ready();
        
        try {
            if (tg.setHeaderColor) tg.setHeaderColor('#000000');
            if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
            if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
        } catch(e) {
            console.log("Telegram WebApp API feature not supported:", e);
        }
    }
    if (window.adController) adController = window.adController;
    currentStats = getShipStats();
    isPhase3 = false; isVictory = false; isShopOpen = false; isDead = false; isBossFight = false; isStarted = false; isPaused = false; isPhase2 = false;
    const bootHealth = 100 + (upgradeLevels.meta_plating || 0) * 10 + (upgradeLevels.health || 0) * 25 + currentStats.hpBonus;
    distance = 0; overdrive = 0; coinsThisRun = 0; playerHealth = bootHealth; maxPlayerHealth = bootHealth; isMagnetActive = false; isGlitchMode = false;
    if (this.physics?.world) this.physics.world.timeScale = 1;
    
    this.cameras.main.setBackgroundColor('#000000');
    
    const pTex = generatePlayerTexture(this);
    player = this.physics.add.sprite(187, 600, pTex).setDepth(10).setCollideWorldBounds(true);
    shieldAura = this.add.sprite(player.x, player.y, 'shieldaura').setDepth(11).setVisible(false);
    this.starsSlow = this.add.particles(0, 0, 'pixel', { x: { min: 0, max: 375 }, y: -10, speedY: { min: 20, max: 50 }, scale: 0.2, alpha: 0.3, lifespan: 10000, frequency: 100, tint: 0x5555ff });
    this.starsMed = this.add.particles(0, 0, 'pixel', { x: { min: 0, max: 375 }, y: -10, speedY: { min: 80, max: 150 }, scale: 0.4, alpha: 0.6, lifespan: 5000, frequency: 200, tint: 0x00ffff });
    this.starsFast = this.add.particles(0, 0, 'fast_streak', { x: { min: -50, max: 425 }, y: -50, speedY: { min: 600, max: 1200 }, scaleY: { start: 1, end: 1.5, ease: 'Quad.easeIn' }, scaleX: { min: 0.1, max: 0.3 }, alpha: { start: 0.6, end: 0 }, lifespan: 1500, frequency: 30, tint: 0xccffff, blendMode: 'ADD' });
    this.add.grid(187, 333, 800, 1200, 40, 40, 0x00ffff, 0.03);
    obstacles = this.physics.add.group(); bullets = this.physics.add.group(); playerBullets = this.physics.add.group(); playerMissiles = this.physics.add.group(); bossShields = this.physics.add.group(); items = this.physics.add.group(); minions = this.physics.add.group(); minionBullets = this.physics.add.group();
    this.isFirstMove = false;
    this.input.on('pointerdown', p => { if (!isStarted || isShopOpen || isDead || isPaused || !player?.active) return; const isHudTap = p.y < 90; if (isHudTap) return; if (!this.isFirstMove) this.isFirstMove = true; player.x = Phaser.Math.Clamp(p.x, 20, 355); player.y = Phaser.Math.Clamp(p.y + yOffset, 80, 620); if (shieldAura) shieldAura.setPosition(player.x, player.y); if (overdrive >= 100 && !isVictory && isBossFight) useOverdrive.call(this); });
    this.input.on('pointermove', p => { if (!isStarted || isShopOpen || isDead || isPaused || !player?.active) return; if (this.isFirstMove) { player.x = Phaser.Math.Clamp(p.x, 20, 355); player.y = Phaser.Math.Clamp(p.y + yOffset, 80, 620); if (shieldAura) shieldAura.setPosition(player.x, player.y); } });
    const skin = SKINDATA[currentSkin] || SKINDATA.classic;
    trailEmitter = this.add.particles(0, 0, 'pixel', { speed: 60, scale: { start: 0.6, end: 0 }, alpha: { start: 0.4, end: 0 }, lifespan: 600, blendMode: 'ADD', follow: player, tint: skin.trail });
    
    bulletTrailEmitter = this.add.particles(0, 0, 'pixel', {
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.3, end: 0 },
        lifespan: 100,
        blendMode: 'ADD',
        emitting: false
    });
    boss = this.physics.add.sprite(187, -200, 'boss').setDepth(5).setImmovable(true).setVisible(false).clearTint();
    bossTrail = this.add.particles(0, 0, 'pixel', { speed: 40, scale: { start: 0.9, end: 0 }, alpha: { start: 0.5, end: 0 }, lifespan: 700, blendMode: 'ADD', tint: 0xff00ff, follow: boss }); bossTrail.setParticleTint(0xff00ff); bossTrail.setVisible(false);
    const fontUI = 'Arial, sans-serif';
    scoreText = this.add.text(10, 15, `${TRANSLATIONS[lang].credits}: ${coins}`, { fontFamily: fontUI, fontSize: '14px', fill: '#ffff00' }).setDepth(100);
    levelText = this.add.text(365, 15, `${TRANSLATIONS[lang].sector}: ${level}`, { fontFamily: fontUI, fontSize: '14px', fill: '#ff00ff' }).setOrigin(1, 0).setDepth(100);
    bestText = this.add.text(10, 35, `${TRANSLATIONS[lang].best}: ${bestLevel}`, { fontFamily: fontUI, fontSize: '10px', fill: '#00ff00' }).setDepth(100);
    bestDistText = this.add.text(187, 35, `${TRANSLATIONS[lang].max_dist}: ${bestDistance}m`, { fontFamily: fontUI, fontSize: '12px', fill: '#ffff00', fontWeight: 'bold' }).setOrigin(0.5, 0).setDepth(100);
    let pauseBg = this.add.rectangle(335, 42, 60, 20, 0xff00ff, 0.2).setDepth(99).setInteractive();
    let pauseBtn = this.add.text(335, 42, TRANSLATIONS[lang].pause_text, { fontSize: '11px', fontFamily: fontUI, fill: '#fff' }).setOrigin(0.5).setDepth(100).setInteractive();
    const doPause = () => togglePause.call(this); pauseBtn.on('pointerdown', doPause); pauseBg.on('pointerdown', doPause);
    pHealthLabel = this.add.text(10, 65, 'YOU 100/100', { fontFamily: fontUI, fontSize: '12px', fill: '#00ffff' }).setDepth(100);
    bHealthLabel = this.add.text(365, 65, '', { fontFamily: fontUI, fontSize: '12px', fill: '#ff00ff' }).setOrigin(1, 0).setDepth(100);
    rankXPText = this.add.text(365, 80, '', { fontFamily: fontUI, fontSize: '10px', fill: '#ffaa00' }).setOrigin(1, 0).setDepth(100);
    distanceText = this.add.text(187, 105, '', { fontFamily: fontUI, fontSize: '14px', fill: '#00ffff', align: 'center' }).setOrigin(0.5, 0).setDepth(100);
    glitchText = this.add.text(187, 285, '', { fontFamily: fontUI, fontSize: '20px', stroke: '#000', strokeThickness: 6, align: 'center', wordWrap: { width: 320, useAdvancedWrap: true }, lineSpacing: 2 }).setOrigin(0.5).setDepth(100);
    overdriveBar = this.add.graphics().setDepth(100); roadBar = this.add.graphics().setDepth(100); this.overheadGfx = this.add.graphics().setDepth(11);
    
    // --- ОБРАБОТКА ПОПАДАНИЙ В ПРЕПЯТСТВИЯ (ДЛЯ ЭЛИТНЫХ ВРАГОВ) ---
    this.physics.add.overlap(playerBullets, obstacles, (bullet, obs) => {
        bullet.destroy();
        let spark = this.add.circle(bullet.x, bullet.y, 3, 0x00ffff).setDepth(20);
        this.tweens.add({ targets: spark, scale: 2, alpha: 0, duration: 150, onComplete: () => spark.destroy() });

        if (obs.getData('isElite')) {
            let hp = obs.getData('hp') - 1;
            obs.setData('hp', hp);
            this.cameras.main.shake(50, 0.005);
            if (hp <= 0) {
                let ox = obs.x; let oy = obs.y;
                obs.destroy();
                minionExplode(this, ox, oy);
                coinsThisRun += 25; 
                updateHudTexts();
                if (glitchText) { glitchText.setText(TRANSLATIONS[lang].elite_purged).setFill('#00ffff'); this.time.delayedCall(800, () => { if (glitchText.text === TRANSLATIONS[lang].elite_purged) glitchText.setText(''); }); }
            } else {
                obs.setTint(0xffffff);
                this.time.delayedCall(50, () => { if (obs.active) obs.setTint(0x00ffff); });
            }
        }
    });

    this.physics.add.overlap(player, obstacles, (p, o) => { 
        const earlyDifficulty = getEarlyRunDifficulty();
        if (currentShape === 'phase' && upgradeLevels.ship_phase > 0 && Math.random() < 0.10) {
            o.destroy();
            if (glitchText) glitchText.setText(TRANSLATIONS[lang].phase_shift).setFill('#aa00ff');
            this.time.delayedCall(500, () => { if (glitchText && glitchText.text === TRANSLATIONS[lang].phase_shift) glitchText.setText(''); });
            this.cameras.main.flash(100, 170, 0, 255, 0.3);
            return;
        }
        o.destroy(); handleDamage(this, earlyDifficulty.obstacleHit); 
    });
    this.physics.add.overlap(player, bullets, (p, b) => { 
        const earlyDifficulty = getEarlyRunDifficulty();
        if (currentSkin === 'void_skin' && Math.random() < 0.03) {
            b.destroy();
            if (glitchText) glitchText.setText(TRANSLATIONS[lang].void_dodge).setFill('#aa00ff');
            this.time.delayedCall(500, () => { if (glitchText && glitchText.text === TRANSLATIONS[lang].void_dodge) glitchText.setText(''); });
            return;
        }
        if (level >= 70 && boss && boss.active) {
            const dist = Phaser.Math.Distance.Between(b.x, b.y, p.x, p.y);
            if (dist < voidAbsorbRadius + 60 && Math.random() < 0.4) {
                absorbedBullets++;
                voidChargeLevel = Math.min(absorbedBullets / 20, 1);
                b.destroy();
                const absorbFx = this.add.circle(b.x, b.y, 10, 0xaa00ff, 0.8).setDepth(150);
                this.tweens.add({ targets: absorbFx, scale: 2, alpha: 0, duration: 300, onComplete: () => absorbFx.destroy() });
                if (absorbedBullets % 5 === 0) {
                    if (glitchText) glitchText.setText(`${TRANSLATIONS[lang].void_charge}${absorbedBullets}`).setFill('#aa00ff');
                    this.time.delayedCall(500, () => { if (glitchText && glitchText.text.includes(TRANSLATIONS[lang].void_charge)) glitchText.setText(''); });
                }
                return;
            }
        }
        b.destroy(); 
        let dmg = earlyDifficulty.bulletHit;
        if (level >= 40 && !isInSafeZone()) dmg = 25;
        if (level >= 60 && isInStormZone()) dmg = 20;
        if (level >= 70 && absorbedBullets > 0) {
            const extraDmg = Math.min(absorbedBullets * 2, 30);
            dmg += extraDmg;
            absorbedBullets = 0;
            if (glitchText) glitchText.setText(TRANSLATIONS[lang].void_strike).setFill('#ff0000');
            this.time.delayedCall(500, () => { if (glitchText && glitchText.text === TRANSLATIONS[lang].void_strike) glitchText.setText(''); });
        }
        bossDamageTaken += dmg;
        handleDamage(this, dmg); 
    });
    this.physics.add.overlap(boss, playerBullets, hitBoss, null, this);
    this.physics.add.overlap(boss, playerMissiles, hitBoss, null, this);
    this.physics.add.overlap(player, items, collectItem, null, this);
    this.physics.add.overlap(minions, playerBullets, (minion, bullet) => { let mx = minion.x; let my = minion.y; minion.destroy(); bullet.destroy(); minionExplode(this, mx, my); checkDailyQuest(this, 'kill50'); awardRankXP(this, 5, 'kill'); });
    this.physics.add.overlap(minions, playerMissiles, (minion, m) => { let mx = minion.x; let my = minion.y; minion.destroy(); m.destroy(); minionExplode(this, mx, my); checkDailyQuest(this, 'kill50'); awardRankXP(this, 5, 'kill'); });
    this.physics.add.overlap(player, minionBullets, (p, b) => { b.destroy(); handleDamage(this, getEarlyRunDifficulty().minionBulletHit); });
    this.physics.add.overlap(player, minions, (p, m) => { m.destroy(); handleDamage(this, getEarlyRunDifficulty().minionHit); });
    this.physics.add.overlap(bossShields, playerBullets, (s, b) => { b.destroy(); s.setAlpha(1); this.time.delayedCall(100, () => s.setAlpha(0.4)); });
    comboPopText = this.add.text(0, 0, '', { fontFamily: fontUI, fontSize: '18px', fill: '#00ff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.rainbowIndex = 0;
    this.time.addEvent({ delay: 100, callback: () => {
        if (currentSkin === 'rainbow' && trailEmitter && trailEmitter.active) {
            this.rainbowIndex = (this.rainbowIndex + 1) % rainbowColors.length;
            trailEmitter.setParticleTint(rainbowColors[this.rainbowIndex]);
        }
    }, loop: true });
    if (upgradeLevels.helper_autoheal > 0) {
        this.healTimer = this.time.addEvent({ delay: 10000, callback: () => {
            if (isStarted && !isDead && player && player.active && playerHealth < maxPlayerHealth) {
                playerHealth = Math.min(maxPlayerHealth, playerHealth + 5);
                updateHudTexts();
                if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        }, loop: true });
    }
    if (upgradeLevels.helper_drone > 0) {
        this.droneTimer = this.time.addEvent({ delay: 3000, callback: () => {
            if (isStarted && !isDead && player && player.active) {
                const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
                let droneBullet = playerBullets.create(player.x, player.y - 30, 'pixel');
                droneBullet.setVelocityY(-750).setTint(skin.bullet).setAlpha(0.7);
            }
        }, loop: true });
    }
    syncUserData.call(this).then(() => {
        prepareOfflineEarnings();
        initDailyLogin(this);
    });
    updateHudTexts();
    if (!localStorage.getItem('GLITCHED_ARENA_INTRO_DONE')) showGaryIntro(this);
    if (shouldAutoStart) startRun(this); else showMenu(this);
}

function update(time, delta) {
    if (!isStarted || isShopOpen || isVictory || isDead || isPaused) return;
    if (player && player.active && !isPaused) { const prevX = this._prevPlayerX ?? player.x; const driftX = player.x - prevX; this._prevPlayerX = player.x; let targetAngle = this.isFirstMove ? Phaser.Math.Clamp(driftX * 2.6, -14, 14) : Math.sin(time * 0.006) * 2.2; if (this.isFirstMove && Math.abs(targetAngle) < 3) targetAngle = Phaser.Math.Clamp((player.x - this.input.activePointer.x) * 0.12, -10, 10); player.angle = Phaser.Math.Linear(player.angle, targetAngle, 0.16); player.scaleX = Phaser.Math.Linear(player.scaleX, 1 - (Math.abs(player.angle) * 0.01), 0.2); player.scaleY = Phaser.Math.Linear(player.scaleY, 1 + (Math.abs(player.angle) * 0.004), 0.2); }
    const fontUI = 'Arial, sans-serif';
    bullets.children.each(b => { if (b && (b.y > 750 || b.y < -100)) b.destroy(); });
    playerBullets.children.each(b => { if (b && b.y < -100) b.destroy(); });
    playerMissiles.children.each(m => { 
        if (m && m.active) {
            let target = null;
            if (isBossFight && boss && boss.active) target = boss;
            else if (minions.getLength() > 0) target = minions.getFirstAlive();
            if (target) {
                const angle = Phaser.Math.Angle.Between(m.x, m.y, target.x, target.y);
                const currentAngle = m.body.velocity.angle();
                const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, angle, 0.1);
                const speed = 400;
                m.body.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
                m.rotation = newAngle + Math.PI/2;
            }
            if (m.y < -100 || m.y > 750 || m.x < -100 || m.x > 475) m.destroy();
        }
    });
    items.children.each(i => { if (i && i.active) { if (isMagnetActive && i.getData('type') === 'coin') { let angle = Phaser.Math.Angle.Between(i.x, i.y, player.x, player.y); i.body.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600); } if (i.y > 750) i.destroy(); } });
    obstacles.children.each(o => { if (o && o.active) { if (o.getData('isDrone')) { let speedX = (player.x - o.x) * 2.5; o.body.setVelocityX(speedX); o.setAlpha(0.7 + Math.sin(time * 0.01) * 0.3); } if (!o.getData('missed') && Math.abs(o.x - player.x) < 75 && Math.abs(o.y - player.y) < 30) { o.setData('missed', true); showComboEffect(this); } if (o.y > 750) o.destroy(); } }, this);
    minions.children.each(m => { if (m && m.active) { m.getData('state') === 'hunting' ? m.body.setVelocity((player.x - m.x) * 3, 100) : m.body.setVelocity(0, 50); if (m.y > 750) m.destroy(); } });
    minionBullets.children.each(b => { if (b && b.y > 750) b.destroy(); });
    if (!isBossFight) {
        let actualDelta = (delta > 0 && delta < 1) ? delta * 1000 : delta;
        let speedFactor = Math.max(0.01, 0.08 + level * 0.01 + (upgradeLevels.speed || 0) * 0.03);
        let deltaDist = actualDelta * speedFactor * (currentStats.spd || 1); 
        distance += deltaDist; totalDistance += deltaDist;
        rankXPDistanceAccum += deltaDist;
        if (rankXPDistanceAccum >= 50) { awardRankXP(this, 1, 'distance'); rankXPDistanceAccum -= 50; }
        let currentDist = Math.floor(distance);
        if (currentDist > bestDistance) { bestDistance = currentDist; bestDistText.setText(`${TRANSLATIONS[lang].max_dist}: ${bestDistance}m`).setFill('#ffff00'); }
        if (!achievements.speedster && currentDist >= 2000) { achievements.speedster = true; checkAchievements(this); }
        let prog = Math.min(distance / runGoal, 1); roadBar.clear().fillStyle(0xffffff, 0.2).fillRect(100, 50, 175, 2).fillStyle(0x00ffff, 1).fillRect(100, 50, prog * 175, 2);
        let toBoss = Math.max(0, Math.floor(runGoal - distance)); let label = level < 15 ? `${TRANSLATIONS[lang].to_mega_boss}: ${15 - level} ${TRANSLATIONS[lang].sector}` : `${TRANSLATIONS[lang].elite_phase}: ${level}`;
        distanceText.setY(105).setText(`${currentDist}m\n${label}\n${TRANSLATIONS[lang].distance_to}: ${toBoss}m`);
        if (distance >= runGoal) startBossFight(this);
        if (currentDist >= 5000 && !achievements.marathon) { achievements.marathon = true; saveProgress(); }
    } else {
        let t = time * 0.001;
        if (isPhase3) { boss.x = 187 + Math.sin(time * 0.05) * 5; boss.y = 150 + Math.cos(time * 0.05) * 5; boss.angle += 20; } else { boss.x = 187 + Math.sin(t * 1.8) * 140; boss.y = 160 + Math.cos(t * 1.2) * 50; boss.angle += isPhase2 ? 15 : 2; }
        if (bossTurretL && bossTurretL.active) { bossTurretL.setPosition(boss.x - 50, boss.y + 10); bossTurretR.setPosition(boss.x + 50, boss.y + 10); }
        if (level >= 20 && bossShields.getLength() > 0) { Phaser.Actions.RotateAroundDistance(bossShields.getChildren(), boss, 0.03, 110); bossShields.children.each(s => { s.setTint(isPhase2 ? 0xff0000 : 0xff00ff); }); }
        if (boss && boss.active) { boss.x += (Math.random() - 0.5) * 2; boss.y += (Math.random() - 0.5) * 2; }
        if (level >= 40 && wallZoneGraphics) {
            if (!isInSafeZone()) {
                this.cameras.main.shake(50, 0.005);
            }
        }
        if (level >= 50 && secondCore) {
            dualCoreAngle += 0.03;
            const radius = 120;
            secondCore.x = boss.x + Math.cos(dualCoreAngle) * radius;
            secondCore.y = boss.y + Math.sin(dualCoreAngle) * radius;
            if (!this.dualCoreShootTimer) {
                this.dualCoreShootTimer = this.time.addEvent({ delay: 1500, callback: () => {
                    if (isBossFight && !isVictory && !isDead && secondCore && secondCore.active) {
                        let angleToPlayer = Phaser.Math.Angle.Between(secondCore.x, secondCore.y, player.x, player.y);
                        for (let i = -1; i <= 1; i++) {
                            let b = bullets.create(secondCore.x, secondCore.y, 'pixel');
                            b.setVelocity(Math.cos(angleToPlayer + i * 0.2) * 350, Math.sin(angleToPlayer + i * 0.2) * 350);
                            b.setTint(0xff4444).setScale(1.3);
                        }
                    }
                }, loop: true });
            }
        }
        if (level >= 60) {
            stormAngle += 0.01;
            if (!this.stormZoneTimer) {
                this.stormZoneTimer = this.time.addEvent({ delay: 100, callback: () => {
                    if (!isBossFight || isVictory || isDead || !boss) return;
                    if (isInStormZone()) {
                        this.cameras.main.shake(30, 0.003);
                    }
                }, loop: true });
            }
        }
        if (level >= 70 && boss && boss.active && !isVictory && !isDead) {
            if (!this.voidZoneTimer) {
                this.voidZoneTimer = this.time.addEvent({ delay: 50, callback: () => {
                    if (!isBossFight || isVictory || isDead || !boss) return;
                    if (voidAbsorbGraphics) voidAbsorbGraphics.destroy();
                    const radius = voidAbsorbRadius + (voidChargeLevel * 40);
                    voidAbsorbGraphics = this.add.graphics().setDepth(50);
                    voidAbsorbGraphics.lineStyle(3, 0xaa00ff, 0.4 + voidChargeLevel * 0.3);
                    voidAbsorbGraphics.strokeCircle(boss.x, boss.y, radius);
                    voidAbsorbGraphics.fillStyle(0xaa00ff, 0.05 + voidChargeLevel * 0.1);
                    voidAbsorbGraphics.fillCircle(boss.x, boss.y, radius);
                }, loop: true });
            }
        }
        distanceText.setText("");
    }
    overdriveBar.clear().fillStyle(0x333333).fillRect(87, 645, 200, 8).fillStyle(0xffff00).fillRect(87, 645, (overdrive/100) * 200, 8);
    if (overdrive >= 100) { overdriveBar.setX(Math.sin(time * 0.1) * 3); if (!this.ovrText) { this.ovrText = this.add.text(player.x, player.y - 65, TRANSLATIONS[lang].tap_ultra, { fontFamily: fontUI, fontSize: '20px', fill: '#ffff00', fontWeight: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(100); this.tweens.add({ targets: this.ovrText, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 }); } this.ovrText.setPosition(player.x, player.y - 65); player.setTint(0xffff00); } else { if (this.ovrText) { this.ovrText.destroy(); this.ovrText = null; } player.clearTint(); }
    
    if (currentSkin === 'rainbow' && player && player.active) {
        const t = Math.floor(time / 200) % rainbowColors.length;
        player.setTint(rainbowColors[t]);
    }

    [bullets, playerBullets, minionBullets].forEach(group => {
        group.children.each(b => {
            if (b && b.active && bulletTrailEmitter) {
                bulletTrailEmitter.emitParticleAt(b.x, b.y);
            }
        });
    });

    if (this.overheadGfx && this.overheadGfx.active && !isVictory) {
        this.overheadGfx.clear();
        if (player && player.active) { let pPct = playerHealth / maxPlayerHealth; let hudY = player.y - (player.displayHeight / 2) - 20; let barW = 40; let barColor = 0x00ffff; if (playerHealth < 20) { let pulse = Math.abs(Math.sin(time * 0.015)); barColor = pulse > 0.5 ? 0xff0000 : 0x660000; pHealthLabel.setX(player.x + Math.random() * 4 - 2); pHealthLabel.setFill('#ff0000'); } else { pHealthLabel.setX(player.x).setFill('#00ffff'); } this.overheadGfx.fillStyle(0x000000, 0.5).fillRect(player.x - barW/2, hudY, barW, 4); this.overheadGfx.fillStyle(barColor).fillRect(player.x - barW/2, hudY, barW * pPct, 4); pHealthLabel.setPosition(player.x, hudY - 12).setOrigin(0.5).setText(`${Math.ceil(playerHealth)} ${TRANSLATIONS[lang].hp_label}`); }
        if (isBossFight && boss && boss.visible) { let hM = level > 30 ? (13.5 + (level - 30) * 0.22) : (level * 0.45); let maxB = 400 * (1 + hM); let bPct = Math.max(0, bossHealth / maxB); let hudY = boss.y - (boss.displayHeight * boss.scale / 2) - 25; let barW = 100; let bColor = level >= 35 ? 0x00ff00 : (isPhase2 ? 0xff0000 : 0xff00ff); this.overheadGfx.fillStyle(0x000000, 0.5).fillRect(boss.x - barW/2, hudY, barW, 6); this.overheadGfx.fillStyle(bColor).fillRect(boss.x - barW/2, hudY, barW * bPct, 6); bHealthLabel.setPosition(boss.x, hudY - 15).setOrigin(0.5).setText(`${TRANSLATIONS[lang].core_label}: ${Math.ceil(bPct * 100)}%`).setFontSize('12px').setFill(isPhase2 ? '#ff0000' : '#ff00ff').setDepth(101); }
        shieldAura.setVisible(isShieldActive);
    }
}

function startRun(scene) {
    isStarted = true; isVictory = false; isDead = false; isPaused = false; isBossFight = false; isShopOpen = false; shouldAutoStart = false;
    if (typeof logMetric === 'function') logMetric('run_start', `sector:${level}`);
    clearBattleTexts(scene); cleanupScreenFx(scene); lastObstaclePattern = null;
    currentStats = getShipStats(); 
    let healthBonus = upgradeLevels.health || 0;
    if (upgradeLevels.up_enhanced > 0 && level >= 50) healthBonus *= 2;
    const metaHealthBonus = (upgradeLevels.meta_plating || 0) * 10;
    const startOverdrive = Math.min(100, (upgradeLevels.meta_overdrive || 0) * 15);
    maxPlayerHealth = 100 + metaHealthBonus + healthBonus * 25 + currentStats.hpBonus; playerHealth = maxPlayerHealth;
    distance = 0; overdrive = startOverdrive; coinsThisRun = 0; viperShotCounter = 0;
    bossDamageTaken = 0; coinsCollectedThisRun = 0; overdriveUsedToKill = false;
    if (wallZoneGraphics) { wallZoneGraphics.destroy(); wallZoneGraphics = null; }
    if (secondCore) { secondCore.destroy(); secondCore = null; }
    if (stormZoneGraphics) { stormZoneGraphics.destroy(); stormZoneGraphics = null; }
    if (this.stormZoneTimer) { this.stormZoneTimer.remove(); this.stormZoneTimer = null; } bossHealth = 400 * (1 + (level >= 30 ? (30 * 0.45 + (level - 30) * 0.22) : level * 0.45)); isMagnetActive = false; isGlitchMode = false; scene.isFirstMove = false; isSlowMoActive = false; slowMoCooldown = 0; lastEmpTime = 0;
    if (scene.physics?.world) { scene.physics.resume(); scene.physics.world.timeScale = 1; }
    if (scene.time) { scene.time.paused = false; scene.time.timeScale = 1; }
    scene.obstacleTimer?.remove(); scene.shootEvent?.remove(); scene.itemTimer?.remove(); scene.bossShootEvent?.remove(); scene.turretShootEvent?.remove(); scene.minionTimer?.remove(); scene.phraseTimer?.remove(); scene.teleportEvent?.remove();
    obstacles?.clear(true, true); bullets?.clear(true, true); playerBullets?.clear(true, true); items?.clear(true, true); minions?.clear(true, true); minionBullets?.clear(true, true); bossShields?.clear(true, true);
    if (bossTurretL) { bossTurretL.destroy(); bossTurretL = null; } if (bossTurretR) { bossTurretR.destroy(); bossTurretR = null; } if (bossTurretLTrail) { bossTurretLTrail.destroy(); bossTurretLTrail = null; } if (bossTurretRTrail) { bossTurretRTrail.destroy(); bossTurretRTrail = null; }
    if (player) { player.setVisible(true); player.setActive(true); player.setPosition(187, 600); player.clearTint(); player.angle = 0; player.scaleX = 1; player.scaleY = 1; scene._prevPlayerX = player.x; }
    if (shieldAura) { shieldAura.setVisible(isShieldActive); shieldAura.setPosition(player.x, player.y); }
    if (boss) { safeKillTweens(scene, boss); boss.setActive(true); boss.setVisible(false); boss.setPosition(187, -200); boss.setAlpha(1); boss.setScale(level >= 35 ? 1.4 : (level >= 10 ? 1.2 : 1)); boss.setAngle(0); boss.clearTint(); if (boss.body) { boss.body.enable = true; boss.body.setVelocity(0, 0); boss.body.setAcceleration(0, 0); } }
    if (bossTrail) bossTrail.setVisible(false);
    if (trailEmitter) trailEmitter.start();
    if (glitchText) glitchText.setText('').setBackgroundColor(null).setAlpha(1).setVisible(true);
    if (distanceText) distanceText.setText('').setVisible(true);
    if (pHealthLabel) pHealthLabel.setVisible(true); if (bHealthLabel) bHealthLabel.setText('').setVisible(false); if (overdriveBar) overdriveBar.setVisible(true); if (roadBar) roadBar.setVisible(true);
    updateHudTexts(); ensureBgm(scene); scene.isFirstMove = false;
    scene.input.off('pointerdown'); scene.input.off('pointermove');
    scene.input.on('pointerdown', p => { if (!isStarted || isShopOpen || isDead || isPaused || !player?.active) return; if (p.y < 90) return; scene.isFirstMove = true; player.x = Phaser.Math.Clamp(p.x, 20, 355); player.y = Phaser.Math.Clamp(p.y + yOffset, 80, 620); if (shieldAura) shieldAura.setPosition(player.x, player.y); if (overdrive >= 100 && !isVictory && isBossFight) useOverdrive.call(scene); });
    scene.input.on('pointermove', p => { if (!isStarted || isShopOpen || isDead || isPaused || !player?.active) return; if (scene.isFirstMove) { player.x = Phaser.Math.Clamp(p.x, 20, 355); player.y = Phaser.Math.Clamp(p.y + yOffset, 80, 620); if (shieldAura) shieldAura.setPosition(player.x, player.y); } });
    scene.obstacleTimer = scene.time.addEvent({ 
        delay: level <= 1 ? 1650 : level <= 3 ? 1500 : level <= 5 ? 1400 : Math.max(520, 1300 - level * 25), 
        callback: spawnObstacle, 
        callbackScope: scene, 
        loop: true 
    });
    let shootDelay = 150 - (upgradeLevels.fire * 20);
    if (upgradeLevels.up_enhanced > 0 && level >= 50) shootDelay = Math.max(50, shootDelay - 30);
    scene.shootEvent = scene.time.addEvent({ delay: shootDelay, callback: playerShoot, callbackScope: scene, loop: true });
    scene.itemTimer = scene.time.addEvent({ delay: 800, callback: spawnItem, callbackScope: scene, loop: true });

    if (scene.rainbowTimer) scene.rainbowTimer.remove();
    scene.rainbowIndex = 0;
    scene.rainbowTimer = scene.time.addEvent({ delay: 100, callback: () => {
        if (currentSkin === 'rainbow' && trailEmitter && trailEmitter.active) {
            scene.rainbowIndex = (scene.rainbowIndex + 1) % rainbowColors.length;
            trailEmitter.setParticleTint(rainbowColors[scene.rainbowIndex]);
        }
    }, loop: true });

    if (scene.healTimer) scene.healTimer.remove();
    if (upgradeLevels.helper_autoheal > 0) {
        scene.healTimer = scene.time.addEvent({ delay: 2500, callback: () => {
            if (isStarted && !isDead && player && player.active && playerHealth < maxPlayerHealth) {
                playerHealth = Math.min(maxPlayerHealth, playerHealth + 10);
                updateHudTexts();
            }
        }, loop: true });
    }

    if (scene.droneTimer) scene.droneTimer.remove();
    if (upgradeLevels.helper_drone > 0) {
        scene.droneTimer = scene.time.addEvent({ delay: 800, callback: () => {
            if (isStarted && !isDead && player && player.active) {
                const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
                let b1 = playerBullets.create(player.x - 15, player.y - 20, 'pixel');
                let b2 = playerBullets.create(player.x + 15, player.y - 20, 'pixel');
                b1.setVelocityY(-750).setTint(0xffaa00).setAlpha(0.8).setScale(1.2);
                b2.setVelocityY(-750).setTint(0xffaa00).setAlpha(0.8).setScale(1.2);
            }
        }, loop: true });
    }

    if (scene.missileTimer) scene.missileTimer.remove();
    if (upgradeLevels.helper_missile > 0) {
        scene.missileTimer = scene.time.addEvent({ delay: 1500, callback: () => {
            if (isStarted && !isDead && player && player.active) {
                let m = playerMissiles.create(player.x, player.y, 'pixel');
                m.setVelocityY(-300).setTint(0xff00ff).setScale(2);
            }
        }, loop: true });
    }

    if (scene.mercenaryTimer) scene.mercenaryTimer.remove();
    if (scene.mercenarySprite) { scene.mercenarySprite.destroy(); scene.mercenarySprite = null; }
    if (upgradeLevels.helper_mercenary > 0) {
        upgradeLevels.helper_mercenary = 0; 
        saveProgress();
        scene.mercenarySprite = scene.add.sprite(187, 600, 'pixel').setTint(0xff3333).setScale(2.5).setDepth(15);
        scene.tweens.add({ targets: scene.mercenarySprite, angle: 360, duration: 2000, repeat: -1, ease: 'Linear' });
        
        scene.mercenaryTimer = scene.time.addEvent({ delay: 350, callback: () => {
            if (isStarted && !isDead && player && player.active) {
                if (scene.mercenarySprite) {
                    scene.mercenarySprite.setVisible(true);
                    scene.mercenarySprite.x = Phaser.Math.Linear(scene.mercenarySprite.x, player.x + 45 + Math.sin(scene.time.now * 0.003) * 15, 0.2);
                    scene.mercenarySprite.y = Phaser.Math.Linear(scene.mercenarySprite.y, player.y + 10 + Math.cos(scene.time.now * 0.004) * 10, 0.2);
                    
                    if (Math.random() < 0.3) {
                        let t = scene.add.rectangle(scene.mercenarySprite.x, scene.mercenarySprite.y, 10, 10, 0xff0000).setAlpha(0.6).setDepth(14);
                        scene.tweens.add({ targets: t, scale: 0, alpha: 0, duration: 400, onComplete: () => t.destroy() });
                    }
                }
                if (isBossFight && boss && boss.active) {
                    let b = playerBullets.create(scene.mercenarySprite.x, scene.mercenarySprite.y - 10, 'pixel');
                    b.setVelocityY(-900).setTint(0xff3333).setScale(2.5);
                }
            } else if (scene.mercenarySprite) {
                scene.mercenarySprite.setVisible(false);
            }
        }, loop: true });
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) { this.physics.pause(); this.time.paused = true; ['sfx_nuke', 'sfx_ultra', 'sfx_combo'].forEach(key => { if (this.sound.get(key)?.isPlaying) this.sound.stopByKey(key); }); const bgm = this.sound.get('bgm'); if (bgm && bgm.isPlaying) bgm.pause(); }
    else { this.physics.resume(); this.time.paused = false; if (isSoundOn) { const bgm = this.sound.get('bgm'); if (bgm && bgm.isPaused) bgm.resume(); } }
}

function generatePlayerTexture(scene) {
    let g = scene.make.graphics({ x: 0, y: 0, add: false });
    const skin = SKIN_DATA[currentSkin] || SKIN_DATA.classic;
    let bodyColor = skin.body;
    if (currentSkin === 'rainbow') {
        const t = Math.floor(Date.now() / 200) % rainbowColors.length;
        bodyColor = rainbowColors[t];
    }
    g.fillStyle(bodyColor, skin.alpha || 1);
    if (currentShape === 'striker') { g.fillTriangle(16, 2, 0, 38, 32, 38); g.fillRect(0, 30, 4, 10); g.fillRect(28, 30, 4, 10); g.fillStyle(skin.eyes, 1); g.fillRect(12, 25, 2, 4); g.fillRect(18, 25, 2, 4); }
    else if (currentShape === 'tank') { g.fillRoundedRect(2, 6, 28, 24, 8); g.fillRect(-2, 12, 6, 16); g.fillRect(28, 12, 6, 16); g.fillStyle(skin.eyes, 1); g.fillRect(10, 14, 3, 3); g.fillRect(19, 14, 3, 3); g.lineStyle(2, 0xff8800, 0.8); g.strokeRoundedRect(2, 6, 28, 24, 8); }
    else if (currentShape === 'dart') { g.fillTriangle(16, 0, 4, 36, 28, 36); g.fillStyle(skin.eyes, 1); g.fillRect(14, 24, 2, 3); g.fillRect(18, 24, 2, 3); g.lineStyle(2, skin.trail, 0.5); g.lineBetween(16, 8, 16, 0); }
    else if (currentShape === 'viper') { g.fillTriangle(16, 2, 0, 38, 32, 38); g.fillRect(6, 28, 4, 12); g.fillRect(22, 28, 4, 12); g.fillStyle(skin.eyes, 1); g.fillRect(12, 24, 2, 4); g.fillRect(18, 24, 2, 4); }
    else if (currentShape === 'phase') { g.fillRoundedRect(4, 10, 24, 18, 6); g.fillStyle(skin.eyes, 1); g.fillRect(12, 16, 2, 2); g.fillRect(18, 16, 2, 2); g.lineStyle(2, skin.trail, 0.3); g.strokeCircle(16, 20, 14); }
    else { g.fillRoundedRect(4, 10, 24, 18, 6); g.fillStyle(skin.eyes, 1); g.fillRect(12, 16, 2, 2); g.fillRect(18, 16, 2, 2); }
    if (upgradeLevels.fire > 0) { g.fillStyle(0xff0000, 1); g.fillRect(0, 12, 6, 14); g.fillRect(26, 12, 6, 14); }
    g.lineStyle(3, 0x00ffff, 1); g.lineBetween(16, 10, 16, -5);
    if (upgradeLevels.ultra > 0) { g.fillStyle(0xffff00, 1); g.fillCircle(16, -8, 8); g.lineStyle(2, 0xffff00, 0.5); g.strokeCircle(16, -8, 12); }
    const name = `p_v_${currentShape}_${currentSkin}_${Date.now()}`; g.generateTexture(name, 32, 40); g.destroy(); return name;
}

async function syncUserData() {
    const tgUser = getTelegramUser(); if (!tgUser?.id) { console.log('[Sync] No Telegram user'); return; }
    console.log('[Sync] Syncing for user:', tgUser.id);
    try {
        const response = await fetch(`${botUrl}/get_user_personal/${tgUser.id}`); const cloudData = await response.json(); 
        if (!cloudData || cloudData.error) { console.log('[Sync] No cloud data:', cloudData?.error); return; }
        console.log('[Sync] Cloud data received:', cloudData);
        let shouldPushLocalBack = false;
        
        const cloudCoins = typeof cloudData.coins === 'number' && !isNaN(cloudData.coins) ? cloudData.coins : 0;
        const localCoins = coins || 0;

        if (cloudCoins > localCoins) {
            console.log(`[Sync] Updating coins: ${localCoins} -> ${cloudCoins} (Cloud is ahead)`);
            coins = cloudCoins;
        } else if (localCoins > cloudCoins) {
            console.log(`[Sync] Local coins are ahead: ${localCoins} vs ${cloudCoins} (Will sync to cloud)`);
            shouldPushLocalBack = true;
        }
        
        const cloudLevel = typeof cloudData.level === 'number' ? Math.floor(cloudData.level) : 0;
        if (cloudLevel > level) { 
            level = cloudLevel; 
            runGoal = 700 + (level - 1) * 100; 
        } else if (level > cloudLevel) {
            shouldPushLocalBack = true;
        }
        runGoal = 700 + (level - 1) * 100;
        
        const cloudBestLevel = typeof cloudData.best_level === 'number' ? cloudData.best_level : 0;
        if (cloudBestLevel > bestLevel) bestLevel = cloudBestLevel; else if (bestLevel > cloudBestLevel) shouldPushLocalBack = true;
        
        const cloudScore = typeof cloudData.score === 'number' ? cloudData.score : 0;
        if (cloudScore > bestDistance) bestDistance = cloudScore; else if (bestDistance > cloudScore) shouldPushLocalBack = true;
        
        if (cloudData.skin) currentSkin = cloudData.skin; if (cloudData.shape) currentShape = cloudData.shape; if (cloudData.ship_name) shipName = cloudData.ship_name;
        
        if (typeof cloudData.explosion_color === 'number' && cloudData.explosion_color !== 0) {
            currentExplosionColor = cloudData.explosion_color;
        } else {
            shouldPushLocalBack = true;
        }
        if (typeof cloudData.total_dist === 'number') totalDistance = Math.max(totalDistance, cloudData.total_dist);
        if (typeof cloudData.bosses_killed === 'number') bossesKilled = Math.max(bossesKilled, cloudData.bosses_killed);
        if (cloudData.upgrades && typeof cloudData.upgrades === 'object') { for (const key in cloudData.upgrades) { if (key === 'helper_mercenary') continue; upgradeLevels[key] = Math.max(upgradeLevels[key] || 0, cloudData.upgrades[key] || 0); } }
        if (cloudData.achievements && typeof cloudData.achievements === 'object') { for (const key in cloudData.achievements) if (cloudData.achievements[key]) achievements[key] = true; }
        if (typeof cloudData.rank_xp === 'number') rankXP = Math.max(rankXP || 0, cloudData.rank_xp);
        
        if (typeof cloudData.daily_login_streak === 'number') {
            dailyLoginStreak = Math.max(dailyLoginStreak || 0, cloudData.daily_login_streak);
        }
        if (cloudData.last_login_date) {
            if (!lastLoginDate || cloudData.last_login_date > lastLoginDate) {
                lastLoginDate = cloudData.last_login_date;
            } else if (lastLoginDate > cloudData.last_login_date) {
                shouldPushLocalBack = true;
            }
        }

        if (typeof cloudData.last_daily_reset === 'number') {
            const cloudReset = cloudData.last_daily_reset;
            const localReset = lastDailyReset || 0;
            
            if (cloudReset > localReset) {
                lastDailyReset = cloudReset;
                if (cloudData.daily_quests && typeof cloudData.daily_quests === 'object') {
                    dailyQuests = JSON.parse(JSON.stringify(cloudData.daily_quests));
                }
            } else if (cloudReset === localReset) {
                if (cloudData.daily_quests && typeof cloudData.daily_quests === 'object') {
                    for (const key in cloudData.daily_quests) {
                        if (!dailyQuests[key] || cloudData.daily_quests[key].completed) {
                            dailyQuests[key] = cloudData.daily_quests[key];
                        }
                    }
                }
            } else {
                shouldPushLocalBack = true;
            }
        }
        initDailyQuests();
        saveProgress();
        currentStats = getShipStats(); maxPlayerHealth = 100 + (upgradeLevels.meta_plating || 0) * 10 + (upgradeLevels.health || 0) * 25 + currentStats.hpBonus;
        saveProgress(); updateHudTexts();
        if (player && player.active) refreshPlayerAppearance(this);
        if (shouldPushLocalBack) { await submitScore(); }
    } catch (e) { console.error('[Sync] syncUserData error', e); }
}

async function logMetric(eventType, extra = null) {
    const tgUser = getTelegramUser();
    if (!tgUser?.id) return;
    try {
        await fetch(`${botUrl}/log_metric`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: tgUser.id,
                event_type: eventType,
                level: level,
                score: Math.floor(distance || 0),
                extra: extra ? String(extra) : null
            })
        });
    } catch (e) { console.log('[Metric] error', e); }
}

async function submitScore(manualData = null) {
    const tgUser = getTelegramUser(); if (!tgUser?.id) return false;
    const initData = window.Telegram?.WebApp?.initData || '';
    try {
        const payload = { 
            telegram_id: tgUser.id, 
            username: tgUser.first_name || tgUser.username || 'PILOT', 
            score: Math.floor(bestDistance), 
            level: manualData ? manualData.level : level, 
            best_level: manualData ? manualData.best_level : bestLevel, 
            explosion_color: currentExplosionColor, 
            skin: currentSkin, 
            shape: currentShape, 
            coins, 
            upgrades: upgradeLevels, 
            achievements, 
            total_dist: Math.floor(totalDistance), 
            bosses_killed: bossesKilled, 
            ship_name: shipName || 'RAZOR-01', 
            rank_xp: rankXP, 
            daily_quests: dailyQuests, 
            last_daily_reset: lastDailyReset, 
            daily_login_streak: dailyLoginStreak, 
            last_login_date: lastLoginDate,
            lang: lang || 'en'
        };
        const response = await fetch(`${botUrl}/submit_score`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': initData }, body: JSON.stringify(payload) });
        if (response.ok) { return true; }
        return false;
    } catch (e) { console.error('✗ Ошибка submitScore:', e); return false; }
}

function startBossFight(scene) {
    resetBossPhrase(scene); clearBattleTexts(scene);
    if (typeof logMetric === 'function') logMetric('boss_reached', `sector:${level}`);
    obstacles.clear(true, true); bullets.clear(true, true); isBossFight = true;
    scene.cameras.main.shake(1000, 0.02); scene.cameras.main.flash(500, 255, 0, 255, 0.3);
    let alertText = scene.add.text(187, 333, TRANSLATIONS[lang].warning_boss, { fontSize: '32px', fontFamily: 'Arial', fontWeight: 'bold', fill: '#ff0000', align: 'center' }).setOrigin(0.5).setDepth(1000);
    scene.tweens.add({ targets: alertText, alpha: 0, duration: 200, yoyo: true, repeat: 5, onComplete: () => alertText.destroy() });
    boss.setVisible(true).setY(-100);
    scene.tweens.add({ targets: boss, y: 100, duration: 2000, ease: 'Back.easeOut' });
    bossTrail.setVisible(true); distanceText.setText(''); if (bHealthLabel) bHealthLabel.setVisible(true);
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
    
    if (level >= 40) {
        boss.setTint(0xff8800).setScale(1.6); if (bossTrail) bossTrail.setParticleTint(0xff8800);
        glitchText.setText(TRANSLATIONS[lang].wall_detected).setFill("#ff8800").setBackgroundColor("#442200");
        scene.tweens.add({ targets: boss, scale: { from: 1.4, to: 1.8 }, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        scene.wallZoneTimer = scene.time.addEvent({ delay: 3000, callback: () => {
            if (isBossFight && !isVictory && !isDead && !isPaused) {
                updateWallZone(scene);
            }
        }, loop: true });
        updateWallZone(scene);
    }
    if (level >= 50) {
        if (bossTrail) bossTrail.stop();
        boss.setTint(0xff00ff).setScale(1.2);
        bossHealth *= 1.5;
        glitchText.setText(TRANSLATIONS[lang].dual_detected).setFill("#ff00ff").setBackgroundColor("#440044");
        dualCoreAngle = 0;
        secondCore = scene.add.circle(187, 160, 30, 0xff0000, 0.7).setStrokeStyle(3, 0xff6666).setDepth(150);
        scene.tweens.add({ targets: boss, alpha: { from: 1, to: 0.3 }, duration: 500, yoyo: true, repeat: -1 });
        scene.tweens.add({ targets: secondCore, alpha: { from: 0.7, to: 0.3 }, duration: 500, yoyo: true, repeat: -1 });
        dualCores = [];
    }
    if (level >= 60) {
        boss.setTint(0x00ffff).setScale(1.3);
        glitchText.setText(TRANSLATIONS[lang].storm_approaches).setFill("#00ffff").setBackgroundColor("#004444");
        bossHealth *= 1.05;
        stormAngle = 0;
        stormZoneCount = 3;
    }
    if (level >= 70) {
        boss.setTint(0xaa00ff).setScale(1.5);
        glitchText.setText(TRANSLATIONS[lang].void_rises).setFill("#aa00ff").setBackgroundColor("#220033");
        bossHealth *= 1.5;
        absorbedBullets = 0;
    }
}

loadProgress();
const config = { type: Phaser.AUTO, parent: 'game-container', backgroundColor: '#000000', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 375, height: 667 }, render: { pixelArt: false, antialias: true, roundPixels: true }, physics: { default: 'arcade', arcade: { gravity: { y: 0 } } }, scene: { preload, create, update } };
const game = new Phaser.Game(config);
console.log('🚀 Glitched Arena запущена!');
