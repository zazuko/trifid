/* global ReactDOM, React, GraphExplorer, graphExplorerConfig */

const SparqlDialect = GraphExplorer.OWLStatsSettings;
SparqlDialect.dataLabelProperty = graphExplorerConfig.dataLabelProperty;
SparqlDialect.schemaLabelProperty = graphExplorerConfig.schemaLabelProperty;

function onWorkspaceMounted(workspace) {
  if (!workspace) {
    return;
  }

  const model = workspace.getModel();

  model.importLayout({
    dataProvider: new GraphExplorer.SparqlDataProvider(
      {
        endpointUrl: graphExplorerConfig.endpointUrl,
        acceptBlankNodes: graphExplorerConfig.acceptBlankNodes,
        imagePropertyUris: ["http://xmlns.com/foaf/0.1/img"],
        queryMethod: GraphExplorer.SparqlQueryMethod.GET,
      },
      SparqlDialect,
    ),
  });

  /**
   * get the '?resources' search param and load those resources
   */
  const url = new URL(window.location.href);
  const resources = url.searchParams.get("resources");

  if (resources) {
    const elm = model.dataProvider.elementInfo({
      elementIds: resources.split(";"),
    });

    elm
      .then(function (arg) {
        const elmIds = [];
        resources.split(";").forEach(function (item) {
          const node = model.createElement(arg[item]);
          elmIds[item] = node.id;
          workspace.forceLayout();
        });
        return elmIds;
      })
      .then(function (elmIds) {
        /* now that we have the resources, add the links */
        const lnk = model.dataProvider.linksInfo({
          elementIds: resources.split(";"),
        });
        lnk.then(function (arg) {
          arg.forEach(function (link) {
            const newLink = new GraphExplorer.Link({
              typeId: link.linkTypeId,
              sourceId: elmIds[link.sourceId],
              targetId: elmIds[link.targetId],
            });
            model.addLink(newLink);
            workspace.forceLayout();
          });
        });
      });
  }
}

const props = {
  ref: onWorkspaceMounted,
  languages: graphExplorerConfig.languages,
  language: graphExplorerConfig.language,
};

ReactDOM.render(
  React.createElement(GraphExplorer.Workspace, props),
  document.getElementById("trifid-plugin-graph-explorer"),
);
