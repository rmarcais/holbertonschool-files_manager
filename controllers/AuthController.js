import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UNAUTHORIZED = 'Unauthorized';

const USERSCOLLECTION = 'users';

const TOKEN = 'x-token';

export default class AuthController {
  static async getConnect(request, response) {
    const auth = request.headers.authorization;
    const extractAuth = auth.split('Basic ')[1];
    const decodeAuth = Buffer.from(extractAuth, 'base64').toString('utf-8');
    const extractUser = decodeAuth.split(':');
    const user = { email: extractUser[0], password: sha1(extractUser[1]) };

    const getUser = await dbClient.db.collection(USERSCOLLECTION).findOne(user);
    if (!getUser) {
      response.status(401).send({ error: UNAUTHORIZED });
    } else {
      const token = uuidv4();
      await redisClient.set(`auth_${token}`, getUser._id.toString(), 24 * 60 * 60);
      response.status(200).send({ token });
    }
  }

  static async getDisconnect(request, response) {
    const xToken = request.headers[TOKEN];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) response.status(401).send({ error: UNAUTHORIZED });
    else {
      await redisClient.del(`auth_${xToken}`);
      response.status(204).send();
    }
  }
}
