const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { mapAlbumsToModel } = require('../../utils/model');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const coverUrl = null;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, name, year, coverUrl, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const query = 'SELECT id, name, year, cover_url FROM albums';

    const result = await this._pool.query(query);

    return result.rows.map(mapAlbumsToModel);
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year, cover_url FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return result.rows.map(mapAlbumsToModel)[0];
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus album, Id tidak ditemukan');
    }
  }

  async checkAlbum(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menumukan album');
    }
  }

  async editAlbumToAddCoverById(id, fileLocation) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2',
      values: [fileLocation, id],
    };

    await this._pool.query(query);
  }

  async likeAlbum(id, userId) {
    await this.checkAlbum(id);

    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [id, userId],
    };

    const result = await this._pool.query(query);

    let responseMessage = '';

    if (!result.rows.length) {
      const queryLike = {
        text: 'INSERT INTO user_album_likes (album_id, user_id) VALUES($1, $2) RETURNING id',
        values: [id, userId],
      };

      const resultLike = await this._pool.query(queryLike);

      if (!resultLike.rows.length) {
        throw new InvariantError('Gagal menyukai album');
      }

      responseMessage = 'Menyukai album';
    } else {
      const queryUnlike = {
        text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
        values: [id, userId],
      };

      const resultUnlike = await this._pool.query(queryUnlike);

      if (!resultUnlike.rows.length) {
        throw new InvariantError('Gagal untuk membatalkan menyukai album');
      }

      responseMessage = 'Batal menyukai album';
    }
    await this._cacheService.delete(`user_album_likes:${id}`);
    return responseMessage;
  }

  async getLikesAlbumById(id) {
    try {
      const source = 'cache';
      const likes = await this._cacheService.get(`user_album_likes:${id}`);
      return { likes: +likes, source };
    } catch (error) {
      await this.checkAlbum(id);

      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };

      const result = await this._pool.query(query);

      const likes = result.rows.length;

      await this._cacheService.set(`user_album_likes:${id}`, likes);

      const source = 'server';

      return { likes, source };
    }
  }
}

module.exports = AlbumsService;
