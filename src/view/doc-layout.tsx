import * as React from 'react';
import { Layout } from 'ts-react-ui/layout';
import { DocLayout } from '../model/client/doc-layout';

export {
  DocLayout
}

interface Props {
  model: DocLayout;
}

export class DocLayoutView extends React.Component<Props, {}> {
  render() {
    return <Layout model={this.props.model.getLayout()}/>;
  }
}
