import { expect, assert } from 'chai';
import dbClient from '../utils/db';

describe('dbClient tests', () => {
  before(async () => {
    await new dbClient.constructor();
  });

  describe('nbUsers method', () => {
    it('should return the number of users in the database mongodb', async () => {
      const users = await dbClient.nbUsers();
      assert.isNumber(users);
      assert.operator(users, '>=', 0);
    });
  });

  describe('nbFiles method', () => {
    it('should return the number of files in the database mongodb', async () => {
      const files = await dbClient.nbFiles();
      assert.isNumber(files);
      assert.operator(files, '>=', 0);
    });
  });

  describe('isAlive method', () => {
    it('should return true if connected to the database mongodb', async () => {
      const connected = await dbClient.isAlive();
      expect(connected).equals(true);
    });

    it('should return false if not connected to the database mongodb', async () => {
      dbClient.db = null;
      const disconnected = await dbClient.isAlive();
      expect(disconnected).equals(false);
    });
  });
});
