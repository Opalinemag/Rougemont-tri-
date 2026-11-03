/* =====================================================================
   PLANNING DES ENTRAÎNEMENTS — contenu de départ
   Une fois le site en ligne, le planning se modifie dans l'espace
   administrateur (admin.html). Ce fichier sert seulement au premier lancement.
   =====================================================================
   - Change uniquement le texte entre guillemets "...".
   - Une ligne { ... } = un créneau de la semaine. Copie/colle une ligne
     pour en ajouter un, supprime-la pour l'enlever (garde bien la virgule
     entre deux lignes).
   - jour   : Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi ou Dimanche
   - debut / fin : heures au format "14h00"
   - annule : mets true pour afficher le créneau comme ANNULÉ, sinon false
   ===================================================================== */

// Message affiché au-dessus du planning (changement de lieu, météo...).
// Laisse "" pour ne rien afficher.
const INFO_DU_MOMENT = "";

// N'afficher que les créneaux CONFIRMÉS. Tant que la liste est vide, le site
// affiche « Contactez-nous pour connaître les horaires ».
const ENTRAINEMENTS = [
  { jour: "Mercredi", debut: "14h00", fin: "16h00", groupe: "Jeunes – École de triathlon", activite: "Duathlon, course à pied, vélo",
    lieu: "Terrain annexe de football de Rougemont (terrain en schiste)", note: "Par mauvais temps : voir l'encadré ci-dessous", annule: false },
  { jour: "Samedi", debut: "10h00", fin: "11h30", groupe: "Jeunes – École de triathlon", activite: "Vélo et course à pied",
    lieu: "Départ de la Voie Verte, en face de la pharmacie de Rougemont", note: "", annule: false },
];

// Textes fixes affichés sous le planning (laisser "" pour ne rien afficher)
const NOTE_MAUVAIS_TEMPS = "En cas de mauvais temps ou de températures trop basses, les entraînements pourront être organisés temporairement dans la salle située près de la salle des fêtes de Rougemont, sous réserve de disponibilité, conformément à l'accord donné par Monsieur le Maire. Le club n'est pas prioritaire sur l'utilisation de cette salle.";
const NOTE_ADULTES = "Section adultes : horaires en cours d'élaboration. Le planning adultes sera communiqué prochainement en fonction des disponibilités et des groupes constitués.";
