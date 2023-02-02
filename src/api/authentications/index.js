const AuthenticationHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'authentication',
  version: '1.0.0',
  register: async (
    server,
    {
      AuthenticationsService,
      UsersService,
      TokenManager,
      AuthenticationsValidator,
    }
  ) => {
    const authenticationHandler = new AuthenticationHandler(
      AuthenticationsService,
      UsersService,
      TokenManager,
      AuthenticationsValidator
    );

    server.route(routes(authenticationHandler));
  },
};
