# ByteBridge website

Source of the public ByteBridge website, published with GitHub Pages.

- Static HTML and CSS, no build step. [htmx](https://htmx.org) (vendored in `site/assets/htmx.min.js`)
  loads the example setups and the download section as small HTML fragments from `site/partials/`.
- Diagrams are inline SVG styled by `site/assets/style.css`, so they follow the light and dark theme.
- Links are relative, so the site works under `https://bartk1990.github.io/byte-bridge-docs/`
  and on a custom domain.

```
site/
  index.html                 the page
  assets/                    style, htmx, logo animations, favicon, UI screenshots
  partials/setups/*.html     example setups, loaded into the page by the tabs
  partials/release.html      download buttons; regenerated from the latest release on deploy
scripts/release-partial.sh   writes partials/release.html from the latest GitHub release
.github/workflows/pages.yml  publishes site/ to GitHub Pages
```

## Preview locally

```bash
cd site && python3 -m http.server 8000     # http://localhost:8000
```

(htmx loads fragments over HTTP, so open the page through a server, not as a file.)

## Publishing

1. In the repository settings, **Pages > Build and deployment > Source: GitHub Actions** (once).
2. Every push to `main` deploys `site/`.

## Releasing the desktop app

The download section lists the files of the **latest release of this repository**.

1. Build the desktop app (`dotnet publish apps/ByteBridge.Desktop -c Release -r win-x64` in the
   application repository) and zip the output, e.g. `ByteBridge-Desktop-1.0.0-win-x64.zip`.
2. Create a release here (`gh release create v1.0.0 ByteBridge-Desktop-1.0.0-win-x64.zip
   --repo BartK1990/byte-bridge-docs --notes "..."`).
3. Publishing, editing or deleting a release redeploys the site, and the download buttons,
   version and date update by themselves.
