import { OBJIOItem, OBJIO } from 'objio';
import { Condition } from 'objio-object/client/table';
import { DataSourceHolder } from '../../server/doc-layout';
import { DocTable } from 'objio-object/client/doc-table';

export const EventType = {
  change: 'cond-change'
};

export interface CondHolderOwner {
  getCondHolder(): CondHolder;
}

export class CondHolder {
  private cond: Condition;
  private tgt: DocTable;

  setCondition(tgt: DocTable, cond: Condition, objs: Array<OBJIOItem>, skipNotify?: OBJIOItem): void {
    this.cond = cond;
    this.tgt = tgt;

    objs.forEach(obj => {
      if (skipNotify == obj)
        return;

      const owner = obj as any as CondHolderOwner;
      if (owner.getCondHolder)
        obj.holder.delayedNotify({type: EventType.change});
    });
  }

  getMergedCondition(tgtSrc: DataSourceHolder<DocTable>, arr: Array<OBJIOItem>): Condition {
    const srcID = tgtSrc.get().holder.getID();

    const values = new Array<Condition>();
    arr.forEach((holder: DataSourceHolder<DocTable>) => {
      const owner = holder as any as CondHolderOwner;
      if (!owner.getCondHolder)
        return;

      const condHolder = owner.getCondHolder();
      const cond = condHolder.cond;
      const tgt = condHolder.tgt;
      if (!cond || tgt.holder.getID() != srcID)
        return;

      values.push(cond);
    });

    if (values.length == 1)
      return values[0];

    if (values.length == 0)
      return null;

    return { op: 'and', values };
  }
}
