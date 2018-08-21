import { RangeFilter as Base } from '../../server/layout/range-filter';
import { RangeSliderModel } from 'ts-react-ui/model/range-slider';
import { DocLayout } from '../doc-layout';
import { DocTable } from '../doc-table';
import { CondHolderOwner, CondHolder } from './cond-holder';

export {
  RangeSliderModel
}

export class RangeFilter extends Base<DocTable, DocLayout> implements CondHolderOwner {
  protected slider = new RangeSliderModel();
  protected cond = new CondHolder();

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
      this.cond.setCondition(this.source, {
        column: this.getColumn(),
        value: [range.from, range.to]
      }, this.layout.getObjects().getArray(), this);
    }, 'changed');
  }

  onInit = () => {
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

  setColumn(column: string) {
    if (!super.setColumn(column))
      return false;

    this.onInit();
    return true;
  }

  getCondHolder(): CondHolder {
    return this.cond;
  }

  getColumns() {
    return this.source.getAllColumns();
  }
}
