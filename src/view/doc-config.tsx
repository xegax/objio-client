import * as React from 'react';
import { ObjectBase } from 'objio-object/client/object-base';

export interface Props {
  objects(): Array<ObjectBase>;
  source?: ObjectBase;
}

export abstract class DocConfig<TObjArgs extends Object = Object> extends React.Component<Partial<Props>> {
  protected config: Partial<TObjArgs> = {};

  getConfig(): Partial<TObjArgs> {
    return this.config;
  }

  abstract render();
}
