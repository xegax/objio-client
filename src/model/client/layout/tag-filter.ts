import { CategoryFilter, CategoryFilterImpl } from './category-filter';
import { ColumnAttr, LoadCellsArgs, Condition, CompoundCond } from 'objio-object/table';
import { TagFilter as Base } from '../../server/layout/tag-filter';
import { DocTable } from '../doc-table';
import { OBJIOItem } from 'objio';
import { CondHolder, CondHolderOwner } from './cond-holder';
import { DocLayout } from '../doc-layout';

export interface TagFilterOwner extends OBJIOItem {
  getColumn(): string;
  setCondition(cond: Condition): void;
  get(): DocTable;
  getJoinColumn(): string;
  getTarget(): DocTable;
}

export class TagFilter extends Base<DocTable, DocLayout> implements CondHolderOwner, TagFilterOwner {
  private condHolder = new CondHolder();
  private impl = new TagFilterImpl(this);

  getCondHolder(): CondHolder {
    return this.condHolder;
  }

  getColumn(): string {
    return this.column || this.source.getAllColumns()[0].name;
  }

  setColumn(name: string): boolean {
    if (!super.setColumn(name))
      return false;

    this.impl.updateSubtable();
    return true;
  }

  getColumns(): Array<ColumnAttr> {
    return this.source.getAllColumns();
  }

  setCondition(cond: Condition): void {
    this.condHolder.setCondition(this.target || this.source, cond, this.layout.getObjects().getArray(), this);
  }

  getTotalRows(): number {
    return this.impl.getTotalRows();
  }

  getRender() {
    return this.impl.getRender();
  }
}

class TagFilterImpl extends CategoryFilterImpl<TagFilterOwner> {
  setCondition(cond: Condition): void {
    if (!cond)
      return this.owner.setCondition(null);

    let comp: CompoundCond = {
      table: this.owner.get().getTable(),
      ...(cond['values'] ? {...cond as CompoundCond, op: 'or'} : {op: 'or', values: [cond]})
    }

    const cond2: Condition = {
      column: this.owner.getJoinColumn(),
      value: comp
    };
    console.log(JSON.stringify(cond2));
    this.owner.setCondition(cond2);
  }
}
