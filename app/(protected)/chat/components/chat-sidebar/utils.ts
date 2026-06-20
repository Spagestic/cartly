export type Thread = {
  _id: string;
  title?: string;
};

export function threadIdFromPathname(pathname: string): string | undefined {
  const match = /^\/chat\/([^/]+)$/.exec(pathname);
  return match?.[1];
}
