import * as React from 'react';
import { FileObject } from 'objio-object/file-object';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { CSVFileObject } from 'objio-object//csv-file-object';

interface Props {
  model: FileObject;
  prj: string;
}

const images = [ '.png', '.jpg', '.jpeg', '.gif' ];
const video = [ '.mp4', '.webm' ];
export class FileObjectView extends React.Component<Props, {}> {
  renderImage(): JSX.Element {
    if (images.indexOf(this.props.model.getExt().toLowerCase()) == -1)
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
    if (video.indexOf(this.props.model.getExt().toLowerCase()) == -1)
      return null;

    return (
      <FitToParent wrapToFlex>
        <video controls src={this.getPath()}/>
      </FitToParent>
    );
  }

  renderCSV(): JSX.Element | string {
    const csv = this.props.model.getImpl<CSVFileObject>();
    if (!(csv instanceof CSVFileObject))
      return null;

    return (
      <table>
        <td>
          {csv.getColumns().map((col, i) => {
            return (
              <tr key={'col-1-' + i}>
                {col.name}
              </tr>
            );
          })}
        </td>
        <td>
          {csv.getColumns().map((col, i) => {
            return (
              <tr key={'col-2-' + i}>
                <select defaultValue={col.type}>
                  {['TEXT', 'INTEGER', 'REAL', 'DATE'].map(type => {
                    return <option key={type} value={type}>{type}</option>;
                  })}
                </select>
              </tr>
            );
          })}
        </td>
      </table>
    );
  }

  getPath(): string {
    return `/data/projects/${this.props.prj}/${this.props.model.getPath()}`;
  }

  renderContent(): JSX.Element | string {
    if (this.props.model.getProgress() != 1)
      return null;

    return this.renderImage() || this.renderVideo() || this.renderCSV();
  }

  render() {
    const model = this.props.model;
    return (
      <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
        <div>
          <div>name: {model.getName()}</div>
          <div>size: {model.getSize()}</div>
          <div>mime: {model.getMIME()}</div>
          <div>loaded: {model.getLoadSize()}</div>
          <div>progress: {model.getProgress()}</div>
        </div>
        <div style={{flexGrow: 1, display: 'flex', position: 'relative'}}>
          {this.renderContent()}
        </div>
      </div>
    );
  }
}
