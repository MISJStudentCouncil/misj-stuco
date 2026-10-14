# The Journey of MISJ StuCo

The website of the MISJ Student Council (Mentari Intercultural School Jakarta).
It is a static site: plain HTML, CSS and JavaScript, with no build step and nothing to install.

## Run it

- **Quick look:** double-click `index.html`.
- **Publish:** upload the whole folder to any static host (GitHub Pages, Netlify, Vercel, or the school web server).

It needs an internet connection for two things: the fonts (Google Fonts: Archivo + JetBrains Mono) and smooth scrolling (Lenis, from jsDelivr). If Lenis can't load, the site falls back to normal scrolling.

## Update the content (no design skills needed)

**Edit `content/content.js`. That one file holds all the content.** The site rebuilds itself from it, so you never need to touch the layout.

| What | Where in `content.js` |
|---|---|
| MISJ logo, StuCo logo, school year | `site` |
| Email, location, social links | `contact`, `socials` |
| The four words in chapter 02 | `community` |
| President, VP, Secretary, Treasurer | `leadership` |
| Departments: description, mission, head, members, stats, photos | `departments` |
| Projects and their filter categories | `projects`, `projectFilters` |
| Events (dates switch between UPCOMING and MEMORY on their own) | `events` |
| The big impact numbers | `impact` |
| Submit an idea / Give feedback / Start something links | `voice` |
| Milestones on the final line | `milestones` |
| Menu items | `menu` |

Anything marked `// SAMPLE` is placeholder content. Replace it before launch.

### The official logo

1. Put the official logo file in `assets/` (for example `assets/misj-logo.png`).
2. In `content.js`, set `site.logo.src` to `"assets/misj-logo.png"`.

The site shows the logo exactly as it is in the file. It never recolours, crops or stretches it. Use a PNG or SVG with a transparent background.

### Photos

1. Put photos in `assets/images/`.
2. Write the path into the matching field, for example `photo: "assets/images/president.jpg"` or `image: "assets/images/sports-day.jpg"`.
3. Leave a field as `""` to keep the designed placeholder.

Recommended sizes: about **1600px wide** for large photos (projects, events, department headers) and about **900px wide** for portraits (3:4 crop). Export as JPG or WebP at roughly 80% quality. Images load lazily, so they won't slow down the first screen.

### Add a department

Copy one `{ ... }` block in `departments`, paste it at the end, and edit it. The network, the mobile list, the counter ("13 Departments."), the department pages and the previous/next navigation all update automatically.

The `id` also chooses the animated motif. You can reuse an existing id's motif with `motif: "technology"`, or leave it out to get the default network motif.

### Add a project or event

Copy a block, paste it, and edit it. For a project, set `department` to a department `id`. Event dates use the format `"YYYY-MM-DD"`.

## The game: Be The Mentarian

A top-down campus adventure (about 15 minutes) in the "Bonus level" chapter near the end of the page. It lives in `js/game/` and `css/game.css`.

| Want to change… | Edit |
|---|---|
| What characters say, quests, litter/book/plant positions | `js/game/quests.js` |
| The campus layout (rooms, paths, trees) | `build()` in `js/game/world.js` |
| Quiz words and minigame rules | `js/game/minigames.js` |
| Tile colours / pixel art | `drawTile()` in `js/game/world.js`, `js/game/sprites.js` |

Progress is saved in the visitor's browser (localStorage), so players can leave and press **Continue** later.

## Files

```
index.html            page structure (chapter headings live here)
content/content.js    ALL editable content
css/base.css          colours, type, navigation, menu, cursor, journey line
css/chapters.css      Arrival, The Beginning, The Community, The People
css/story.css         Ideas → Impact, Projects, Moments, Impact, Voice, Future, Footer
css/departments.css   department network + department pages
js/core.js            scrolling engine, reveals, cursor, menu, journey line
js/render.js          builds every chapter from content.js
js/scenes.js          scroll choreography
js/departments.js     network, department pages, project sheet
js/motifs.js          the 12 department animations
assets/               logo and images
```

To change a colour, edit the tokens at the top of `css/base.css` (`--blue-600`, `--yellow`, and so on).

## Accessibility

- Works fully with a keyboard. Menus and pages trap focus while open, and Esc closes them.
- If the visitor's device has **Reduce Motion** turned on, smooth scrolling, pinned scroll scenes, parallax and the big transitions are switched off, and every chapter is shown in its final, readable state.
- The custom cursor only appears with a mouse. It is off on touch devices.
- Department pages have their own links (`#department/technology`), so they can be shared, and the browser back button closes them.
