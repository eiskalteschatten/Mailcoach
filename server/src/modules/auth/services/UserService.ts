import bcrypt from 'bcryptjs';
import config from 'config';
import jwt from 'jsonwebtoken';
import { v1 as uuidv1 } from 'uuid';

import { HttpError } from '@mc/lib/Error';

import { serialize } from '../serializer/user';
import { ModelCreateUpdate, PasswordChange } from '../interfaces/User';
import { User } from '../models/User';
import UserSession from '../models/UserSession';
import UserSetting from '../models/UserSetting';

export default class UserService {
  private readonly saltRounds = 12;
  private readonly accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
  private instanceId: string;
  private user: User;

  getUser(): User {
    return this.user;
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  async setUser(identifier: number | string): Promise<User> {
    if (typeof identifier === 'number') {
      await this.getUserById(identifier);
    }
    else {
      await this.getUserByUsername(identifier);
    }

    return this.user;
  }

  generatePassword(): string {
    return uuidv1();
  }

  async register(registerData: ModelCreateUpdate): Promise<User> {
    const {
      username,
      firstName,
      lastName,
      avatar
    } = registerData;

    const password = registerData.password || this.generatePassword();
    const status = registerData.status || 'pending';

    const existingUser: User = await User.findOne({ where: { username } });

    if (existingUser) {
      throw new HttpError('Could not create user because a user with this username already exists!', 409);
    }

    if (!username || !firstName || !lastName) {
      throw new HttpError('Could not create user because a field was missing!', 400);
    }

    const newAvatar = avatar || config.get<string>('users.defaultAvatar');

    const hash: string = await bcrypt.hash(password, this.saltRounds);

    const userModel: User = await User.create({
      ...registerData,
      avatar: newAvatar,
      password: hash,
      lastLogin: new Date(),
      status
    });

    const defaultUserSettings = config.get<any>('users.defaultSettings');

    await UserSetting.create({
      ...defaultUserSettings,
      fkUser: userModel.id
    });

    await this.getUserById(userModel.id);
    return this.user;
  }

  async localLogin(username: string, password: string): Promise<boolean> {
    await this.getUserByUsername(username);
    const hasValidPassword: boolean = await this.validatePassword(password);

    if (!hasValidPassword) {
      throw new HttpError('Invalid credentials', 401);
    }

    await this.updateUser(this.user.id, {
      lastLogin: new Date()
    });

    return !!this.user;
  }

  async localLogout(instanceId?: string): Promise<void> {
    const where = {
      fkUser: this.user.id
    };

    if (instanceId) {
      where['instanceId'] = instanceId;
    }

    await UserSession.destroy({ where });
    this.user = null;
  }

  async generateAccessToken(id?: number): Promise<string> {
    if (!this.accessTokenSecret) {
      throw new HttpError('There was a problem generating an access token for the user!', 500);
    }

    if (id) {
      await this.getUserById(id);
    }

    const ttl = config.get<number>('jwt.accessToken.ttl');
    const serializedUser = serialize(this.user);

    return jwt.sign({
      ...serializedUser
    },
    this.accessTokenSecret,
    {
      expiresIn: `${ttl}s`
    });
  }

  async generateRefreshToken(id?: number): Promise<string> {
    if (!this.refreshTokenSecret) {
      throw new HttpError('There was a problem generating a refresh token for the user!', 500);
    }

    if (id) {
      await this.getUserById(id);
    }

    const ttl = config.get<number>('jwt.refreshToken.ttl');
    this.instanceId = uuidv1();

    const refreshToken = jwt.sign({
      id: this.user.id,
      instanceId: this.instanceId
    },
    this.refreshTokenSecret,
    {
      expiresIn: `${ttl}s`
    });

    await UserSession.create({
      fkUser: this.user.id,
      refreshToken,
      instanceId: this.instanceId
    });

    return refreshToken;
  }

  async jwtLogin(id: number): Promise<boolean> {
    await this.getUserById(id);
    return !!this.user;
  }

  async getUserSettings(): Promise<UserSetting> {
    const settings = await UserSetting.findOne({
      where: {
        fkUser: this.user.id
      }
    });

    return settings;
  }

  async updateUser(id: number, updatedUser: ModelCreateUpdate): Promise<void> {
    if (updatedUser.username) {
      const existingUser: User = await User.findOne({ where: { username: updatedUser.username } });

      if (existingUser && existingUser.id !== id) {
        throw new HttpError('Could not create user because a user with this username already exists!', 409);
      }
    }

    await this.getUserById(id);
    await this.user.update(updatedUser);
  }

  async updatePassword(id: number, data: PasswordChange): Promise<void> {
    await this.getUserById(id);
    const isValid: boolean = await this.validatePassword(data.currentPassword);

    if (!isValid) {
      throw new HttpError('Could not change the user\'s password because the old password is incorrect!', 406);
    }

    if (!this.isPasswordVaild(data.newPassword)) {
      throw new HttpError('The password does not meet the password requirements!', 406);
    }

    this.user.password = await bcrypt.hash(data.newPassword, this.saltRounds);
    await this.user.save();
  }

  async updatePasswordWithoutOldPassword(id: number, data: PasswordChange): Promise<void> {
    if (!this.isPasswordVaild(data.newPassword)) {
      throw new HttpError('The password does not meet the password requirements!', 406);
    }

    await this.getUserById(id);

    this.user.password = await bcrypt.hash(data.newPassword, this.saltRounds);
    await this.user.save();
  }

  isPasswordVaild(password: string): boolean {
    // At least 8 characters, one lowercase and one uppercase letter, one number and one symbol
    const strongRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})');
    return strongRegex.test(password);
  }

  async checkCanUpdatePasswordWithoutOldPassword(id: number): Promise<boolean> {
    await this.getUserById(id);
    return this.user.status === 'pending';
  }

  private async validatePassword(password: string): Promise<boolean> {
    if (!this.user) {
      return false;
    }

    const isValid: boolean = await bcrypt.compare(password, this.user.password);
    return isValid;
  }

  async deleteUser(userId: number): Promise<void> {
    await UserSession.destroy({ where: { fkUser: userId } });
    await UserSetting.destroy({ where: { fkUser: userId } });
    await User.destroy({ where: { id: userId } });
  }

  private async getUserByUsername(username: string): Promise<void> {
    if (this.user) {
      await this.refreshUser();
    }
    else {
      this.user = await User.findOne({ where: { username } });
    }
  }

  private async getUserById(id: number): Promise<void> {
    if (this.user) {
      await this.refreshUser();
    }
    else {
      this.user = await User.findByPk(id);
    }
  }

  async getAllUsers(): Promise<User[]> {
    const users = await User.findAll();
    return users;
  }

  async refreshUser(): Promise<void> {
    if (!this.user) {
      throw new HttpError('Cannot refresh an undefined user!', 500);
    }

    this.user = await User.findByPk(this.user.id);
  }
}
