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

/** One entry in the topic list (left column) of the help tab. */
export interface HelpTopic {
  id: string;
  label: string;
  entries: HelpEntry[];
}

/**
 * The help tab's content, grouped exactly like the toolbar's own tabs so a
 * reader can jump from "what does this button do" straight to the ribbon tab
 * that has it.
 *
 * Kept as data rather than JSX so the search can walk it without touching
 * React, and so wording stays in one place instead of scattered across the
 * rendering code.
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "start",
    label: "Start",
    entries: [
      {
        title: "Zwischen Reitern wechseln",
        text: "Mit den Pfeiltasten (links/rechts) springt die Tastatur-Fokusmarke von einem Reiter zum nächsten, auch über den Rand der Leiste hinweg zurück zum ersten Reiter.",
      },
      {
        title: "Speichern und Schließen",
        text: "„Speichern“ übergibt den aktuellen Stand der Tabelle an das Formularfeld. „Schließen“ verwirft nichts von sich aus, verlässt den Dialog aber ohne zu speichern — ungespeicherte Änderungen zeigt der Hinweis „Ungespeicherte Änderungen“ neben den beiden Buttons.",
      },
      {
        title: "Tabellen importieren",
        text: "Der Daten-Reiter enthält den Button „Importieren“, mit dem sich Tabellen aus .csv- und .xlsx/.xls-Dateien einlesen lassen.",
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
        title: "Versalien aufheben",
        text: "Hebt eine automatische Großschreibung (z. B. durch CSS der Wirtsseite) für die Markierung wieder auf.",
      },
      {
        title: "Schrift- und Hintergrundfarbe",
        text: "Öffnet je einen Farbwähler für Text- und Zellenhintergrundfarbe der Markierung. Ein Klick auf die durchgestrichene Fläche entfernt die gesetzte Farbe wieder.",
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
        text: "Fügt ein Bild in die markierte Zelle ein.",
      },
      {
        title: "Bildgröße angleichen",
        text: "Gleicht die Höhe oder Breite mehrerer markierter Bilder an das zuerst markierte Bild an. Dafür müssen mindestens zwei Bilder markiert sein. „Standardgröße“ setzt die Größe wieder zurück.",
      },
      {
        title: "Bilder anpassen",
        text: "Schalter, der Bilder auf die Breite der Tabelle begrenzt. Ausgeschaltet werden Bilder immer in ihrer eigenen, ursprünglichen Größe angezeigt.",
      },
    ],
  },
  {
    id: "data",
    label: "Daten",
    entries: [
      {
        title: "Sortieren",
        text: "Sortiert die Tabelle auf- oder absteigend nach der Spalte der aktuellen Markierung. „Sortierung entfernen“ stellt die ursprüngliche Reihenfolge wieder her.",
      },
      {
        title: "Format kopieren",
        text: "Übernimmt die Formatierung der markierten Zelle und wendet sie auf die nächste Markierung an (Format-Pinsel).",
      },
      {
        title: "Sichtbare Zeilen",
        text: "Legt fest, wie viele Datenzeilen die veröffentlichte Tabelle zeigt, bevor sie sich hinter einem Button einklappt. Der Wert 0 zeigt immer alle Zeilen.",
      },
      {
        title: "Formatierung entfernen",
        text: "Setzt wahlweise alle Formatierungen, nur die Textformatierung oder nur die Bildgrößen zurück — auf die Markierung, oder ohne Markierung auf die ganze Tabelle.",
      },
      {
        title: "Tabelle importieren",
        text: "Liest eine Tabelle aus einer .csv- oder .xlsx/.xls-Datei ein und ersetzt damit den aktuellen Inhalt.",
      },
    ],
  },
];
