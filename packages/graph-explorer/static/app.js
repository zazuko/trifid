/* global GraphExplorer, graphExplorerConfig */

const SparqlDialect = GraphExplorer.OWLStatsSettings;
SparqlDialect.dataLabelProperty = graphExplorerConfig.dataLabelProperty;
SparqlDialect.schemaLabelProperty = graphExplorerConfig.schemaLabelProperty;

const onWorkspaceMounted = async (workspace) => {
  if (!workspace) {
    return;
  }

  const model = workspace.getModel();

  // `importLayout` resets the diagram, so it has to be awaited before any
  // element is added below, otherwise it wipes them once it resolves.
  await model.importLayout({
    dataProvider: new GraphExplorer.SparqlDataProvider(
      {
        endpointUrl: graphExplorerConfig.endpointUrl,
        acceptBlankNodes: graphExplorerConfig.acceptBlankNodes,
        imagePropertyUris: ['http://xmlns.com/foaf/0.1/img'],
        queryMethod: GraphExplorer.SparqlQueryMethod.GET,
      },
      SparqlDialect,
    ),
  });

  /**
   * get the '?resources' search param and load those resources
   */
  const url = new URL(window.location.href);
  const resources = url.searchParams.get('resources');

  if (resources) {
    const elm = await model.dataProvider.elementInfo({
      elementIds: resources.split(';'),
    });

    const elmIds = {};
    resources.split(';').forEach((item) => {
      if (!elm[item]) {
        return;
      }
      const node = model.createElement(elm[item]);
      elmIds[item] = node.id;
    });

    /* now that we have the resources, add the links */
    const lnk = await model.dataProvider.linksInfo({
      elementIds: resources.split(';'),
    });

    lnk.forEach((link) => {
      const sourceId = elmIds[link.sourceId];
      const targetId = elmIds[link.targetId];
      if (!sourceId || !targetId) {
        return;
      }
      model.addLink(new GraphExplorer.Link({
        typeId: link.linkTypeId,
        sourceId,
        targetId,
      }));
    });

    workspace.forceLayout();
  }
};

const props = {
  // React 19 treats a value returned from a callback ref as a cleanup function,
  // so the async handler must not have its promise returned here.
  ref: (workspace) => {
    onWorkspaceMounted(workspace);
  },
  languages: graphExplorerConfig.languages,
  language: graphExplorerConfig.language,
};

// `renderTo` is the mount helper exposed by graph-explorer; it uses the React 19
// `createRoot` API from the React copy bundled inside the library.
GraphExplorer.renderTo(
  GraphExplorer.Workspace,
  document.getElementById('trifid-plugin-graph-explorer'),
  props,
);
