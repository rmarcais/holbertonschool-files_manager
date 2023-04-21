import {
  expect, request, use,
} from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../utils/db';

use(chaiHttp);
const url = 'http://0.0.0.0:5000';

describe('appController tests', () => {
  describe('[GET] /status route', () => {
    it('should return a status code 200', async () => {
      const response = await request(url).get('/status').send();
      expect(response.statusCode).equals(200);
    });
    it('should return the body with connection to redis and db', async () => {
      const response = await request(url).get('/status').send();
      expect(response.body).to.deep.equal({ redis: true, db: true });
    });
  });

  describe('[GET] /stats route', () => {
    it('should return a status code 200', async () => {
      const response = await request(url).get('/stats').send();
      expect(response.statusCode).equals(200);
    });
    it('should return the body with nbUsers and nbFiles', async () => {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      const response = await request(url).get('/stats').send();
      expect(response.body).to.deep.equal({ users, files });
    });
  });
});
