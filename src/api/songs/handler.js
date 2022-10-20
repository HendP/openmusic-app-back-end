class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  async postSongHandler(request, h) {
    this._validator.validateSongsPayload(request.payload);

    const songId = await this._service.addSong(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        songId,
      },
    });

    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
    const { title, performer } = request.query;

    const songs = await this._service.getSongs(title, performer);

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request, h) {
    const { id } = request.params;

    const song = await this._service.getSongById(id);

    const response = h.response({
      status: 'success',
      data: {
        song,
      },
    });

    response.code(200);
    return response;
  }

  async putSongByIdHandler(request, h) {
    this._validator.validateSongsPayload(request.payload);

    const { id } = request.params;
    await this._service.editSongById(id, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    });

    response.code(200);
    return response;
  }

  async deleteSongByIdHandler(request, h) {
    const { id } = request.params;

    await this._service.deleteSongById(id);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });

    response.code(200);
    return response;
  }
}

module.exports = SongsHandler;
