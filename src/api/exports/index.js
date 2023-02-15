const ExportsHandler = require('./handle');
const routes = require('./routes');

module.exports = {
  name: 'exports',
  version: '0.0.1',
  register: async (
    server,
    { ProducerService, PlaylistsService, ExportsValidator }
  ) => {
    const exportsHandler = new ExportsHandler(
      ProducerService,
      PlaylistsService,
      ExportsValidator
    );
    server.route(routes(exportsHandler));
  },
};
