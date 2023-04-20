import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UNAUTHORIZED = 'Unauthorized';
const MISSINGEMAIL = 'Missing email';
const MISSINGPASSWORD = 'Missing password';

const USERSCOLLECTION = 'users';

const TOKEN = 'x-token';

export default class UserController {
  static async postNew(request, response) {
    const { email, password } = request.body;
    if (!email) response.status(400).send({ error: MISSINGEMAIL });
    else if (!password) response.status(400).send({ error: MISSINGPASSWORD });
    else if (await dbClient.db.collection(USERSCOLLECTION).findOne({ email })) response.status(400).send({ error: 'Already exist' });
    else {
      const user = { email, password: sha1(password) };
      const result = await dbClient.db.collection(USERSCOLLECTION).insertOne(user);
      response.status(201).send({ id: result.insertedId, email });
    }
  }

  static async getMe(request, response) {
    const xToken = request.headers[TOKEN];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId)response.status(401).send({ error: UNAUTHORIZED });
    else {
      const user = await dbClient.db.collection(USERSCOLLECTION).findOne({ _id: ObjectId(userId) });
      if (!user) response.status(401).send({ error: UNAUTHORIZED });
      else response.status(200).send({ id: user._id, email: user.email });
    }
  }
}
