---
layout: content_1col.njk
title: Startseite
pageLanguage: de
templateEngineOverride: njk,md
topNavigation: true
tags:
  - menu
navigation:
  key: home
  title: Home
  order: 1
eleventyNavigation:
  key: home
  title: Home
  order: 1
Placeholder_Hero:
  - componentType: Hero
    id: hero-start
    title: Willkommen
    text: "<p>Das ist Ihre neue Website. Passen Sie Inhalte, Komponenten und Theme nach Ihren Wünschen an.</p>"
    image:
      src: /_assets/images/starter-hero.jpg
      alt: Willkommensbild
    flushNav: false
    invertTextColor: false
    showContentBox: true
Placeholder_Main:
  - componentType: TextMedia
    id: intro-1
    title: Über dieses Projekt
    text: "Dies ist ein Starter-Projekt mit Marbas. Hier finden Sie vorgefertigte Seiten und Komponenten als Ausgangspunkt für Ihre Website."
    imagePosition: right
    image:
      src: /_assets/images/starter-feature-left.jpg
      alt: Feature-Bild
  - componentType: Cards
    id: leistungen
    headline: Unsere Leistungen
    columns: 3
    cards:
      - headline: Leistung 1
        body: Beschreiben Sie hier Ihre erste Leistung oder Ihr erstes Angebot.
        image:
          src: /_assets/images/starter-card-content.svg
          alt: Leistung 1
        link: "#"
        linkText: Mehr erfahren
        linkAsCta: false
      - headline: Leistung 2
        body: Beschreiben Sie hier Ihre zweite Leistung oder Ihr zweites Angebot.
        image:
          src: /_assets/images/starter-card-content.svg
          alt: Leistung 2
        link: "#"
        linkText: Mehr erfahren
        linkAsCta: false
      - headline: Leistung 3
        body: Beschreiben Sie hier Ihre dritte Leistung oder Ihr drittes Angebot.
        image:
          src: /_assets/images/starter-card-content.svg
          alt: Leistung 3
        link: "#"
        linkText: Mehr erfahren
        linkAsCta: false
  - componentType: Banner
    id: cta-banner
    title: Bereit loszulegen?
    text: Kontaktieren Sie uns oder erfahren Sie mehr über unser Angebot.
    image:
      src: /_assets/images/starter-feature-right.jpg
      alt: Banner-Bild
    link: "#"
    linkAriaLabel: Zum Kontakt
---
