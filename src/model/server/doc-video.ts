import { OBJIOItem, SERIALIZER } from 'objio';
import { VideoFileObject } from 'objio-object/client/video-file-object';

export class DocVideo extends OBJIOItem {
  protected video: VideoFileObject;
  
  constructor(video: VideoFileObject) {
    super();
    this.video = video;
  }

  getExt(): string {
    return this.video.getExt();
  }

  getState() {
    return this.video.getState();
  }

  getPath() {
    return this.video.getPath();
  }

  getName() {
    return this.video.getName();
  }

  getSize() {
    return this.video.getSize();
  }

  getMIME() {
    return this.video.getMIME();
  }

  getLoadSize() {
    return this.video.getLoadSize();
  }

  static TYPE_ID = 'DocVideo';
  static SERIALIZE: SERIALIZER = () => ({
    video: { type: 'object' }
  });
}
