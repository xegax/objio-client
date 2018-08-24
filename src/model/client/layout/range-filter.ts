import { RangeFilter as Base } from '../../server/layout/range-filter';
import { RangeSliderModel } from 'ts-react-ui/model/range-slider';
import { DocLayout } from '../doc-layout';
import { DocTable } from '../doc-table';
import { CondHolderOwner, CondHolder } from './cond-holder';
import { ColumnAttr } from 'objio-object/table';

export {
  RangeSliderModel
}

export class RangeFilter extends Base<DocTable, DocLayout> implements CondHolderOwner {
  protected slider = new RangeSliderModel();
  protected cond = new CondHolder();
  protected colType: string;

  constructor(args) {
    super(args);

    this.holder.addEventHandler({
      onLoad: this.onInit,
      onCreate: this.onInit
    });

    this.slider.subscribe(() => {
      this.holder.delayedNotify();
    }, 'changing');

    this.slider.subscribe(() => {
      const range = this.slider.getRange();
      const minMax = this.slider.getMinMax();
      if (range.from == minMax.from && range.to == minMax.to) {
        this.cond.setCondition(this.source, null, this.layout.getObjects().getArray(), this);
      } else {
        this.cond.setCondition(this.source, {
          column: this.getColumn(),
          value: [range.from, range.to]
        }, this.layout.getObjects().getArray(), this);
      }
    }, 'changed');
  }

  onInit = () => {
    const selCol = this.getColumn();
    const col = this.source.getAllColumns().find(col => col.name == selCol);
    if (col)
      this.colType = col.type.toUpperCase();
    this.slider.setRound(this.isIntType());

    this.source.getTableRef().getNumStats({column: this.getColumn()})
    .then(res => {
      this.slider.setMinMax({from: res.min, to: res.max});
      this.slider.setRange({from: res.min, to: res.max});
    });

    return Promise.resolve();
  }

  getSlider(): RangeSliderModel {
    return this.slider;
  }

  setColumn(column: string): boolean {
    if (!super.setColumn(column))
      return false;

    this.onInit();
    return true;
  }

  getColumnType(): string {
    return this.colType;
  }

  isIntType(): boolean {
    return this.colType == 'INTEGER';
  }

  getCondHolder(): CondHolder {
    return this.cond;
  }

  getColumns(): Array<ColumnAttr> {
    return this.source.getAllColumns().filter(col => {
      return ['INTEGER', 'REAL'].indexOf(col.type.toUpperCase()) != -1;
    });
  }
}
