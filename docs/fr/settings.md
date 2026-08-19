# Paramètres

D'un point de vue technique, le widget ne comporte qu'un seul champ
(« Données du tableau ») dans la boîte de dialogue de configuration, qui stocke l'intégralité du contenu du tableau. Cependant,
celui-ci n'est jamais modifié directement sous forme de texte, mais via l'éditeur de tableau qui
s'ouvre automatiquement au-dessus de ce champ. Les paramètres proprement dits se trouvent
dans sa barre d’outils :

| Onglet | Fonction |
| --- | --- |
| Police | Taille de police, gras/italique/souligné/barré, exposant/indice, couleur du texte et de l’arrière-plan, ainsi que « Annuler les majuscules » (annule la mise en majuscules automatique de la page pour la mise en évidence). |
| Alignement | Alignement horizontal (à gauche/centré/à droite) et vertical (en haut/au centre/en bas) du contenu de la cellule. |
| Cellules | Fusionner/défusionner des cellules, insérer ou supprimer des lignes et des colonnes. |
| Images | Insérer une image dans la cellule sélectionnée, harmoniser ou réinitialiser la taille de plusieurs images sélectionnées. |
| Données | Trier par colonne, pinceau de format, nombre de lignes visibles, supprimer la mise en forme, importer un tableau depuis un fichier `.csv`/`.xlsx`/`.xls`. |

Paramètres supplémentaires en dehors de la barre d'outils :

| Paramètre | Description |
| --- | --- |
| Lignes visibles | Détermine le nombre de lignes de données affichées sur la page publiée avant que le tableau ne soit masqué derrière un bouton « Tout afficher ». La valeur `0` affiche toujours toutes les lignes. Réglable via l'onglet « Données ». |

« Enregistrer » transmet l'état actuel au widget, « Fermer » ne supprime
rien de lui-même, mais quitte la boîte de dialogue sans enregistrer —
une notification à côté des deux boutons indique les modifications non enregistrées. Un
onglet d’aide dédié dans l’éditeur explique à nouveau chaque fonction en détail.
