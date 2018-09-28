import * as React from 'react';
import './files-drop-container.scss';
import { cn } from '../common/common';

const classes = {
  overlay: 'files-drop-overlay',
  content: 'files-drop-content'
};

export interface Props extends React.HTMLProps<HTMLDivElement> {
  onDropFiles(files: Array<File>);
  onStartDrag?(files: Array<File>): boolean;
}

export interface State {
  drag?: boolean;
  filesCount?: number;
}

export class FilesDropContainer extends React.Component<Props, State> {
  private dropTgt = React.createRef<HTMLDivElement>();
  private ref = React.createRef<HTMLElement>();

  state: Readonly<State> = {};

  onDragEnter = (event: React.DragEvent<any>) => {
    if (this.state.drag)
      return;

    const data = event.nativeEvent.dataTransfer;
    if (!data.items)
      return;

    let files = Array<File>();
    for (let n = 0; n < data.items.length; n++) {
      const item = data.items[n];
      if (item.kind != 'file')
        continue;

      files.push(item.getAsFile());
    }

    if (!files.length || this.props.onStartDrag && !this.props.onStartDrag(files))
      return event.preventDefault();

    this.setState({ drag: true, filesCount: files.length });
  };

  onDrop = (event: React.DragEvent<any>) => {
    event.preventDefault();
    if (!this.state.drag)
      return;

    let files: Array<File> = [];
    for (let n = 0; n < event.dataTransfer.items.length; n++) {
      files.push( event.dataTransfer.items[n].getAsFile() );
    }
    this.props.onDropFiles(files);

    this.setState({ drag: false });
  };

  onDragLeave = (event: React.DragEvent<any>) => {
    const newTgt = event.relatedTarget;
    if (newTgt == this.dropTgt.current)
      return;

    this.setState({ drag: false, filesCount: 0 });
  };

  renderFileDrop(container: JSX.Element): JSX.Element {
    if (!this.state.drag)
      return container;

    return React.cloneElement(
      container,
      {},
      [
        ...React.Children.toArray(container.props.children),
        <div
          key='overlay'
          className={cn(classes.overlay)}
          ref={this.dropTgt}
          onDrop={this.onDrop}
          onDragOver={evt => evt.preventDefault()}
          onDragEnter={this.onDragEnter}
          onDragLeave={this.onDragLeave}
        >
          <div className={classes.content}>
            drop {this.state.filesCount} files
          </div>
        </div>
      ]
    );
  }

  render() {
    const root = React.cloneElement(
      React.Children.only(this.props.children),
      {
        ref: this.ref,
        onDragEnter: this.onDragEnter,
        onDragLeave: this.onDragLeave,
        onDragOver: evt => evt.preventDefault(),
        onDrop: evt => evt.preventDefault()
      }
    );

    return (
      <React.Fragment>
        {this.renderFileDrop(root)}
      </React.Fragment>
    );
  }
}
