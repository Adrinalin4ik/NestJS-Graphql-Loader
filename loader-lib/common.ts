// eslint-disable-next-line @typescript-eslint/ban-types
export interface BaseEntity extends Function {
  new (...any: any[]): any;
  [key: string]: any;
}
