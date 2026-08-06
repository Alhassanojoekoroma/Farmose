declare interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare interface D1Database {
  prepare(query: string): { all<T = unknown>(...args: unknown[]): Promise<{ results: Array<T> }>; run(...args: unknown[]): Promise<unknown> };
  batch(statements: Array<unknown>): Promise<unknown>;
}
