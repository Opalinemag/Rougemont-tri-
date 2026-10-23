/* =====================================================================
   Contenu de départ : une fois le site en ligne, tout se gère dans
   l'espace administrateur (admin.html).
   ACTUALITÉS DU CLUB
   - Pour ajouter une actualité : copie un bloc { ... }, colle-le EN HAUT
     de la liste et change les textes. Les plus récentes s'affichent en premier.
   - date  : au format "2026-10-19" (année-mois-jour)
   - image : nom d'une photo du dossier images (ex: "images/haies.jpg"), ou ""
   - texte : chaque paragraphe est une ligne de la liste [ "...", "..." ]
   ===================================================================== */
const ACTUALITES = [
  {
    date: "2026-10-17",
    titre: "Le Rougemont Triathlon est officiellement créé",
    categorie: "Vie du club",
    image: "images/coachs.jpg",
    resume: "Le 17 octobre 2026, l'association Rougemont Triathlon a vu le jour. Premières séances en novembre, cap sur 2027 !",
    texte: [
      "C'est officiel : le club Rougemont Triathlon a été créé le 17 octobre 2026 à Rougemont (25680).",
      "Le bureau de l'association est composé d'Arnaud Crozat (président, titulaire du BF2 FFTri, initiateur-éducateur triathlon), de Mélanie Gervais (trésorière) et de Marie-Christine Crozat (secrétaire).",
      "Notre ambition : proposer un triathlon accessible à tous, enfants comme adultes, dans un esprit de convivialité et de partage. Les premières séances démarrent en novembre 2026, et nous avons de beaux projets pour la saison 2027.",
      "Pour toute question ou inscription, contactez-nous par téléphone ou par e-mail.",
    ],
  },
  {
    date: "2026-09-26",
    titre: "Initiation duathlon : retour en images",
    categorie: "Jeunes",
    image: "images/briefing.jpg",
    resume: "Ateliers vélo, jeux de course et beaucoup de sourires lors de l'initiation au duathlon pour les 5 – 16 ans.",
    texte: [
      "Sous un beau soleil, une dizaine d'enfants ont participé à l'initiation au duathlon organisée sur la place de Rougemont, en partenariat avec le Stade de Reims Triathlon.",
      "Au programme : un atelier de maniabilité à vélo entre les plots, des jeux de course et de saut, puis un petit enchaînement vélo / course pour goûter à l'esprit du triathlon.",
      "Merci aux parents présents et aux bénévoles pour leur aide. Retrouvez toutes les photos dans la rubrique Photos.",
    ],
  },
  {
    date: "2026-09-10",
    titre: "Un club ouvert à tous les enfants",
    categorie: "Inclusion",
    image: "images/apprentissage-velo.jpg",
    resume: "Le club va à la rencontre des structures d'accueil du secteur pour permettre à chaque enfant de pratiquer.",
    texte: [
      "Le sport doit être accessible à tous. Le Rougemont Triathlon souhaite accueillir chaque enfant, quels que soient son parcours ou son niveau.",
      "Nous prenons contact avec les foyers et structures d'accueil du secteur afin que les jeunes qu'ils accompagnent puissent rejoindre les séances et partager la vie du groupe.",
      "Vous êtes éducateur ou responsable d'une structure ? N'hésitez pas à nous contacter.",
    ],
  },
];
