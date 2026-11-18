# FAQ

**Pytanie:** Zamiast edytora tabeli widzę tylko pole tekstowe z
niezrozumiałą treścią, zaczynającą się od `b64:`.

Odpowiedź: Jest to pole **Dane tabeli** — zapisana forma
tabeli, którą edytor zazwyczaj zasłania. Nigdy nie należy ręcznie
edytować tego tekstu. Kliknięcie przycisku **Edytuj tabelę** lub ponowne otwarcie
okna dialogowego spowoduje przywrócenie edytora. Kodowanie chroni tabelę przed
uszkodzeniem przez automatyczne tłumaczenie strony.

**Pytanie:** Moje zmiany zniknęły po zamknięciu.

Odpowiedź: Funkcja **Zamknij** nie zapisuje zmian. Jeśli zmiany są niezapisane,
edytor wyświetli monit — należy wybrać opcję **Zapisz**, a nie **Odrzuć**. Dopóki przy
tytule widnieje napis „… – niezapisane”, oznacza to, że coś pozostało niezapisane. Następnie należy zapisać stronę w
Studio, klikając **Zapisz**.

**Pytanie:** Jak wpisać tekst do komórki?

Odpowiedź: **Kliknij dwukrotnie** komórkę, a następnie wpisz tekst. Pojedyncze kliknięcie
tylko zaznacza komórkę (w celu formatowania), ale nie otwiera jej do
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
chroniony hasłem) oraz czy zawiera on dane. W razie potrzeby w programie Excel
zapisz go ponownie jako `.xlsx`.

**Pytanie:** Na stronie nie wyświetlają się wszystkie wiersze.

Odpowiedź: Jest to ustawienie **Widoczne wiersze** (panel „Tabela” po prawej stronie),
domyślnie ustawione na 5 wierszy danych. Pozostałe wiersze można wyświetlić za pomocą przycisku pod
tabelą. Jeśli od początku mają być widoczne wszystkie wiersze, należy ustawić wartość na `0`
.

**Pytanie:** Dlaczego w aplikacji nie widzę opcji eksportu?

Odpowiedź: W aplikacji Staffbase (iOS/Android) tabela celowo ukrywa opcję eksportu oraz
pola wyboru wierszy, ponieważ pobieranie plików w tym miejscu nie
działa niezawodnie. W przeglądarce — również na telefonie — opcja eksportu
jest dostępna.

**Pytanie:** Jedno zdjęcie rozciąga się na całą tabelę.

Odpowiedź: Po prawej stronie w panelu **Tabela** włącz przełącznik **Dopasuj zdjęcia**.
Ogranicza to wszystkie zdjęcia do szerokości tabeli. Gdy opcja jest wyłączona, każde
zdjęcie wyświetla się w oryginalnym rozmiarze.

**Pytanie:** Kilka zdjęć ma różne rozmiary.

Odpowiedź: Zaznacz wszystkie komórki ze zdjęciami i w zakładce **Zdjęcia** w sekcji
**Rozmiar obrazu** wybierz opcję „Taka sama wysokość jak pierwszy obraz” lub „Taka sama szerokość jak pierwszy
obraz”. Należy zaznaczyć co najmniej dwa obrazy.

**Pytanie:** Czytelnik posortował tabelę inaczej niż ja ją zapisałem
.

Odpowiedź: Na opublikowanej stronie każdy czytelnik może samodzielnie zmienić kolejność, klikając
nagłówek kolumny. Dotyczy to wyłącznie jego widoku
i nie zmienia zapisanej tabeli. Ustawione w edytorze **Pierwsze
sortowanie** (panel „Tabela”) pozostaje widokiem początkowym.

**Pytanie:** Czy mogę umieścić link w komórce?

Odpowiedź: Nie. Komórki mogą zawierać tekst, obrazy oraz indeksy górne i dolne,
ale nie mogą zawierać linków. Linki należy umieścić w elemencie tekstowym obok tabeli.

**Pytanie:** Czy istnieje funkcja „Cofnij”?

Odpowiedź: Nie. Dlatego podczas większych zmian należy od czasu do czasu zapisywać — i
przed importem pamiętać, że zastąpi on całą tabelę.

**Pytanie:** Co stanie się z moją tabelą podczas automatycznego tłumaczenia
strony?

Odpowiedź: Tłumaczone są wyłącznie treści komórek. Połączone komórki,
formatowanie, obrazy i sortowanie pozostają niezmienione.

**Pytanie:** Tabela jest zbyt szeroka na telefonie komórkowym.

Odpowiedź: Można ją przesuwać w bok. W przypadku wąskich ekranów pomocne jest
łączenie kolumn, stosowanie krótszych nagłówków lub usuwanie dużych
obrazów z komórek.
