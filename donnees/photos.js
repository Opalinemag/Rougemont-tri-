/* =====================================================================
   Contenu de départ : une fois le site en ligne, tout se gère dans
   l'espace administrateur (admin.html).
   PHOTOS DU CLUB — classées par album
   - Mets les photos dans le dossier "images", puis ajoute-les ici.
   - Pour un nouvel album : copie un bloc { ... } et colle-le EN HAUT.
   - Chaque photo : { src: "images/nom-du-fichier.jpg", legende: "..." }
   ===================================================================== */
const ALBUMS = [
  {
    titre: "Initiation duathlon jeunes",
    date: "Septembre 2026",
    photos: [
      { src: "images/depart-velo.jpg",        legende: "Prêts pour le départ de l'atelier vélo" },
      { src: "images/briefing.jpg",           legende: "Les consignes avant l'exercice" },
      { src: "images/course-jeux.jpg",        legende: "Jeux de course et de saut" },
      { src: "images/haies.jpg",              legende: "Premières haies pour les plus petits" },
      { src: "images/enfants-alignes.jpg",    legende: "En ligne pour le relais" },
      { src: "images/velo-parc.jpg",          legende: "Installation des vélos" },
      { src: "images/apprentissage-velo.jpg", legende: "Apprendre à bien tenir son guidon" },
    ],
  },
  {
    titre: "L'équipe d'encadrement",
    date: "2026",
    photos: [
      { src: "images/coachs.jpg", legende: "Les entraîneurs du club" },
    ],
  },
];
