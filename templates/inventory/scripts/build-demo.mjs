import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const templateRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const outputDirectory = path.join(templateRoot, 'demo-dist');
const config = {
  appName: 'Inventory',
  businessName: 'Sample Business',
  primaryColor: '#635bff',
  currency: 'USD',
  businessLogo: '',
  businessEmail: '',
  businessPhone: '',
  businessAddress: '',
};
const jsonContent = (value) => JSON.stringify(value).slice(1, -1);
const pageScripts = {
  index: 'dashboard',
  products: 'products',
  categories: 'categories',
  stock: 'stock',
  reports: 'reports',
  settings: 'settings',
};
const partialDirectory = path.join(templateRoot, 'partials');

const registerPartials = async (directory, prefix = '') => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await registerPartials(entryPath, `${prefix}${entry.name}/`);
    } else if (entry.name.endsWith('.hbs')) {
      const name = `${prefix}${entry.name.replace(/\.hbs$/, '')}`;
      Handlebars.registerPartial(name, await readFile(entryPath, 'utf8'));
    }
  }
};

await registerPartials(partialDirectory);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
const pagesDirectory = path.join(templateRoot, 'pages');
for (const file of await readdir(pagesDirectory)) {
  if (!file.endsWith('.hbs')) continue;
  const page = path.basename(file, '.hbs');
  const source = await readFile(path.join(pagesDirectory, file), 'utf8');
  const html = Handlebars.compile(source)({
    ...config,
    pageScript: pageScripts[page],
  });
  await writeFile(path.join(outputDirectory, `${page}.html`), html);
}

await cp(
  path.join(templateRoot, 'assets'),
  path.join(outputDirectory, 'assets'),
  { recursive: true }
);
await mkdir(path.join(outputDirectory, 'icons'), { recursive: true });
for (const file of await readdir(path.join(templateRoot, 'icons'))) {
  if (!file.endsWith('.svg')) continue;
  const source = await readFile(path.join(templateRoot, 'icons', file), 'utf8');
  await writeFile(
    path.join(outputDirectory, 'icons', file),
    Handlebars.compile(source)(config)
  );
}

const manifestSource = await readFile(
  path.join(templateRoot, 'manifest.template.json'),
  'utf8'
);
const manifestConfig = Object.fromEntries(
  Object.entries(config).map(([key, value]) => [key, jsonContent(value)])
);
await writeFile(
  path.join(outputDirectory, 'manifest.json'),
  Handlebars.compile(manifestSource)(manifestConfig)
);
const workerSource = await readFile(
  path.join(templateRoot, 'sw.template.js'),
  'utf8'
);
await writeFile(
  path.join(outputDirectory, 'sw.js'),
  Handlebars.compile(workerSource)(config)
);

process.stdout.write(
  `Compiled six demo pages and static assets to ${outputDirectory}\n`
);
