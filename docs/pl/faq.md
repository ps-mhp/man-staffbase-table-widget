# FAQ

**Pytanie:** Zamiast edytora tabeli widzę tylko pole tekstowe z
niezrozumiałą treścią, zaczynającą się od `b64:`.

Odpowiedź: To jest pole **Dane tabeli** — zapisana forma
tabeli, którą zazwyczaj zasłania edytor. Nigdy nie edytuj tego tekstu ręcznie.
Kliknięcie przycisku **Edytuj tabelę** lub ponowne otwarcie
okna dialogowego przywróci edytor. Kodowanie to chroni tabelę przed
uszkodzeniem przez automatyczne tłumaczenie strony.

**Pytanie:** Moje zmiany zniknęły po zamknięciu.

Odpowiedź: Przycisk **Zamknij** nie zapisuje zmian. Przed zamknięciem zawsze należy kliknąć
**Zapisz** — dopóki obok przycisków widnieje napis „Niezapisane zmiany”,
coś jest otwarte.

**Pytanie:** Jak wpisać tekst do komórki?

Odpowiedź: **Kliknij dwukrotnie** komórkę, a następnie wpisz tekst. Pojedyncze kliknięcie
tylko zaznacza komórkę (w celu formatowania), nie otwiera jej do
edycji.

**Pytanie:** Nie mogę usunąć pierwszego wiersza ani pierwszej kolumny.

Odpowiedź: Tak zostało zaprojektowane: pierwszy wiersz to nagłówek, a pierwsza
kolumna to etykieta wiersza. Jeśli nie są potrzebne, po prostu pozostaw je
puste.

**Pytanie:** Jakie formaty plików mogę importować?

Odpowiedź: `.csv` oraz `.xlsx`/`.xls`. W przypadku plików CSV średnik i przecinek są
automatycznie rozpoznawane jako separatory. W przypadku plików Excel importowany jest pierwszy arkusz
wraz z połączonymi komórkami, formatowaniem tekstu, kolorami, rozmiarami czcionek
i wyrównaniem. Import **zawsze zastępuje całą tabelę**.

**Pytanie:** Pojawia się komunikat „Import nie powiódł się”.

Odpowiedź: Nie udało się odczytać pliku. Sprawdź, czy rzeczywiście jest to
plik `.csv`, `.xlsx` lub `.xls` (a nie np. plik o zmienionej nazwie lub
chroniony hasłem) oraz czy zawiera on treść. W razie potrzeby w programie Excel
zapisz go ponownie jako plik `.xlsx`.

**Pytanie:** Na stronie nie wyświetlają się wszystkie wiersze.

Odpowiedź: Jest to ustawienie **Widoczne wiersze** (zakładka „Dane”),
domyślnie ustawione na 5 wierszy danych. Pozostałe wiersze można wyświetlić za pomocą przycisku pod
tabelą. Jeśli od początku mają być widoczne wszystkie wiersze, należy ustawić wartość na `0`.

**Pytanie:** Obrazek rozciąga się na całą szerokość tabeli.

Odpowiedź: W zakładce **Obrazy** włącz opcję **Dopasuj obrazy**.
Ogranicza ona wszystkie obrazy do szerokości tabeli. Gdy opcja jest wyłączona, każdy
obrazek wyświetla się w oryginalnym rozmiarze.

**Pytanie:** Kilka obrazów ma różne rozmiary.

Odpowiedź: Zaznacz wszystkie komórki z obrazami i w zakładce **Obrazy** w sekcji
**Rozmiar obrazu** wybierz opcję „Taka sama wysokość jak pierwszy obraz” lub „Taka sama szerokość jak pierwszy
obraz”. Należy zaznaczyć co najmniej dwa obrazy.

**Pytanie:** Jeden z czytelników posortował tabelę inaczej niż ja ją zapisałem
.

Odpowiedź: Na opublikowanej stronie każdy czytelnik może samodzielnie zmienić kolejność, klikając
nagłówek kolumny. Dotyczy to wyłącznie jego widoku
i nie zmienia zapisanej tabeli. Sortowanie ustawione w edytorze
pozostaje widokiem początkowym.

**Pytanie:** Czy mogę umieścić link w komórce?

Odpowiedź: Nie. Komórki mogą zawierać tekst, obrazy oraz indeksy górne i dolne,
ale nie zawierają linków. Linki należy umieścić w elemencie tekstowym obok tabeli.

**Pytanie:** Czy istnieje funkcja „Cofnij”?

Odpowiedź: Nie. Dlatego w przypadku większych zmian należy zapisywać na bieżąco — a
przed importem należy pamiętać, że zastąpi on całą tabelę.

**Pytanie:** Mój tekst wyświetla się całkowicie wielkimi literami, mimo że
napisałem go normalnie.

Odpowiedź: Wynika to z układu strony, a nie z samej tabeli. Należy
zaznaczyć odpowiednie komórki i w zakładce **Czcionka** kliknąć opcję **Usuń
wielkie litery**.

**Pytanie:** Co stanie się z moją tabelą podczas automatycznego tłumaczenia
strony?

Odpowiedź: Tłumaczone są wyłącznie treści komórek. Połączone komórki,
formatowanie, obrazy i sortowanie pozostają niezmienione.

**Pytanie:** Tabela jest zbyt szeroka na telefonie komórkowym.

Odpowiedź: Można ją przesuwać w bok. W przypadku wąskich ekranów pomocne jest
łączenie kolumn, stosowanie krótszych nagłówków lub usuwanie dużych
obrazów z komórek.
