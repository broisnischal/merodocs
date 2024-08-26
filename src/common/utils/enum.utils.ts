export function enumToArray(
  enumObj: Record<string, string | number>,
): string[] {
  const keys = Object.keys(enumObj).filter(
    (key) => typeof enumObj[key] === 'string',
  );
  return keys.map((key) => enumObj[key] as string);
}
