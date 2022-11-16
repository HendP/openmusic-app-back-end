require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

const albums = require('./api/albums');
const albumsValidator = require('./validator/albums');
const AlbumsService = require('./services/openmusic/AlbumsService');

const songs = require('./api/songs');
const songsValidator = require('./validator/songs');
const SongsService = require('./services/openmusic/SongsService');

const authentications = require('./api/authentications');
const authenticationsValidator = require('./validator/authentications');
const AuthenticationsService = require('./services/openmusic/AuthenticationsService');
const tokenManager = require('./tokenize/TokenManager');

const users = require('./api/users');
const usersValidator = require('./validator/users');
const UsersService = require('./services/openmusic/UsersService');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const authenticationsService = new AuthenticationsService();
  const usersService = new UsersService();

  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        AlbumsService: albumsService,
        SongsService: songsService,
        AlbumsValidator: albumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        SongsService: songsService,
        SongsValidator: songsValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        AuthenticationsService: authenticationsService,
        UsersService: usersService,
        TokenManager: tokenManager,
        AuthenticationsValidator: authenticationsValidator,
      },
    },
    {
      plugin: users,
      options: {
        UsersService: usersService,
        UsersValidator: usersValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;

    if (response instanceof Error) {
      // penanganan client error secara internal.
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
      if (!response.isServer) {
        return h.continue;
      }

      // penanganan server error sesuai kebutuhan
      const newResponse = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
