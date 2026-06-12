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
   * @param request Request.
   * @param reply Reply.
   */
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
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
  };

  return handler;
};

export default factory;
