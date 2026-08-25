// Croquis silhouette (dessinés, pas des photos) illustrant la pose à reproduire.
// Aucune image tierce/protégée n'est utilisée : tout est généré en SVG à partir
// d'angles de membres + quelques emoji d'accessoires.
(function () {
  'use strict';

  const VIEWBOX = '0 0 200 180';

  function seg(angleDeg, len) {
    const r = (angleDeg * Math.PI) / 180;
    return { dx: len * Math.sin(r), dy: len * Math.cos(r) };
  }
  function up(angleDeg, len) {
    const r = (angleDeg * Math.PI) / 180;
    return { dx: len * Math.sin(r), dy: -len * Math.cos(r) };
  }

  function limb(ox, oy, upperAngle, upperLen, foreAngle, foreLen) {
    const s1 = seg(upperAngle, upperLen);
    const elbow = { x: ox + s1.dx, y: oy + s1.dy };
    const s2 = seg(foreAngle != null ? foreAngle : upperAngle, foreLen || 0);
    const end = { x: elbow.x + s2.dx, y: elbow.y + s2.dy };
    return '<polyline points="' + ox.toFixed(1) + ',' + oy.toFixed(1) + ' ' +
      elbow.x.toFixed(1) + ',' + elbow.y.toFixed(1) + ' ' +
      end.x.toFixed(1) + ',' + end.y.toFixed(1) + '" />';
  }

  const DEFAULT_LIMB = { angle: 18, len: 24, foreLen: 16 };

  function figure(f) {
    const x = f.x != null ? f.x : 100;
    const y = f.y != null ? f.y : 138;
    const torsoAngle = (f.torso && f.torso.angle) || 0;
    const torsoLen = (f.torso && f.torso.len) || 36;
    const headR = (f.head && f.head.r) || 11;

    const su = up(torsoAngle, torsoLen);
    const shoulder = { x: x + su.dx, y: y + su.dy };
    const hu = up(torsoAngle, headR + 5);
    const head = { x: shoulder.x + hu.dx, y: shoulder.y + hu.dy };

    const armL = Object.assign({}, DEFAULT_LIMB, { angle: -18, foreAngle: -18 }, f.armL || {});
    const armR = Object.assign({}, DEFAULT_LIMB, { angle: 18, foreAngle: 18 }, f.armR || {});
    const legL = Object.assign({}, { angle: -16, len: 34, foreLen: 0 }, f.legL || {});
    const legR = Object.assign({}, { angle: 16, len: 34, foreLen: 0 }, f.legR || {});

    let out = '';
    out += '<circle cx="' + head.x.toFixed(1) + '" cy="' + head.y.toFixed(1) + '" r="' + headR + '" />';
    out += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + shoulder.x.toFixed(1) + '" y2="' + shoulder.y.toFixed(1) + '" />';
    out += limb(shoulder.x, shoulder.y, armL.angle, armL.len, armL.foreAngle, armL.foreLen);
    out += limb(shoulder.x, shoulder.y, armR.angle, armR.len, armR.foreAngle, armR.foreLen);
    out += limb(x, y, legL.angle, legL.len, legL.foreAngle, legL.foreLen);
    out += limb(x, y, legR.angle, legR.len, legR.foreAngle, legR.foreLen);
    return out;
  }

  function prop(x, y, emoji, size) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 24) +
      '" text-anchor="middle" dominant-baseline="middle" class="sketch-prop">' + emoji + '</text>';
  }

  function build(def) {
    const figures = (def.figures || []).map(figure).join('');
    const props = (def.props || []).map(function (p) { return prop(p.x, p.y, p.emoji, p.size); }).join('');
    const extra = (def.extra || []).join('');
    return '<svg viewBox="' + VIEWBOX + '" class="pose-sketch" stroke="currentColor" stroke-width="6" ' +
      'fill="none" stroke-linecap="round" stroke-linejoin="round">' + extra + figures + props + '</svg>';
  }

  const SKETCHES = {
    'meme-distracted-bf': build({
      figures: [
        { x: 60, y: 145, torso: { angle: 10 }, armR: { angle: 75, len: 28, foreAngle: 70, foreLen: 20 } },
        { x: 150, y: 150, head: { r: 9 }, armL: { angle: -60, len: 20, foreAngle: -40, foreLen: 14 } },
      ],
      props: [{ x: 92, y: 78, emoji: '👀', size: 26 }, { x: 150, y: 100, emoji: '😠', size: 22 }],
    }),
    'meme-woman-cat': build({
      figures: [
        { x: 55, y: 145, torso: { angle: -8 }, armR: { angle: 80, len: 30, foreAngle: 80, foreLen: 22 } },
        { x: 148, y: 150, legL: { angle: -50, len: 20 }, legR: { angle: 50, len: 20 } },
      ],
      props: [{ x: 55, y: 75, emoji: '😡', size: 24 }, { x: 148, y: 105, emoji: '😐', size: 22 }],
    }),
    'meme-drake': build({
      figures: [{ x: 100, y: 145, armR: { angle: -140, len: 26, foreAngle: -150, foreLen: 20 } }],
      props: [{ x: 45, y: 55, emoji: '🙅', size: 26 }, { x: 155, y: 55, emoji: '👍', size: 26 }],
    }),
    'meme-this-is-fine': build({
      figures: [{ x: 100, y: 150, legL: { angle: -55, len: 20 }, legR: { angle: 55, len: 20 },
        armR: { angle: 60, len: 20, foreAngle: -30, foreLen: 16 } }],
      props: [
        { x: 100, y: 95, emoji: '☕', size: 20 },
        { x: 45, y: 60, emoji: '🔥', size: 26 }, { x: 155, y: 60, emoji: '🔥', size: 26 },
        { x: 100, y: 40, emoji: '🔥', size: 22 },
      ],
    }),
    'meme-success-kid': build({
      figures: [{ x: 100, y: 145, armR: { angle: 178, len: 28, foreAngle: 178, foreLen: 20 } }],
      props: [{ x: 100, y: 60, emoji: '😤', size: 22 }],
    }),
    'meme-side-eye': build({
      figures: [{ x: 100, y: 145 }],
      props: [{ x: 128, y: 90, emoji: '👁️', size: 22 }],
    }),
    'meme-ancient-aliens': build({
      figures: [{ x: 100, y: 148, armL: { angle: -155, len: 24, foreAngle: -160, foreLen: 18 },
        armR: { angle: 155, len: 24, foreAngle: 160, foreLen: 18 } }],
      props: [{ x: 100, y: 60, emoji: '🤯', size: 26 }],
    }),
    'meme-galaxy-brain': build({
      figures: [{ x: 100, y: 148, armL: { angle: -170, len: 26, foreAngle: -170, foreLen: 20 },
        armR: { angle: 170, len: 26, foreAngle: 170, foreLen: 20 } }],
      props: [{ x: 100, y: 55, emoji: '🧠', size: 24 }, { x: 130, y: 50, emoji: '✨', size: 18 }],
    }),
    'meme-hide-pain-harold': build({
      figures: [{ x: 100, y: 145 }],
      props: [{ x: 100, y: 95, emoji: '🙂', size: 24 }],
    }),
    'meme-shocked-pikachu': build({
      figures: [{ x: 100, y: 148, armL: { angle: -95, len: 24, foreAngle: -95, foreLen: 18 },
        armR: { angle: 95, len: 24, foreAngle: 95, foreLen: 18 } }],
      props: [{ x: 100, y: 95, emoji: '😲', size: 26 }],
    }),
    'film-titanic-flying': build({
      figures: [
        { x: 95, y: 150, head: { r: 9 }, armL: { angle: -92, len: 24, foreAngle: -92, foreLen: 16 },
          armR: { angle: 92, len: 24, foreAngle: 92, foreLen: 16 } },
        { x: 105, y: 142, armL: { angle: -90, len: 30, foreAngle: -90, foreLen: 22 },
          armR: { angle: 90, len: 30, foreAngle: 90, foreLen: 22 } },
      ],
      props: [{ x: 40, y: 60, emoji: '💨', size: 22 }, { x: 100, y: 170, emoji: '🌊', size: 20 }],
    }),
    'film-lion-king': build({
      figures: [{ x: 100, y: 150, armL: { angle: -172, len: 26, foreAngle: -172, foreLen: 18 },
        armR: { angle: 172, len: 26, foreAngle: 172, foreLen: 18 } }],
      props: [{ x: 100, y: 40, emoji: '🌅', size: 22 }, { x: 100, y: 68, emoji: '⭕', size: 14 }],
    }),
    'film-matrix-dodge': build({
      figures: [{ x: 100, y: 150, torso: { angle: 130, len: 32 }, head: { r: 10 },
        legL: { angle: -35, len: 30 }, legR: { angle: 45, len: 30 } }],
      props: [{ x: 60, y: 95, emoji: '🕶️', size: 18 }],
    }),
    'film-rocky-steps': build({
      figures: [{ x: 100, y: 148, armL: { angle: -168, len: 28, foreAngle: -168, foreLen: 20 },
        armR: { angle: 168, len: 28, foreAngle: 168, foreLen: 20 } }],
      props: [{ x: 100, y: 165, emoji: '🥊', size: 18 }],
    }),
    'film-dirty-dancing-lift': build({
      figures: [
        { x: 100, y: 158, armL: { angle: -168, len: 26, foreAngle: -168, foreLen: 18 },
          armR: { angle: 168, len: 26, foreAngle: 168, foreLen: 18 }, legL: { angle: -20, len: 26 }, legR: { angle: 20, len: 26 } },
        { x: 100, y: 62, head: { r: 9 }, torso: { len: 24 },
          armL: { angle: -90, len: 20, foreAngle: -90, foreLen: 14 }, armR: { angle: 90, len: 20, foreAngle: 90, foreLen: 14 },
          legL: { angle: 170, len: 18 }, legR: { angle: -170, len: 18 } },
      ],
    }),
    'film-home-alone-scream': build({
      figures: [{ x: 100, y: 148, armL: { angle: -55, len: 20, foreAngle: -150, foreLen: 18 },
        armR: { angle: 55, len: 20, foreAngle: 150, foreLen: 18 } }],
      props: [{ x: 100, y: 90, emoji: '😱', size: 26 }],
    }),
    'film-pulp-fiction-dance': build({
      figures: [
        { x: 65, y: 148, armL: { angle: -35, len: 20, foreAngle: -95, foreLen: 16 }, armR: { angle: 35, len: 20, foreAngle: 95, foreLen: 16 } },
        { x: 140, y: 148, armL: { angle: -35, len: 20, foreAngle: -95, foreLen: 16 }, armR: { angle: 35, len: 20, foreAngle: 95, foreLen: 16 } },
      ],
      props: [{ x: 65, y: 82, emoji: '✌️', size: 18 }, { x: 140, y: 82, emoji: '✌️', size: 18 }],
    }),
    'film-grease-finale': build({
      figures: [
        { x: 70, y: 148, torso: { angle: -8 } },
        { x: 135, y: 148, torso: { angle: 8 } },
      ],
      props: [{ x: 100, y: 55, emoji: '😎', size: 22 }],
    }),
    'film-mona-lisa': build({
      figures: [{ x: 100, y: 148, armL: { angle: 45, len: 20, foreAngle: -25, foreLen: 18 },
        armR: { angle: -45, len: 20, foreAngle: 25, foreLen: 18 } }],
      props: [{ x: 100, y: 95, emoji: '🙂', size: 20 }],
    }),
    'film-scream-mask': build({
      figures: [{ x: 100, y: 148, torso: { angle: 14 }, armL: { angle: -55, len: 20, foreAngle: -150, foreLen: 18 },
        armR: { angle: 55, len: 20, foreAngle: 150, foreLen: 18 } }],
      props: [{ x: 100, y: 88, emoji: '😱', size: 24 }],
    }),
    'film-avengers-assemble': build({
      figures: [
        { x: 55, y: 150, head: { r: 9 }, armR: { angle: 60, len: 18, foreAngle: 60, foreLen: 14 } },
        { x: 100, y: 156, armL: { angle: -60, len: 18, foreAngle: -60, foreLen: 14 }, armR: { angle: 60, len: 18, foreAngle: 60, foreLen: 14 } },
        { x: 148, y: 150, head: { r: 9 }, armL: { angle: -60, len: 18, foreAngle: -60, foreLen: 14 } },
      ],
      props: [{ x: 100, y: 100, emoji: '🛡️', size: 20 }],
    }),
    'serie-friends-couch': build({
      figures: [
        { x: 55, y: 150, head: { r: 9 }, torso: { len: 26 }, legL: { angle: -55, len: 18 }, legR: { angle: 55, len: 18 } },
        { x: 100, y: 150, torso: { len: 26 }, armR: { angle: 70, len: 20, foreAngle: 40, foreLen: 16 }, legL: { angle: -55, len: 18 }, legR: { angle: 55, len: 18 } },
        { x: 145, y: 150, head: { r: 9 }, torso: { len: 26 }, legL: { angle: -55, len: 18 }, legR: { angle: 55, len: 18 } },
      ],
      extra: ['<line x1="20" y1="168" x2="180" y2="168" stroke-width="8" />'],
      props: [{ x: 55, y: 108, emoji: '☕', size: 16 }],
    }),
    'serie-office-jim': build({
      figures: [{ x: 100, y: 148 }],
      props: [{ x: 100, y: 92, emoji: '😑', size: 24 }, { x: 150, y: 130, emoji: '📎', size: 16 }],
    }),
    'serie-stranger-things': build({
      figures: [{ x: 100, y: 148 }],
      props: [{ x: 100, y: 100, emoji: '🩸', size: 16 }, { x: 130, y: 85, emoji: '⚡', size: 18 }],
    }),
    'serie-got-throne': build({
      figures: [{ x: 100, y: 150, torso: { len: 30 }, legL: { angle: -55, len: 18 }, legR: { angle: 55, len: 18 } }],
      extra: ['<rect x="55" y="70" width="90" height="90" rx="4" stroke-width="5" />'],
      props: [{ x: 100, y: 55, emoji: '👑', size: 22 }],
    }),
    'serie-squid-game': build({
      figures: [{ x: 100, y: 148, legL: { angle: -70, len: 32 }, legR: { angle: 30, len: 26 },
        armL: { angle: -90, len: 22, foreAngle: -90, foreLen: 16 }, armR: { angle: 90, len: 22, foreAngle: 90, foreLen: 16 } }],
      props: [{ x: 155, y: 60, emoji: '🦑', size: 20 }],
    }),
    'serie-breaking-bad': build({
      figures: [
        { x: 75, y: 148, armL: { angle: -10, len: 24, foreLen: 0 }, armR: { angle: 10, len: 24, foreLen: 0 } },
        { x: 130, y: 148, armL: { angle: -10, len: 24, foreLen: 0 }, armR: { angle: 10, len: 24, foreLen: 0 } },
      ],
      props: [{ x: 102, y: 110, emoji: '🧪', size: 18 }],
    }),
  };

  function genericSketch() {
    return build({ figures: [{ x: 100, y: 148 }], props: [{ x: 100, y: 90, emoji: '❓', size: 24 }] });
  }

  window.getPoseSketch = function (prompt) {
    return SKETCHES[prompt.id] || genericSketch();
  };
})();
