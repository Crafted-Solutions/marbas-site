---
layout: content_1col.njk
title: ""
seoTitle: "Komponenten Demo"
seoDescription: "Beispielseite mit allen verfügbaren Komponenten."
pageLanguage: de
permalink: /showcase/
navigation:
  key: showcase
  title: Komponenten
  order: 2
Placeholder_Main:
  - componentType: Hero
    id: example-hero
    title: "Hero"
    text: "Diese Demo zeigt alle aktuell verfügbaren Komponenten."
    image:
      src: "/_assets/images/examples/hero.svg"
      alt: "Hero Illustration"
      caption: "Hero Visual"
      originalId: "example-hero"
      enableEnlargement: true

  - componentType: Banner
    id: example-banner
    link: "/showcase/"
    linkAriaLabel: "Zum Anfang der Beispielseite"
    image:
      src: "/_assets/images/examples/banner.svg"
      alt: "Banner Illustration"
      caption: "Banner Visual"
      originalId: "example-banner"

  - componentType: TitleText
    id: example-title-text
    title: "TitleText"
    text: "<p>Dies ist die einfache Textvariante mit optionalem Link als Action.</p>"
    link: "/showcase/"
    linkText: "Mehr erfahren"

  - componentType: TitleTextImageTop
    id: example-title-text-image-top
    title: "TitleTextImageTop"
    text: "<p>Bild oben, Text darunter. Geeignet für Intro- oder Magazin-Teaser.</p>"
    link: "/showcase/"
    linkText: "Mehr lesen"
    image:
      src: "/_assets/images/examples/editorial-1.svg"
      alt: "Editorial Illustration 1"
      caption: "Editorial image top"
      originalId: "example-editorial-1"

  - componentType: TitleTextImageRight
    id: example-title-text-image-right
    variantName: slim_image
    title: "TitleTextImageRight (slim_image)"
    text: "<p>Text links, Bild rechts mit slim image Variante.</p>"
    link: "/showcase/"
    linkText: "Details"
    image:
      src: "/_assets/images/examples/editorial-2.svg"
      alt: "Editorial Illustration 2"
      caption: "Editorial image right"
      originalId: "example-editorial-2"

  - componentType: TitleTextImageBottom
    id: example-title-text-image-bottom
    title: "TitleTextImageBottom"
    text: "<p>Text zuerst, Bild am Ende der Komponente.</p>"
    link: "/showcase/"
    linkText: "Weiter"
    image:
      src: "/_assets/images/examples/editorial-3.svg"
      alt: "Editorial Illustration 3"
      caption: "Editorial image bottom"
      originalId: "example-editorial-3"

  - componentType: TitleTextImageLeft
    id: example-title-text-image-left
    variantName: wide_image
    title: "TitleTextImageLeft"
    text: "<p>Bild links, Text rechts in der Standard-Variante.</p>"
    link: "/showcase/"
    linkText: "Zurück zum Start"
    image:
      src: "/_assets/images/examples/editorial-1.svg"
      alt: "Editorial Illustration left"
      caption: "Editorial image left"
      originalId: "example-editorial-left"

  - componentType: Cards
    id: example-cards
    headline: "Cards"
    ariaLabelHeadline: "Drei Beispielkarten"
    columns: 3
    cards:
      - headline: "Card One"
        body: "<p>Erste Karte mit Bild und Link.</p>"
        link: "/showcase/"
        linkText: "Open"
        linkAriaLabel: "Card one link"
        image:
          src: "/_assets/images/examples/editorial-1.svg"
          alt: "Card image one"
          caption: "Card one"
          originalId: "example-card-1"
      - headline: "Card Two"
        body: "<p>Zweite Karte mit Bild und Link.</p>"
        link: "/showcase/"
        linkText: "Open"
        linkAriaLabel: "Card two link"
        image:
          src: "/_assets/images/examples/editorial-2.svg"
          alt: "Card image two"
          caption: "Card two"
          originalId: "example-card-2"
      - headline: "Card Three"
        body: "<p>Dritte Karte mit Bild und Link.</p>"
        link: "/showcase/"
        linkText: "Open"
        linkAriaLabel: "Card three link"
        image:
          src: "/_assets/images/examples/editorial-3.svg"
          alt: "Card image three"
          caption: "Card three"
          originalId: "example-card-3"

  - componentType: TwoImages
    id: example-two-images
    image1:
      src: "/_assets/images/examples/gallery-1.svg"
      alt: "Gallery one"
      caption: "Gallery image one"
      originalId: "example-gallery-1"
    image2:
      src: "/_assets/images/examples/gallery-2.svg"
      alt: "Gallery two"
      caption: "Gallery image two"
      originalId: "example-gallery-2"

  - componentType: Video
    id: example-video
    videoHeadline: "Video"
    ariaLabelHeadline: "Video Demo"
    autoplay: false
    muted: false
    loop: false
    video:
      webm: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
      mp4: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      poster: "/_assets/images/examples/video-poster.svg"

---
