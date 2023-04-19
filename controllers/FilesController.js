import fs from 'fs';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class FilesController {
  static async postUpload(request, response) {
    const xToken = request.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic, data,
    } = request.body;
    const validTypes = ['folder', 'file', 'image'];
    if (!name) return response.status(400).send({ error: 'Missing name' });
    if (!type || !validTypes.includes(type)) return response.status(400).send({ error: 'Missing type' });
    if (!data && type !== 'folder') return response.status(400).send({ error: 'Missing data' });
    if (parentId) {
      if (!await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) })) return response.status(400).send({ error: 'Parent not found' });
      if (!await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId), type: 'folder' })) return response.status(400).send({ error: 'Parent is not a folder' });
    }
    if (type === 'folder') {
      const document = {
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: 0,
      };
      const result = await dbClient.db.collection('files').insertOne(document);
      response.status(201).send({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: 0,
      });
    } else {
      let localPath = process.env.FOLDER_PATH || '/tmp/files_manager/';
      const filename = uuidv4();
      const clearData = Buffer.from(data, 'base64').toString('utf-8');
      try {
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath);
        }
        localPath += filename;
        fs.appendFile(localPath, clearData, (err) => {
          if (err) throw err;
        });
      } catch (error) {
        console.log(error);
      }
      const document = {
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: parentId || 0,
        localPath,
      };
      const result = await dbClient.db.collection('files').insertOne(document);
      response.status(201).send({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: parentId || 0,
      });
    }
    return response.send();
  }

  static async getShow(request, response) {
    const xToken = request.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const fileId = request.params.id;
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });
    if (!file) return response.status(404).send({ error: 'Not found' });

    return response.status(200).send({
      id: file._id.toString(),
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(request, response) {
    const xToken = request.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized1' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const parentId = request.query.parentId || 0;
    const page = request.query.page || 0;

    const limit = 20;
    const skip = page * limit;
    const filesList = await dbClient.db.collection('files').aggregate([
      { $match: { parentId, userId } },
      { $skip: skip },
      { $limit: limit },
    ]).toArray();
    return response.status(200).send(filesList);
  }

  static async putPublish(request, response) {
    const xToken = request.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const fileId = request.params.id;
    const query = { _id: ObjectId(fileId), userId };
    const file = await dbClient.db.collection('files').findOne(query);
    if (!file) return response.status(404).send({ error: 'Not found' });

    const updateValue = { $set: { isPublic: true } };
    dbClient.db.collection('files').updateOne(query, updateValue, (error) => {
      if (error) throw error;
    });

    return response.status(200).send({
      id: file._id.toString(),
      userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  static async putUnPublish(request, response) {
    const xToken = request.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const fileId = request.params.id;
    const query = { _id: ObjectId(fileId), userId };
    const file = await dbClient.db.collection('files').findOne(query);
    if (!file) return response.status(404).send({ error: 'Not found' });

    const updateValue = { $set: { isPublic: false } };
    dbClient.db.collection('files').updateOne(query, updateValue, (error) => {
      if (error) throw error;
    });

    return response.status(200).send({
      id: file._id.toString(),
      userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }

  static async getFile(request, response) {
    const fileId = request.params.id;
    const query = { _id: ObjectId(fileId) };
    const file = await dbClient.db.collection('files').findOne(query);

    if (!file) return response.status(404).send({ error: 'Not found4' });

    if (!file.isPublic) {
      const xToken = request.headers['x-token'];
      const userId = await redisClient.get(`auth_${xToken}`);
      if (!userId) return response.status(404).send({ error: 'Not found' });
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user || user._id.toString() !== file.userId) return response.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') return response.status(400).send({ error: "A folder doesn't have content" });

    if (!fs.existsSync(file.localPath)) return response.status(404).send({ error: 'Not found' });

    const mimeType = mime.lookup(file.name);
    response.setHeader('Content-Type', mimeType);
    const data = fs.readFileSync(file.localPath, 'utf8');

    return response.status(200).send(data);
  }
}
