import { FarmoseSite } from "./components/FarmoseSite";
import { readStorefront } from "./storefront-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const storefront = await readStorefront();
  return <FarmoseSite view="home" {...storefront} />;
}
