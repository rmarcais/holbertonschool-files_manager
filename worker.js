import Bull from 'bull';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { fileId } = job.data;
  const { userId } = job.data;
  if (!fileId) throw Error('Missing fileId');
  if (!userId) throw Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });
  if (!file) throw Error('File not found');

  const path = file.localPath;

  try {
    const thumbnail = await imageThumbnail(path, { width: 100 });
    fs.writeFileSync(`${path}_100`, thumbnail);

    const thumbnail250 = await imageThumbnail(path, { width: 250 });
    fs.writeFileSync(`${path}_250`, thumbnail250);

    const thumbnail500 = await imageThumbnail(path, { width: 500 });
    fs.writeFileSync(`${path}_500`, thumbnail500);
  } catch (e) {
    console.log(e);
  }
});
