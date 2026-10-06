---
layout: content_1col.njk
title: Über uns
seoDescription: Über uns — wer wir sind und wie wir arbeiten.
pageLanguage: de
templateEngineOverride: njk,md
topNavigation: true
tags:
  - menu
navigation:
  key: ueber-uns
  title: Über uns
  order: 2
eleventyNavigation:
  key: ueber-uns
  title: Über uns
  order: 2
Placeholder_Hero:
  - componentType: Intro
    id: ueber-uns
    headline: "Über uns"
    lead: "Ein einleitender Satz."
    image:
      src: /_assets/images/starter-feature-left.jpg
      alt: Beispielbild
      originalId: starter-v2-ueber
Placeholder_Main:
  - componentType: Split
    id: abschnitt
    layout: title
    label: "Abschnitt"
    headline: "Eine Überschrift mit einer Aussage."
    text: "<p>Ein erster Absatz.</p><p>Ein zweiter Absatz.</p>"
    note: "Eine kurze Randnotiz."
  - componentType: LinkList
    id: liste
    label: "Übersicht"
    headline: "Überschrift der Liste"
    items:
      - { title: "Eintrag eins", text: "Kurze Beschreibung des Eintrags." }
      - { title: "Eintrag zwei", text: "Kurze Beschreibung des Eintrags." }
      - { title: "Eintrag drei", text: "Kurze Beschreibung des Eintrags." }
---
