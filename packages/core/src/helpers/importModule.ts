export async function importModule<T>(filepath: string): Promise<T> {
  const _module = await import(filepath);
  return _module.default || _module;
}
