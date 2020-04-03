import * as React from 'react';
import { GuestModel } from '../model/base/guest';

interface Props {
  model: GuestModel;
}

export class GuestView extends React.Component<Props> {
  private subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  render() {
    const view = this.props.model.render();
    if (!view) {
      return (
        <div
          className='doc-view-content abs-fit flex'
          style={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <h3>Nothing to view</h3>
        </div>
      );
    }

    return (
      <div className='doc-view-content abs-fit flex'>
        {view}
      </div>
    );
  }
}
