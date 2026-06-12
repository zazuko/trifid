import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FastifyReply, FastifyRequest } from 'fastify';

import type { RenderFunction } from '../../types/index.ts';

const currentDir = dirname(fileURLToPath(import.meta.url));

/*
 * Using the factory pattern to create the handler,
 * so that it can have access to the `render` function.
 */
const factory = async ({ render }: { render: RenderFunction }) => {
  /**
   * Not found handler.
   *
   * Returns a Promise that resolves only after the raw response stream emits
   * `finish` or `close`.  This prevents Fastify's wrapThenable from racing
   * and calling `reply.send(undefined)` while an async onSend hook (e.g.
   * @fastify/compress) is still streaming the body — which would cause
   * Fastify to write `content-length: 0` and flush headers before the
   * compressed body arrives.
   *
   * @param request Request.
   * @param reply Reply.
   */
  const handler = (request: FastifyRequest, reply: FastifyReply): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const onDone = () => {
        reply.raw.off('finish', onDone);
        reply.raw.off('close', onDone);
        resolve();
      };
      reply.raw.once('finish', onDone);
      reply.raw.once('close', onDone);

      (async () => {
        request.log.debug(`path '${request.url}' returned a 404 error (Not Found)`);

        const accept = request.accepts();

        reply.status(404);

        switch (accept.type([
          'text/plain',
          'json',
          'html',
        ])) {
          case 'json':
            reply.send({ success: false, message: 'Not found', status: 404 });
            break;

          case 'html':
            reply.type('text/html').send(
              await render(
                request,
                `${currentDir}/../../views/404.hbs`,
                {
                  url: request.url,
                },
                { title: 'Not Found' },
              ),
            );
            break;

          default:
            reply.type('text/plain').send('Not Found\n');
            break;
        }
      })().catch((err) => {
        reply.raw.off('finish', onDone);
        reply.raw.off('close', onDone);
        reject(err as Error);
      });
    });

  return handler;
};

export default factory;
