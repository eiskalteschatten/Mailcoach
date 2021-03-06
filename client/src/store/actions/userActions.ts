import axios from 'axios';
import { Dispatch, ActionCreator, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { SerializedModel, ModelCreateUpdate, LoginModel, PasswordChange } from '../../../../interfaces/auth/Users';
import { SerializedModel as SerializedModelSettings } from '../../../../interfaces/auth/UserSettings';

import { AppStopLoadingAction, appStartLoading, appStopLoading, appSetFormError, appSetError } from './appActions';

export interface UserSetInfo extends Action<'USER_SET_INFO'> {
  user: SerializedModel
}
export interface UserLogin extends Action<'USER_LOG_IN'> {}
export interface UserLogout extends Action<'USER_LOG_OUT'> {}
export interface UserSetInstanceId extends Action<'USER_SET_INSTANCE_ID'> {
  instanceId: string;
}

export interface UserSetSettings extends Action<'USER_SET_SETTINGS'> {
  settings: SerializedModelSettings;
}

export type UserActions =
  UserSetInfo |
  UserLogin |
  UserLogout |
  UserSetInstanceId |
  UserSetSettings;

export const userSetInfo = (user: SerializedModel): UserSetInfo => ({
  type: 'USER_SET_INFO',
  user
});

export const userLogin = (): UserLogin => ({ type: 'USER_LOG_IN' });
export const userLogout = (): UserLogout => ({ type: 'USER_LOG_OUT' });

export const userSetInstanceId = (instanceId: string): UserSetInstanceId => ({
  type: 'USER_SET_INSTANCE_ID',
  instanceId
});

export const userSetSettings = (settings: SerializedModelSettings): UserSetSettings => ({
  type: 'USER_SET_SETTINGS',
  settings
});


// See https://www.carlrippon.com/strongly-typed-react-redux-code-with-typescript/ for more on the return type
export const registerUser: ActionCreator<
  ThunkAction<
    // The type of the last action to be dispatched - will always be promise<T> for async actions
    Promise<AppStopLoadingAction>,
    // The type for the data within the last action
    null,
    // The type of the parameter for the nested function
    null,
    // The type of the last action to be dispatched
    AppStopLoadingAction
  >
> = (user: ModelCreateUpdate): any => async (dispatch: Dispatch, getState: any): Promise<AppStopLoadingAction> => {
  dispatch(appStartLoading());
  dispatch(appSetFormError(''));

  try {
    const res: any = await axios.post('/api/auth/users', user);
    dispatch(userSetInfo(res.data.user));
    dispatch(userLogin());
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
  }
  catch (error) {
    if (error.response.status === 409) {
      dispatch(appSetFormError('errors.usernameAlreadyExists'));
    }
    else if (error.response.status === 400) {
      dispatch(appSetFormError('errors.requiredFieldsMissing'));
    }
    else {
      dispatch(appSetFormError('errors.registrationError'));
      console.error(error);
    }
  }

  return dispatch(appStopLoading());
};

export const loginUser: ActionCreator<
  ThunkAction<
    Promise<AppStopLoadingAction>,
    null,
    null,
    AppStopLoadingAction
  >
> = (user: LoginModel): any => async (dispatch: Dispatch, getState: any): Promise<AppStopLoadingAction> => {
  dispatch(appStartLoading());
  dispatch(appSetFormError(''));

  try {
    const res: any = await axios.post('/api/auth/login', user);
    dispatch(userSetInfo(res.data.user));
    dispatch(userSetInstanceId(res.data.instanceId));
    dispatch(userSetSettings(res.data.settings));
    dispatch(userLogin());
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    localStorage.setItem('userSettings', JSON.stringify(res.data.settings));
  }
  catch (error) {
    dispatch(appSetFormError('errors.loginError'));
    console.error(error);
  }

  return dispatch(appStopLoading());
};

export const renewAccessToken: ActionCreator<
  ThunkAction<
    Promise<AppStopLoadingAction>,
    null,
    null,
    AppStopLoadingAction
  >
> = (): any => async (dispatch: Dispatch, getState: any): Promise<AppStopLoadingAction> => {
  dispatch(appStartLoading());

  try {
    const refreshToken = localStorage.getItem('refreshToken');

    const localAxios = axios.create({
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    });

    const res: any = await localAxios.post('/api/auth/token');

    dispatch(userSetInstanceId(res.data.instanceId));

    if (res.status === 200 && res.data && res.data.user) {
      localStorage.setItem('accessToken', res.data.accessToken);
      dispatch(userSetInfo(res.data.user));
      dispatch(userLogin());
    }
  }
  catch (error) {
    console.error(error);
    dispatch(userLogout());
  }

  return dispatch(appStopLoading());
};

export const logoutUser: ActionCreator<
  ThunkAction<
    Promise<AppStopLoadingAction>,
    null,
    null,
    AppStopLoadingAction
  >
> = (): any => async (dispatch: Dispatch, getState: any): Promise<AppStopLoadingAction> => {
  dispatch(appStartLoading());

  try {
    const refreshToken = localStorage.getItem('refreshToken');

    const localAxios = axios.create({
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    });

    const res: any = await localAxios.post('/api/auth/logout');

    if (res.status === 204) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userSettings');
      dispatch(userLogout());
    }
  }
  catch (error) {
    console.error(error);
    dispatch(userLogout());
  }

  return dispatch(appStopLoading());
};

export const updateUserSelf: ActionCreator<
  ThunkAction<
    Promise<AppStopLoadingAction>,
    null,
    null,
    AppStopLoadingAction
  >
> = (user: ModelCreateUpdate): any => async (dispatch: Dispatch, getState: any): Promise<AppStopLoadingAction> => {
  dispatch(appStartLoading());
  dispatch(appSetError(''));

  try {
    const res: any = await axios.put('/api/auth/users/self', user);
    dispatch(userSetInfo(res.data.user));
  }
  catch (error) {
    if (error.response.status === 409) {
      dispatch(appSetError('errors.usernameAlreadyExists'));
    }
    else {
      dispatch(appSetError('errors.anErrorOccurred'));
      console.error(error);
    }
  }

  return dispatch(appStopLoading());
};

export const updateOwnPassword: ActionCreator<
  ThunkAction<
    Promise<AppStopLoadingAction>,
    null,
    null,
    AppStopLoadingAction
  >
> = (passwordInfo: PasswordChange): any => async (dispatch: Dispatch, getState: any): Promise<AppStopLoadingAction> => {
  dispatch(appStartLoading());
  dispatch(appSetError(''));

  try {
    await axios.patch('/api/auth/users/self/password', passwordInfo);
  }
  catch (error) {
    if (error.response.status === 406) {
      dispatch(appSetError('errors.oldPasswordIncorrect'));
    }
    else {
      dispatch(appSetError('errors.anErrorOccurred'));
      console.error(error);
    }
  }

  return dispatch(appStopLoading());
};

export const saveUserSettings: ActionCreator<
  ThunkAction<
    Promise<AppStopLoadingAction>,
    null,
    null,
    AppStopLoadingAction
  >
> = (settings: SerializedModelSettings): any => async (dispatch: Dispatch, getState: any): Promise<AppStopLoadingAction> => {
  dispatch(appStartLoading());
  dispatch(appSetError(''));

  try {
    const res = await axios.put('/api/auth/users/settings', settings);
    dispatch(userSetSettings(res.data.settings));
    localStorage.setItem('userSettings', JSON.stringify(res.data.settings));
  }
  catch (error) {
    dispatch(appSetError('errors.anErrorOccurred'));
    console.error(error);
  }

  return dispatch(appStopLoading());
};
