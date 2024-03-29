require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');
const config = require('./utils/config');

// albums
const albums = require('./api/albums');
const albumsValidator = require('./validator/albums');
const AlbumsService = require('./services/openmusic/AlbumsService');

// songs
const songs = require('./api/songs');
const songsValidator = require('./validator/songs');
const SongsService = require('./services/openmusic/SongsService');

// authentications
const authentications = require('./api/authentications');
const authenticationsValidator = require('./validator/authentications');
const AuthenticationsService = require('./services/openmusic/AuthenticationsService');
const tokenManager = require('./tokenize/TokenManager');

// users
const users = require('./api/users');
const usersValidator = require('./validator/users');
const UsersService = require('./services/openmusic/UsersService');

// playlists
const playlists = require('./api/playlists');
const playlistsValidator = require('./validator/playlists');
const PlaylistsService = require('./services/openmusic/PlaylistsService');
const PlaylistsSongsService = require('./services/openmusic/PlaylistsSongsService');
const PlaylistsSongsActivitiesService = require('./services/openmusic/PlaylistsSongsActivitiesService');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsValidator = require('./validator/collaborations');
const CollaborationsService = require('./services/openmusic/CollaborationsService');

// export
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// uploads
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

// cache
const CacheService = require('./services/redis/CacheService');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService();
  const authenticationsService = new AuthenticationsService();
  const usersService = new UsersService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const playlistsSongsService = new PlaylistsSongsService();
  const playlistsSongsActivitiesService = new PlaylistsSongsActivitiesService();
  const storageService = new StorageService(path.resolve(__dirname, 'api/albums/file/covers'));

  const server = Hapi.server({
    host: config.app.host,
    port: config.app.port,
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
    {
      plugin: Inert,
    }
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.token.tokenKey,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.token.tokenAge,
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
        StorageService: storageService,
        UploadsValidator: UploadsValidator
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
    {
      plugin: playlists,
      options: {
        PlaylistsService: playlistsService,
        PlaylistsSongsService: playlistsSongsService,
        PlaylistsSongsActivitiesService: playlistsSongsActivitiesService,
        PlaylistsValidator: playlistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        CollaborationsService: collaborationsService,
        PlaylistsService: playlistsService,
        CollaborationsValidator: CollaborationsValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        ProducerService: ProducerService,
        PlaylistsService: playlistsService,
        ExportsValidator: ExportsValidator,
      }
    }
  ]);

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;
    console.log(response);
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
