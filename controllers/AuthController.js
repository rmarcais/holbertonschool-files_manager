import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UNAUTHORIZED = 'Unauthorized';
const TOKEN = 'x-token';

export default class AuthController {
  static async getConnect(req, res) {
    const Authorization = req.header('Authorization') || '';

    const creds = Authorization.split(' ')[1];
    if (!creds) return res.status(401).send({ error: 'Unauthorized' });

    const decodedCreds = Buffer.from(creds, 'base64').toString('utf-8');

    const [email, pass] = decodedCreds.split(':');
    if (!email || !pass) return res.status(401).send({ error: 'Unauthorized' });

    const secPass = sha1(pass);

    const user = await dbClient.users.findOne({
      email,
      password: secPass,
    });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const expiration = 24 * 3600;

    await redisClient.set(key, user._id.toString(), expiration);

    return res.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    const xToken = request.headers[TOKEN];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return response.status(401).send({ error: UNAUTHORIZED });
    await redisClient.del(`auth_${xToken}`);
    return response.status(204).send();
  }
}
