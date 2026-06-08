let tokenGetter: (() => Promise<string>) | null = null;

export function setTokenGetter(fn: typeof tokenGetter): void {
  tokenGetter = fn;
}

export async function currentToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
