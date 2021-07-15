// eslint-disable-next-line @typescript-eslint/ban-types
export type IApplyDecorator = <TFunction extends Function, Y>(
  target: Record<string, any> | TFunction,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<Y>,
) => void;
