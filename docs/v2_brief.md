# Brief V2 - CNC Coding Is Not A Crime

## Vision

Faire evoluer la V1 en un editeur de demos HTML plus ambitieux, plus beau, plus structure et plus pedagogue, sans casser la base existante.

## ADN produit

- demoscene
- open source
- transmission culturelle
- edition visuelle
- approche pedagogique
- compatibilite web

## Ce que la V1 sait deja faire

- manipuler des calques
- gerer des effets simples
- sauvegarder des versions
- gerer des sets
- exporter en HTML et JSON
- exposer des sources d'inspiration
- proposer des fontes web utilisables
- associer une musique sourcee

## Ce que la V2 doit apporter

- meilleure architecture interne
- meilleure UX generale
- systeme de niveaux d'expertise
- registres de sources, effets, fontes et musiques
- attribution plus solide dans l'export
- effets mieux catalogues et mieux presets
- couche pedagogique progressive

## Les 4 modes

### LAME

- simple
- visuel
- presets
- peu de reglages

### NOOB

- guide
- explique
- decompose les effets
- rassure

### L33T

- ouvre les reglages avances
- expose plus de structure
- montre davantage les concepts

### ROXOR

- mode expert
- debug
- controle brut
- vue source / metadata / parametres complets

## Architecture cible minimale

- `EffectRegistry`
- `SourceRegistry`
- `FontRegistry`
- `MusicRegistry`
- `PresetRegistry`
- `ExportMetadataBuilder`

## UX cible

- bibliotheque d'effets
- preview centrale
- inspector a droite
- timeline ou pile de calques tres lisible
- edition proche des logiciels de VJ / mapping

## Regle cle

Toute evolution V2 doit etre incrementale et compatible avec la V1 autant que possible.

## Premier objectif concret

Un MVP V2 qui apporte :

- structure plus propre
- meilleurs exports
- niveaux d'usage
- meilleure organisation UI
- premiers effets bien references
