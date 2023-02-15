class AlbumsHandler {
  constructor(
    AlbumsService,
    SongsService,
    AlbumsValidator,
    StorageService,
    UploadsValidator
  ) {
    this._albumsService = AlbumsService;
    this._songsService = SongsService;
    this._albumsValidator = AlbumsValidator;
    this._storageService = StorageService;
    this._uploadsValidator = UploadsValidator;
  }

  async postAlbumHandler(request, h) {
    this._albumsValidator.validateAlbumsPayload(request.payload);

    const { name, year } = request.payload;

    const albumId = await this._albumsService.addAlbum({ name, year });
    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumsHandler() {
    const albums = await this._albumsService.getAlbums();

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;

    const album = await this._albumsService.getAlbumById(id);
    album.songs = await this._songsService.getSongByAlbumId(id);

    return h.response({
      status: 'success',
      data: {
        album,
      },
    });
  }

  async putAlbumByIdHandler(request, h) {
    this._albumsValidator.validateAlbumsPayload(request.payload);

    const { id } = request.params;
    await this._albumsService.editAlbumById(id, request.payload);

    return h.response({
      status: 'success',
      message: 'Album berhasil diperbaharui',
    });
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;

    await this._albumsService.deleteAlbumById(id);

    return h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });
  }

  async postUploadCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;

    await this._albumsService.checkAlbum(id);

    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/albums/covers/${filename}`;

    await this._albumsService.editAlbumToAddCoverById(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Cover berhasil diupload',
    });

    response.code(201);
    return response;
  }
}

module.exports = AlbumsHandler;
