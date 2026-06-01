---
layout: content_1col.njk
title: ""
seoTitle: "Marbas Basic Example"
seoDescription: "Beispielprojekt für marbas-site — eine vollständige Marbas-Website."
pageLanguage: de
navigation:
  key: home
  title: Startseite
  order: 1
Placeholder_Main:
  - componentType: Hero
    id: home-hero
    title: "Willkommen"
    text: "Dies ist ein Beispielprojekt für marbas-site. Seiten bestehen aus Komponenten — jede Komponente wird im Frontmatter als Eintrag in einem Placeholder definiert."
    image:
      src: "/_assets/images/examples/hero.svg"
      alt: "Hero Illustration"
      caption: ""
      originalId: "home-hero"
      enableEnlargement: false

  - componentType: TitleText
    id: home-intro
    title: "Wie Marbas-Seiten aufgebaut sind"
    text: "<p>Jede Seite hat einen oder mehrere <strong>Placeholder</strong> im Frontmatter (z. B. <code>Placeholder_Main</code>). Ein Placeholder ist eine Liste von Komponenten — jede mit einem <code>componentType</code> und den zugehörigen Feldern. Das Layout rendert den Placeholder an der richtigen Stelle.</p><p>Eigene Komponenten legst du in <code>_components/MeineKomponente/MeineKomponente.njk</code> ab — sie werden automatisch erkannt.</p>"
    link: "/showcase/"
    linkText: "Alle eingebauten Komponenten ansehen"

  - componentType: Cards
    id: home-cards
    headline: "Was du in diesem Beispielprojekt findest"
    ariaLabelHeadline: "Projektübersicht"
    columns: 3
    cards:
      - headline: "Komponenten-Demo"
        body: "<p>Die Showcase-Seite zeigt alle eingebauten Komponenten mit echten Daten.</p>"
        link: "/showcase/"
        linkText: "Zur Demo"
        linkAriaLabel: "Zur Komponenten-Demo"
        image:
          src: "/_assets/images/examples/editorial-1.svg"
          alt: "Komponenten"
          caption: ""
          originalId: "card-components"
      - headline: "Projekt-Struktur"
        body: "<p><code>pages/</code>, <code>_components/</code>, <code>_theme/</code> — alles was du besitzt, nichts was du nicht brauchst.</p>"
        link: "https://github.com/CraftedSolutions/marbas-site"
        linkText: "Dokumentation"
        linkAriaLabel: "Zur Dokumentation"
        image:
          src: "/_assets/images/examples/editorial-2.svg"
          alt: "Struktur"
          caption: ""
          originalId: "card-structure"
      - headline: "Anpassen"
        body: "<p>Jede Lib-Datei kann per <code>marbas-site eject</code> ins Projekt geholt und editiert werden.</p>"
        link: "https://github.com/CraftedSolutions/marbas-site"
        linkText: "Mehr erfahren"
        linkAriaLabel: "Mehr über Eject erfahren"
        image:
          src: "/_assets/images/examples/editorial-3.svg"
          alt: "Anpassen"
          caption: ""
          originalId: "card-eject"
---
