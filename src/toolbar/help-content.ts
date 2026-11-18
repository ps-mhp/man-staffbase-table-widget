/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** One explained function within a help topic. */
export interface HelpEntry {
  title: string;
  text: string;
}

/** One topic of the help, shown as a collapsible section. */
export interface HelpTopic {
  id: string;
  label: string;
  entries: HelpEntry[];
}

/**
 * The help's content, grouped like the toolbar's own tabs so a reader can
 * jump from "what does this button do" straight to the toolbar tab that has
 * it – plus „Tabelle“ for the panel on the right.
 *
 * Kept as data rather than JSX so wording stays in one place instead of
 * scattered across the rendering code (`table-editor-help.tsx`). Tasten,
 * Übernehmen und Rückgängig erklärt der Rahmen selbst.
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "start",
    label: "Start",
    entries: [
      {
        title: "Aufbau",
        text: "Oben die Reiter Schrift, Ausrichtung, Zellen, Bilder und Daten, darunter die Werkzeuge des gewählten Reiters und die Tabelle. Rechts das Panel „Tabelle“ mit den Einstellungen, die für die ganze Tabelle gelten.",
      },
      {
        title: "Zellen bearbeiten",
        text: "Doppelklick in eine Zelle startet die Eingabe; ein Klick auf eine andere Zelle oder Escape beendet sie. ⌘/Strg Z nimmt in der Zelle Getipptes zurück, außerhalb einen ganzen Schritt.",
      },
      {
        title: "Markieren",
        text: "Klicken und ziehen, mit Umschalt einen Bereich aufziehen, mit ⌘/Strg weitere Bereiche dazunehmen. Die Griffe am Rand markieren ganze Zeilen, Spalten oder die ganze Tabelle. Rechtsklick öffnet das Kontextmenü.",
      },
      {
        title: "Zwischen Reitern wechseln",
        text: "Mit den Pfeiltasten (links/rechts) springt die Tastatur-Fokusmarke von einem Reiter zum nächsten, auch über den Rand der Leiste hinweg zurück zum ersten Reiter. In der Werkzeugleiste darunter wandern dieselben Tasten von Werkzeug zu Werkzeug.",
      },
      {
        title: "Tabelle importieren",
        text: "„Importieren (.csv, .xlsx)“ rechts neben den Reitern liest eine Tabelle aus einer .csv- oder .xlsx/.xls-Datei ein und ersetzt damit den aktuellen Inhalt.",
      },
      {
        title: "Vorschau",
        text: "Desktop, Tablet und Mobil im Kopf zeigen die Tabelle so, wie Leser sie sehen – mit Einklappen, Export und erster Sortierung. Editor führt zurück zur Bearbeitung.",
      },
    ],
  },
  {
    id: "font",
    label: "Schrift",
    entries: [
      {
        title: "Schriftgröße",
        text: "Über das Auswahlfeld „Schriftgröße“ oder die beiden Buttons zum Vergrößern und Verkleinern der Schrift lässt sich die Textgröße der Markierung ändern.",
      },
      {
        title: "Fett, Kursiv, Unterstrichen, Durchgestrichen",
        text: "Die vier Textauszeichnungen schalten unabhängig voneinander an und aus und wirken auf die aktuelle Markierung.",
      },
      {
        title: "Hoch- und Tiefstellen",
        text: "Setzt den markierten Text hoch- oder tiefgestellt, etwa für Exponenten oder chemische Formeln.",
      },
      {
        title: "Schrift- und Hintergrundfarbe",
        text: "Der Knopf öffnet einen Farbwähler für die Text- bzw. Zellenhintergrundfarbe der Markierung; der Balken darunter zeigt die gesetzte Farbe. Der Pfeil daneben bietet „Standard“, das die Farbe wieder entfernt.",
      },
    ],
  },
  {
    id: "align",
    label: "Ausrichtung",
    entries: [
      {
        title: "Horizontale Ausrichtung",
        text: "Linksbündig, zentriert oder rechtsbündig — wirkt auf den Inhalt der markierten Zellen.",
      },
      {
        title: "Vertikale Ausrichtung",
        text: "Oben, mittig oder unten ausrichten — bestimmt, wo der Inhalt innerhalb der Zellenhöhe sitzt.",
      },
    ],
  },
  {
    id: "cells",
    label: "Zellen",
    entries: [
      {
        title: "Zellen verbinden und lösen",
        text: "„Verbinden“ fasst die markierten Zellen zu einer zusammen, „Lösen“ macht eine bestehende Verbindung wieder rückgängig.",
      },
      {
        title: "Zeilen und Spalten einfügen",
        text: "Über „Einfügen“ lassen sich eine Zeile oberhalb oder unterhalb bzw. eine Spalte links oder rechts der Markierung hinzufügen. Ist bereits eine ganze Zeile oder Spalte markiert, zeigt das Menü nur die dazu passenden Optionen.",
      },
      {
        title: "Zeilen und Spalten löschen",
        text: "Entfernt die Zeile(n) oder Spalte(n) der aktuellen Markierung aus der Tabelle.",
      },
    ],
  },
  {
    id: "images",
    label: "Bilder",
    entries: [
      {
        title: "Bild einfügen",
        text: "Öffnet rechts die Mediathek für die markierte Zelle. Ein Bild lässt sich von dort auch direkt auf jede Zelle ziehen.",
      },
      {
        title: "Bildgröße angleichen",
        text: "Gleicht die Höhe oder Breite mehrerer markierter Bilder an das zuerst markierte Bild an. Dafür müssen mindestens zwei Bilder markiert sein. „Standardgröße“ setzt die Größe wieder zurück.",
      },
    ],
  },
  {
    id: "data",
    label: "Daten",
    entries: [
      {
        title: "Format kopieren",
        text: "Übernimmt die Formatierung der markierten Zelle und wendet sie auf die nächste Markierung an (Format-Pinsel).",
      },
      {
        title: "Formatierung entfernen",
        text: "Setzt wahlweise alle Formatierungen, nur die Textformatierung oder nur die Bildgrößen zurück — auf die Markierung, oder ohne Markierung auf die ganze Tabelle.",
      },
    ],
  },
  {
    id: "table",
    label: "Tabelle (Panel rechts)",
    entries: [
      {
        title: "Erste Sortierung",
        text: "Spalte und Richtung, nach der die Tabelle beim Öffnen sortiert ist; die Kopfzeile bleibt oben. Leser sortieren per Klick auf eine Überschrift um. Dasselbe geht über das Kontextmenü → Sortierung für die Spalte unter der Maus. „Keine“ zeigt die Zeilen in ihrer Reihenfolge.",
      },
      {
        title: "Sichtbare Zeilen",
        text: "Legt fest, wie viele Datenzeilen die veröffentlichte Tabelle zeigt, bevor sie sich hinter einem Button einklappt. Der Wert 0 zeigt immer alle Zeilen.",
      },
      {
        title: "Export",
        text: "Bietet Lesern der veröffentlichten Tabelle einen Download als Excel- (.xlsx) oder CSV-Datei an. „Ganze Tabelle“ exportiert alle Zeilen, „Mit Zeilenauswahl“ fügt eine Spalte mit Kästchen hinzu — exportiert werden dann die gewählten Zeilen, ohne Auswahl alle. In der Staffbase-App wird der Export nicht angezeigt.",
      },
      {
        title: "Bilder anpassen",
        text: "Schalter, der Bilder auf die Breite der Tabelle begrenzt. Ausgeschaltet werden Bilder immer in ihrer eigenen, ursprünglichen Größe angezeigt.",
      },
    ],
  },
];
