# CNC_CodingIsNotACrime

Editeur demoscene HTML simple avec gestion des calques, des versions numerotees et des exports.

## Fonctions principales

- Gestion de la hierarchie des calques
- Reglage de la transparence de chaque calque
- Edition du type, de l'effet et des parametres de chaque calque
- Export direct de la demo en HTML autonome
- Export du code de la demo en JSON
- Affichage du code source de la page exportee pour modification
- Historique local des versions dans le navigateur
- Version numerotee automatiquement
- Attribution automatique d'un nom de demo connue
- Lien Demozoo pour chaque version
- References visibles vers les sources d'inspiration
- Selection de fontes web utilisables avec licence compatible
- URL musique sourcee avec prise en charge audio web
- Commentaires de fallback dans le code quand une ressource n'est pas integrable directement

## Types de calques

- Etoiles
- Plasma
- Barres raster
- Texte geant
- Scroller
- Image externe par URL

## Sources d'inspiration

- [CODEF](https://codef.santo.fr/)
- [Namwollem / Mellow Man - CODEF basics](https://namwollem.blogspot.com/p/codef-basics.html)
- [Democyclopedie - Liste des effets](https://democyclopedie.wordpress.com/2015/04/01/liste-des-effets/)
- [Democyclopedie - Differents types de demos](https://democyclopedie.wordpress.com/2017/04/03/differents-types-de-demos/)
- [Pouet.net](https://www.pouet.net/)

## Liens ajoutes en bas de page

- [demoparty.net](https://www.demoparty.net/)
- [Article du Ministere de la Culture sur la demoscene](https://www.culture.gouv.fr/thematiques/patrimoine-culturel-immateriel/vivre-le-patrimoine-culturel-immateriel/reportages/la-demoscene-une-culture-libre-a-la-croisee-des-arts-et-de-la-technique)

## Limite actuelle

L'application sait sauvegarder les versions en local dans le navigateur et exporter les fichiers. En revanche, l'upload automatique vers GitHub ne peut pas etre garanti tant qu'une authentification GitHub valide n'est pas configuree sur la machine ou dans un workflow dedie.

## Push automatique GitHub

Le depot contient un script `auto_push.sh` prevu pour pousser automatiquement la branche courante vers `origin`.

Un hook Git `post-commit` peut appeler ce script pour envoyer chaque nouveau commit sans question supplementaire, a condition que:

- un remote `origin` GitHub existe
- l'authentification GitHub soit deja valide sur la machine
