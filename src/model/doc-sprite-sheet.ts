import { SERIALIZER, OBJIOItem, OBJIOArray } from 'objio';
import { Point, Size, Rect, inRect } from '../common/point';
import { FileObject } from 'objio-object/client/file-object';
import { ObjectBase } from 'objio-object/client/object-base';

export interface DocSpriteSheetArgs {
  source?: FileObject;
}

export interface FrameInfo {
  rect: number;
  baseX: number;
  baseY: number;
}

export class Animation extends OBJIOItem {
  name: string = 'default';
  frames = Array<FrameInfo>();

  constructor(name?: string, frames?: Array<FrameInfo>) {
    super();
    this.name = name || this.name;
    this.frames = frames || this.frames;
  }

  getSize(rects: Array<Rect>): Size {
    let size: Size = { width: 0, height: 0 };
    this.frames.forEach(frame => {
      size.width = Math.max(rects[frame.rect].width, size.width);
      size.height = Math.max(rects[frame.rect].height, size.height);
    });
    return size;
  }

  static TYPE_ID = 'Animation';
  static SERIALIZE: SERIALIZER = () => ({
    name:   { type: 'string' },
    frames: { type: 'json' }
  });
}

export class DocSpriteSheet extends ObjectBase {
  private file: FileObject;
  private rects = Array<Rect>();
  private anim = new OBJIOArray<Animation>([new Animation('default', [])]);

  constructor(args?: DocSpriteSheetArgs) {
    super();

    if (!args)
      return;

    this.file = args.source;
  }

  getImageUrl(): string {
    if (!this.file)
      return '';

    return this.file.getPath();
  }

  getRects(): Array<Rect> {
    return this.rects;
  }

  getAnim(): OBJIOArray<Animation> {
    return this.anim;
  }

  hitTest(point: Point): number {
    return this.rects.findIndex(rect => inRect(rect, point));
  }

  static TYPE_ID = 'DocSpriteSheet';
  static SERIALIZE: SERIALIZER = () => ({
    ...ObjectBase.SERIALIZE(),
    file: {type: 'object'},
    rects: {type: 'json'},
    anim: {type: 'object'}
  });
}
