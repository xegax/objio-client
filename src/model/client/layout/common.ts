export interface SelectProv {
  getSelection(): Array<string>;
}

export interface SelectProvOwner {
  getSelProv(): SelectProv;
}

export const EventTypes = {
  selProvSelection: 'selProv-selection'
};
