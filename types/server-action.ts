export type ServerActionRes<T = undefined> = Promise<
  T extends undefined
    ? { success: true } | { success: false; error: string }
    : { success: true; data: T } | { success: false; error: string }
>;
