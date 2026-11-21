# Cyber Security Network Protection Techniques

An interactive, browser-based visualization of how common network protection
techniques work, such as firewalls, intrusion detection and prevention,
network segmentation and defense in depth. The goal is to make each technique
easy to understand by showing traffic, layers and decisions visually.

The site is fully static and is published with GitHub Pages at
<https://adi199.github.io/cyber-security-network-protection-techniques/>.

## Scope

- A single-page web app with one view per technique or concept.
- Visuals are SVG, drawn with [D3](https://d3js.org/) inside React components.
- No backend, accounts or real network traffic. Everything runs in the browser
  from bundled data.

## Tech stack

- [Vite](https://vite.dev/) for the dev server and build
- [React](https://react.dev/) with TypeScript
- [D3](https://d3js.org/) for SVG layout and animation
- [oxlint](https://oxc.rs/) for linting
- GitHub Actions for build and GitHub Pages deployment

## Running locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and build to dist/
npm run preview   # serve the production build locally
npm run lint      # lint the source
```

The dev server prints the local URL. The app is served under the
`/cyber-security-network-protection-techniques/` base path so local URLs match
GitHub Pages.

## Project structure

```
src/
  main.tsx          app entry
  App.tsx           page shell and view navigation
  index.css         global styles and color tokens (light and dark)
  views/            one component per visualization
    index.ts        view registry, add new views here
    Overview.tsx    landing view
  components/       shared building blocks used by views
```

### Adding a visualization

1. Create `src/views/<Name>.tsx` (or a `src/views/<Name>/` folder for larger views).
2. Register it in `src/views/index.ts` with an `id`, a `title` and the component.
3. Put reusable pieces in `src/components/`.

## Deployment

`.github/workflows/deploy.yml` builds and lints every pull request and deploys
`main` to GitHub Pages. In the repository settings, under **Pages**, set
**Source** to **GitHub Actions** once so the deploy step is allowed to publish.

## License

[MIT](LICENSE)
