---
layout: content_1col.njk
title: Startseite
seoDescription: Kurze Beschreibung der Startseite für Suchmaschinen.
pageLanguage: de
templateEngineOverride: njk,md
topNavigation: true
tags:
  - menu
navigation:
  key: home
  title: Start
  order: 1
eleventyNavigation:
  key: home
  title: Start
  order: 1
Placeholder_Hero:
  - componentType: Intro
    id: start
    label: "Kurze Einordnung"
    headline: "Überschrift<br>der Startseite"
    lead: "Ein einleitender Satz."
    text: "<p>Ein kurzer Absatz mit weiteren Informationen. Inhalte, Bausteine und Farben lassen sich frei anpassen.</p>"
    links:
      - { label: "Mehr erfahren", href: "#bereiche" }
      - { label: "Kontakt", href: "#kontakt" }
    image:
      src: /_assets/images/starter-hero.jpg
      alt: Beispielbild
      originalId: starter-v2-hero
Placeholder_Main:
  - componentType: Notice
    id: hinweis
    label: "Hinweis"
    text: "<p>Hier steht eine kurze Mitteilung.</p>"
    meta: "Beispiel"
  - componentType: LinkList
    id: bereiche
    label: "Bereiche"
    headline: "Überschrift der Liste"
    text: "<p>Ein kurzer Einleitungstext.</p>"
    items:
      - { title: "Eintrag eins", text: "Kurze Beschreibung des Eintrags.", href: "#abschnitt" }
      - { title: "Eintrag zwei", text: "Kurze Beschreibung des Eintrags.", href: "/ueber-uns/" }
      - { title: "Eintrag drei", text: "Kurze Beschreibung des Eintrags.", href: "#kontakt" }
  - componentType: Split
    id: abschnitt
    tone: soft
    label: "Abschnitt"
    headline: "Eine Überschrift mit einer Aussage."
    text: "<p>Ein Absatz mit dem Inhalt dieses Abschnitts.</p>"
    mutedText: "<p>Ein ergänzender Nebentext.</p>"
    link: "#kontakt"
    linkText: "Mehr erfahren"
    list:
      title: "Liste"
      items: ["Punkt eins", "Punkt zwei", "Punkt drei"]
      note: "Die Liste ist ein Beispiel — ersetzen oder löschen."
  - componentType: Contact
    id: kontakt
    label: "Kontakt"
    headline: "So erreichen Sie uns."
    text: "<p>Kontaktangaben an einem Ort.</p>"
    details:
      - { term: "Adresse", value: "<em>[Straße Hausnummer]</em><br><em>[PLZ Ort]</em>" }
      - { term: "Telefon", value: "<em>[Telefonnummer]</em>" }
      - { term: "E-Mail", value: "<em>[E-Mail-Adresse]</em>" }
    hoursTitle: "Zeiten"
    hours:
      - { day: "<em>[Tage]</em>", time: "<em>[Uhrzeit]</em>" }
---
