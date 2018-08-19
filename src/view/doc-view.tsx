import * as React from 'react';
import { DocHolder } from '../model/client/doc-holder';
import './doc-view.scss';

const classes = {
  docView: 'doc-view',
  header: 'doc-view-header',
  content: 'doc-view-content'
};

interface Props {
  model: DocHolder;
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
      <div onDoubleClick={() => this.setState({edit: true})}>
        {model.getName()}
      </div>
    );
  }

  render() {
    return (
      <div className={classes.docView}>
        <div className={classes.header}>
          {this.renderName()}
        </div>
        <div className={classes.content}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
