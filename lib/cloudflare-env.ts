type D1PreparedStatement = {
  all: <T = unknown>(...args: unknown[]) => Promise<{ results: Array<T> }>;
  run: (...args: unknown[]) => Promise<unknown>;
};

type CloudflareEnv = Record<string, unknown> & {
  DB?: {
    batch: (statements: Array<unknown>) => Promise<unknown>;
    prepare: (query: string) => D1PreparedStatement;
  };
  MEDIA?: unknown;
};

const runtimeEnv = (globalThis as typeof globalThis & { __cloudflareEnv?: CloudflareEnv }).__cloudflareEnv ?? process.env;

export const env = runtimeEnv as CloudflareEnv;
