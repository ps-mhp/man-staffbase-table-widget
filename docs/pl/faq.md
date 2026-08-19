# FAQ

**Pytanie:** W oknie dialogowym konfiguracji zamiast edytora tabeli widzę tylko
puste pole tekstowe z niezrozumiałą treścią — czy tabela jest uszkodzona?

Odpowiedź: Nie. To pole tekstowe służy wyłącznie jako kopia zapasowa, którą edytor
zwykle zasłania; tajemnicza treść (zaczynająca się od `b64:`) to
tabela w postaci zakodowanej. Kodowanie to zapobiega uszkodzeniu tabeli przez automatyczne
tłumaczenia strony. Zazwyczaj wystarczy ponowne załadowanie okna dialogowego,
aby edytor ponownie się pojawił.

**Pytanie:** Jakie formaty plików można importować?

Odpowiedź: `.csv` oraz `.xlsx`/`.xls`. Podczas importu z Excela zachowane zostają połączone
komórki, formatowanie komórek (pogrubienie/kursywa/kolory/wyrównanie) oraz wielkość liter;
import zawsze zastępuje całą aktualną
zawartość tabeli.

**Pytanie:** Dlaczego w przypadku długiej tabeli nie są wyświetlane wszystkie wiersze?

Odpowiedź: To zależy od ustawienia „Zawartość tabeli w jednym wierszu”.
indeksy górne i dolne; import zawsze zastępuje całą aktualną
zawartość tabeli.

**Pytanie:** Dlaczego w przypadku długiej tabeli nie są wyświetlane wszystkie wiersze
?

Odpowiedź: Jest to ustawienie „Widoczne wiersze” (zakładka „Dane”) —
użytkownicy widzą początkowo tylko ustawioną liczbę wierszy danych i
mogą wyświetlić pozostałe za pomocą przycisku „Pokaż wszystko”. Przy ustawieniu `0`
tabela od początku wyświetla wszystkie wiersze.

**Pytanie:** Obraz w komórce rozciąga się na całą tabelę — co zrobić?

Odpowiedź: Należy włączyć przełącznik „Dopasuj obrazy” (zakładka „Obrazy”) — ogranicza on
wszystkie obrazy do szerokości tabeli. Jeśli jest wyłączony,
każdy obraz jest wyświetlany w swoim oryginalnym rozmiarze.
