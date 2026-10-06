# Third-party notices

## Simple Icons

Footer social icons for X (Twitter), Instagram, GitHub, Facebook, YouTube, TikTok and Xing
(`src/render/filters/social-icons.js`) are taken from [Simple Icons](https://simpleicons.org)
16.33.0, released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

The logos are trademarks of their respective owners. They are included to link to the site
owner's profiles on these platforms; follow each brand's guidelines when using them otherwise.

## Web fonts (library themes)

The library themes ship their web fonts as self-hosted woff2 files in `themes/fonts/<family>/`
(latin and latin-ext subsets only). A build copies only the files of the selected theme to
`_assets/fonts/`. The files are taken from the [Fontsource](https://fontsource.org) packages listed
below; each family is licensed under the [SIL Open Font License 1.1](https://openfontlicense.org),
the full licence text including the copyright notice is in `themes/fonts/<family>/LICENSE`.
The files are generated in the cms-theme repository (`npm run fonts:sync` there) and copied here with `npm run sync:theme` — do not edit them in this repo.

| Family | Files | Licence | Source package |
|---|---|---|---|
| Cormorant Garamond | `themes/fonts/cormorant-garamond/` | OFL-1.1 | @fontsource-variable/cormorant-garamond 5.3.0 |
| DM Sans | `themes/fonts/dm-sans/` | OFL-1.1 | @fontsource-variable/dm-sans 5.3.0 |
| EB Garamond | `themes/fonts/eb-garamond/` | OFL-1.1 | @fontsource-variable/eb-garamond 5.3.0 |
| IBM Plex Mono | `themes/fonts/ibm-plex-mono/` | OFL-1.1 | @fontsource/ibm-plex-mono 5.3.0 |
| IBM Plex Sans | `themes/fonts/ibm-plex-sans/` | OFL-1.1 | @fontsource-variable/ibm-plex-sans 5.3.0 |
| Inter | `themes/fonts/inter/` | OFL-1.1 | @fontsource-variable/inter 5.3.0 |
| JetBrains Mono | `themes/fonts/jetbrains-mono/` | OFL-1.1 | @fontsource-variable/jetbrains-mono 5.3.0 |
| Jost | `themes/fonts/jost/` | OFL-1.1 | @fontsource-variable/jost 5.3.0 |
| Lato | `themes/fonts/lato/` | OFL-1.1 | @fontsource/lato 5.3.0 |
| Libre Baskerville | `themes/fonts/libre-baskerville/` | OFL-1.1 | @fontsource-variable/libre-baskerville 5.3.0 |
| Merriweather | `themes/fonts/merriweather/` | OFL-1.1 | @fontsource-variable/merriweather 5.3.0 |
| Nunito Sans | `themes/fonts/nunito-sans/` | OFL-1.1 | @fontsource-variable/nunito-sans 5.3.0 |
| Oswald | `themes/fonts/oswald/` | OFL-1.1 | @fontsource-variable/oswald 5.3.0 |
| Playfair Display | `themes/fonts/playfair-display/` | OFL-1.1 | @fontsource-variable/playfair-display 5.3.0 |
| Plus Jakarta Sans | `themes/fonts/plus-jakarta-sans/` | OFL-1.1 | @fontsource-variable/plus-jakarta-sans 5.3.0 |
| Public Sans | `themes/fonts/public-sans/` | OFL-1.1 | @fontsource-variable/public-sans 5.3.0 |
| Raleway | `themes/fonts/raleway/` | OFL-1.1 | @fontsource-variable/raleway 5.3.0 |
| Source Sans 3 | `themes/fonts/source-sans-3/` | OFL-1.1 | @fontsource-variable/source-sans-3 5.3.0 |
| Source Serif 4 | `themes/fonts/source-serif-4/` | OFL-1.1 | @fontsource-variable/source-serif-4 5.3.0 |
