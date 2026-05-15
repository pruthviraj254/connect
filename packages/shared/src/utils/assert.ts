export function assertNever(_value: never, message = 'Unexpected value'): never {
  throw new Error(message);
}
