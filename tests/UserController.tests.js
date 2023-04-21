import {
  expect, request, use,
} from 'chai';
import chaiHttp from 'chai-http';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

use(chaiHttp);
const url = 'http://0.0.0.0:5000';

describe('userController tests', () => {
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

  describe('[POST] /users', () => {
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

  describe('[GET] /users/me', () => {
    it('should return id and email of user authenticated', async () => {
      const createUser = await request(url).post('/users').send(user);
      const userId = { _id: ObjectId(createUser.body.id) };
      const findUser = await dbClient.db.collection('users').findOne(userId);

      const authValue = 'Basic aG9sYmVydG9uQHNjaG9vbC5jb206aGVsbG9DIzE2';
      const connectResponse = await request(url).get('/connect').set('authorization', authValue).send();
      const { token } = connectResponse.body;
      const meResponse = await request(url).get('/users/me').set('x-token', token).send();
      expect(meResponse.statusCode).equals(200);
      expect(meResponse.body).to.deep.equal({ id: findUser._id.toString(), email: findUser.email });
    });

    it('should return an error if fake token is passed', async () => {
      const errorToken = '04ced7ff-e339-4646-872d-783525fc145b';
      const response = await request(url).get('/users/me').set('x-token', errorToken).send();
      expect(response.body).to.deep.equal({ error: 'Unauthorized' });
      expect(response.statusCode).equals(401);
    });
  });
});
