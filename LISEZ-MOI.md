# Site du Rougemont Triathlon

Site en ligne : https://rougemont-triathlon.vercel.app

## Hébergement

- **GitHub** : dépôt `Opalinemag/Rougemont-tri-` (fichiers du site). Chaque envoi sur la branche `main` remet le site en ligne automatiquement.
- **Vercel** : projet `rougemont-triathlon`, relié au dépôt GitHub. Réglages nécessaires dans le projet :
  - **Stockage → Blob**, en accès **public**, relié au projet (garde les photos et actualités ajoutées depuis l'admin) ;
  - **Paramètres → Variables d'environnement** (Production) :
    - `ADMIN_USER` : l'identifiant de connexion à l'admin ;
    - `ADMIN_PASSWORD` : le mot de passe (long, connu du seul bureau).
  - Après un changement de réglage : **Déploiements → ⋯ → Redéployer**.

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
