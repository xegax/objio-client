import * as React from 'react';
import { Layout } from 'ts-react-ui/layout';
import { DocLayout } from '../model/client/doc-layout';
import { DataSourceHolder,
  ViewFactory,
  FactoryItem,
  LayoutItemViewProps
} from '../model/server/doc-layout';

export {
  DocLayout,
  DataSourceHolder,
  ViewFactory,
  FactoryItem,
  LayoutItemViewProps
}

interface Props {
  model: DocLayout;
}

export class DocLayoutView extends React.Component<Props, {}> {
  render() {
    const model = this.props.model;
    return (
      <Layout
        key={model.holder.getID()}
        model={model.getLayout()}
      />
    );
  }
}
