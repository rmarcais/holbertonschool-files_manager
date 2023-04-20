import Bull from 'bull';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { fileId } = job.data;
  const { userId } = job.data;
  if (!fileId) throw Error('Missing fileId');
  if (!userId) throw Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ fileId, userId });
  if (!file) throw Error('File not found');

  const allWidth = [100, 250, 500];
  const path = file.localPath;

  const thumbnail100 = await imageThumbnail(path, { width: allWidth[0] });
  fs.writeFileSync(`${path}_${allWidth[0]}`, thumbnail100);

  const thumbnail250 = await imageThumbnail(path, { width: allWidth[1] });
  fs.writeFileSync(`${path}_${allWidth[1]}`, thumbnail250);

  const thumbnail500 = await imageThumbnail(path, { width: allWidth[2] });
  fs.writeFileSync(`${path}_${allWidth[2]}`, thumbnail500);
});
