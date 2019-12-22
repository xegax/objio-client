import * as React from 'react';
import './doc-view.scss';
import { App } from '../model/client/app';
import { ObjectBase } from 'objio-object/base/object-base';

const scss = {
  docView: 'doc-view',
  header: 'doc-view-header',
  content: 'doc-view-content',
  name: 'doc-view-header-name',
  tools: 'doc-view-header-tools'
};

interface Props {
  root: App;
  model: ObjectBase;
}

interface State {
  edit?: boolean;
}

export class DocView extends React.Component<Props> {
  state: Readonly<State> = { edit: false };

  subscriber = () => {
    this.setState({})
  };

  componentWillMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  renderName(): JSX.Element {
    const obj = this.props.model;
    if (this.state.edit)
      return (
        <input
          defaultValue={ obj.getName() }
          onKeyDown={ evt => {
            if (evt.keyCode == 13) {
              obj.setName(evt.currentTarget.value);
              this.setState({ edit: false });
            }
          }}
        />
      );

    return (
      <div className={scss.name} onDoubleClick={() => this.setState({edit: true})}>
        {obj.getName()}
      </div>
    );
  }

  private renderTools() {
    const link = (
      <i
        style={{marginLeft: 10}}
        title='link'
        className='fa fa-link'
        onClick={() => location.assign(`/?objId=${this.props.model.holder.getID()}`)}
      />
    );

    return (
      <div className={scss.tools}>
        {link}
      </div>
    );
  }

  private renderProgress() {
    const model = this.props.model;
    const base = model;
    if (!base.isStatusInProgess())
      return null;

    let p = Math.round(base.getProgress() * 100);
    return (
      <div style={{position: 'relative'}}>
        <div style={{backgroundColor: '#abccdc', position: 'absolute', top: 0, bottom: 0, width: p + '%'}}/>
        <div style={{position: 'relative', textAlign: 'center'}}>in progress ({p} %) </div>
      </div>
    );
  }

  render() {
    return (
      <div className={scss.docView} {...this.props}>
        <div className={scss.header}>
          {this.renderName()}
          {this.renderTools()}
        </div>
        {this.renderProgress()}
        <div className={scss.content}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
