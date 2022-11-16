class UserHandler {
  constructor(UsersService, UsersValidator) {
    this._usersService = UsersService;
    this._usersValidator = UsersValidator;
  }

  async postUserHandler(request, h) {
    this._usersValidator.validateUsersPayload(request.payload);
    const { username, password, fullname } = request.payload;

    const userId = await this._usersService.addUser({
      username,
      password,
      fullname,
    });

    console.log(userId);

    const response = h.response({
      status: 'success',
      message: 'User berhasil ditambahkan',
      data: {
        userId,
      },
    });

    response.code(201);
    return response;
  }

  async getUserByIdHandler(request, h) {
    const { id } = request.params;
    const user = await this._usersService.getUserById(id);

    return h.response({
      status: 'success',
      data: {
        user,
      }
    });
  }

  async getUserByUsernameHandler(request, h) {
    const { username = '' } = request.query;
    const users = await this._usersService.getUserByUsername(username);

    return h.response({
      status: 'success',
      data: {
        users,
      },
    });
  }
}

module.exports = UserHandler;
