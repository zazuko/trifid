# Trifid as DBpedia frontend

In this example we want to setup Trifid to act as a frontend for DBpedia. Our goals:

* change the default port from `8080` to `3030`
* Override the SPARQL endpoint so we can use the DBpedia one
* Enable proxy-rewrite mode (explained later)

There are two ways of executing Trifid and we will use both of them in this tutorial. The first one is based on cloning the Github repository, as described in [README](README.md).

## Trifid from pre-built Docker image

If you just want to execute Trifid without much tweaking, the easiest way is to use our [pre-built Docker image](https://hub.docker.com/r/zazuko/trifid/): 

    docker pull zazuko/trifid

The default configuration won't do much so you need to specify a different configuration file, as described below. Once you have an adjusted config file run the image:

     docker run -ti -e TRIFID_CONFIG=config-custom.json -v $(pwd)/config-custom.json:/usr/src/app/config-custom.json -p 8080:8080 zazuko/trifid

With `-e TRIFID_CONFIG=config-custom.json` we override the configuration file, `-v` mounts the local config file into the container. The `$(pwd)` is necessary as `-v` does not support relative paths.

In case you want to do the same with `docker-compose, a YAML file should contain something like this:

```yaml
  myfancyname:
    container_name: myfancyname
    image: zazuko/trifid
    volumes:
      - ./config-custom.json:/usr/src/app/config-custom.json
    environment:
      - TRIFID_CONFIG=config-custom.json
```

Now let us see how we can adjust the configuration.

## Base configuration

After cloning, `cd` into the `trifid` directory and create a new config file, called `config-custom.json`. It should contain the following configuration:

```json
{
  "baseConfig": "trifid:config-sparql.json", // inherit the default sparql config
  "sparqlEndpointUrl": "http://dbpedia.org/sparql", // overrides SPARQL endpoint
  "datasetBaseUrl": "http://dbpedia.org/", // enables "proxy" mode. 
  "listener": {
    "port": 3030
  }
}
```

(Hint: The JSON parser Trifid is using supports comments)

### baseConfig

We do not recommend to change the default configuration files from Trifid called `config.json` and `config-sparql.json`. This makes it harder to update to a new version. Instead you should simply override from an existing configuration by using the `baseConfig` statement. This feature can also be used to provide multiple configurations, say one for development with the proxy feature enabled and one which is for production.

### sparqlEndpointUrl

`sparqlEndpointUrl` This sets the SPARQL endpoint used by Trifid for dereferencing resources. In our case we use the public one from DBpedia

### datasetBaseUrl

This enables the proxy-rewrite module of Trifid. With this functionality you can access URIs on whatever domain you are running, like `localhost`. This is super convenient for testing as you most probably won't be pointing the productive URI of the data to your development machine. In our sample setup, we rewrite the URIs to the DBpedia SPARQL endpoint so we can use the DBpedia dataset on our development machine.

To test this simply enter a URI that exists on DBpedia and adjust it accordingly. In our example, the resource `http://dbpedia.org/resource/Switzerland` would become `http://localhost:3030/resource/Switzerland`. The `DESCRIBE` query will be re-written to the correct DBpedia URI.

### listener & port

As you probably guessed this adjusts the port, in this case it is set to `3030`.
