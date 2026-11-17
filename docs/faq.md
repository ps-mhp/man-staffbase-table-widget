# FAQ

**Frage:** Ich sehe statt des Tabellen-Editors nur ein Textfeld mit
kryptischem Inhalt, der mit `b64:` beginnt.

Antwort: Das ist das Feld **Tabellendaten** — die gespeicherte Form der
Tabelle, die der Editor normalerweise überdeckt. Diesen Text nie von Hand
bearbeiten. Ein Klick auf **Tabelle bearbeiten** bzw. ein erneutes Öffnen des
Dialogs holt den Editor zurück. Die Kodierung schützt die Tabelle davor, von
der automatischen Seitenübersetzung zerstört zu werden.

**Frage:** Meine Änderungen sind nach dem Schließen weg.

Antwort: **Schließen** übernimmt nicht. Mit offenen Änderungen fragt der
Editor nach — dort **Übernehmen** wählen, nicht **Verwerfen**. Solange am
Titel „… – nicht übernommen“ steht, ist etwas offen. Danach die Seite im
Studio mit **Speichern** sichern.

**Frage:** Wie schreibe ich in eine Zelle?

Antwort: In die Zelle **doppelklicken**, dann tippen. Ein einfacher Klick
markiert die Zelle nur (für Formatierungen), er öffnet sie nicht zum
Bearbeiten.

**Frage:** Ich kann die erste Zeile oder die erste Spalte nicht löschen.

Antwort: Das ist so vorgesehen: Die erste Zeile ist die Kopfzeile, die erste
Spalte die Zeilenbeschriftung. Werden sie nicht gebraucht, einfach leer
lassen.

**Frage:** Welche Dateiformate kann ich importieren?

Antwort: `.csv` sowie `.xlsx`/`.xls`. Bei CSV werden Semikolon und Komma als
Trennzeichen automatisch erkannt. Bei Excel wird das erste Tabellenblatt
übernommen, samt verbundenen Zellen, Textformatierung, Farben, Schriftgrößen
und Ausrichtung. Ein Import **ersetzt immer die gesamte Tabelle**.

**Frage:** Es erscheint „Import fehlgeschlagen“.

Antwort: Die Datei ließ sich nicht lesen. Prüfen, ob es wirklich eine
`.csv`-, `.xlsx`- oder `.xls`-Datei ist (nicht etwa eine umbenannte oder
passwortgeschützte Datei) und ob sie Inhalt enthält. In Excel notfalls
erneut als `.xlsx` speichern.

**Frage:** Auf der Seite werden nicht alle Zeilen angezeigt.

Antwort: Das ist die Einstellung **Sichtbare Zeilen** (Panel „Tabelle“ rechts),
voreingestellt auf 5 Datenzeilen. Der Rest erscheint über den Button unter
der Tabelle. Sollen von Anfang an alle Zeilen zu sehen sein, den Wert auf `0`
setzen.

**Frage:** Warum sehe ich in der App keinen Export?

Antwort: In der Staffbase-App (iOS/Android) blendet die Tabelle den Export und
die Kästchen zur Zeilenauswahl bewusst aus, weil Downloads dort nicht
zuverlässig funktionieren. Im Browser — auch auf dem Telefon — ist der Export
vorhanden.

**Frage:** Ein Bild sprengt die ganze Tabelle.

Antwort: Rechts im Panel **Tabelle** den Schalter **Bilder anpassen** einschalten.
Er begrenzt alle Bilder auf die Tabellenbreite. Ausgeschaltet erscheint jedes
Bild in seiner Originalgröße.

**Frage:** Mehrere Bilder sind unterschiedlich groß.

Antwort: Alle Bildzellen markieren und im Reiter **Bilder** unter
**Bildgröße** „Gleiche Höhe wie erstes Bild“ oder „Gleiche Breite wie erstes
Bild“ wählen. Es müssen mindestens zwei Bilder markiert sein.

**Frage:** Ein Leser hat die Tabelle anders sortiert als ich sie gespeichert
habe.

Antwort: Auf der veröffentlichten Seite kann jede lesende Person durch Klick
auf eine Spaltenüberschrift selbst umsortieren. Das gilt nur für ihre Ansicht
und ändert die gespeicherte Tabelle nicht. Die im Editor gesetzte **Erste
Sortierung** (Panel „Tabelle“) bleibt die Startansicht.

**Frage:** Kann ich einen Link in eine Zelle setzen?

Antwort: Nein. Zellen nehmen Text, Bilder sowie Hoch-/Tiefstellungen auf,
aber keine Verlinkungen. Links gehören in ein Textelement neben der Tabelle.

**Frage:** Gibt es „Rückgängig“?

Antwort: Nein. Deshalb bei größeren Umbauten zwischendurch speichern — und
vor einem Import daran denken, dass er die gesamte Tabelle ersetzt.

**Frage:** Was passiert mit meiner Tabelle bei der automatischen Übersetzung
der Seite?

Antwort: Übersetzt werden nur die Zellinhalte. Verbundene Zellen,
Formatierungen, Bilder und die Sortierung bleiben unverändert erhalten.

**Frage:** Die Tabelle ist auf dem Handy zu breit.

Antwort: Sie lässt sich seitwärts schieben. Für schmale Bildschirme hilft es,
Spalten zusammenzufassen, kürzere Überschriften zu verwenden oder große
Bilder aus den Zellen zu nehmen.
