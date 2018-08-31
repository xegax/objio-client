import { CategoryFilter } from './category-filter';
import { DocLayout } from '../doc-layout';
import { DocTable } from 'objio-object/server/doc-table';
import { SERIALIZER } from 'objio';

export class TagFilter<
  TSource extends DocTable = DocTable,
  TLayout extends DocLayout = DocLayout
> extends CategoryFilter<TSource, TLayout> {
  protected target: TSource;
  protected joinColumn: string;

  getTarget(): TSource {
    return this.target;
  }

  setTarget(tgt: TSource): boolean {
    if (tgt == this.target)
      return false;

    if (tgt == this.source) {
      this.target = null;
    } else {
      this.target = tgt;
    }

    this.holder.save();
    this.holder.delayedNotify();
    return true;
  }

  getJoinColumn(): string {
    return this.joinColumn;
  }

  setJoinColumn(name: string): void {
    if (this.joinColumn == name)
      return;

    this.joinColumn = name;
    this.holder.save();
    this.holder.delayedNotify();
  }

  static TYPE_ID = 'TagFilter';
  static SERIALIZE: SERIALIZER = () => ({
    ...CategoryFilter.SERIALIZE(),
    target:     { type: 'object' },
    joinColumn: { type: 'string' }
  });
}