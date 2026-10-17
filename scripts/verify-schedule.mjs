import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

const databaseUrl = await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (part) => { data += part; });
  process.stdin.on("end", () => resolve(data.trim()));
});
if (!databaseUrl) throw new Error("Pass the database URL on stdin.");
const db = new Client({ connectionString: databaseUrl });
await db.connect();
try {
  await db.query("BEGIN");
  const ids = Array.from({ length: 4 }, () => randomUUID());
  const rows = [
    [ids[0], true, -2, 2],   // live
    [ids[1], false, -2, 2],  // draft
    [ids[2], true, 2, 4],    // scheduled
    [ids[3], true, -4, -2],  // expired
  ];
  for (const [id, published, startHours, endHours] of rows) {
    await db.query(`INSERT INTO public_updates
      (id, kind, title, starts_at, ends_at, published)
      VALUES ($1, 'news', 'Schedule verification', now() + $2 * interval '1 hour',
        now() + $3 * interval '1 hour', $4)`, [id, startHours, endHours, published]);
  }
  const { rows: visible } = await db.query(`SELECT id FROM public_updates
    WHERE id = ANY($1) AND published = true AND starts_at <= now()
      AND (ends_at IS NULL OR ends_at > now())`, [ids]);
  assert.deepEqual(visible.map((row) => row.id), [ids[0]]);
  await db.query("ROLLBACK");
  console.log("Schedule verified: only the live item was public; test rows rolled back.");
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
