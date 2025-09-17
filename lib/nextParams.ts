export async function getParams<T>(params: Promise<T>): Promise<T> {
  return await params;
}

export async function getSearchParams<T extends Record<string, string | string[] | undefined>>(
  searchParams: Promise<T>
): Promise<T> {
  return await searchParams;
}
