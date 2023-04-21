import {
  expect, request, use,
} from 'chai';
import chaiHttp from 'chai-http';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

use(chaiHttp);
const url = 'http://0.0.0.0:5000';

describe('authController tests', () => {
  describe('[GET] /connect route', () => {
    const user = {
      email: 'holberton@school.com',
      password: 'helloC#16',
    };

    beforeEach(async () => {
      await new dbClient.constructor();
      await request(url).post('/users').send(user);
    });

    afterEach(async () => {
      await dbClient.db.collection('users').deleteOne({ email: user.email });
    });

    it('should return a token if find user', async () => {
      const authValue = 'Basic aG9sYmVydG9uQHNjaG9vbC5jb206aGVsbG9DIzE2';
      const response = await request(url).get('/connect').set('authorization', authValue).send();
      expect(response.body).to.have.property('token');
      expect(response.statusCode).equals(200);
    });

    it('should return an error if user not find', async () => {
      const errorAuthValue = 'Basic aG9sYmVydG9uQHNjaG9vbC5jb206aGVsbG9DIzE3';
      const response = await request(url).get('/connect').set('authorization', errorAuthValue).send();
      expect(response.body).to.deep.equal({ error: 'Unauthorized' });
      expect(response.statusCode).equals(401);
    });
  });
});
