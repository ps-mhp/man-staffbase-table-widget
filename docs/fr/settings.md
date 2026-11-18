# Paramètres

Dans la boîte de dialogue de configuration, il n'y a techniquement qu'un seul champ : **Données du tableau**.
Ce champ contient le tableau sous sa forme enregistrée ; sa modification s'effectue
exclusivement via l'**éditeur de tableau**, qui s'ouvre automatiquement par-dessus
. Une fois l’éditeur fermé, le bouton **Modifier le tableau**
permet de le rouvrir.

## Barre d’en-tête de l’éditeur

La barre d’en-tête est identique dans tous les widgets MAN.

| Bouton | Effet |
| --- | --- |
| Fermer (à gauche) | Quitte l’éditeur. Si des modifications sont en cours, il demande : Ignorer, Continuer à modifier ou Valider. |
| Statut dans le titre | « Aucune modification » ou ce qui est en cours, par exemple « 3 cellules modifiées – non validées », « Structure modifiée », « Paramètres modifiés ». |
| Éditeur · Bureau · Tablette · Mobile | Bascule entre le mode Édition et l’aperçu du tableau publié, adapté à la largeur de l’appareil. |
| Annuler, Répéter | Annule ou rétablit les actions précédentes. |
| Aide | Ouvre à droite l’aide rapide pour chaque fonction et les boutons. |
| Annuler | Comme « Fermer ». |
| Appliquer | Enregistre le tableau dans la boîte de dialogue du widget et ferme celle-ci. L’enregistrement n’est effectif qu’après avoir cliqué sur « Enregistrer » dans Studio. |

## Onglets de la barre d’outils

| Onglet | Ce qu’il contient |
| --- | --- |
| Police | Taille de police (par défaut, 10–32), agrandir/réduire la police, gras, italique, souligné, barré, exposant, indice, couleur de police, couleur d’arrière-plan. |
| Alignement | Aligné à gauche, centré, aligné à droite, ainsi qu’en haut, au milieu, en bas. |
| Cellules | Fusionner, séparer, insérer (ligne au-dessus/en dessous, colonne à gauche/à droite), supprimer (ligne(s), colonne(s)). |
| Images | Insérer une image dans une cellule, ajuster la taille des images (même hauteur/largeur que la première image, taille par défaut). |
| Données | Copier le format, supprimer la mise en forme. |

À droite des onglets se trouve **Importer (.csv, .xlsx)** : lit un
fichier et remplace l'ensemble du tableau.

## Panneau « Tableau »

À droite du tableau se trouvent les paramètres qui s'appliquent à l'ensemble du tableau
. Elles restent visibles dans l’aperçu.

| Paramètre | Description |
| --- | --- |
| Premier tri | *Aucun* (par défaut) ou une colonne, avec *Croissant* ou *Décroissant*. Le tableau est ainsi trié à l’ouverture ; l’en-tête reste en haut. Les lecteurs peuvent modifier le tri en cliquant sur un en-tête. Il est également possible de définir le tri via le menu contextuel → Tri. |
| Lignes visibles | Nombre de lignes de données immédiatement visibles sur la page ; le reste étant masqué derrière un bouton d’affichage. Valeur par défaut : 5 ; `0` signifie « toujours toutes les lignes ». L’en-tête n’est pas pris en compte. |
| Exportation | *Désactivée* (par défaut), *Tableau complet* ou *Avec sélection de lignes*. Les boutons « Excel (.xlsx) » et « CSV » apparaissent alors au-dessus du tableau ; avec la sélection de lignes, une colonne de cases à cocher s’affiche à gauche, et seules les lignes sélectionnées sont exportées (sans sélection, toutes les lignes sont exportées). Dans l’application Staffbase (iOS/Android), l’option d’exportation n’apparaît pas. |
| Ajuster les images | Lorsque cette option est activée, toutes les images s’adaptent à la largeur du tableau. Lorsqu’elle est désactivée, chaque image s’affiche dans sa taille d’origine — et peut dépasser les limites du tableau. |

La version du widget est indiquée en bas du panneau.

## Autres outils

| Outil | Description |
| --- | --- |
| Copier le format (onglet « Données ») | Applique le format de la sélection actuelle aux cellules sélectionnées ensuite. |
