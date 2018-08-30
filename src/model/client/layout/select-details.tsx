import { SelectDetails as Base, FieldItem } from '../../server/layout/select-details';
import { DocLayout } from '../doc-layout';
import { DocTable } from '../doc-table';
import { ColumnAttr } from 'objio-object/client/table';
import { EventTypes, SelectProvOwner } from './common';

export interface FieldsMap {
  [name: string]: string;
}

export class SelectDetails extends Base<DocTable, DocLayout> {
  private fields: FieldsMap = {};

  constructor(args) {
    super(args);

    this.holder.subscribe(() => {
      this.layout.getObjects().getArray().forEach(obj => {
        const selProvOwner = obj as any as SelectProvOwner;
        if (!selProvOwner.getSelProv)
          return;

        const sel = selProvOwner.getSelProv().getSelection();
        if (sel.length)
          this.updateSelection(sel[0]);
      });
    }, EventTypes.selProvSelection);
  }

  updateSelection = (rowId: string) => {
    this.source.getTableRef().loadCells({
      filter: { column: this.idColumn, value: rowId },
      first: 0,
      count: 1
    }).then(res => {
      this.source.getAllColumns().forEach((col, i) => {
        this.fieldsOrder.filter(item => item.name == col.name).forEach(item => item.value = res[0][i]);
        this.fields[col.name] = res[0][i];
      });
      this.holder.delayedNotify();
    });

    return Promise.resolve();
  }

  getFields(): Array<FieldItem> {
    const fields = Object.keys(this.fields);
    if (fields.length == 0)
      return null;

    if (this.fieldsOrder.length == 0)
      this.fieldsOrder = fields.map(item => {
        return {
          name: item,
          value: this.fields[item]
        };
      });

    return this.fieldsOrder;
  }

  getColumns(): Array<ColumnAttr> {
    return this.source.getAllColumns();
  }
}
