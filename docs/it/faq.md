# Domande frequenti

**Domanda:** Al posto dell’editor della tabella vedo solo un campo di testo con
contenuto criptico che inizia con `b64:`.

Risposta: Si tratta del campo **Dati della tabella** — la forma salvata della
tabella che normalmente viene nascosta dall’editor. Non modificare mai questo testo manualmente
. Cliccando su **Modifica tabella** o riaprendo la
finestra di dialogo, l’editor tornerà visibile. La codifica protegge la tabella dal
rischio di essere danneggiata dalla traduzione automatica della pagina.

**Domanda:** Le mie modifiche sono andate perse dopo la chiusura.

Risposta: **Chiudi** non salva le modifiche. Se ci sono modifiche in sospeso, l’
editor chiede conferma: selezionare **Applica**, non **Annulla**. Finché sul
titolo compare «… – non applicato», significa che c’è qualcosa in sospeso. Successivamente, salvare la pagina in
Studio con **Salva**.

**Domanda:** Come faccio a scrivere in una cella?

Risposta: **Fai doppio clic** sulla cella, poi digita. Un semplice clic
evidenzia solo la cella (per la formattazione), ma non la apre per la
modifica.

**Domanda:** Non riesco a cancellare la prima riga o la prima colonna.

Risposta: È previsto così: la prima riga è l’intestazione, la prima
colonna è l’etichetta della riga. Se non servono, basta lasciarle vuote
.

**Domanda:** Quali formati di file posso importare?

Risposta: `.csv` e `.xlsx`/`.xls`. Nel formato CSV, il punto e virgola e la virgola vengono
riconosciuti automaticamente come separatori. Per i file Excel viene importato il primo foglio di lavoro
, comprese le celle unite, la formattazione del testo, i colori, le dimensioni dei caratteri
e l’allineamento. Un’importazione **sostituisce sempre l’intera tabella**.

**Domanda:** Viene visualizzato il messaggio «Importazione non riuscita».

Risposta: Il file non è stato letto. Verificare che si tratti effettivamente di un
file `.csv`, `.xlsx` o `.xls` (e non, ad esempio, di un file rinominato o
protetto da password) e che contenga dei dati. Se necessario,
salvarlo nuovamente in formato `.xlsx` in Excel.

**Domanda:** Nella pagina non vengono visualizzate tutte le righe.

Risposta: Si tratta dell’impostazione **Righe visibili** (pannello “Tabella” a destra),
impostata di default su 5 righe di dati. Il resto è visibile tramite il pulsante sotto
la tabella. Se si desidera visualizzare tutte le righe fin dall’inizio, impostare il valore su `0`
.

**Domanda:** Perché nell’app non vedo l’opzione di esportazione?

Risposta: Nell’app Staffbase (iOS/Android) la tabella nasconde intenzionalmente l’opzione di esportazione e
le caselle di selezione delle righe, poiché i download in quel contesto non
funzionano in modo affidabile. Nel browser — anche sul telefono — l’opzione di esportazione
è disponibile.

**Domanda:** Un’immagine occupa l’intera tabella.

Risposta: A destra nel pannello **Tabella**, attiva l’opzione **Adatta immagini**.
Questa opzione limita tutte le immagini alla larghezza della tabella. Se disattivata, ogni
immagine appare nelle sue dimensioni originali.

**Domanda:** Diverse immagini hanno dimensioni diverse.

Risposta: Selezionare tutte le celle contenenti immagini e, nella scheda **Immagini**, sotto
**Dimensioni immagine**, selezionare «Stessa altezza della prima immagine» o «Stessa larghezza della prima
immagine». Devono essere selezionate almeno due immagini.

**Domanda:** Un lettore ha ordinato la tabella in modo diverso da come l’ho salvata
io.

Risposta: Nella pagina pubblicata, ogni lettore può riordinare la tabella cliccando
sull’intestazione di una colonna. Ciò vale solo per la sua visualizzazione
e non modifica la tabella salvata. Il **Primo
ordinamento** impostato nell’editor (pannello «Tabella») rimane la visualizzazione iniziale.

**Domanda:** Posso inserire un link in una cella?

Risposta: No. Le celle accettano testo, immagini e caratteri in apice/pedice,
ma non i link. I link vanno inseriti in un elemento di testo accanto alla tabella.

**Domanda:** Esiste la funzione “Annulla”?

Risposta: No. Per questo motivo, in caso di modifiche significative, è consigliabile salvare di tanto in tanto — e
prima di un’importazione, ricordarsi che questa sostituirà l’intera tabella.

**Domanda:** Cosa succede alla mia tabella durante la traduzione automatica
della pagina?

Risposta: Vengono tradotti solo i contenuti delle celle. Le celle unite,
la formattazione, le immagini e l’ordinamento rimangono invariati.

**Domanda:** La tabella è troppo larga sul cellulare.

Risposta: È possibile scorrerla lateralmente. Per gli schermi stretti è utile
unire le colonne, utilizzare intestazioni più brevi o rimuovere le immagini di grandi
dimensioni dalle celle.
