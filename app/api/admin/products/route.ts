// Kept as a compatibility endpoint for older admin clients. The current admin
// uses /api/admin/catalog with Cloudflare D1 and /api/admin/upload with R2.
export async function POST() {
  return Response.json({ error: "Use the current Farmose admin product editor." }, { status: 410 });
}

export async function DELETE() {
  return Response.json({ error: "Use the current Farmose admin product editor." }, { status: 410 });
}
