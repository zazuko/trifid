// @ts-check

/**
 * Not found handler.
 *
 * @param {import('fastify').FastifyRequest} request Request.
 * @param {import('fastify').FastifyReply} reply Reply.
 */
const handler = (request, reply) => {
  request.log.debug(`path '${request.url}' returned a 404 error (Not Found)`)

  const accept = request.accepts()

  reply.status(404)

  switch (accept.type([
    'text/plain',
    'json',
    'html',
  ])) {
    case 'json':
      reply.send({ success: false, message: 'Not found', status: 404 })
      break

    case 'html':
    // res.send(
    //   await render(
    //     `${currentDir}/../views/404.hbs`,
    //     {
    //       url: req.url,
    //       locals: res.locals,
    //     },
    //     { title: 'Not Found' },
    //   ),
    // )
    // break

    default:
      reply.send('Not Found\n')
      break
  }
}

export default handler
