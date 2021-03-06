import sequelizeFixtures from 'sequelize-fixtures';

import usersFixture from '@mc/modules/auth/fixtures/users';
import User from '@mc/modules/auth/models/User';

import fixture from '../fixtures/folders';

import Folder from './Folder';

const { data } = fixture;

describe('Folder Model', () => {
  beforeAll((): Promise<void> =>
    sequelizeFixtures.loadFixtures(
      [usersFixture, fixture],
      { User, Folder }
    )
  );

  test('Exists', () => {
    expect(Folder).toBeDefined();
  });

  test('Model is writable and readable', async () => {
    const newUser = await Folder.create(data);

    const testModel = await Folder.findByPk(newUser.id, { raw: true });

    expect(testModel).toBeDefined();
    expect(testModel.name).toEqual(data.name);
  });

  test('Model is updateable', async () => {
    const newName = 'Franz';
    const testModel = await Folder.findByPk(1);

    expect(testModel).toBeDefined();

    testModel.update({
      name: newName
    });

    expect(testModel.name).toEqual(newName);
  });
});
