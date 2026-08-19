# Veelgestelde vragen

**Vraag:** In het configuratievenster zie ik in plaats van de tabel-editor alleen
een leeg tekstveld met cryptische inhoud — is de tabel beschadigd?

Antwoord: Nee. Het tekstveld is louter een back-upveld dat normaal gesproken door de editor
normaal gesproken bedekt; de cryptische inhoud (begint met `b64:`) is de
tabel in gecodeerde vorm. Deze codering voorkomt dat automatische
vertalingen van de pagina de tabel beschadigen. Het dialoogvenster opnieuw laden
is meestal voldoende om de editor weer te laten verschijnen.

**Vraag:** Welke bestandsformaten kunnen worden geïmporteerd?

Antwoord: `.csv` en `.xlsx`/`.xls`. Bij het importeren vanuit Excel blijven gekoppelde
cellen, celopmaak (vet/cursief/kleuren/uitlijning) en hoofdletters/
laag; een import vervangt altijd de volledige huidige
tabelinhoud.

**Vraag:** Waarom worden bij een lange tabel niet alle rijen
weergegeven?

Antwoord: Dat is de instelling „Zichtbare rijen“ (tabblad „Gegevens“) —
bezoekers zien in eerste instantie alleen het ingestelde aantal gegevensrijen en
kunnen de rest weergeven via een knop „Alles weergeven“. Als deze is ingesteld op `0`,
toont de tabel vanaf het begin alle rijen.

**Vraag:** Een afbeelding in een cel laat de hele tabel uitlopen — wat te doen?

Antwoord: Schakel de optie „Afbeeldingen aanpassen“ (tabblad „Afbeeldingen“) in — deze
beperkt alle afbeeldingen tot de breedte van de tabel. Als deze optie is uitgeschakeld, wordt
elke afbeelding in zijn oorspronkelijke grootte weergegeven.
