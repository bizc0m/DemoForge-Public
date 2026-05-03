# Claude Prompts Specialises - CNC V2

Ce fichier contient des prompts plus cibles a lancer apres le prompt maitre.

## 1. Diagnostic initial V1 -> V2

```text
Analyse la V1 existante et propose un plan V2 realiste sans re-ecrire tout le projet.

Je veux :
- conserver ce qui marche deja
- eviter un refactor total inutile
- structurer une vraie montee en gamme V2

Donne-moi :
1. un diagnostic de la V1
2. les modules a creer ou renforcer
3. l'ordre optimal d'implementation
4. ce qui doit rester stable
5. un MVP V2 concret et incremental
```

## 2. Architecture interne V2

```text
Renforce l'architecture du projet existant pour preparer la V2 sans casser la V1.

Je veux une structure compatible avec :
- EffectRegistry
- SourceRegistry
- FontRegistry
- MusicRegistry
- PresetRegistry
- ExportMetadataBuilder

Chaque effet doit pouvoir contenir :
- id
- nom
- categorie
- description
- fonction
- 7 parametres principaux
- niveau minimum (LAME / NOOB / L33T / ROXOR)
- sources
- demos de reference
- auteurs / codeurs / groupes
- limites techniques ou juridiques

Travaille par petites etapes et reste compatible avec l'interface actuelle.
```

## 3. Systeme de niveaux

```text
Ajoute un systeme progressif de niveaux UI au projet existant :
- LAME
- NOOB
- L33T
- ROXOR

Règles :
- LAME : interface minimale, presets et gros boutons
- NOOB : explications pedagogiques, labels clairs
- L33T : parametres avances visibles
- ROXOR : donnees brutes, debug, controle expert

Je veux :
- un etat global du mode
- une logique de visibilite propre
- aucun doublon inutile
- une integration propre dans les panneaux existants
```

## 4. UX type logiciel de mapping / VJ

```text
Ameliore l'UX de l'editeur existant pour la rapprocher d'un logiciel de video mapping / VJ.

Objectif :
- bibliotheque d'effets a gauche
- preview centrale
- inspector a droite
- timeline et pile de calques tres lisibles
- action rapide sur ordre, mute, solo, opacite, blend

Conserve le moteur existant autant que possible.
Priorise l'organisation, la lisibilite et la fluidite du workflow.
```

## 5. Premiere vague d'effets bien structures

```text
Prepare la V2 pour un vrai catalogue d'effets demoscene.

Commence par structurer et integrer proprement ces effets :
- horizontal scroller
- DYCP scroller
- starfield
- copper / raster bars
- plasma
- fire
- tunnel
- rotozoom
- metaballs
- ascii intro / nfo screen

Pour chaque effet :
- panneau de parametres
- niveau minimum d'acces
- metadonnees source
- preset de demonstration
- compatibilite export
```

## 6. Bibliotheque des fontes

```text
Ajoute un vrai selecteur de fontes pour les scrollers et titres.

Je veux :
- les fontes legalement integrables directement
- les fontes seulement referencees si l'integration directe n'est pas claire
- preview live
- licence / source visibles
- tags de style : pixel, dos, amiga, arcade, terminal, clean
- commentaires dans le code pour les fontes non embarquees

Travaille a partir des fontes et sources deja presentes dans le projet.
```

## 7. Musique et formats tracker

```text
Ameliore la partie audio du projet.

Je veux :
- support clair des formats audio web simples
- architecture prete pour .mod / .xm / .s3m / .it
- commentaires explicites quand un format tracker n'est pas encore lu nativement
- structure propre pour brancher plus tard chiptune3.js ou modplayer-js
- metadata exportees dans les productions generees
```

## 8. Export enrichi

```text
Renforce l'export existant sans casser le comportement actuel.

Je veux 3 niveaux d'export :
1. export HTML complet
2. export demo seule
3. export JSON projet

Chaque export doit inclure :
- effets utilises
- concepts / inspirations
- fontes utilisees
- musique utilisee
- liens source
- commentaires de fallback pour les ressources non embarquees
```

## 9. Couche pedagogique

```text
Ajoute une couche pedagogique legere a l'editeur.

Pour un effet, je veux pouvoir afficher :
- ce que c'est
- sa fonction
- ses 7 parametres principaux
- l'impact de ces parametres
- ses references demoscene
- auteur / codeur / groupe
- lien source

Attention :
- ne surcharge pas le mode LAME
- privilegie NOOB, L33T et ROXOR pour les details
```

## 10. Audit de regression avant gros refactor

```text
Avant de modifier fortement le projet, fais un audit de regression.

Liste :
- ce qui marche deja
- ce qui risque de casser
- quels composants toucher en premier
- quels composants laisser stables pour l'instant
- une strategie de migration V1 -> V2 sure

Ensuite seulement, propose le premier patch incremental.
```

## Ordre recommande

1. Diagnostic initial
2. Audit de regression
3. Architecture V2
4. Systeme de niveaux
5. UX mapping / timeline
6. Export enrichi
7. Premiere vague d'effets
8. Fontes
9. Audio tracker
10. Couche pedagogique
