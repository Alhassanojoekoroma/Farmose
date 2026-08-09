export const env = process.env;

export class WorkerEntrypoint<Env = unknown> {
  env: Env;
  ctx: unknown;
  constructor(ctx: unknown, envValue: Env) { this.ctx = ctx; this.env = envValue; }
}

export class DurableObject<Env = unknown> {
  ctx: unknown;
  env: Env;
  constructor(ctx: unknown, envValue: Env) { this.ctx = ctx; this.env = envValue; }
}

export class WorkflowEntrypoint<Env = unknown> extends WorkerEntrypoint<Env> {}
