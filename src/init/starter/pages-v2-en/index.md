---
layout: content_1col.njk
title: Home
seoDescription: Short description of the home page for search engines.
pageLanguage: en
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
  - componentType: Intro
    id: start
    label: "Short context"
    headline: "Home page<br>headline"
    lead: "An introductory sentence."
    text: "<p>A short paragraph with further information. Content, blocks and colours can be adapted freely.</p>"
    links:
      - { label: "Learn more", href: "#areas" }
      - { label: "Contact", href: "#contact" }
    image:
      src: /_assets/images/starter-hero.jpg
      alt: Example image
      originalId: starter-v2-hero
Placeholder_Main:
  - componentType: Notice
    id: notice
    label: "Notice"
    text: "<p>A short message goes here.</p>"
    meta: "Example"
  - componentType: LinkList
    id: areas
    label: "Areas"
    headline: "List headline"
    text: "<p>A short introduction.</p>"
    items:
      - { title: "Item one", text: "Short description of the item.", href: "#section" }
      - { title: "Item two", text: "Short description of the item.", href: "/about-us/" }
      - { title: "Item three", text: "Short description of the item.", href: "#contact" }
  - componentType: Split
    id: section
    tone: soft
    label: "Section"
    headline: "A headline that makes a point."
    text: "<p>A paragraph with the content of this section.</p>"
    mutedText: "<p>A supplementary note.</p>"
    link: "#contact"
    linkText: "Learn more"
    list:
      title: "List"
      items: ["Point one", "Point two", "Point three"]
      note: "The list is an example — replace or delete it."
  - componentType: Contact
    id: contact
    label: "Contact"
    headline: "How to reach us."
    text: "<p>Contact details in one place.</p>"
    details:
      - { term: "Address", value: "<em>[Street number]</em><br><em>[Postcode city]</em>" }
      - { term: "Phone", value: "<em>[Phone number]</em>" }
      - { term: "Email", value: "<em>[Email address]</em>" }
    hoursTitle: "Hours"
    hours:
      - { day: "<em>[Days]</em>", time: "<em>[Time]</em>" }
---
