# FAQ

**Question :** Dans la boîte de dialogue de configuration, au lieu de l'éditeur de tableau, je ne vois qu'
un champ de texte vide contenant du contenu cryptique — le tableau est-il corrompu ?

Réponse : Non. Ce champ de texte est un simple champ de sauvegarde que l'éditeur
masque normalement ; le contenu cryptique (commençant par `b64:`) correspond au
tableau sous forme codée. Ce codage empêche les traductions automatiques
de la page d'endommager le tableau. Il suffit généralement de recharger la boîte de dialogue
pour que l'éditeur réapparaisse.

**Question :** Quels formats de fichiers peut-on importer ?

Réponse : `.csv` ainsi que `.xlsx`/`.xls`. Lors de l’importation depuis Excel, les cellules liées
, la mise en forme des cellules (gras/italique/couleurs/alignement) et les caractères en majuscules/
bas ; une importation remplace toujours l’intégralité du contenu actuel
du tableau.

**Question :** Pourquoi toutes les lignes ne s’affichent-elles pas
lorsqu’un tableau est long ?

Réponse : Il s’agit du paramètre « Lignes visibles » (onglet « Données ») —
les utilisateurs ne voient dans un premier temps que le nombre de lignes défini et
peuvent afficher les autres à l'aide d'un bouton « Tout afficher ». Si la valeur est définie sur `0`,
le tableau affiche toutes les lignes dès le départ.

**Question :** Une image dans une cellule fait déborder tout le tableau — que faire ?

Réponse : Activez l’option « Ajuster les images » (onglet « Images ») — elle
limite toutes les images à la largeur du tableau. Si elle est désactivée,
chaque image s’affiche dans sa taille d’origine.
