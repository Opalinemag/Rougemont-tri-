/* =====================================================================
   SPONSORS ET MAILLOT — contenu de départ
   Une fois le site en ligne, tout se gère dans l'espace administrateur
   (onglet Sponsors) : ajout des logos, présentations, liens.
   Sponsors repris du projet de maillot. Sans logo, le nom s'affiche.
   Logos : Wikimedia Commons / Wikipédia (marques déposées de leurs propriétaires) ;
   SOCODIF : logo officiel (socodif-chimie-industrie.fr) ; SARL de la Forge et
   Michel Chambrette redessinés d'après les logos fournis.
   ===================================================================== */
const SPONSORS = [
  { nom: "Mairie de Rougemont", activite: "Commune de Rougemont (Doubs)",
    description: "La commune de Rougemont soutient le club et la pratique sportive des jeunes du village.",
    logo: "images/sponsors/mairie-rougemont.svg", site: "" },
  { nom: "Super U", activite: "Grande distribution",
    description: "Enseigne de supermarchés de la Coopérative U, partenaire de la vie locale et des associations sportives.",
    logo: "images/sponsors/super-u.svg", site: "https://www.magasins-u.com" },
  { nom: "Decathlon", activite: "Magasin de sport",
    description: "Enseigne française d'articles de sport, fondée en 1976, qui accompagne la pratique sportive pour tous.",
    logo: "images/sponsors/decathlon.svg", site: "https://www.decathlon.fr" },
  { nom: "Lapierre", activite: "Fabricant de vélos",
    description: "Marque française de vélos née à Dijon en 1946, référence du vélo de route, de triathlon et de VTT.",
    logo: "images/sponsors/lapierre.svg", site: "https://www.lapierrebikes.com" },
  { nom: "Ford", activite: "Automobile",
    description: "Constructeur automobile américain fondé en 1903, partenaire du club.",
    logo: "images/sponsors/ford.svg", site: "https://www.ford.fr" },
  { nom: "SOCODIF", activite: "Produits techniques pour professionnels",
    description: "Fabricant de produits techniques (détergents, lubrifiants, traitements, produits verts…) pour l'industrie, le bâtiment et les collectivités.",
    logo: "images/sponsors/socodif.svg", site: "https://www.socodif-chimie-industrie.fr" },
  { nom: "SARL de la Forge", activite: "Terrassement et travaux publics",
    description: "Entreprise de terrassement et de travaux publics, partenaire du club.",
    logo: "images/sponsors/sarl-de-la-forge.svg", site: "" },
  { nom: "SARL Michel Chambrette", activite: "Chauffage, sanitaire, dépannage",
    description: "Entreprise de chauffage, sanitaire et dépannage, partenaire du club.",
    logo: "images/sponsors/michel-chambrette.svg", site: "" },
];

const MAILLOT = {
  image: "images/maillot.jpg",
  texte: "La tenue du club : trifonction et tee-shirt aux couleurs de Rougemont, avec les logos de nos partenaires.",
};
