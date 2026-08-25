// Bibliothèque de photos cultes à reproduire (memes, films, séries)
//
// Le champ "image" est optionnel, deux façons de le remplir :
//   1. Une URL externe   : "https://exemple.com/photo.jpg"
//   2. Un fichier du projet, placé dans le dossier images/ à côté de ce
//      fichier, référencé par un chemin relatif : "images/mon-fichier.jpg"
// Dans les deux cas, l'image s'affiche par défaut pour tout le monde, sur
// n'importe quel navigateur/appareil (contrairement à la photo ajoutée
// depuis l'appli via le bouton "Photo de référence", qui elle reste
// stockée uniquement dans le navigateur de la personne qui l'a ajoutée).
// Laissez "" pour garder le croquis silhouette généré.
// C'est vous qui fournissez ces images : les droits sur l'image restent à
// votre charge pour un usage privé. Voir images/README.md pour le détail
// (notamment sur ce que ça implique si le projet est poussé sur un repo
// public).
const BUILTIN_PROMPTS = [
  // --- MEMES ---
  { id: 'meme-distracted-bf', cat: 'meme', emoji: '👀', difficulty: 2, image: '',
    title: 'Le petit copain distrait',
    desc: "Un joueur marche en tenant la main d'un autre, mais tourne la tête pour reluquer une 3e personne qui passe. La personne tenue par la main a l'air outrée." },
  { id: 'meme-woman-cat', cat: 'meme', emoji: '🐱', difficulty: 2, image: '',
    title: 'La femme qui crie sur le chat',
    desc: "Un joueur pointe du doigt en criant/pleurant façon dispute dramatique, face à un autre assis à table, impassible, l'air blasé (façon chat)." },
  { id: 'meme-drake', cat: 'meme', emoji: '🙅', difficulty: 1, image: '',
    title: 'Drakeposting',
    desc: "Deux poses d'affilée : d'abord la main qui repousse avec une grimace de dégoût, puis la même main qui pointe/valide avec un sourire satisfait." },
  { id: 'meme-this-is-fine', cat: 'meme', emoji: '🔥', difficulty: 2, image: '',
    title: '« This is fine »',
    desc: "Assis, mug à la main, sourire figé et calme, pendant qu'autour de toi tout part en vrille (mime des flammes avec les mains d'un autre joueur en arrière-plan)." },
  { id: 'meme-success-kid', cat: 'meme', emoji: '👊', difficulty: 1, image: '',
    title: 'Success Kid',
    desc: "Poing serré levé devant soi, sourcils froncés, air de triomphe absolu façon bébé qui vient de réussir un exploit." },
  { id: 'meme-side-eye', cat: 'meme', emoji: '😒', difficulty: 1, image: '',
    title: 'Regard en coin suspicieux',
    desc: "Regarde légèrement sur le côté avec un sourcil levé et une moue dubitative, sans bouger la tête, façon soupçon total." },
  { id: 'meme-ancient-aliens', cat: 'meme', emoji: '🛸', difficulty: 2, image: '',
    title: 'C\'était les aliens',
    desc: "Cheveux ébouriffés vers le haut avec les mains, yeux écarquillés, bouche entrouverte, air d'annoncer une théorie improbable." },
  { id: 'meme-galaxy-brain', cat: 'meme', emoji: '🧠', difficulty: 2, image: '',
    title: 'Illumination progressive',
    desc: "Mime une prise de conscience grandissante : commence voûté et perplexe, puis redresse-toi en écartant les bras, tête auréolée de lumière (imaginaire)." },
  { id: 'meme-hide-pain-harold', cat: 'meme', emoji: '🙂', difficulty: 1, image: '',
    title: 'Sourire qui cache la douleur',
    desc: "Grand sourire figé, mais les yeux trahissent une détresse intense. Mains posées sagement, posture très raide." },
  { id: 'meme-shocked-pikachu', cat: 'meme', emoji: '😲', difficulty: 1, image: '',
    title: 'Surprise totale',
    desc: "Bouche grande ouverte en O parfait, yeux écarquillés, mains légèrement levées, comme pris totalement au dépourvu." },

  // --- FILMS ---
  { id: 'film-titanic-flying', cat: 'film', emoji: '🚢', difficulty: 2, image: '',
    title: 'Titanic — « Je vole »',
    desc: "Deux joueurs à l'avant d'un « bateau » imaginaire : l'un derrière tient les bras de l'autre écartés en croix vers l'avant, vent dans les cheveux." },
  { id: 'film-lion-king', cat: 'film', emoji: '🦁', difficulty: 2, image: '',
    title: 'Le Roi Lion — présentation',
    desc: "Un joueur lève un objet (ou un autre joueur en mode bébé) à bout de bras au-dessus de sa tête, sur fond de « lever de soleil »." },
  { id: 'film-matrix-dodge', cat: 'film', emoji: '🕶️', difficulty: 3, image: '',
    title: 'Matrix — esquive de balle',
    desc: "Cambre le dos en arrière le plus possible, jambes fléchies, comme pour esquiver un tir au ralenti, lunettes de soleil si possible." },
  { id: 'film-rocky-steps', cat: 'film', emoji: '🥊', difficulty: 1, image: '',
    title: 'Rocky — en haut des marches',
    desc: "Bras levés en V au-dessus de la tête, poings serrés, air de triomphe essoufflé, comme en haut d'un escalier." },
  { id: 'film-dirty-dancing-lift', cat: 'film', emoji: '💃', difficulty: 3, image: '',
    title: 'Dirty Dancing — le porté',
    desc: "Un joueur soulève (ou mime soulever) un autre à bout de bras au-dessus de sa tête, les deux bras et jambes tendus en arrière." },
  { id: 'film-home-alone-scream', cat: 'film', emoji: '😱', difficulty: 1, image: '',
    title: 'Maman, j\'ai raté l\'avion !',
    desc: "Mains plaquées sur les joues, bouche grande ouverte, yeux écarquillés façon cri muet de panique/excitation." },
  { id: 'film-pulp-fiction-dance', cat: 'film', emoji: '✌️', difficulty: 2, image: '',
    title: 'Pulp Fiction — danse',
    desc: "Deux joueurs côte à côte, index et majeur tendus devant les yeux puis balayés sur le côté façon pas de danse rétro, jambes légèrement pliées." },
  { id: 'film-grease-finale', cat: 'film', emoji: '🎸', difficulty: 2, image: '',
    title: 'Grease — pose finale',
    desc: "Deux joueurs dos à dos ou enlacés, un genou légèrement plié, regard confiant vers l'objectif, cheveux « coiffés » façon rockabilly." },
  { id: 'film-mona-lisa', cat: 'film', emoji: '🖼️', difficulty: 1, image: '',
    title: 'La Joconde',
    desc: "Mains croisées devant soi, léger sourire énigmatique, tête légèrement penchée, regard fixe vers l'objectif." },
  { id: 'film-scream-mask', cat: 'film', emoji: '🔪', difficulty: 1, image: '',
    title: 'Le Cri (E. Munch)',
    desc: "Mains sur les joues, bouche en grand O, tête légèrement inclinée sur le côté, expression d'effroi existentiel." },
  { id: 'film-avengers-assemble', cat: 'film', emoji: '🛡️', difficulty: 3, image: '',
    title: 'Avengers — pose de groupe',
    desc: "Toute l'équipe se met en cercle serré, dos presque tourné les uns aux autres, chacun dans une pose de « super-héros » différente." },

  // --- SÉRIES ---
  { id: 'serie-friends-couch', cat: 'serie', emoji: '☕', difficulty: 2, image: '',
    title: 'Friends — le canapé du Central Perk',
    desc: "Assis en rang façon canapé, une tasse à la main, un joueur fait de grands gestes en racontant une histoire pendant que les autres réagissent avec exagération." },
  { id: 'serie-office-jim', cat: 'serie', emoji: '📎', difficulty: 1, image: '',
    title: 'The Office — regard caméra',
    desc: "Fixe l'objectif droit dans les yeux avec une expression totalement blasée/désabusée, sans un mot, pendant que quelque chose d'absurde se passe autour." },
  { id: 'serie-stranger-things', cat: 'serie', emoji: '🩸', difficulty: 2, image: '',
    title: 'Stranger Things — pouvoir psychique',
    desc: "Fixe un point au loin, filet de « sang » imaginaire sous le nez (doigt sous la narine), sourcils froncés de concentration intense." },
  { id: 'serie-got-throne', cat: 'serie', emoji: '👑', difficulty: 2, image: '',
    title: 'Game of Thrones — le trône',
    desc: "Assis très droit sur une chaise « imposante », mains posées fermement sur les accoudoirs, regard dominateur et impassible." },
  { id: 'serie-squid-game', cat: 'serie', emoji: '🦑', difficulty: 2, image: '',
    title: 'Squid Game — 1, 2, 3, soleil',
    desc: "Fige-toi en pleine action, un pied en l'air, bras figés en mouvement, comme surpris en flagrant délit de bouger." },
  { id: 'serie-breaking-bad', cat: 'serie', emoji: '🧪', difficulty: 2, image: '',
    title: 'Breaking Bad — le duo iconique',
    desc: "Deux joueurs debout côte à côte en tenue « protection » imaginaire, expression grave et déterminée, regard vers l'horizon." },
];

const STORAGE_KEYS = {
  customPrompts: 'icebreaker_custom_prompts_v1',
  gallery: 'icebreaker_gallery_v1',
  players: 'icebreaker_players_v1',
  refImages: 'icebreaker_ref_images_v1',
};
