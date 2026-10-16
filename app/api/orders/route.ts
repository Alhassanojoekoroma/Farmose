/** The supplied storefront sends enquiries to WhatsApp. Its former checkout
 * endpoint accepted client-supplied totals, so it must not create orders. */
export async function POST() {
  return Response.json(
    { error: "Online checkout is no longer available. Send an enquiry through the storefront." },
    { status: 410 },
  );
}
