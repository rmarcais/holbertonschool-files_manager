import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('redisClient tests', () => {
  describe('constructor', () => {
    it('should create a Redis client instance', () => {
      expect(redisClient.client).to.exist;
      expect(redisClient.client.constructor.name).equals('RedisClient');
    });
  });

  describe('isAlive method', () => {
    it('should return true if connected to Redis server', () => {
      redisClient.client.on('connect', () => {
        expect(redisClient.isAlive()).equals(true);
      });
    });
  });

  describe('set and get method', () => {
    it('should return the Redis key', async () => {
      const key = '1-test-key';
      const value = '1-test-value';

      await redisClient.set(key, value, 5);
      const getValue = await redisClient.get(key);
      expect(getValue).equals(value);
    });
  });

  describe('del method', () => {
    it('should delete the Redis key', async () => {
      const key = '2-test-key';
      const value = '2-test-value';

      await redisClient.set(key, value, 5);
      await redisClient.del(key);

      const getValue = await redisClient.get(key);
      expect(getValue).equals(null);
    });
  });
});
