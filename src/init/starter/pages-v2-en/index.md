---
layout: content_1col.njk
title: Home
seoDescription: Home — overview of services, process and contact.
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
    label: "Your offer in one line"
    headline: "Your name<br>or company"
    lead: "One sentence that says what you do and for whom."
    text: "<p>A short secondary text with the essentials: location, focus, availability. Adjust content, building blocks and colours as you like.</p>"
    links:
      - { label: "How can we help?", href: "#topics" }
      - { label: "Contact", href: "#contact" }
    image:
      src: /_assets/images/starter-hero.jpg
      alt: Example image
      originalId: starter-v2-hero
Placeholder_Main:
  - componentType: Notice
    id: news
    label: "News"
    text: "<p><strong>Good to know:</strong> short notices go here — holidays, new hours, dates.</p>"
    meta: "Example"
  - componentType: LinkList
    id: topics
    label: "01 / Orientation"
    headline: "What would you like to do?"
    text: "<p>Each row leads straight to what matters now.</p>"
    items:
      - { title: "Book a first meeting", text: "How a first appointment works and how to prepare.", href: "#process" }
      - { title: "See our services", text: "What we offer and for whom.", href: "/about-us/" }
      - { title: "Get in touch", text: "Phone, email and hours at a glance.", href: "#contact" }
  - componentType: Split
    id: process
    tone: soft
    label: "02 / Process"
    headline: "Well prepared for the first talk."
    text: "<p>Describe in two or three sentences how working together starts.</p>"
    mutedText: "<p>A secondary text for limitations or notes.</p>"
    link: "#contact"
    linkText: "Request an appointment"
    list:
      title: "Please bring"
      items: ["Documents on your topic", "Open questions", "Preferred dates"]
      note: "The list is an example — replace or delete it."
  - componentType: Contact
    id: contact
    label: "03 / Contact"
    headline: "Contact & hours."
    text: "<p>Everything important in one place.</p>"
    details:
      - { term: "Address", value: "<em>[Street number]</em><br><em>[Postcode city]</em>" }
      - { term: "Phone", value: "<em>[Phone number]</em>" }
      - { term: "Email", value: "<em>[Email address]</em>" }
    hoursTitle: "Opening hours"
    hours:
      - { day: "Monday – Thursday", time: "9 am – 5 pm" }
      - { day: "Friday", time: "9 am – 1 pm" }
---
