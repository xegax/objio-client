import * as React from 'react';
import { DocHolder } from '../model/client/doc-holder';
import './doc-view.scss';

const classes = {
  docView: 'doc-view',
  header: 'doc-view-header',
  content: 'doc-view-content',
  name: 'doc-view-header-name',
  tools: 'doc-view-header-tools'
};

interface Props {
  model: DocHolder;
  onRemove?();
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
    const model = this.props.model;

    if (this.state.edit)
      return (
        <input
          defaultValue={ model.getName() }
          onKeyDown={ evt => {
            if (evt.keyCode == 13) {
              model.setName(evt.currentTarget.value);
              this.setState({ edit: false });
            }
          }}
        />
      );

    return (
      <div className={classes.name} onDoubleClick={() => this.setState({edit: true})}>
        {model.getName()}
      </div>
    );
  }

  renderTools() {
    const remove = (
      this.props.onRemove && <i
        title='delete'
        className='fa fa-trash-o'
        onClick={() => this.props.onRemove()}
      />
    );

    return (
      <div className={classes.tools}>
        {remove}
      </div>
    );
  }

  render() {
    return (
      <div className={classes.docView}>
        <div className={classes.header}>
          {this.renderName()}
          {this.renderTools()}
        </div>
        <div className={classes.content}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
