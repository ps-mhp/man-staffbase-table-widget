# FAQ

**Frage:** Im Konfigurationsdialog sehe ich statt des Tabellen-Editors nur
ein leeres Textfeld mit kryptischem Inhalt — ist die Tabelle kaputt?

Antwort: Nein. Das Textfeld ist ein reines Backup-Feld, das der Editor
normalerweise überdeckt; der kryptische Inhalt (beginnt mit `b64:`) ist die
Tabelle in kodierter Form. Diese Kodierung verhindert, dass automatische
Übersetzungen der Seite die Tabelle beschädigen. Ein Neuladen des Dialogs
reicht in der Regel, damit der Editor wieder erscheint.

**Frage:** Welche Dateiformate lassen sich importieren?

Antwort: `.csv` sowie `.xlsx`/`.xls`. Beim Excel-Import bleiben verbundene
Zellen, Zellformatierung (fett/kursiv/Farben/Ausrichtung) und Hoch-/
Tiefstellungen erhalten; ein Import ersetzt immer den gesamten aktuellen
Tabelleninhalt.

**Frage:** Warum werden bei einer langen Tabelle nicht alle Zeilen
angezeigt?

Antwort: Das ist die Einstellung „Sichtbare Zeilen“ (Reiter „Daten“) —
Besucher:innen sehen zunächst nur die eingestellte Anzahl an Datenzeilen und
können über einen „Alle anzeigen“-Button die restlichen einblenden. Auf `0`
gesetzt, zeigt die Tabelle von Anfang an alle Zeilen.

**Frage:** Ein Bild in einer Zelle sprengt die ganze Tabelle — was tun?

Antwort: Den Schalter „Bilder anpassen“ (Reiter „Bilder“) aktivieren — er
begrenzt alle Bilder auf die Breite der Tabelle. Ist er ausgeschaltet, wird
jedes Bild in seiner ursprünglichen Größe angezeigt.
