import sys
# ---------- sprites.js: open web sprite ----------
s = open('js/data/sprites.js').read()
s = s.replace("  reg('shot_en_kree',", """  reg('web_spider', (() => { const p = new Pix(13, 13); p.circle(6, 6, 5, '#ffffff', false); p.circle(6, 6, 3, '#e8e8ff', false); p.px(6, 6, '#ffffff'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.px(6 + Math.round(Math.cos(a) * 4), 6 + Math.round(Math.sin(a) * 4), '#ffffff'); p.px(6 + Math.round(Math.cos(a) * 6), 6 + Math.round(Math.sin(a) * 6), '#e8e8ff'); } return p; })());
  reg('shot_en_kree',""")
open('js/data/sprites.js', 'w').write(s)

# ---------- bullets.js: multi-sprite web dart ----------
s = open('js/game/bullets.js').read()
old = """      if (b.fx === 'arachnid') {
        // silk threads trailing the web dart
        ctx.strokeStyle = '#ff2b2b88';"""
new = """      if (b.fx === 'arachnid') {
        // layered web dart: spinning open web + twin silk threads + node glints
        if (SPR.web_spider) { ctx.globalAlpha = 0.55; drawSprite(ctx, SPR.web_spider, b.x, b.y, { rot: b.age * 9, scale: sc }); ctx.globalAlpha = 1; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - Math.cos(a) * 9 - 1, b.y - Math.sin(a) * 9 - 1, 1, 1);
        ctx.fillRect(b.x - Math.cos(a) * 5, b.y - Math.sin(a) * 5, 1, 1);
        ctx.strokeStyle = '#ffffff99';"""
assert old in s
s = s.replace(old, new, 1)
open('js/game/bullets.js', 'w').write(s)

# ---------- enemy.js: webbed enemies wear the web ----------
s = open('js/game/enemy.js').read()
old = "  // variant identification pip"
new = """  if ((e.rooted || 0) > 0 && SPR.web_spider) {
    ctx.globalAlpha = 0.75;
    drawSprite(ctx, SPR.web_spider, e.x, e.y, { rot: e.t * 1.5, scale: (e.r * 2 + 4) / 13 });
    ctx.strokeStyle = '#ffffff88';
    ctx.beginPath();
    ctx.moveTo(e.x - e.r, e.y); ctx.lineTo(e.x - e.r - 4, e.y + e.r + 3);
    ctx.moveTo(e.x + e.r, e.y); ctx.lineTo(e.x + e.r + 4, e.y + e.r + 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // variant identification pip"""
assert s.count(old) == 1
s = s.replace(old, new, 1)
open('js/game/enemy.js', 'w').write(s)

# ---------- player.js: SILK LINK + mystic spell cycle ----------
s = open('js/game/player.js').read()
old = """    // decay webbed connections
    for (let i = this.webbed.length - 1; i >= 0; i--) {
      this.webbed[i].t -= dt;
      if (this.webbed[i].t <= 0 || this.webbed[i].e.dead) this.webbed.splice(i, 1);
    }"""
new = old + """
    // SILK LINK: webbed enemies near each other get bound — shared damage + slow
    if (this.hero.id === 'arachnid') {
      this.webLinkTick = (this.webLinkTick || 0) - dt;
      const rooted = G.enemies.filter((e) => !e.dead && e.spawnT <= 0 && (e.rooted || 0) > 0);
      const links = [];
      for (let i = 0; i < rooted.length && links.length < 6; i++)
        for (let j = i + 1; j < rooted.length && links.length < 6; j++)
          if (dist2(rooted[i].x, rooted[i].y, rooted[j].x, rooted[j].y) < 110 * 110) links.push([rooted[i], rooted[j]]);
      const had = (this.webLinks || []).length;
      this.webLinks = links;
      if (links.length > had) G.audio.sfx('web');
      if (this.webLinkTick <= 0) {
        this.webLinkTick = 0.3;
        for (const [A, B] of links) {
          G.damageEnemy(A, 3 * st.dmg, A.x, A.y, true);
          G.damageEnemy(B, 3 * st.dmg, B.x, B.y, true);
          A.chill = Math.max(A.chill || 0, 0.35);
          B.chill = Math.max(B.chill || 0, 0.35);
        }
      }
    } else this.webLinks = null;"""
assert old in s
s = s.replace(old, new, 1)

old = """    // web connections between recently webbed enemies
    if (this.webbed.length > 1) {"""
new = """    // SILK LINK draw: sagging web lines + anchor nodes between bound enemies
    if (this.webLinks && this.webLinks.length) {
      for (const [A, B] of this.webLinks) {
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + 6;
        ctx.strokeStyle = '#ffffffaa';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
        ctx.strokeStyle = '#ffffff55';
        ctx.beginPath(); ctx.moveTo(A.x, A.y - 3); ctx.quadraticCurveTo(mx, my - 5, B.x, B.y - 3); ctx.stroke();
        for (let k = 1; k <= 3; k++) {
          const t = k / 4;
          const qx = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x;
          const qy = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(qx - 1, qy - 1, 2, 2);
        }
        if (SPR.web_spider) { ctx.globalAlpha = 0.7; drawSprite(ctx, SPR.web_spider, mx, my, { rot: this.t * 2, scale: 0.8 }); ctx.globalAlpha = 1; }
      }
      ctx.lineWidth = 1;
    }
    if (false && this.webbed.length > 1) {"""
assert old in s
s = s.replace(old, new, 1)

