/* =====================================================================
   SPONSORS ET MAILLOT — contenu de départ
   Une fois le site en ligne, tout se gère dans l'espace administrateur
   (onglet Sponsors) : ajout des logos, présentations, liens.
   Sponsors = ceux présents sur les tenues du club.
   Logos : SOCODIF officiel (socodif-chimie-industrie.fr) ; SARL de la Forge
   redessiné ; SOGEA, Assurances Abeilles et Cycle Franck Brun repris des
   maquettes des tenues (à remplacer par les logos officiels si disponibles).
   fondLogo : couleur de fond du cadre du logo (pour les logos blancs).
   ===================================================================== */
const SPONSORS = [
  { nom: "SOCODIF", activite: "Produits techniques pour professionnels",
    description: "Fabricant de produits techniques (détergents, lubrifiants, traitements, produits verts…) pour l'industrie, le bâtiment et les collectivités.",
    logo: "images/sponsors/socodif.svg", site: "https://www.socodif-chimie-industrie.fr" },
  { nom: "SOGEA", activite: "Travaux publics",
    description: "Partenaire du club, présent sur les tenues officielles.",
    logo: "images/sponsors/sogea.png", fondLogo: "#16246a", site: "" },
  { nom: "Assurances Abeilles", activite: "Assurances",
    description: "Partenaire du club, présent sur les tenues officielles.",
    logo: "images/sponsors/assurances-abeilles.png", fondLogo: "#16246a", site: "" },
  { nom: "SARL de la Forge", activite: "Terrassement et travaux publics",
    description: "Entreprise de terrassement et de travaux publics, partenaire du club.",
    logo: "images/sponsors/sarl-de-la-forge.svg", site: "https://sarldelaforge.fr/services/" },
  { nom: "Cycle Franck Brun", activite: "Cycles",
    description: "Partenaire du club, présent sur les tenues officielles.",
    logo: "images/sponsors/cycle-franck-brun.png", fondLogo: "#16246a", site: "" },
  { nom: "Boulangerie Gamet", activite: "Boulangerie",
    description: "Boulangerie de Rougemont, 2 place du Marché, partenaire du club.",
    logo: "", site: "" },
  { nom: "Mairie de Rougemont", activite: "Partenaire institutionnel",
    description: "La commune de Rougemont soutient le club en mettant à disposition ses installations pour les entraînements.",
    logo: "images/sponsors/mairie-rougemont.svg", site: "" },
  { nom: "Team GT Cycling", activite: "Support technique",
    description: "Association cycliste qui assure la conception et le suivi technique du site internet du club.",
    logo: "images/sponsors/team-gt-cycling.png", fondLogo: "#111111", site: "" },
];

const MAILLOT = {
  image: "images/tenues/tenues-garcon-fille.webp",
  texte: "Les tenues officielles du club, en version garçon (bleu et rouge) et fille (bleu et rose) : maillot et trifonction sans manches, aux couleurs de Rougemont et de nos partenaires.",
};
