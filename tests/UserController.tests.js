import {
  expect, request, use,
} from 'chai';
import chaiHttp from 'chai-http';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

use(chaiHttp);
const url = 'http://0.0.0.0:5000';

describe('userController tests', () => {
  describe('[POST] /users', () => {
    const user = {
      email: 'holberton@school.com',
      password: 'helloC#16',
    };

    beforeEach(async () => {
      await new dbClient.constructor();
    });

    afterEach(async () => {
      await dbClient.db.collection('users').deleteOne({ email: user.email });
    });

    it('should return id and email of user created', async () => {
      const response = await request(url).post('/users').send(user);
      expect(response.body.email).to.deep.equal(user.email);
      expect(response.body).to.have.property('id');
    });

    it('should create the user in db', async () => {
      const response = await request(url).post('/users').send(user);
      const userId = { _id: ObjectId(response.body.id) };
      const findUser = await dbClient.db.collection('users').findOne(userId);
      expect(findUser).to.exist;
      expect(response.body.id).equal(findUser._id.toString());
    });

    it('should return an error if email missing', async () => {
      const user = { password: 'helloC#16' };
      const response = await request(url).post('/users').send(user);
      expect(response.body).to.deep.equal({ error: 'Missing email' });
    });

    it('should return an error if password missing', async () => {
      const user = { email: 'holberton@school.com' };
      const response = await request(url).post('/users').send(user);
      expect(response.body).to.deep.equal({ error: 'Missing password' });
    });

    it('should return an error if user already exist', async () => {
      await request(url).post('/users').send(user);
      const response = await request(url).post('/users').send(user);
      expect(response.body).to.deep.equal({ error: 'Already exist' });
    });
  });
});
