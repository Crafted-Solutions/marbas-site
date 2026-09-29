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
    label: "About us"
    headline: "Who we are."
    lead: "One sentence about your attitude — why you do what you do."
    image:
      src: /_assets/images/starter-feature-left.jpg
      alt: Example image team
      originalId: starter-v2-about
Placeholder_Main:
  - componentType: Split
    id: values
    layout: title
    label: "01 / Values"
    headline: "What matters to us."
    text: "<p>Describe your story, your values or your team here.</p><p>Two or three short paragraphs read better than one long wall.</p>"
    note: "One sentence that sticks."
  - componentType: LinkList
    id: services
    label: "02 / Services"
    headline: "What we offer."
    items:
      - { title: "Service one", text: "Briefly described, and who it is for." }
      - { title: "Service two", text: "Briefly described, and who it is for." }
      - { title: "Service three", text: "Briefly described, and who it is for." }
---
