# 🎬 **Cinefy** – Your Personal Film Diary & Discovery Hub

[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/Zatuzo/Cinefy/blob/main/LICENSE)  
[![Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?logo=vite)](https://vitejs.dev/)  
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node-20.12.0-339933?logo=node.js)](https://nodejs.org/)

---

## ✨ Overview
**Cinefy** is a modern, glass‑morphism‑styled web application that turns your Letterboxd diary into a dynamic, visual cinema journal. It lets you:
- **Spotlight a daily watchlist gem** with a cinematic backdrop, rich metadata, and smooth hover effects.
- **Track monthly viewing pace** with elegant micro‑ribbons showing film count, average rating, and top‑genre focus.
- **Browse recent logs, watchlist queue, and 5‑star masterworks** via scrollable rails with floating arrow navigation.
- **Explore algorithmic “Cinema Mixes”** and **semantic mood search** powered by TF‑IDF and TMDb data.

All interfaces are built with **React 18**, **Vite**, and a custom CSS design system that emphasizes premium gradients, subtle micro‑animations, and responsive layouts.

---

## 🚀 Getting Started
### Prerequisites
- **Node.js** ≥ 20 (recommended via `nvm`)
- **npm** (comes with Node) or **pnpm**/`yarn`
- A **TMDb API key** – sign up at https://www.themoviedb.org/settings/api

### Installation
```bash
# Clone the repo (already done) and navigate to the project root
cd Cinefy

# Install dependencies
npm ci   # or `npm install`
```

### Environment
Create a `.env` file in the root with:
```dotenv
VITE_TMDB_API_KEY=YOUR_TMDB_API_KEY_HERE
```
The `VITE_` prefix makes the variable available to the Vite‑powered frontend.

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` – Vite provides hot‑module replacement for instant UI feedback.

### Production Build
```bash
npm run build   # Generates optimized static assets in `dist/`
```
Deploy the `dist/` folder to any static‑hosting service (Netlify, Vercel, GitHub Pages, etc.).

---

## 📦 Core Features
| Feature | Description | Visual Highlights |
|---|---|---|
| **Daily Spotlight** | Randomly selects a film from your watchlist each day, fetches full TMDb metadata, and displays a hero card with blurred backdrop, overlay gradient, and interactive poster. | Glass‑morphism card, vibrant accent colors, smooth hover lift. |
| **Taste Ribbon** | Micro‑ribbon shows current month pace, average rating, and top‑genre focus with animated icons. | Subtle “glow” on hover, gradient icons (ruby, gold, cyan). |
| **Scrollable Rails** | Reusable `<ScrollableRail>` component with floating left/right arrows that auto‑hide when scrolling is not possible. | Arrow buttons fade in/out, smooth scroll‑by animation. |
| **5‑Star Masterpieces** | Filters diary entries for perfect 5‑star ratings and displays them in a dedicated rail. | High‑contrast star badge, crisp poster frames. |
| **Cinema Mixes** | Generates themed 4‑film playlists based on your top genres and directors. | Tile layout with genre tags and director badges. |
| **Semantic Mood Search** | Natural‑language search over your watchlist using TF‑IDF vectors and cosine similarity. | Input field with auto‑suggest, results displayed as cards. |

---

## 🏗️ Architecture & Folder Structure
```
Cinefy/
├─ public/                     # static assets (favicon, manifest)
├─ src/
│  ├─ components/             # Re‑usable UI components (MovieCard, PosterImage, ...)
│  ├─ services/               # API wrappers (tmdb.js, semanticSearch.js, mixEngine.js)
│  ├─ styles/                 # Vanilla CSS with design tokens (components.css, views.css, navbar.css)
│  ├─ views/                  # Page‑level React components (HomeView, MixesView, RewindView, ...)
│  ├─ App.jsx                 # Root component with routing logic
│  └─ index.html              # Entry HTML (Vite injects script)
├─ vite.config.js              # Vite configuration (alias, env handling)
├─ package.json                # Scripts, dependencies, Vite plugin list
└─ .env                        # API key (not committed)
```
- **Components** are pure UI elements without business logic.
- **Services** encapsulate all external calls (TMDb, semantic search, mix generation).
- **Views** compose components and implement state‑driven UI flows.
- **CSS** follows a token‑first approach: colors, spacing, and typography are defined at the top and reused throughout.

---

## 🎨 Design System
The UI embraces a **dark glass‑morphism theme**:
- **Colors** – HSL‑based palette with primary ruby, cyan, gold accents.
- **Typography** – `Inter` from Google Fonts for clean, modern text.
- **Animations** – `transition` on hover for cards, `scroll-behavior: smooth` for rails, subtle `box‑shadow` elevation.
- **Responsive** – Mobile‑first breakpoints; the layout collapses gracefully to a single‑column view on narrow screens.

All styles are contained in `src/styles/` and imported via `import './styles/components.css'` in `App.jsx`.

---

## 🔧 Development Tips
- **Hot Reload** – Vite automatically reloads only the affected module.
- **Debugging** – Use the React DevTools extension and inspect component props.
- **Adding New Views** – Create a new file in `src/views/`, expose it in `App.jsx`'s router, and follow the existing layout patterns.
- **Extending Services** – Add a function to `src/services/` and export it; Vite will bundle it automatically.

---

## 📚 API & Data Sources
- **TMDb** – All movie metadata (posters, backdrops, runtime, director, genres) is fetched via the TMDb API. Responses are cached with Vite's built‑in fetch wrapper.
- **Letterboxd Export** – Import your `watchlist.csv` and `diary.csv` via the UI; the app parses them with `csvParser.js` and normalises fields for internal use.

---

## 🧪 Testing & Linting
```bash
# Run ESLint (configured in package.json) 
npm run lint
# Run unit tests (Jest + React Testing Library) 
npm test
```
The project follows the **Airbnb JavaScript style guide** with Prettier auto‑formatting.

---

## 📦 Deployment
Deploy the `dist/` folder to any static host. Example with GitHub Pages:
```bash
npm run build
git add dist -f
git commit -m "chore: deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```
Add a custom domain in the repository settings if desired.

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🙏 Acknowledgements
- **TMDb** for comprehensive movie data.
- **Letterboxd** for the community‑driven diary export.
- **Vite** and **React** teams for the fast development experience.
- The open‑source community for countless UI inspirations.

---

*Ready to dive into your cinematic universe?* 🎥
