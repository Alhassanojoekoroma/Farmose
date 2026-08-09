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

type CloudflareRuntime = typeof globalThis & { __cloudflareEnv?: CloudflareEnv };

const runtime = globalThis as CloudflareRuntime;
const processEnv: Record<string, string | undefined> = typeof process === "undefined" ? {} : process.env;

// The vinext Worker receives Cloudflare bindings for every request. Read them
// lazily so server modules do not permanently capture process.env while the
// Worker entry point is still being initialized.
export const env = new Proxy({} as CloudflareEnv, {
  get(_target, property) {
    if (typeof property !== "string") return undefined;
    return runtime.__cloudflareEnv?.[property] ?? processEnv[property];
  },
  has(_target, property) {
    if (typeof property !== "string") return false;
    return property in (runtime.__cloudflareEnv ?? {}) || property in processEnv;
  },
});
