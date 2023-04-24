import {
  assert,
  expect, request, use,
} from 'chai';
import chaiHttp from 'chai-http';
import { ObjectId } from 'mongodb';
import { randomBytes } from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import {re} from "@babel/core/lib/vendor/import-meta-resolve";

use(chaiHttp);
const url = 'http://0.0.0.0:5000';

describe('filesContoller tests', async () => {
  const user = {
    email: 'holberton@school.com',
    password: 'helloC#16',
  };

  const file = {
    name: 'myTest.txt',
    type: 'file',
    data: 'SGVsbG8gV2Vic3RhY2shCg==',
  };

  const folder = {
    name: 'images',
    type: 'folder',
  };

  let token;

  beforeEach(async () => {
    await new dbClient.constructor();
    await request(url).post('/users').send(user);

    const authValue = 'Basic aG9sYmVydG9uQHNjaG9vbC5jb206aGVsbG9DIzE2';
    const connectResponse = await request(url).get('/connect').set('authorization', authValue).send();
    token = connectResponse.body.token;
  });

  afterEach(async () => {
    await dbClient.db.collection('users').deleteOne({ email: user.email });
    await redisClient.del(`auth_${token}`);
  });

  describe('[POST] /files route', () => {
    it('should create a text file without isPublic and parentId', async () => {
      const meResponse = await request(url).get('/users/me').set('x-token', token).send();

      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body).to.have.property('id');
      expect(createFile.body.userId).to.deep.equal(meResponse.body.id);
      expect(createFile.body.name).to.deep.equal(file.name);
      expect(createFile.body.type).to.deep.equal(file.type);
      expect(createFile.body.isPublic).to.deep.equal(false);
      expect(createFile.body.parentId).to.deep.equal(0);

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(createFile.body.id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(createFile.body.id) });
      expect(findFile).equals(null);
    });

    it('should return an error if name missing', async () => {
      const file = {
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body).to.deep.equal({ error: 'Missing name' });
    });

    it('should return an error if type missing', async () => {
      const file = {
        name: 'myTest.txt',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body).to.deep.equal({ error: 'Missing type' });
    });

    it('should return an error if data missing', async () => {
      const file = {
        name: 'myTest.txt',
        type: 'file',
      };

      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body).to.deep.equal({ error: 'Missing data' });
    });

    it('should create a folder', async () => {
      const meResponse = await request(url).get('/users/me').set('x-token', token).send();

      const createFolder = await request(url).post('/files').set('x-token', token).send(folder);
      expect(createFolder.body).to.have.property('id');
      expect(createFolder.body.userId).to.deep.equal(meResponse.body.id);
      expect(createFolder.body.name).to.deep.equal(folder.name);
      expect(createFolder.body.type).to.deep.equal(folder.type);
      expect(createFolder.body.isPublic).to.deep.equal(false);
      expect(createFolder.body.parentId).to.deep.equal(0);

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(createFolder.body.id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(createFolder.body.id) });
      expect(findFile).equals(null);
    });

    it('should create a file in a folder', async () => {
      const meResponse = await request(url).get('/users/me').set('x-token', token).send();

      const createFolder = await request(url).post('/files').set('x-token', token).send(folder);

      const file = {
        name: 'myTest.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId: createFolder.body.id,
      };
      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body).to.have.property('id');
      expect(createFile.body.userId).to.deep.equal(meResponse.body.id);
      expect(createFile.body.name).to.deep.equal(file.name);
      expect(createFile.body.type).to.deep.equal(file.type);
      expect(createFile.body.isPublic).to.deep.equal(false);
      expect(createFile.body.parentId).to.deep.equal(createFolder.body.id);

      const idsToDelete = [ObjectId(createFile.body.id), ObjectId(createFolder.body.id)];
      await dbClient.db.collection('files').deleteMany({ _id: { $in: idsToDelete } });

      const findFile = await dbClient.db.collection('files').find({ _id: { $in: idsToDelete } }).toArray();
      expect(findFile.length).equals(0);
    });

    it('should return an error if parentId is not a folder', async () => {
      const firstFile = {
        name: '1-myTest.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };
      const createFirstFile = await request(url).post('/files').set('x-token', token).send(firstFile);

      const secondFile = {
        name: '2-myTest.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId: createFirstFile.body.id,
      };
      const createSecondFile = await request(url).post('/files').set('x-token', token).send(secondFile);
      expect(createSecondFile.body).to.deep.equal({ error: 'Parent is not a folder' });

      const idsToDelete = [ObjectId(createFirstFile.body.id), ObjectId(createSecondFile.body.id)];
      await dbClient.db.collection('files').deleteMany({ _id: { $in: idsToDelete } });

      const findFile = await dbClient.db.collection('files').find({ _id: { $in: idsToDelete } }).toArray();
      expect(findFile.length).equals(0);
    });

    it('should return an error if parentId is not found', async () => {
      const errorParentId = randomBytes(12).toString('hex');
      const file = {
        name: 'myTest.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId: errorParentId,
      };
      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body).to.deep.equal({ error: 'Parent not found' });

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(createFile.body.id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(createFile.body.id) });
      expect(findFile).equals(null);
    });
  });

  describe('[GET] /files/:id route', () => {
    it('should return the file corresponding to the id passed', async () => {
      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      const { id } = createFile.body;

      const retrieveFile = await request(url).get(`/files/${id}`).set('x-token', token).send();
      expect(retrieveFile.body.id).equals(createFile.body.id);

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(createFile.body.id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(createFile.body.id) });
      expect(findFile).equals(null);
    });

    it('should return an error if id passed not found', async () => {
      const errorId = randomBytes(12).toString('hex');
      const retrieveFile = await request(url).get(`/files/${errorId}`).set('x-token', token).send();
      expect(retrieveFile.body).to.deep.equal({ error: 'Not found' });
    });
  });

  describe('[GET] /files route', () => {
    it('should return all files', async () => {
      const retrieveAllFiles = await request(url).get('/files').set('x-token', token).send();
      assert.operator(retrieveAllFiles.body.length, '<=', 20);
    });

    it('should return all files of a specific page', async () => {
      const files = await dbClient.db.collection('files').find().toArray();
      const totalFiles = files.length;
      const limitByPage = 20;
      const totalPages = Math.floor(totalFiles / limitByPage);
      const nbFilesInLastPage = totalFiles % limitByPage;

      const retrieveFilesOnLastPage = await request(url).get(`/files?page=${totalPages}`).set('x-token', token).send();
      expect(retrieveFilesOnLastPage.body.length).equals(nbFilesInLastPage);
      assert.operator(retrieveFilesOnLastPage.body.length, '<=', 20);
    });

    it('should return all files corresponding to the parentId of a folder', async () => {
      const createFolder = await request(url).post('/files').set('x-token', token).send(folder);

      const firstFile = {
        name: '1-project.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId: createFolder.body.id,
      };
      const secondFile = {
        name: '2-project.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId: createFolder.body.id,
      };
      const createFirstFile = await request(url).post('/files').set('x-token', token).send(firstFile);
      const createSecondFile = await request(url).post('/files').set('x-token', token).send(secondFile);

      const parentId = createFolder.body.id;
      const retrieveFilesOfFolder = await request(url).get(`/files?parentId=${parentId}`).set('x-token', token).send();
      expect(retrieveFilesOfFolder.body.length).equals(2);
      expect(retrieveFilesOfFolder.body[0].id).equals(createFirstFile.body.id);
      expect(retrieveFilesOfFolder.body[1].id).equals(createSecondFile.body.id);

      const idsToDelete = [
        ObjectId(createFirstFile.body.id),
        ObjectId(createSecondFile.body.id),
        ObjectId(createFolder.body.id)];
      await dbClient.db.collection('files').deleteMany({ _id: { $in: idsToDelete } });

      const findFile = await dbClient.db.collection('files').find({ _id: { $in: idsToDelete } }).toArray();
      expect(findFile.length).equals(0);
    });
  });

  describe('[PUT] /files/:id/publish route', () => {
    it('should update isPublic to true', async () => {
      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body.isPublic).equals(false);

      const { id } = createFile.body;
      const publishFile = await request(url).put(`/files/${id}/publish`).set('x-token', token).send();
      expect(publishFile.body.isPublic).equals(true);

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
      expect(findFile).equals(null);
    });

    it('should return an error if id passed is not found', async () => {
      const id = randomBytes(12).toString('hex');
      const publishFile = await request(url).put(`/files/${id}/publish`).set('x-token', token).send();
      expect(publishFile.body).to.deep.equal({ error: 'Not found' });
    });
  });

  describe('[PUT] /files/:id/unpublish route', () => {
    it('should update isPublic to false', async () => {
      const file = {
        name: 'myTest.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: true,
      };
      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body.isPublic).equals(true);

      const { id } = createFile.body;
      const unpublishFile = await request(url).put(`/files/${id}/unpublish`).set('x-token', token).send();
      expect(unpublishFile.body.isPublic).equals(false);

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
      expect(findFile).equals(null);
    });

    it('should return an error if id passed is not found', async () => {
      const id = randomBytes(12).toString('hex');
      const unpublishFile = await request(url).put(`/files/${id}/unpublish`).set('x-token', token).send();
      expect(unpublishFile.body).to.deep.equal({ error: 'Not found' });
    });
  });

  describe('[GET] /files/:id/data', () => {
    it('should display the content of a file if isPublic is true without token', async () => {
      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body.isPublic).equals(false);

      const { id } = createFile.body;
      const publishFile = await request(url).put(`/files/${id}/publish`).set('x-token', token).send();
      expect(publishFile.body.isPublic).equals(true);

      const readData = await request(url).get(`/files/${id}/data`).send();
      expect(readData.text).equals('Hello Webstack!\n');

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
      expect(findFile).equals(null);
    });

    it('should return an error if would like to display the content of a file when isPublic is false without token', async () => {
      const createFile = await request(url).post('/files').set('x-token', token).send(file);
      expect(createFile.body.isPublic).equals(false);

      const { id } = createFile.body;
      const readData = await request(url).get(`/files/${id}/data`).send();
      expect(readData.body).to.deep.equal({ error: 'Not found' });

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
      expect(findFile).equals(null);
    });

    it('should return an error if would like to display the content of a folder', async () => {
      const createFolder = await request(url).post('/files').set('x-token', token).send(folder);
      expect(createFolder.body.type).equals('folder');

      const { id } = createFolder.body;
      const publishFolder = await request(url).put(`/files/${id}/publish`).set('x-token', token).send();
      expect(publishFolder.body.isPublic).equals(true);

      const readData = await request(url).get(`/files/${id}/data`).send();
      expect(readData.body).to.deep.equal({ error: "A folder doesn't have content" });

      await dbClient.db.collection('files').deleteOne({ _id: ObjectId(id) });

      const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
      expect(findFile).equals(null);
    });
  });
});
