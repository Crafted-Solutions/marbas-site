---
layout: content_1col.njk
title: Home
seoDescription: Home — an overview of our services and what we offer.
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
  - componentType: Hero
    id: hero-start
    title: Welcome
    text: "<p>This is your new website. Adapt content, components and theme to your needs.</p>"
    image:
      src: /_assets/images/starter-hero.jpg
      alt: Welcome image
      originalId: starter-hero
    flushNav: false
    invertTextColor: false
    showContentBox: true
Placeholder_Main:
  - componentType: TextMedia
    id: intro-1
    title: About this project
    text: "This is a starter project built with Marbas. It contains ready-made pages and components as a starting point for your website."
    imagePosition: right
    image:
      src: /_assets/images/starter-feature-left.jpg
      alt: Feature image
      originalId: starter-feature-left
  - componentType: Cards
    id: services
    headline: Our services
    columns: 3
    cards:
      - headline: Service 1
        body: Describe your first service or offer here.
        image:
          src: /_assets/images/starter-card-content.svg
          alt: Service 1
          originalId: starter-card-1
      - headline: Service 2
        body: Describe your second service or offer here.
        image:
          src: /_assets/images/starter-card-content.svg
          alt: Service 2
          originalId: starter-card-2
      - headline: Service 3
        body: Describe your third service or offer here.
        image:
          src: /_assets/images/starter-card-content.svg
          alt: Service 3
          originalId: starter-card-3
  - componentType: Banner
    id: cta-banner
    image:
      src: /_assets/images/starter-feature-right.jpg
      alt: Banner image
      originalId: starter-feature-right
    link: /about-us/
    linkAriaLabel: More about us
---
