# 🚀Cinetech

Il s'agit d'une bibliothèque de films et de séries. Elle a été réalisée grâce à l'API publique disponible en ligne (TMDB).

### Elle comporte les pages suivantes:

- Page d'accueil:
  La page d’accueil présente une sélection de films et une sélection des séries.
- Page films:
  Page dédiée aux films qui affiche tous les films disponibles avec pagination.
- Page séries:
  Page dédiée aux films qui affiche tous les films disponibles avec pagination.
- Page détail:
  Page dans laquelle se trouvent les informations des films/séries (réalisateur, types, pays d’origine, résumé, acteurs, etc...).Sur cette page également, une suggestion de films et des séries similaires est proposée.
- Page favoris:
  Page dédiée aux favoris de la personne connectée.

Un utilisateur connecté peut ajouter un élément à sa liste “favoris” lorsqu’il la consulte et peut toujours consulter ses favoris dans la fage favoris.
L’utilisateur peut laisser des commentaires sur les films et séries et peut répondre également à des commentaires laissés précédemment.
L’utilisateur a la possibilité de chercher n’importe quel élément grâce à une barre de recherche intégrée dans le header

## ⚠️ Important

Le site est fait uniquement en front. Par conséquent, la gestion des connexions,des données pour manipuler vos favoris et pour inscrire vos commentaires est faite avec le local storage.

## 📁 Structure du projet

```
cinetech/
├── config/           # Configuration
│   ├── config.js     #fichier de config qui contient la clé d'API
│   └── config.ts
|
|── auth.js            # JS pour la modal de connexion dans la navbar
|── auth.ts
|── details.html       #Page détails des films/séries
|── details.js
|── details.ts
|── favorites.html     #Page favorites
|── favorites.js
|── favorites.ts
|── index.html         #Page d'accueil
|── index.js
|── index.ts
|── list.js            # JS pour les listes
|── list.ts
|── movies.html        #Page films
|── series.html        #Page séries
|── style.css          #CSS
|── tsconfig.json      #Fichier config typescript
```
