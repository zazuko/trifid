import { promises as fs } from 'node:fs';
import { dirname, join as pathJoin } from 'node:path';
import { fileURLToPath } from 'node:url';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

import addClasses from './addClasses.ts';
import { defaultValue } from './utils.ts';

const currentDir = dirname(fileURLToPath(import.meta.url));

const LOCALS_PLUGIN_KEY = 'markdown-content-plugin';

/**
 * Configuration used to convert a single Markdown file.
 */
interface ContentConfiguration {
  idPrefix: string;
  classes: Record<string, string>;
  autoLink: boolean;
}

/**
 * A single converted Markdown entry.
 */
interface ContentEntry {
  language: string;
  path: string;
  html: string;
}

/**
 * Return a HTML string from a Markdown string.
 *
 * @param markdownString Markdown string
 * @param config configuration
 * @returns HTML string
 */
const convertToHtml = async (markdownString: string, config: ContentConfiguration): Promise<string> => {
  const processors: unknown[][] = [
    [remarkParse],
    [remarkFrontmatter],
    [remarkGfm],
    [remarkRehype],
    [rehypeSlug, {
      prefix: config.idPrefix,
    }],
  ];

  if (config.autoLink) {
    processors.push([rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: {
        class: 'headers-autolink',
      },
    }]);
  }

  processors.push([addClasses, config.classes]);
  processors.push([rehypeStringify]);

  const processor = unified();
  for (const [plugin, options] of processors) {
    // @ts-ignore -- the plugin/options pairs are intentionally heterogeneous
    processor.use(plugin, options);
  }

  const html = await processor.process(markdownString);

  return html.toString();
};

/**
 * Get all subdirectories of that particular directory.
 *
 * @param path path of the starting directory
 * @returns list of all directories present in that directory
 */
const getItems = async (path: string): Promise<Array<{ name: string; path: string }>> => {
  const directories = [];

  const pathContent = await fs.readdir(path, { withFileTypes: true });

  for (const item of pathContent) {
    if (!item.isDirectory()) {
      continue;
    }
    const fullPath = pathJoin(path, item.name);
    directories.push({
      name: item.name,
      path: fullPath,
    });
  }

  return directories;
};

/**
 * Read all markdown files from a directory and convert them in HTML format.
 *
 * @param path path of the directory to read
 * @param config configuration
 * @returns list of files that are in that directory
 */
const getContent = async (path: string, config: ContentConfiguration): Promise<ContentEntry[]> => {
  const files: ContentEntry[] = [];

  const pathContent = await fs.readdir(path, { withFileTypes: true });

  for (const item of pathContent) {
    if (item.isDirectory()) {
      continue;
    }
    const fullPath = pathJoin(path, item.name);
    if (!fullPath.endsWith('.md')) {
      continue;
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    const html = await convertToHtml(content, config);
    files.push({
      language: item.name.replace(/\.md*/, ''),
      path: fullPath,
      html,
    });
  }

  return files;
};

/**
 * Return all keys for the specific language.
 *
 * @param store Store of content entries, grouped by key.
 * @param language Language to extract.
 */
const entriesForLanguage = (
  store: Record<string, ContentEntry[]>,
  language = 'en',
): Record<string, string> => {
  const finalStore: Record<string, string> = {};

  for (const [key, item] of Object.entries(store)) {
    let value: string | null = null;
    let fallbackValue: string | null = null;

    item.map((item) => {
      if (item.language === language) {
        value = item.html;
      }
      if (item.language === 'default') {
        fallbackValue = item.html;
      }
    });

    if (value === null && fallbackValue !== null) {
      value = fallbackValue;
    }

    if (value === null) {
      value = '';
    }

    finalStore[key] = value;
  }

  return finalStore;
};

const factory: TrifidPlugin = async (trifid) => {
  const { config, server, render } = trifid;

  const entries = (config?.entries ?? {}) as Record<string, Record<string, unknown>>;
  const defaults = (config?.defaults ?? {}) as Record<string, unknown>;

  // Default configuration
  const idPrefix = defaultValue('idPrefix', defaults, 'content-');
  const classes = defaultValue<Record<string, string>>('classes', defaults, {});
  const autoLink = defaultValue('autoLink', defaults, true);
  const template = defaultValue('template', defaults, `${currentDir}/../views/content.hbs`);

  // Iterate over all configured entries
  for (const [namespace, entry] of Object.entries(entries)) {
    const directory = entry?.directory;
    const mountPath = typeof entry?.mountPath === 'string' ? entry.mountPath : false;

    // Check config
    if (!directory || typeof directory !== 'string') {
      throw new Error('\'directory\' should be a non-empty string');
    }

    const contentConfiguration: ContentConfiguration = {
      idPrefix: defaultValue('idPrefix', entry, idPrefix),
      classes: defaultValue<Record<string, string>>('classes', entry, classes),
      autoLink: defaultValue('autoLink', entry, autoLink),
    };

    const store: Record<string, ContentEntry[]> = {};
    const items = await getItems(directory);

    for (const item of items) {
      store[item.name] = await getContent(item.path, contentConfiguration);
    }

    /**
     * Handler to load the content into the session, using the user language.
     *
     * @param request Request.
     * @param _reply Reply.
     * @param done Done.
     */
    const onRequestHook = (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) => {
      if (!request.session.has(LOCALS_PLUGIN_KEY)) {
        request.session.set(LOCALS_PLUGIN_KEY, {});
      }

      const currentLanguage = (request.session.get('currentLanguage') || request.session.get('defaultLanguage') || 'en') as string;
      const currentContent = (request.session.get(LOCALS_PLUGIN_KEY) as Record<string, unknown>) || {};
      currentContent[namespace] = entriesForLanguage(store, currentLanguage);
      request.session.set(LOCALS_PLUGIN_KEY, currentContent);
      done();
    };
    server.addHook('onRequest', onRequestHook);

    // Create a route for each entry
    if (mountPath) {
      const mountAtPathSlash = mountPath.endsWith('/') ? mountPath : `${mountPath}/`;

      for (const item of items) {
        const routePath = `${mountAtPathSlash}${item.name}`;

        /**
         * Route handler for the specific content.
         *
         * @param _request Request.
         * @param reply Reply.
         */
        const redirectHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
          reply.redirect(`${routePath}/`);
          return reply;
        };

        /**
         * Route handler for the specific content.
         *
         * @param request Request.
         * @param reply Reply.
         */
        const routeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
          const content = request.session.get(LOCALS_PLUGIN_KEY) as Record<string, Record<string, string>> | undefined;
          reply.type('text/html').send(await render(request, defaultValue('template', entry, template), {
            content: content?.[namespace]?.[item.name] || '',
          }));
          return reply;
        };

        // Mount routes
        server.get(`${routePath}`, redirectHandler);
        server.get(`${routePath}/`, routeHandler);
      }
    }
  }
};

export default factory;
