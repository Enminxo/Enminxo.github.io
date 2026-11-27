# enminxo.github.io

Personal website of Enmin Zhong, PhD researcher at GTI-UPM (Madrid) working on multimodal AI and egocentric vision for wearable intelligence. Live at [enminxo.github.io](https://enminxo.github.io).

It holds my research path and publications, side projects, and the build logs that go with them.

## Run it locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Where things live

- `src/content/research/`: the steps of the research path
- `src/content/publications/`: papers (`featured: true` puts one on the home page)
- `src/content/work/`: projects (`hidden: true` keeps one off the Projects list)
- `src/content/logs/`: build-log entries, in English and Spanish
- `src/i18n/translations.ts`: interface text

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`).

Built with [Astro](https://astro.build), starting from its portfolio template.
