# FAQ

**Question :** À la place de l'éditeur de tableau, je ne vois qu'un champ de texte contenant
un contenu cryptique commençant par `b64:`.

Réponse : Il s’agit du champ **Données du tableau** — la forme enregistrée du
tableau que l’éditeur masque normalement. Ne modifiez jamais ce texte manuellement
. Un clic sur **Modifier le tableau** ou une nouvelle ouverture de la
boîte de dialogue fait réapparaître l’éditeur. Le codage protège le tableau contre toute
altération due à la traduction automatique de la page.

**Question :** Mes modifications ont disparu après la fermeture.

Réponse : **Fermer** n’enregistre pas les modifications. Si des modifications sont en cours, l’
éditeur vous le signale — sélectionnez alors **Appliquer**, et non **Ignorer**. Tant que le
titre indique « … – non appliqué », cela signifie qu’il reste des modifications en attente. Ensuite, sauvegardez la page dans
Studio en cliquant sur **Enregistrer**.

**Question :** Comment écrire dans une cellule ?

Réponse : **Double-cliquez** sur la cellule, puis saisissez votre texte. Un simple clic
ne fait que sélectionner la cellule (pour la mise en forme), il ne l’ouvre pas pour la
modification.

**Question :** Je ne parviens pas à supprimer la première ligne ou la première colonne.

Réponse : C’est voulu : la première ligne est l’en-tête, la première
colonne l’intitulé de colonne. Si vous n’en avez pas besoin, laissez-les simplement
vides.

**Question :** Quels formats de fichiers puis-je importer ?

Réponse : `.csv` ainsi que `.xlsx`/`.xls`. Pour les fichiers CSV, le point-virgule et la virgule sont
automatiquement reconnus comme séparateurs. Pour les fichiers Excel, la première feuille de calcul
est reprise, y compris les cellules fusionnées, la mise en forme du texte, les couleurs, les tailles de police
et l’alignement. Une importation **remplace toujours l’intégralité du tableau**.

**Question :** Le message « Échec de l’importation » s’affiche.

Réponse : Le fichier n’a pas pu être lu. Vérifiez s’il s’agit bien d’un
fichier `.csv`, `.xlsx` ou `.xls` (et non d’un fichier renommé ou
protégé par un mot de passe) et s’il contient du contenu. Si nécessaire,
enregistrez-le à nouveau au format `.xlsx` dans Excel.

**Question :** Toutes les lignes ne s’affichent pas sur la page.

Réponse : Il s’agit du paramètre **Lignes visibles** (panneau « Tableau » à droite),
réglé par défaut sur 5 lignes de données. Le reste s’affiche via le bouton situé sous
le tableau. Si vous souhaitez que toutes les lignes soient visibles dès le départ, réglez la valeur sur `0`
.

**Question :** Pourquoi ne vois-je pas d’option d’exportation dans l’application ?

Réponse : Dans l’application Staffbase (iOS/Android), le tableau masque volontairement l’option d’exportation et
les cases de sélection des lignes, car les téléchargements ne
fonctionnent pas de manière fiable sur cette plateforme. Dans le navigateur — même sur le téléphone —, la fonction d’exportation
est disponible.

**Question :** Une image déborde du tableau.

Réponse : Dans le panneau **Tableau**, à droite, activez le bouton **Ajuster les images**.
Cela limite toutes les images à la largeur du tableau. Lorsque cette option est désactivée, chaque
image s'affiche dans sa taille d'origine.

**Question :** Plusieurs images ont des tailles différentes.

Réponse : Sélectionnez toutes les cellules contenant des images, puis dans l'onglet **Images**, sous
**Taille de l’image**, sélectionnez « Même hauteur que la première image » ou « Même largeur que la première
image ». Au moins deux images doivent être sélectionnées.

**Question :** Un lecteur a trié le tableau différemment de la façon dont je l’ai enregistré
.

Réponse : Sur la page publiée, chaque lecteur peut réorganiser lui-même le tri en cliquant
sur un en-tête de colonne. Cela ne s’applique qu’à son affichage
et ne modifie pas le tableau enregistré. Le **premier
tri** défini dans l’éditeur (panneau « Tableau ») reste l’affichage par défaut.

**Question :** Puis-je insérer un lien dans une cellule ?

Réponse : Non. Les cellules acceptent du texte, des images ainsi que des indices et des exposants,
mais pas de liens. Les liens doivent être placés dans un élément de texte à côté du tableau.

**Question :** Y a-t-il une fonction « Annuler » ?

Réponse : Non. C’est pourquoi il faut enregistrer régulièrement lors de modifications importantes — et
penser, avant une importation, que celle-ci remplacera l’intégralité du tableau.

**Question :** Qu'advient-il de mon tableau lors de la traduction automatique
de la page ?

Réponse : Seul le contenu des cellules est traduit. Les cellules fusionnées,
les mises en forme, les images et le tri restent inchangés.

**Question :** Le tableau est trop large sur mon téléphone.

Réponse : Vous pouvez le faire défiler horizontalement. Pour les écrans étroits, il est utile de
fusionner des colonnes, d’utiliser des en-têtes plus courts ou de retirer les grandes
images des cellules.
