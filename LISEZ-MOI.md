# Site du Rougemont Triathlon

## Mettre le site en ligne (gratuit, sur ton propre compte)

1. Crée un compte gratuit sur **github.com**, puis un nouveau dépôt (repository) et envoie-y tout le contenu de ce dossier (bouton *Add file → Upload files*). N'envoie pas le dossier `node_modules` s'il existe.
2. Crée un compte gratuit sur **vercel.com** en te connectant avec GitHub.
3. Sur Vercel : **Add New → Project**, choisis le dépôt, puis **Deploy**.
4. Toujours sur Vercel, dans le projet :
   - **Storage → Create → Blob** : crée un espace de stockage et relie-le au projet (sert à garder les photos et actualités ajoutées depuis l'admin).
   - **Settings → Environment Variables** : ajoute deux variables :
     - `ADMIN_USER` : l'identifiant de connexion (ex. `bureau`) ;
     - `ADMIN_PASSWORD` : le mot de passe de ton choix (long, que tu es seul à connaître).
   - **Deployments → … → Redeploy** pour prendre en compte ces réglages.

## Espace administrateur

Bouton « Connexion administrateur » en bas de chaque page (ou `ton-site.vercel.app/admin.html`), puis identifiant et mot de passe choisis dans Vercel.

- **Actualités** : ajouter, modifier, supprimer, avec photo.
- **Photos** : créer des albums et y ajouter des photos (réduites automatiquement).
- **Planning** : modifier les créneaux de la semaine, marquer un créneau annulé, afficher un message (changement de lieu, météo…).
- **Sponsors** : ajouter un sponsor (nom, activité, présentation, logo, site) et la photo du maillot. Tant qu'il n'y a aucun sponsor, le bandeau de l'accueil fait défiler le logo du club.

Chaque modification est visible sur le site immédiatement.

## Formulaire de contact

Les demandes arrivent sur rougemont.triathlon@outlook.fr via FormSubmit (gratuit).
À la toute première demande, FormSubmit envoie un e-mail d'activation : il faut cliquer une fois sur le lien (regarder aussi dans les indésirables).

## Coordonnées et réseaux sociaux

Dans `donnees/club.js` : téléphone, e-mail, liens Facebook / Instagram.

## Photos d'enfants

Avant de publier une photo où un enfant est reconnaissable, vérifier l'autorisation des parents (droit à l'image).
