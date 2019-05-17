import { createFactory, OBJIOFactory } from 'objio';
import { createOBJIOServer } from 'objio/server';
import { registerObjects } from '../model/server/register-objects';
import * as Bluebird from 'bluebird';
import * as process from 'process';

Bluebird.config({ cancellation: true });
global.Promise = Bluebird;

async function runDocServer() {
  const factory: OBJIOFactory = await createFactory();
  registerObjects(factory);

  createOBJIOServer({
    factory,
    rootDir: 'data'
  });
}

console.log(process.env['FFMPEG']);
runDocServer();
