# TFT Challenger Lab local — version 2

Application personnelle et locale. Aucun compte, serveur distant ou envoi de données.

## Démarrage

- **Windows** : double-cliquer sur `start.bat`.
- **macOS/Linux** : exécuter `./start.sh`.
- **Sans Python** : ouvrir directement `index.html` dans un navigateur moderne.

Adresse locale habituelle : `http://localhost:8765`.

## Boucle d'utilisation

1. Définir une compétence mesurable pour le bloc.
2. Après une partie, capturer une décision importante en moins de deux minutes.
3. Envoyer les cas incertains ou coûteux dans la file de review.
4. Extraire un principe conditionnel.
5. Créer un drill et le retester aux dates proposées.

## Fonctions

- capture, modification et suppression en cascade ;
- liaison des décisions à un joueur professionnel comparable ;
- contexte, alternatives, prédiction et résultat séparés ;
- reviews avec notes ;
- drills espacés, réponses conservées et suspension ;
- watchlist modifiable ;
- recherche dans les décisions ;
- export JSON, import fusionné et export CSV ;
- migration automatique depuis la version 1 ;
- diagnostic d'intégrité et journal d'audit ;
- sauvegarde pré-réinitialisation dans le navigateur.

## Sauvegarde

Les données sont stockées dans le `localStorage` du navigateur. Elles peuvent disparaître si les données du navigateur sont nettoyées.

Exporter un JSON au minimum une fois par semaine et conserver plusieurs versions. L'import fusionne les identifiants au lieu d'effacer silencieusement la base existante.

## Tests

Le moteur de données est dans `core.js`. Pour exécuter ses tests :

```bash
node test-core.js
```

Les tests vérifient l'ajout, la modification, la suppression en cascade, les reviews, les drills, leur planification et la fusion d'une sauvegarde.

## Limites volontaires

Cette application ne remplace pas Tactics.tools, MetaTFT ou les VOD. Elle ne récupère pas automatiquement les parties et ne prétend pas juger objectivement une décision. Elle sert uniquement à réduire la friction de l'apprentissage personnel.