old = """      case 'sigil': {
        const n = 1 + st.extraProj;
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * 0.22;
          const b = mk(a + off, { r: 4, pierce: 1, homing: 2.2, wobble: 0, sprite: 'b_mandala' });
          if (b) { b.sigil = true; if (SPR.fx_sigil) b.sprite = 'fx_sigil'; }
        }
        G.audio.sfx('sigil');
        break;
      }"""
new = """      case 'sigil': {
        // feitiços em ciclo: mandala rastreadora -> leque de estilhas -> orbe explosivo
        const n = 1 + st.extraProj;
        const spell = this.shotCount % 3;
        if (spell === 0) {
          for (let i = 0; i < n; i++) {
            const off = (i - (n - 1) / 2) * 0.22;
            const b = mk(a + off, { r: 4, pierce: 1, homing: 2.2, wobble: 0, sprite: 'b_mandala' });
            if (b) { b.sigil = true; if (SPR.fx_sigil) b.sprite = 'fx_sigil'; }
          }
          G.audio.sfx('sigil');
          G.particles.ring(this.x, this.y, '#ff9d4d', 6, 40);
        } else if (spell === 1) {
          for (let i = 0; i < n + 2; i++) {
            const off = (i - (n + 1) / 2) * 0.16;
            const b = mk(a + off, { r: 3, pierce: 2, speed: (atk.speed || 210) * 1.35, sprite: 'b_purple' });
            if (b) b.spin = true;
          }
          G.audio.sfx('zap');
          G.particles.spark(this.x + Math.cos(a) * 10, this.y + Math.sin(a) * 10, '#b06bff', 3);
        } else {
          const b = mk(a, { r: 5, pierce: 0, homing: 1.2, speed: (atk.speed || 210) * 0.8, sprite: 'b_mandala' });
          if (b) { b.arcaneBurst = true; b.sigil = true; }
          G.audio.sfx('illus');
          G.particles.ring(this.x, this.y, '#b06bff', 8, 50);
        }
        break;
      }"""
assert old in s
s = s.replace(old, new, 1)
open('js/game/player.js', 'w').write(s)

# ---------- game.js collide: arcaneBurst on impact ----------
s = open('js/scenes/game.js').read()
old = "          if (b.split && !b.didSplit) {"
new = """          if (b.arcaneBurst && !b.didBurst) {
            b.didBurst = true; b.dead = true;
            for (let k = 0; k < 8; k++) {
              const aa = (k / 8) * Math.PI * 2;
              G.bullets.spawnPlayer({ x: b.x, y: b.y, vx: Math.cos(aa) * 170, vy: Math.sin(aa) * 170, dmg: b.dmg * 0.5, pierce: 1, r: 3, sprite: 'b_purple', life: 0.7 });
            }
            G.particles.ring(b.x, b.y, '#b06bff', 12, 90);
            G.particles.burst(b.x, b.y, '#ff9d4d', 6, 60, 0.3, 1);
            Audio.sfx('illus');
          }
          if (b.split && !b.didSplit) {"""
assert s.count(old) == 1
s = s.replace(old, new, 1)
open('js/scenes/game.js', 'w').write(s)

# ---------- lobby.js: orbit heads + generated nav icons on menu ----------
s = open('js/scenes/lobby.js').read()
s = s.replace("const em = SPR['hero_' + h.id];",
              "const em = SPR['head_' + h.id] || SPR['hero_' + h.id];")
old = """    ctx.globalAlpha = hov ? 1 : 0.85;
    drawIcon(ctx, icon, x, y - 2, { scale: 1.5, color: hov ? '#ffffff' : color || '#9a93c8' });
    ctx.globalAlpha = 1;"""
new = """    ctx.globalAlpha = hov ? 1 : 0.85;
    if (SPR[icon]) drawSprite(ctx, SPR[icon], x, y - 2, { scale: 1.4 });
    else drawIcon(ctx, icon, x, y - 2, { scale: 1.5, color: hov ? '#ffffff' : color || '#9a93c8' });
    ctx.globalAlpha = 1;"""
assert old in s
s = s.replace(old, new, 1)
s = s.replace("this.holo(ctx, 'gear', 618, 11, 'gear', '', '#8a84a8')", "this.holo(ctx, 'gear', 618, 11, 'nav_gear', '', '#8a84a8')")
s = s.replace("this.holo(ctx, 'mis', 26, 336, 'list', 'MISSÕES', '#4dff88')", "this.holo(ctx, 'mis', 26, 336, 'nav_mis', 'MISSÕES', '#4dff88')")
s = s.replace("this.holo(ctx, 'dev', 78, 336, 'wrench', 'DEV', '#ff8c3b')", "this.holo(ctx, 'dev', 78, 336, 'nav_dev', 'DEV', '#ff8c3b')")
s = s.replace("this.holo(ctx, 'cod', 130, 336, 'book', 'CODEX', '#4dd8ff')", "this.holo(ctx, 'cod', 130, 336, 'nav_col', 'CODEX', '#4dd8ff')")
s = s.replace("drawIcon(ctx, 'play', x + 18, y + h / 2, { scale: 1.6, color: hov ? '#ffffff' : '#4dff88' });",
              "if (SPR.nav_play) drawSprite(ctx, SPR.nav_play, x + 18, y + h / 2, { scale: 1.4 }); else drawIcon(ctx, 'play', x + 18, y + h / 2, { scale: 1.6, color: hov ? '#ffffff' : '#4dff88' });")
open('js/scenes/lobby.js', 'w').write(s)
print('all patches ok')
