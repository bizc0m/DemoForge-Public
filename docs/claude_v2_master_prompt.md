# Claude Prompt Maitre - CNC V2

Utilise ce prompt au debut d'une session Claude quand tu veux faire evoluer la V1 vers une vraie V2 sans tout casser.

```text
Tu travailles sur la V2 d'un editeur de demos HTML deja existant.
Le projet s'appelle "CNC Coding Is Not A Crime".

MISSION
Tu dois ameliorer l'existant sans casser les fonctions qui marchent deja.
Tu ne dois pas recrire l'application from scratch si ce n'est pas indispensable.
Tu travailles par ameliorations incrementales, testables, coherentes et documentees.

CONTEXTE PRODUIT
Le projet est un editeur demoscene HTML pedagogique et creatif.
Il doit evoluer vers une V2 plus ambitieuse avec :
- UX inspiree des logiciels de video mapping / VJ
- timeline et couches mieux structurees
- presets, sets, versions, export propre
- attribution systematique des concepts, effets, fontes et musiques
- 4 niveaux d'usage : LAME / NOOB / L33T / ROXOR
- valorisation culturelle et open source de la demoscene

ETAT ACTUEL A PRESERVER
La V1 contient deja :
- un canvas de preview
- des calques
- des effets demoscene simples
- des parametres par calque
- des versions locales
- des sets
- des exports HTML et JSON
- des fontes web
- une section musique sourcee
- des liens et commentaires de sourcing

CONTRAINTE FONDAMENTALE
Ne supprime pas brutalement des fonctions existantes.
Ne remplace pas tout par une nouvelle architecture si une extension propre suffit.
Preserve absolument :
- les exports actuels
- la logique de sauvegarde locale
- la compatibilite navigateur
- le rendu existant tant qu'il n'est pas explicitement remplace

OBJECTIF V2
Faire de cette V1 un editeur plus robuste, plus beau, plus pedagogique et plus scene-compatible.

PRINCIPES DE TRAVAIL
1. Toujours commencer par analyser les fichiers existants.
2. Toujours proposer un plan incremental avant un gros changement.
3. Toujours preferer des modules clairs plutot qu'un gros fichier encore plus monolithique.
4. Toujours documenter les ressources et leurs limites de licence ou d'integration.
5. Toujours ajouter du code compatible avec une migration progressive.

RÈGLES DE SOURCING
Chaque effet ou ressource importante doit pouvoir contenir :
- nom
- categorie
- description
- fonction
- 7 parametres principaux
- origine / contexte
- demos de reference
- auteur, groupe ou codeur si connu
- lien source
- limites d'usage ou de licence si necessaire

REGLES D'EXPORT
Chaque production exportee doit embarquer ou exposer :
- les effets utilises
- les concepts inspires
- les fontes utilisees
- la musique utilisee
- les sources et credits
- des commentaires de fallback si une ressource n'est pas embarquee directement

4 MODES UTILISATEUR
- LAME : usage ultra simple, presets, tres peu de controles
- NOOB : usage guide, labels pedagogiques, controles accessibles
- L33T : usage avance, plus de parametres visibles
- ROXOR : usage expert, donnees brutes, debug, reglages complets, source

LIGNE UX
L'interface doit tendre vers :
- bibliotheque d'effets a gauche
- preview centrale
- inspector a droite
- timeline / pile de calques tres lisible
- workflow proche Resolume / mapping / VJ

TECHNIQUE
- garder les performances correctes
- eviter les dependances inutiles
- produire un code lisible
- commenter seulement ce qui le merite vraiment

FORMAT DE REPONSE ATTENDU
A chaque etape :
1. explique ce que tu vas faire
2. fais la modification
3. liste les fichiers touches
4. signale les risques ou regressions possibles
5. propose le prochain increment logique

SI LE SCOPE EST TROP GRAND
Commence par un MVP V2 solide :
- meilleure architecture interne
- meilleur sourcing
- systeme de modes
- base UX renforcee
- exports enrichis
- quelques effets majeurs tres bien structures
```

## Utilisation recommandee

1. Colle ce prompt.
2. Ajoute ensuite les fichiers actuels du projet.
3. Lance un chantier a la fois avec les prompts specialises du fichier `CLAUDE_V2_TASKS.md`.
