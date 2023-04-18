import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from "../utils/redis";

export default class UserController {
  static async postNew(request, response) {
    const { email, password } = request.body;
    if (!email) response.status(400).send({ error: 'Missing email' });
    else if (!password) response.status(400).send({ error: 'Missing password' });
    else if (await dbClient.db.collection('users').findOne({ email })) response.status(400).send({ error: 'Already exist' });
    else {
      const user = { email, password: sha1(password) };
      const result = await dbClient.db.collection('users').insertOne(user);
      response.status(201).send({ id: result.insertedId, email });
    }
  }

  static async getMe(request, response) {
    const xToken = request.headers.get('X-Token');
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) response.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: userId });
    if (!user) response.status(401).send({ error: 'Unauthorized' });
    else response.status(200).send({ id: user._id, email: user.email });
  }
}
