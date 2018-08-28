import * as React from 'react';
import { DocRoot } from '../model/client/doc-root';

export interface Props {
  root: DocRoot;
}

export abstract class DocConfig<TObjArgs extends Object = Object> extends React.Component<Partial<Props>> {
  protected config: Partial<TObjArgs> = {};

  getConfig(): Partial<TObjArgs> {
    return this.config;
  }

  abstract render();
}
