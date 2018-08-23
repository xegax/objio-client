import { createFactory, OBJIOFactory } from 'objio';
import { createOBJIOServer } from 'objio/server';
import { registerObjects } from '../model/server/register-objects';

async function runDocServer() {
  const factory: OBJIOFactory = await createFactory();
  registerObjects(factory);

  createOBJIOServer({
    factory,
    prjsDir: 'data/projects'
  });
}

console.log(process.env['FFMPEG']);
runDocServer();
