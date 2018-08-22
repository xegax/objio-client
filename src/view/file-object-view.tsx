import * as React from 'react';
import { FileObject } from 'objio-object/file-object';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { CSVFileObject } from 'objio-object//csv-file-object';
import { OBJIOItem } from 'objio';
import { prompt } from './prompt';
import { DocTable } from '../model/client/doc-table';
import { RangeSlider, RangeSliderModel } from 'ts-react-ui/range-slider';
import { VideoFileObject } from 'objio-object/video-file-object';

interface Props {
  onlyContent?: boolean;
  model: FileObject;
  prj: string;
  createDoc<T extends OBJIOItem = OBJIOItem>(model?: T): Promise<T>;
}

interface State {
  slider: RangeSliderModel;
}
const images = [ '.png', '.jpg', '.jpeg', '.gif' ];
export class FileObjectView extends React.Component<Props, State> {
  state: Readonly<State> = { slider: new RangeSliderModel() };
  video: VideoFileObject;
  videoCtrl: React.RefObject<HTMLVideoElement> = React.createRef();

  subscriber = () => {
    const range = this.state.slider.getRange();
    const lastDrag = this.state.slider.getLastDrag();
    if (lastDrag == 'from' || lastDrag == 'thumb')
      this.videoCtrl.current.currentTime = range.from;
    else if (lastDrag == 'to')
      this.videoCtrl.current.currentTime = range.to;

    this.setState({});
  }

  componentDidMount() {
    this.props.model.getImpl().holder.subscribe(this.subscriber);
    
    const video = this.props.model.getImpl<VideoFileObject>();
    if (video instanceof VideoFileObject) {
      this.video = video;
      const dur = video.getDurationSec();
      this.state.slider.setMinMax({ from: 0, to: dur});
      this.state.slider.subscribe(this.subscriber, 'changing');
    }
  }

  componentWillUnmount() {
    this.props.model.getImpl().holder.unsubscribe(this.subscriber);
  }

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
    if (!this.video)
      return null;

    const model = this.props.model;
    const range = this.state.slider.getRange();
    return (
      <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column'}}>
        <FitToParent wrapToFlex>
          <video ref={this.videoCtrl} controls src={this.getPath()}/>
        </FitToParent>
        <div style={{ flexGrow: 0, margin: 10}}>
          {VideoFileObject.timeToStr(VideoFileObject.toTime(range.from))}
          <div style={{height: 20}}>
            <RangeSlider model={this.state.slider}/>
          </div>
          {VideoFileObject.timeToStr(VideoFileObject.toTime(range.to))}
          <button onClick={() => {
            this.props.createDoc(new FileObject({
              originName: model.getName(),
              originSize: 0,
              mime: model.getMIME()
            })).then(file => {
              const video = file.getImpl<VideoFileObject>();
              video.split({
                from: VideoFileObject.toTime(range.from),
                to: VideoFileObject.toTime(range.to),
                parentId: model.holder.getID()
              });              
            });
          }}>split</button>
        </div>
      </div>
    );
  }

  renderCSV(): JSX.Element | string {
    const csv = this.props.model.getImpl<CSVFileObject>();
    if (!(csv instanceof CSVFileObject))
      return null;

    return (
      <div>
        <div>
          <button>
            table
          </button>
          <button onClick={() => {
            const table = new DocTable();
            this.props.createDoc(table)
            .then(() => 
              prompt({
                title: 'Prompt',
                prompt: 'Enter table name',
                placeholder: 'new table name'
              })
            )
            .then(name => 
              table.execute({
                table: name,
                fileObjId: this.props.model.holder.getID(),
                columns: csv.getColumns()
              })
            );
          }}>
            table + data
          </button>
        </div>
        <table>
          <tr>
            <td>Name</td>
            <td>Type</td>
            <td>Discard</td>
          </tr>
          {csv.getColumns().map((col, i) => {
            return (
              <tr key={'row-' + i}>
                <td>
                  {col.name}
                </td>
                <td>
                  <select
                    value={col.type}
                    onChange={event => {
                      csv.setColumn({
                        name: col.name,
                        type: event.target.value
                      });
                    }}>
                    {['TEXT', 'INTEGER', 'REAL', 'DATE'].map(type => {
                      return <option key={type} value={type}>{type}</option>;
                    })}
                  </select>
                </td>
                <td>
                  <input
                    type='checkbox'
                    checked={col.discard}
                    onChange={() => {
                      csv.setColumn({
                        name: col.name,
                        discard: !!!col.discard
                      });
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </table>
      </div>
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
        {this.props.onlyContent != true ? <div>
          <div>name: {model.getName()}</div>
          <div>size: {model.getSize()}</div>
          <div>mime: {model.getMIME()}</div>
          <div>loaded: {model.getLoadSize()}</div>
          <div>progress: {model.getProgress()}</div>
        </div> : null}
        <div style={{flexGrow: 1, display: 'flex', position: 'relative'}}>
          {this.renderContent()}
        </div>
      </div>
    );
  }
}
