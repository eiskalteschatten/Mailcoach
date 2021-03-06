import { MockStore } from 'redux-mock-store';
import nock from 'nock';

import { SerializedModel, ModelCreateUpdate } from '../../../../interfaces/auth/Users';

import {
  userSetInfo,
  userLogin,
  userLogout,
  registerUser,
  loginUser,
  logoutUser,
  renewAccessToken,
  updateUserSelf,
  updateOwnPassword,
  saveUserSettings
} from './userActions';

import mockStore from '../../lib/tests/mockStore';

describe('User Actions', () => {
  const addUser: ModelCreateUpdate = {
    firstName: 'firstname',
    lastName: 'lastname',
    password: 'testpassword',
    username: 'username',
    email: 'email',
    avatar: ''
  };

  const serializedUser: SerializedModel = {
    id: 1,
    firstName: 'firstname',
    lastName: 'lastname',
    username: 'username',
    email: 'email',
    avatar: ''
  };

  afterEach(() => {
    nock.cleanAll();
  });

  test('User info is set', async () => {
    const localStore: MockStore = mockStore();
    await localStore.dispatch(userSetInfo(serializedUser));
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({
      type: 'USER_SET_INFO',
      user: serializedUser
    });
  });

  test('User is logged in', async () => {
    const localStore: MockStore = mockStore();
    await localStore.dispatch(userLogin());
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'USER_LOG_IN'});
  });

  test('User is logged out', async () => {
    const localStore: MockStore = mockStore();
    await localStore.dispatch(userLogout());
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'USER_LOG_OUT'});
  });

  test('User is registered', async () => {
    const accessToken = 'Iamatoken';
    const refreshToken = 'Iamarefreshtoken';

    nock('http://localhost')
      .post('/api/auth/users')
      .reply(200, {
        user: addUser,
        accessToken,
        refreshToken
      });

    const localStore: MockStore = mockStore();
    await localStore.dispatch(registerUser(addUser) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'USER_SET_INFO',
      user: addUser
    });
    expect(actions[3]).toEqual({type: 'USER_LOG_IN'});
    expect(actions[4]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User registration throws a username already exists error', async () => {
    nock('http://localhost')
      .post('/api/auth/users')
      .reply(409);

    const localStore: MockStore = mockStore();
    await localStore.dispatch(registerUser(addUser) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: 'errors.usernameAlreadyExists'
    });
    expect(actions[3]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User registration throws a field missing error', async () => {
    nock('http://localhost')
      .post('/api/auth/users')
      .reply(400);

    const localStore: MockStore = mockStore();
    await localStore.dispatch(registerUser(addUser) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: 'errors.requiredFieldsMissing'
    });
    expect(actions[3]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User registration throws an error', async () => {
    nock('http://localhost')
      .post('/api/auth/users')
      .reply(500);

    const localStore: MockStore = mockStore();
    await localStore.dispatch(registerUser(serializedUser) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: 'errors.registrationError'
    });
    expect(actions[3]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User is logged in', async () => {
    const accessToken = 'Iamatoken';
    const refreshToken = 'Iamarefreshtoken';
    const instanceId = 'testId';
    const user = {
      username: 'testuser',
      password: 'testpassword'
    };
    const settings = {};

    nock('http://localhost')
      .post('/api/auth/login')
      .reply(200, {
        user: {},
        accessToken,
        refreshToken,
        instanceId,
        settings
      });

    const localStore: MockStore = mockStore();
    await localStore.dispatch(loginUser(user) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'USER_SET_INFO',
      user: {}
    });
    expect(actions[3]).toEqual({
      type: 'USER_SET_INSTANCE_ID',
      instanceId
    });
    expect(actions[4]).toEqual({
      type: 'USER_SET_SETTINGS',
      settings
    });
    expect(actions[5]).toEqual({type: 'USER_LOG_IN'});
    expect(actions[6]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User is logged out', async () => {
    nock('http://localhost')
      .post('/api/auth/logout')
      .reply(204);

    const localStore: MockStore = mockStore();
    await localStore.dispatch(logoutUser() as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({type: 'USER_LOG_OUT'});
    expect(actions[2]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User login throws an error', async () => {
    const user = {
      username: 'testuser',
      password: 'testpassword'
    };

    nock('http://localhost')
      .post('/api/auth/login')
      .reply(400);

    const localStore: MockStore = mockStore();
    await localStore.dispatch(loginUser(user) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'APP_SET_FORM_ERROR',
      error: 'errors.loginError'
    });
    expect(actions[3]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('Renewing an access token works', async () => {
    nock('http://localhost')
      .post('/api/auth/token')
      .reply(200, {
        user: {},
        instanceId: ''
      });

    const localStore: MockStore = mockStore();
    await localStore.dispatch(renewAccessToken() as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'USER_SET_INSTANCE_ID',
      instanceId: ''
    });
    expect(actions[2]).toEqual({
      type: 'USER_SET_INFO',
      user: {}
    });
    expect(actions[3]).toEqual({type: 'USER_LOG_IN'});
    expect(actions[4]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('Refresh token is not valid', async () => {
    nock('http://localhost')
      .post('/api/auth/token')
      .reply(401);

    const localStore: MockStore = mockStore();
    await localStore.dispatch(renewAccessToken() as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({type: 'USER_LOG_OUT'});
    expect(actions[2]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User can update his own account information', async () => {
    nock('http://localhost')
      .put('/api/auth/users/self')
      .reply(200, {
        user: addUser
      });

    const localStore: MockStore = mockStore();
    await localStore.dispatch(updateUserSelf(addUser) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'USER_SET_INFO',
      user: addUser
    });
    expect(actions[3]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('User can update his own password', async () => {
    nock('http://localhost')
      .patch('/api/auth/users/self/password')
      .reply(204);

    const localStore: MockStore = mockStore();
    await localStore.dispatch(updateOwnPassword(addUser) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({type: 'APP_STOP_LOADING'});
  });

  test('Saving user settings works', async () => {
    nock('http://localhost')
      .put('/api/auth/users/settings')
      .reply(200, {
        settings: {}
      });

    const localStore: MockStore = mockStore();
    await localStore.dispatch(saveUserSettings(addUser) as any);
    const actions = localStore.getActions();
    expect(actions[0]).toEqual({type: 'APP_START_LOADING'});
    expect(actions[1]).toEqual({
      type: 'APP_SET_ERROR',
      error: ''
    });
    expect(actions[2]).toEqual({
      type: 'USER_SET_SETTINGS',
      settings: {}
    });
    expect(actions[3]).toEqual({type: 'APP_STOP_LOADING'});
  });
});
