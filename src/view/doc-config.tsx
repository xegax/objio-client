import * as React from 'react';
import { OBJIOItem } from 'objio';

export interface Props {
  objects(): Array<OBJIOItem>;
  source?: OBJIOItem;
}

export abstract class DocConfig<TObjArgs extends Object = Object> extends React.Component<Partial<Props>> {
  protected config: Partial<TObjArgs> = {};

  getConfig(): Partial<TObjArgs> {
    return this.config;
  }

  abstract render();
}
