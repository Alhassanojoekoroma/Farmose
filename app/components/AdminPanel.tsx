"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { defaultTheme, money, Product, SiteTheme } from "../farmose-data";
import type { ManagedProduct } from "../catalog-server";

type AdminOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  area: string;
  paymentMethod: string;
  total: number;
  status: string;
  createdAt: string;
};

type AdminPayload = {
  products: ManagedProduct[];
  theme: SiteTheme;
  orders: AdminOrder[];
};

type Tab = "products" | "appearance" | "orders";

const blankProduct = (sortOrder: number): ManagedProduct => ({
  slug: "",
  name: "",
  shortName: "",
  category: "Pantry",
  tag: "NEW",
  price: 0,
  unit: "",
  image: "/images/farmose-groundnut-display.webp",
  imagePosition: "center",
  color: "#d9e9b5",
  rating: 5,
  reviews: 0,
  description: "",
  details: "",
  features: ["Locally sourced", "Carefully prepared", "Kitchen ready"],
  active: true,
  sortOrder,
});

const categoryOptions: Product["category"][] = ["Pantry", "Fresh Seafood", "Meat & Poultry", "Fresh Produce"];

export function AdminPanel({ adminName, signOutPath }: { adminName: string; signOutPath: string }) {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [theme, setTheme] = useState<SiteTheme>(defaultTheme);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<ManagedProduct>(blankProduct(0));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/catalog", { cache: "no-store" });
      const result = (await response.json()) as AdminPayload & { error?: string };
      if (!response.ok) throw new Error(result.error || "The administration data could not be loaded.");
      setProducts(result.products);
      setTheme(result.theme);
      setOrders(result.orders);
      if (!selectedSlug && result.products[0]) {
        setSelectedSlug(result.products[0].slug);
        setDraft(result.products[0]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The administration data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeCount = useMemo(() => products.filter((product) => product.active).length, [products]);
  const newOrders = useMemo(() => orders.filter((order) => order.status === "new").length, [orders]);

  function selectProduct(product: ManagedProduct) {
    setSelectedSlug(product.slug);
    setDraft({ ...product, features: [...product.features] });
    setNotice("");
    setError("");
  }

  function createProduct() {
    setSelectedSlug(null);
    setDraft(blankProduct(products.length));
    setNotice("");
    setError("");
  }

  function updateDraft<K extends keyof ManagedProduct>(key: K, value: ManagedProduct[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "product", product: draft }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "The product could not be saved.");
      setNotice(`${draft.name} is now saved.`);
      setSelectedSlug(draft.slug);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct() {
    if (!selectedSlug || !window.confirm(`Delete ${draft.name}? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/catalog?slug=${encodeURIComponent(selectedSlug)}`, { method: "DELETE" });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "The product could not be deleted.");
      setSaving(false);
      return;
    }
    setSelectedSlug(null);
    setNotice("Product deleted.");
    await load();
    setSaving(false);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "The image could not be uploaded.");
      updateDraft("image", result.url);
      setNotice("Image uploaded. Save the product to publish it.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveTheme(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "theme", theme }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "The storefront appearance could not be saved.");
      setNotice("Storefront appearance published.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The storefront appearance could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function updateOrderStatus(id: number, status: string) {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) {
      setError("That order status could not be updated.");
      await load();
    } else {
      setNotice("Order status updated.");
    }
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="Open Farmose storefront">
          <img src="/images/farmose-logo.png" alt="Farmose" />
          <span>Store manager</span>
        </a>
        <nav aria-label="Administration sections">
          <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><span>▦</span>Products <b>{activeCount}</b></button>
          <button className={tab === "appearance" ? "active" : ""} onClick={() => setTab("appearance")}><span>◐</span>Appearance</button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><span>◎</span>Orders {newOrders > 0 && <b>{newOrders}</b>}</button>
        </nav>
        <div className="admin-account"><small>Signed in as</small><strong>{adminName}</strong><a href={signOutPath}>Sign out</a></div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div><p>FARMOSE ADMINISTRATION</p><h1>{tab === "products" ? "Products" : tab === "appearance" ? "Storefront appearance" : "Customer orders"}</h1></div>
          <a href="/" target="_blank" rel="noreferrer">View live store ↗</a>
        </header>
        {(notice || error) && <div className={`admin-message ${error ? "error" : ""}`}>{error || notice}</div>}
        {loading ? <div className="admin-loading">Loading your Farmose workspace…</div> : null}

        {!loading && tab === "products" && (
          <div className="admin-products-layout">
            <section className="admin-product-list">
              <div><h2>Catalog</h2><button onClick={createProduct}>＋ New product</button></div>
              {products.map((product) => (
                <button key={product.slug} className={selectedSlug === product.slug ? "active" : ""} onClick={() => selectProduct(product)}>
                  <span style={{ background: product.color }}><img src={product.image} alt="" /></span>
                  <i><strong>{product.shortName}</strong><small>{money(product.price)} · {product.active ? "Live" : "Hidden"}</small></i>
                </button>
              ))}
            </section>
            <form className="admin-editor" onSubmit={saveProduct}>
              <div className="admin-section-title"><div><p>{selectedSlug ? "EDIT PRODUCT" : "NEW PRODUCT"}</p><h2>{draft.name || "Untitled product"}</h2></div><label className="admin-switch"><input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} /><span>Visible in store</span></label></div>
              <div className="admin-product-preview" style={{ background: draft.color }}><span>{draft.tag || "PRODUCT"}</span><img src={draft.image} alt="Product preview" /><b>{money(Number(draft.price) || 0)}</b></div>
              <div className="admin-form-grid">
                <label><span>Product name</span><input required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} /></label>
                <label><span>Short name</span><input required value={draft.shortName} onChange={(event) => updateDraft("shortName", event.target.value)} /></label>
                <label><span>URL slug</span><input required disabled={Boolean(selectedSlug)} value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))} /></label>
                <label><span>Category</span><select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as Product["category"])}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label><span>Price (Le)</span><input required min="0" step="0.01" type="number" value={draft.price} onChange={(event) => updateDraft("price", Number(event.target.value))} /></label>
                <label><span>Unit</span><input required value={draft.unit} onChange={(event) => updateDraft("unit", event.target.value)} placeholder="e.g. 950 g jar" /></label>
                <label><span>Card label</span><input value={draft.tag} onChange={(event) => updateDraft("tag", event.target.value.toUpperCase())} /></label>
                <label><span>Card background</span><input type="color" value={draft.color} onChange={(event) => updateDraft("color", event.target.value)} /></label>
                <label><span>Display order</span><input type="number" value={draft.sortOrder} onChange={(event) => updateDraft("sortOrder", Number(event.target.value))} /></label>
                <label><span>Image position</span><select value={draft.imagePosition || "center"} onChange={(event) => updateDraft("imagePosition", event.target.value)}><option>center</option><option>top</option><option>bottom</option><option>left</option><option>right</option></select></label>
              </div>
              <label className="admin-field"><span>Short card description</span><textarea required rows={3} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
              <label className="admin-field"><span>Product page description</span><textarea required rows={4} value={draft.details} onChange={(event) => updateDraft("details", event.target.value)} /></label>
              <div className="admin-form-grid features-fields">{[0, 1, 2].map((index) => <label key={index}><span>Feature {index + 1}</span><input value={draft.features[index] || ""} onChange={(event) => updateDraft("features", [0, 1, 2].map((featureIndex) => featureIndex === index ? event.target.value : draft.features[featureIndex] || ""))} /></label>)}</div>
              <div className="admin-upload"><div><strong>Product image</strong><small>JPG, PNG or WebP up to 8 MB</small></div><label><input type="file" accept="image/*" onChange={uploadImage} />{uploading ? "Uploading…" : "Upload new image"}</label><input aria-label="Product image URL" value={draft.image} onChange={(event) => updateDraft("image", event.target.value)} /></div>
              <div className="admin-actions">{selectedSlug && <button className="danger" type="button" onClick={removeProduct}>Delete product</button>}<button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save product"}</button></div>
            </form>
          </div>
        )}

        {!loading && tab === "appearance" && (
          <form className="appearance-layout" onSubmit={saveTheme}>
            <section className="appearance-controls">
              <div className="admin-section-title"><div><p>VISUAL SYSTEM</p><h2>Colours & typography</h2></div></div>
              <div className="color-controls">
                {(["primaryColor", "backgroundColor", "accentColor", "highlightColor"] as const).map((key) => <label key={key}><input type="color" value={theme[key]} onChange={(event) => setTheme({ ...theme, [key]: event.target.value })} /><span>{key.replace("Color", "").replace(/^./, (letter) => letter.toUpperCase())}</span><code>{theme[key]}</code></label>)}
              </div>
              <div className="admin-form-grid">
                <label><span>Heading font</span><select value={theme.headingFont} onChange={(event) => setTheme({ ...theme, headingFont: event.target.value })}><option value="Georgia, 'Times New Roman', serif">Georgia</option><option value="'Times New Roman', Times, serif">Times New Roman</option><option value="Arial, Helvetica, sans-serif">Arial</option></select></label>
                <label><span>Body font</span><select value={theme.bodyFont} onChange={(event) => setTheme({ ...theme, bodyFont: event.target.value })}><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Verdana, Geneva, sans-serif">Verdana</option><option value="Georgia, 'Times New Roman', serif">Georgia</option></select></label>
                <label><span>Body size ({theme.baseFontSize}px)</span><input type="range" min="14" max="20" value={theme.baseFontSize} onChange={(event) => setTheme({ ...theme, baseFontSize: Number(event.target.value) })} /></label>
                <label><span>Headline size ({theme.headingMaxSize}px)</span><input type="range" min="64" max="100" value={theme.headingMaxSize} onChange={(event) => setTheme({ ...theme, headingMaxSize: Number(event.target.value) })} /></label>
                <label><span>Button roundness ({theme.buttonRadius}px)</span><input type="range" min="4" max="999" value={theme.buttonRadius} onChange={(event) => setTheme({ ...theme, buttonRadius: Number(event.target.value) })} /></label>
              </div>
              <div className="admin-section-title copy-title"><div><p>HOME PAGE</p><h2>Message & hero</h2></div></div>
              <label className="admin-field"><span>Announcement bar</span><input value={theme.announcement} onChange={(event) => setTheme({ ...theme, announcement: event.target.value })} /></label>
              <label className="admin-field"><span>Hero headline</span><input value={theme.heroTitle} onChange={(event) => setTheme({ ...theme, heroTitle: event.target.value })} /></label>
              <label className="admin-field"><span>Emphasised words</span><input value={theme.heroEmphasis} onChange={(event) => setTheme({ ...theme, heroEmphasis: event.target.value })} /></label>
              <label className="admin-field"><span>Hero supporting text</span><textarea rows={4} value={theme.heroBody} onChange={(event) => setTheme({ ...theme, heroBody: event.target.value })} /></label>
              <label className="admin-field"><span>Hero image URL</span><input value={theme.heroImage} onChange={(event) => setTheme({ ...theme, heroImage: event.target.value })} /></label>
              <div className="admin-actions"><button type="button" onClick={() => setTheme(defaultTheme)}>Reset draft</button><button className="primary" type="submit" disabled={saving}>{saving ? "Publishing…" : "Publish appearance"}</button></div>
            </section>
            <aside className="appearance-preview" style={{ background: theme.highlightColor, fontFamily: theme.bodyFont, fontSize: theme.baseFontSize }}>
              <div className="appearance-preview-nav" style={{ background: theme.backgroundColor }}><span>☰</span><img src="/images/farmose-logo.png" alt="" /><span>▢</span></div>
              <div className="appearance-preview-copy"><b style={{ background: theme.accentColor }}>CLEAN LOCAL FOOD</b><h2 style={{ fontFamily: theme.headingFont, fontSize: Math.min(theme.headingMaxSize * .55, 48) }}>{theme.heroTitle} <em>{theme.heroEmphasis}</em></h2><p>{theme.heroBody}</p><button style={{ background: theme.primaryColor, borderRadius: theme.buttonRadius }}>Shop local produce</button></div>
              <img className="appearance-preview-image" src={theme.heroImage} alt="" />
            </aside>
          </form>
        )}

        {!loading && tab === "orders" && (
          <section className="admin-orders">
            <div className="admin-section-title"><div><p>RECENT CHECKOUTS</p><h2>Orders from the storefront</h2></div></div>
            {orders.length === 0 ? <div className="admin-empty"><h3>No orders yet.</h3><p>New digital checkouts will appear here.</p></div> : orders.map((order) => (
              <article key={order.id}><div><strong>{order.orderNumber}</strong><small>{order.createdAt}</small></div><div><b>{order.customerName}</b><small>{order.phone} · {order.area}</small></div><div><b>{money(order.total)}</b><small>{order.paymentMethod}</small></div><select value={order.status} onChange={(event) => void updateOrderStatus(order.id, event.target.value)}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="preparing">Preparing</option><option value="out-for-delivery">Out for delivery</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
