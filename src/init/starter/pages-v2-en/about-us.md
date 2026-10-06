---
layout: content_1col.njk
title: About us
seoDescription: About us — who we are and how we work.
pageLanguage: en
templateEngineOverride: njk,md
topNavigation: true
tags:
  - menu
navigation:
  key: about-us
  title: About us
  order: 2
eleventyNavigation:
  key: about-us
  title: About us
  order: 2
Placeholder_Hero:
  - componentType: Intro
    id: about-us
    headline: "About us"
    lead: "An introductory sentence."
    image:
      src: /_assets/images/starter-feature-left.jpg
      alt: Example image
      originalId: starter-v2-about
Placeholder_Main:
  - componentType: Split
    id: section
    layout: title
    label: "Section"
    headline: "A headline that makes a point."
    text: "<p>A first paragraph.</p><p>A second paragraph.</p>"
    note: "A short side note."
  - componentType: LinkList
    id: list
    label: "Overview"
    headline: "List headline"
    items:
      - { title: "Item one", text: "Short description of the item." }
      - { title: "Item two", text: "Short description of the item." }
      - { title: "Item three", text: "Short description of the item." }
---
