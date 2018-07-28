import * as React from 'react';
import { FileObject } from 'objio-object/file-object';

interface Props {
  model: FileObject;
  prj: string;
}

const images = [ '.png', '.jpg', '.jpeg', '.gif' ];
const video = [ '.mp4', '.webm' ];
export class FileObjectView extends React.Component<Props, {}> {
  renderImage(): JSX.Element {
    const { prj, model } = this.props;
    if (images.indexOf(model.getExt().toLowerCase()) == -1)
      return null;

    return <div style={{
      flexGrow: 1,
      backgroundImage: `url(${this.getPath()})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'contain'
    }}/>;
  }

  renderVideo(): JSX.Element {
    const { prj, model } = this.props;
    if (video.indexOf(model.getExt().toLowerCase()) == -1)
      return null;
    
    return <video controls style={{flexGrow: 1}} src={this.getPath()}/>;
  }

  getPath(): string {
    return `/data/projects/${this.props.prj}/${this.props.model.getPath()}`;
  }

  renderContent(): JSX.Element {
    if (this.props.model.getProgress() != 1)
      return null;

    return this.renderImage() || this.renderVideo();
  }

  render() {
    const model = this.props.model;
    return (
      <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
        <div>
          <div>name: {model.getName()}</div>
          <div>size: {model.getSize()}</div>
          <div>mime: {model.getMime()}</div>
          <div>loaded: {model.getLoadSize()}</div>
          <div>progress: {model.getProgress()}</div>
        </div>
        <div style={{flexGrow: 1, display: 'flex'}}>
          {this.renderContent()}
        </div>
      </div>
    );
  }
}
