import { getDb } from "../../../db";
import { orders } from "../../../db/schema";

type OrderPayload = {
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  notes?: string;
  paymentMethod?: string;
  items?: Array<{ slug: string; name: string; quantity: number; price: number }>;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderPayload;
    const customerName = payload.customerName?.trim() ?? "";
    const phone = payload.phone?.trim() ?? "";
    const address = payload.address?.trim() ?? "";
    const area = payload.area?.trim() ?? "";
    const items = payload.items ?? [];

    if (!customerName || !phone || !address || !area || items.length === 0) {
      return Response.json(
        { error: "Name, phone, address, area and at least one item are required." },
        { status: 400 },
      );
    }

    const orderNumber = `FAR-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;
    const db = getDb();
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerName,
        phone,
        email: payload.email?.trim() ?? "",
        address,
        area,
        notes: payload.notes?.trim() ?? "",
        paymentMethod: payload.paymentMethod ?? "Cash on delivery",
        itemsJson: JSON.stringify(items),
        subtotal: Number(payload.subtotal ?? 0),
        deliveryFee: Number(payload.deliveryFee ?? 0),
        total: Number(payload.total ?? 0),
      })
      .returning({ orderNumber: orders.orderNumber });

    return Response.json({ orderNumber: order.orderNumber }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save order";
    return Response.json({ error: message }, { status: 500 });
  }
}
