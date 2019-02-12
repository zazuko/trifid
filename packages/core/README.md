# trifid-core
<img src="https://cdn.rawgit.com/zazuko/trifid/master/logo.svg" width="140px" height="140px" align="right" alt="Trifid-ld Logo"/>

[![Join the chat at https://gitter.im/zazuko/trifid](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/zazuko/trifid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Just the core parts of Trifid (plugin loader, config handler, ...).
This package doesn't contain any handlers (SPARQL, file system, ...).
If you want a out of the box solution check [trifid](https://www.npmjs.com/package/trifid/).

## Configuration

* `debug`, defaults to true: logs debug information through `console.log`, pass a falsy value to disable e.g.

    ```js
    const trifid = new Trifid()
    await trifid.init(Object.assign(config, { debug: false }))
    app.use(trifid.middleware())
    ```
