# FAQ

**Domanda:** Nella finestra di dialogo di configurazione, al posto dell'editor della tabella vedo solo
un campo di testo vuoto con un contenuto criptico — la tabella è danneggiata?

Risposta: No. Il campo di testo è un semplice campo di backup che l'editor
normalmente copre; il contenuto criptico (che inizia con `b64:`) è la
tabella in forma codificata. Questa codifica impedisce che le traduzioni automatiche
della pagina danneggino la tabella. Di solito è sufficiente ricaricare la finestra di dialogo
per far riapparire l’editor.

**Domanda:** Quali formati di file è possibile importare?

Risposta: `.csv` e `.xlsx`/`.xls`. Nell’importazione da Excel vengono mantenute le
celle collegate, la formattazione delle celle (grassetto/corsivo/colori/allineamento) e le maiuscole/
bassa; un’importazione sostituisce sempre l’intero contenuto attuale
della tabella.

**Domanda:** Perché in una tabella lunga non vengono visualizzate tutte le righe
?

Risposta: Si tratta dell’impostazione «Righe visibili» (scheda «Dati») —
gli utenti vedono inizialmente solo il numero di righe di dati impostato e
possono visualizzare le restanti tramite un pulsante «Mostra tutto». Se impostato su `0`,
la tabella mostra tutte le righe fin dall’inizio.

**Domanda:** Un’immagine in una cella fa sfiorare i bordi della tabella — cosa fare?

Risposta: Attivare l’opzione «Adatta immagini» (scheda «Immagini») — questa
limita tutte le immagini alla larghezza della tabella. Se è disattivata,
ogni immagine viene visualizzata nelle sue dimensioni originali.
