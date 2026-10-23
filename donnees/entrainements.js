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
// Exemple de ligne :
// { jour: "Mercredi", debut: "14h00", fin: "15h30", groupe: "Jeunes 6 – 11 ans", activite: "Course & vélo", lieu: "Rougemont", note: "Casque obligatoire", annule: false },
const ENTRAINEMENTS = [];
