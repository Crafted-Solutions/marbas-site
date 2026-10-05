---
layout: content_1col.njk
title: Startseite
seoDescription: Startseite — Überblick über Angebot, Ablauf und Kontakt.
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
    label: "Ihr Angebot in einem Satz"
    headline: "Ihr Name<br>oder Ihre Firma"
    lead: "Ein Satz, der sagt, wofür Sie da sind und für wen."
    text: "<p>Ein kurzer Nebentext mit dem Wichtigsten: Ort, Schwerpunkt, Erreichbarkeit. Passen Sie Inhalte, Bausteine und Farben nach Ihren Wünschen an.</p>"
    links:
      - { label: "Zu den Anliegen", href: "#anliegen" }
      - { label: "Kontakt", href: "#kontakt" }
    image:
      src: /_assets/images/starter-hero.jpg
      alt: Beispielbild
      originalId: starter-v2-hero
Placeholder_Main:
  - componentType: Notice
    id: aktuelles
    label: "Aktuelles"
    text: "<p><strong>Gut zu wissen:</strong> Hier stehen kurze Hinweise — Urlaub, neue Zeiten, Termine.</p>"
    meta: "Beispiel"
  - componentType: LinkList
    id: anliegen
    label: "Orientierung"
    headline: "Was möchten Sie tun?"
    text: "<p>Jede Zeile führt direkt zu dem, was jetzt wichtig ist.</p>"
    items:
      - { title: "Erstgespräch vereinbaren", text: "Wie ein erster Termin abläuft und was Sie vorbereiten können.", href: "#ablauf" }
      - { title: "Leistungen ansehen", text: "Was wir anbieten und für wen.", href: "/ueber-uns/" }
      - { title: "Kontakt aufnehmen", text: "Telefon, E-Mail und Zeiten auf einen Blick.", href: "#kontakt" }
  - componentType: Split
    id: ablauf
    tone: soft
    label: "Ablauf"
    headline: "Gut vorbereitet ins Gespräch."
    text: "<p>Beschreiben Sie hier in zwei, drei Sätzen, wie die Zusammenarbeit beginnt.</p>"
    mutedText: "<p>Ein Nebentext für Einschränkungen oder Hinweise.</p>"
    link: "#kontakt"
    linkText: "Termin anfragen"
    list:
      title: "Bitte mitbringen"
      items: ["Unterlagen zum Anliegen", "Offene Fragen", "Wunschtermine"]
      note: "Die Liste ist ein Beispiel — ersetzen oder löschen."
  - componentType: Contact
    id: kontakt
    label: "Kontakt"
    headline: "So erreichen Sie uns."
    text: "<p>Alles Wichtige an einem Ort.</p>"
    details:
      - { term: "Adresse", value: "<em>[Straße Hausnummer]</em><br><em>[PLZ Ort]</em>" }
      - { term: "Telefon", value: "<em>[Telefonnummer]</em>" }
      - { term: "E-Mail", value: "<em>[E-Mail-Adresse]</em>" }
    hoursTitle: "Öffnungszeiten"
    hours:
      - { day: "Montag – Donnerstag", time: "9–17 Uhr" }
      - { day: "Freitag", time: "9–13 Uhr" }
---
