import sha1 from 'sha1';
import dbClient from '../utils/db';

export default class UserController {
  static async postNew(request, response) {
    const { email, password } = request.body;
    if (!email) response.status(400).send({ error: 'Missing email' });
    else if (!password) response.status(400).send({ error: 'Missing password' });
    else if (await dbClient.db.collection('users').findOne({ email })) response.status(400).send({ error: 'Already exist' });
    else {
      const user = {
        email,
        password: sha1(password),
      };
      const result = await dbClient.db.collection('users').insertOne(user);
      response.status(201).send({ id: result.insertedId, email });
    }
  }
}
