import { OBJIOItem, OBJIO } from 'objio';
import { Condition } from 'objio-object/table';
import { DataSourceHolder } from '../../server/doc-layout';
import { DocTable } from '../doc-table';

export const EventType = {
  change: 'cond-change'
};

export interface CondHolderOwner {
  getCondHolder(): CondHolder;
}

export class CondHolder {
  private cond: Condition;

  setCondition(cond: Condition, objs: Array<OBJIOItem>, skipNotify?: OBJIOItem): void {
    this.cond = cond;

    objs.forEach(obj => {
      if (skipNotify == obj)
        return;

      const owner = obj as any as CondHolderOwner;
      if (owner.getCondHolder)
        obj.holder.delayedNotify({type: EventType.change});
    });
  }

  getCondition(): Condition {
    return this.cond;
  }

  getMergedCondition(tgtSrc: DataSourceHolder<DocTable>, arr: Array<OBJIOItem>): Condition {
    const srcID = tgtSrc.get().holder.getID();

    const values = new Array<Condition>();
    arr.forEach((holder: DataSourceHolder<DocTable>) => {
      if (holder.get().holder.getID() != srcID)
        return;

      const owner = holder as any as CondHolderOwner;
      if (owner.getCondHolder)
        return;

      values.push(owner.getCondHolder().getCondition());
    });

    if (values.length == 1)
      return values[0];

    return { op: 'and', values };
  }
}
