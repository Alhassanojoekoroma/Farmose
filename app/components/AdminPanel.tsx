"use client";
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { defaultTheme, money, Product, SiteTheme } from "../farmose-data";
import type { ManagedProduct } from "../catalog-server";
import type { AdminRole } from "../admin-auth";

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
  role: AdminRole;
};

type Tab = "products" | "appearance" | "media" | "orders" | "team";
type StaffUser = { email: string; displayName: string; role: "editor" | "orders"; active: boolean };

type MediaAsset = {
  key: string;
  url: string;
  kind: "image" | "video";
  size: number;
  uploaded: string;
};

type ThemeImageKey = "experienceLogoImage" | "heroImage" | "logoImage" | "seafoodImage" | "pantryImage" | "produceImage" | "standardImage";

async function readApiResponse<T extends object>(response: Response): Promise<T & { error?: string }> {
  const body = await response.text();
  if (!body) {
    return { error: `The server returned an empty response (${response.status}). Please try again.` } as T & { error?: string };
  }
  try {
    return JSON.parse(body) as T & { error?: string };
  } catch {
    return { error: `The server returned an unreadable response (${response.status}). Please try again.` } as T & { error?: string };
  }
}

const blankProduct = (sortOrder: number): ManagedProduct => ({
  slug: "",
  name: "",
  shortName: "",
  category: "Pantry",
  tag: "NEW",
  price: 0,
  unit: "",
  image: "/images/farmose-groundnut-display.webp",
  video: "",
  imagePosition: "center",
  color: "#d9e9b5",
  rating: 5,
  reviews: 0,
  description: "",
  details: "",
  features: ["Locally sourced", "Carefully prepared", "Kitchen ready"],
  active: true,
  siteVisible: true,
  sortOrder,
});

const categoryOptions: Product["category"][] = ["Pantry", "Fresh Seafood", "Meat & Poultry", "Fresh Produce"];

export function AdminPanel({ adminName, adminRole, signOutPath }: { adminName: string; adminRole: AdminRole; signOutPath: string }) {
  const [tab, setTab] = useState<Tab>(adminRole === "orders" ? "orders" : "products");
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [theme, setTheme] = useState<SiteTheme>(defaultTheme);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [staffDraft, setStaffDraft] = useState<StaffUser>({ email: "", displayName: "", role: "editor", active: true });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<ManagedProduct>(blankProduct(0));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/catalog", { cache: "no-store" });
      const result = await readApiResponse<AdminPayload>(response);
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

  async function loadMedia() {
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const result = await readApiResponse<{ media?: MediaAsset[] }>(response);
      if (!response.ok) throw new Error(result.error || "Your media library could not be loaded.");
      setMedia(result.media ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your media library could not be loaded.");
    }
  }

  async function loadTeam() {
    if (adminRole !== "owner") return;
    try {
      const response = await fetch("/api/admin/team", { cache: "no-store" });
      const result = await readApiResponse<{ users?: StaffUser[] }>(response);
      if (!response.ok) throw new Error(result.error || "Staff access could not be loaded.");
      setStaff(result.users ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Staff access could not be loaded.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      if (adminRole !== "orders") void loadMedia();
      if (adminRole === "owner") void loadTeam();
    }, 0);
    return () => window.clearTimeout(timer);
    // This is the one-time admin bootstrap; later refreshes are explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveStaff(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/admin/team", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(staffDraft) });
    const result = await readApiResponse<Record<string, never>>(response);
    if (!response.ok) setError(result.error || "Staff access could not be saved.");
    else {
      setNotice("Staff access saved.");
      setStaffDraft({ email: "", displayName: "", role: "editor", active: true });
      await loadTeam();
    }
    setSaving(false);
  }

  async function removeStaff(email: string) {
    if (!window.confirm(`Remove admin access for ${email}?`)) return;
    const response = await fetch(`/api/admin/team?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    if (!response.ok) setError("Staff access could not be removed.");
    else { setNotice("Staff access removed."); await loadTeam(); }
  }

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
      const result = await readApiResponse<Record<string, never>>(response);
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
    const result = await readApiResponse<Record<string, never>>(response);
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

  async function uploadMedia(
    event: ChangeEvent<HTMLInputElement>,
    kind: "image" | "video",
    destination: "product" | "library" | ThemeImageKey = "product",
  ) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (!files.length) return;
    const invalidFile = files.find((file) => !(kind === "image" ? file.type.startsWith("image/") : file.type.startsWith("video/")));
    const maxBytes = (kind === "image" ? 12 : 40) * 1024 * 1024;
    if (invalidFile) {
      setError(`Choose a ${kind} file.`);
      return;
    }
    if (files.some((file) => file.size > maxBytes)) {
      setError(`${kind === "image" ? "Images" : "Videos"} must be smaller than ${kind === "image" ? "12" : "40"} MB.`);
      return;
    }

    setUploading(kind);
    setUploadProgress(0);
    setError("");
    try {
      const uploaded: MediaAsset[] = [];
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const file = files[fileIndex];
        const chunkSize = 512 * 1024;
        const total = Math.max(1, Math.ceil(file.size / chunkSize));
        const uploadId = crypto.randomUUID();
        let uploadedAsset: MediaAsset | null = null;
        for (let index = 0; index < total; index += 1) {
          const query = new URLSearchParams({ uploadId, index: String(index), total: String(total), name: file.name, type: file.type, size: String(file.size) });
          const response = await fetch(`/api/admin/upload?${query}`, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize)) });
          const body = await response.text();
          let result: Partial<MediaAsset> & { error?: string } = {};
          try { result = JSON.parse(body) as Partial<MediaAsset> & { error?: string }; } catch { /* Surface a readable error below. */ }
          if (!response.ok) throw new Error(result.error || `The ${kind} upload failed (${response.status}). Please try again.`);
          if (result.url && result.key) uploadedAsset = { key: result.key, url: result.url, kind, size: result.size ?? file.size, uploaded: new Date().toISOString() };
          setUploadProgress(Math.round((((fileIndex * total) + index + 1) / (files.length * total)) * 100));
        }
        if (!uploadedAsset) throw new Error(`The ${kind} upload did not finish.`);
        uploaded.push(uploadedAsset);
      }
      const firstUploaded = uploaded[0];
      if (firstUploaded && destination === "product") {
        if (kind === "image") {
          setDraft((current) => ({ ...current, image: firstUploaded.url, imageUrl: firstUploaded.url }));
        } else {
          updateDraft("video", firstUploaded.url);
        }
      }
      if (firstUploaded && destination !== "product" && destination !== "library" && kind === "image") {
        setTheme((current) => ({ ...current, [destination]: firstUploaded.url }));
      }
      setMedia((current) => [...uploaded, ...current]);
      if (destination === "product") {
        setNotice(`${uploaded.length} ${kind}${uploaded.length === 1 ? "" : "s"} added. The first file is selected for this product — save the product to publish it.`);
      } else if (destination === "library") {
        setNotice(`${uploaded.length} ${kind}${uploaded.length === 1 ? "" : "s"} added to the media library.`);
      } else {
        setNotice("Image uploaded and selected. Publish the storefront content to make it live.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `The ${kind} could not be uploaded.`);
    } finally {
      setUploading(null);
      setUploadProgress(0);
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
      const result = await readApiResponse<Record<string, never>>(response);
      if (!response.ok) throw new Error(result.error || "The storefront appearance could not be saved.");
      setNotice("Site content published.");
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

  function themeImageControl(label: string, key: ThemeImageKey) {
    return (
      <div className="admin-theme-image">
        <label className="admin-field"><span>{label}</span><input list="farmose-media-images" value={theme[key]} onChange={(event) => setTheme({ ...theme, [key]: event.target.value })} /></label>
        <div className="admin-upload admin-upload-compact">
          <div><strong>Upload {label.toLowerCase()}</strong><small>Choose an image directly from this device.</small></div>
          <label><input type="file" accept="image/*" onChange={(event) => void uploadMedia(event, "image", key)} />{uploading === "image" ? `Uploading ${uploadProgress}%` : "Choose image"}</label>
        </div>
      </div>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="Open Farmose storefront">
          <img src={theme.experienceLogoImage} alt="Farmose" />
          <span>Store manager</span>
        </a>
        <nav aria-label="Administration sections">
          {adminRole !== "orders" && <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><span>▦</span>Products <b>{activeCount}</b></button>}
          {adminRole !== "orders" && <button className={tab === "appearance" ? "active" : ""} onClick={() => setTab("appearance")}><span>◐</span>Content</button>}
          {adminRole !== "editor" && <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><span>◎</span>Orders {newOrders > 0 && <b>{newOrders}</b>}</button>}
          {adminRole !== "orders" && <button className={tab === "media" ? "active" : ""} onClick={() => { setTab("media"); void loadMedia(); }}><span>▧</span>Media</button>}
          {adminRole === "owner" && <button className={tab === "team" ? "active" : ""} onClick={() => { setTab("team"); void loadTeam(); }}><span>♙</span>Staff</button>}
        </nav>
        <div className="admin-account"><small>Signed in as</small><strong>{adminName}</strong><a href={signOutPath}>Sign out</a></div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div><p>FARMOSE ADMINISTRATION · {adminRole.toUpperCase()}</p><h1>{tab === "products" ? "Products" : tab === "appearance" ? "Storefront content" : tab === "media" ? "Media library" : tab === "team" ? "Staff & roles" : "Customer orders"}</h1></div>
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
                  <i><strong>{product.shortName}</strong><small>{money(product.price)} · {product.siteVisible ? "New site" : "Legacy"} · {product.active ? "Available" : "Unavailable"}</small></i>
                </button>
              ))}
            </section>
            <form className="admin-editor" onSubmit={saveProduct}>
              <div className="admin-section-title"><div><p>{selectedSlug ? "EDIT PRODUCT" : "NEW PRODUCT"}</p><h2>{draft.name || "Untitled product"}</h2></div><label className="admin-switch"><input type="checkbox" checked={draft.siteVisible} onChange={(event) => updateDraft("siteVisible", event.target.checked)} /><span>Show on new site</span></label></div>
              <div className="admin-product-preview" style={{ background: draft.color }}><span>{draft.tag || "PRODUCT"}</span><img src={draft.image} alt="Product preview" /><b>{money(Number(draft.price) || 0)}</b></div>
              <div className="admin-form-grid">
                <label><span>Product name</span><input required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} /></label>
                <label><span>Short name</span><input required value={draft.shortName} onChange={(event) => updateDraft("shortName", event.target.value)} /></label>
                <label><span>URL slug</span><input required disabled={Boolean(selectedSlug)} value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))} /></label>
                <label><span>Category</span><select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as Product["category"])}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label><span>Price (Le)</span><input required min="0" step="0.01" type="number" value={draft.price} onChange={(event) => updateDraft("price", Number(event.target.value))} /></label>
                <label><span>Unit</span><input required value={draft.unit} onChange={(event) => updateDraft("unit", event.target.value)} placeholder="e.g. 950 g jar" /></label>
                <label><span>{draft.slug.startsWith("pantry-") ? "Product type" : "Card label"}</span><input value={draft.tag} onChange={(event) => updateDraft("tag", event.target.value.toUpperCase())} /></label>
                <label><span>Card background</span><input type="color" value={draft.color} onChange={(event) => updateDraft("color", event.target.value)} /></label>
                <label><span>Display order</span><input type="number" value={draft.sortOrder} onChange={(event) => updateDraft("sortOrder", Number(event.target.value))} /></label>
                <label><span>Available for enquiry</span><input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} /></label>
                <label><span>Stock quantity (0 = untracked)</span><input type="number" min="0" value={draft.stockQuantity ?? 0} onChange={(event) => updateDraft("stockQuantity", Number(event.target.value))} /></label>
                <label><span>Image position</span><select value={draft.imagePosition || "center"} onChange={(event) => updateDraft("imagePosition", event.target.value)}><option>center</option><option>top</option><option>bottom</option><option>left</option><option>right</option></select></label>
              </div>
              <label className="admin-field"><span>{draft.slug.startsWith("pantry-") ? "Product description" : "Short card description"}</span><textarea required rows={3} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
              <label className="admin-field"><span>{draft.slug.startsWith("pantry-") ? "Pack format" : "Product page description"}</span><textarea required rows={4} value={draft.details} onChange={(event) => updateDraft("details", event.target.value)} /></label>
              <div className="admin-form-grid features-fields">{[0, 1, 2].map((index) => <label key={index}><span>{draft.slug.startsWith("pantry-") ? ["Serving ideas", "Storage", "Product fact"][index] : `Feature ${index + 1}`}</span><input value={draft.features[index] || ""} onChange={(event) => updateDraft("features", [0, 1, 2].map((featureIndex) => featureIndex === index ? event.target.value : draft.features[featureIndex] || ""))} /></label>)}</div>
              <div className="admin-upload"><div><strong>Product photos</strong><small>Select one or several images directly from this device. Files up to 12 MB are uploaded safely in small parts.</small></div><label><input type="file" accept="image/*" multiple onChange={(event) => void uploadMedia(event, "image")} />{uploading === "image" ? `Uploading ${uploadProgress}%` : "Choose photos from device"}</label></div>
              <div className="admin-upload"><div><strong>Product video</strong><small>Choose an MP4 or WebM directly from this device (up to 40 MB).</small></div><label><input type="file" accept="video/mp4,video/webm,video/*" onChange={(event) => void uploadMedia(event, "video")} />{uploading === "video" ? `Uploading ${uploadProgress}%` : "Choose video from device"}</label>{draft.video && <button type="button" className="admin-clear-media" onClick={() => updateDraft("video", "")}>Remove selected video</button>}</div>
              <section className="admin-media-picker" aria-label="Product media library">
                <div className="admin-section-title"><div><p>YOUR MEDIA LIBRARY</p><h2>Choose the product photo</h2><small>Click any image to use it for this product. No image URLs are needed.</small></div><button type="button" onClick={() => void loadMedia()}>Refresh</button></div>
                <div className="admin-media-grid compact">
                  {media.filter((asset) => asset.kind === "image").map((asset) => <button className={draft.image === asset.url ? "selected" : ""} type="button" key={asset.key} onClick={() => { setDraft((current) => ({ ...current, image: asset.url, imageUrl: asset.url })); setNotice("Photo selected. Save product to publish it."); }}><img src={asset.url} alt="Uploaded product option" /><span>{draft.image === asset.url ? "Selected" : "Use this photo"}</span></button>)}
                  {!media.some((asset) => asset.kind === "image") && <p className="admin-library-empty">Upload photos above and they will stay here for every product.</p>}
                </div>
              </section>
              <div className="admin-actions">{selectedSlug && <button className="danger" type="button" onClick={removeProduct}>Delete product</button>}<button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save product"}</button></div>
            </form>
          </div>
        )}

        {!loading && tab === "appearance" && (
          <form className="appearance-layout experience-settings" onSubmit={saveTheme}>
            <section className="appearance-controls">
              <div className="admin-section-title"><div><p>THE NEW FARMOSE SITE</p><h2>Brand and contact</h2><small>These fields update the supplied storefront design.</small></div></div>
              {themeImageControl("Site logo", "experienceLogoImage")}
              <label className="admin-field"><span>WhatsApp number</span><input type="tel" value={theme.whatsappNumber} onChange={(event) => setTheme({ ...theme, whatsappNumber: event.target.value })} /></label>
              <label className="admin-field"><span>Contact email</span><input type="email" value={theme.experienceEmail} onChange={(event) => setTheme({ ...theme, experienceEmail: event.target.value })} /></label>
              <label className="admin-field"><span>Address</span><input value={theme.storeAddress} onChange={(event) => setTheme({ ...theme, storeAddress: event.target.value })} /></label>
              <label className="admin-field"><span>Contact heading</span><textarea rows={3} value={theme.experienceContactHeading} onChange={(event) => setTheme({ ...theme, experienceContactHeading: event.target.value })} /></label>

              <div className="admin-section-title copy-title"><div><p>PAGE COPY</p><h2>Headings and introductions</h2></div></div>
              <label className="admin-field"><span>Homepage arc text</span><input value={theme.experienceArc} onChange={(event) => setTheme({ ...theme, experienceArc: event.target.value })} /></label>
              <label className="admin-field"><span>Production heading</span><input value={theme.experienceProductionTitle} onChange={(event) => setTheme({ ...theme, experienceProductionTitle: event.target.value })} /></label>
              <label className="admin-field"><span>Production introduction</span><textarea rows={3} value={theme.experienceProductionBody} onChange={(event) => setTheme({ ...theme, experienceProductionBody: event.target.value })} /></label>
              <label className="admin-field"><span>Experience heading</span><input value={theme.experienceExperienceTitle} onChange={(event) => setTheme({ ...theme, experienceExperienceTitle: event.target.value })} /></label>
              <label className="admin-field"><span>Experience introduction</span><textarea rows={3} value={theme.experienceExperienceBody} onChange={(event) => setTheme({ ...theme, experienceExperienceBody: event.target.value })} /></label>
              <label className="admin-field"><span>About heading</span><input value={theme.experienceAboutTitle} onChange={(event) => setTheme({ ...theme, experienceAboutTitle: event.target.value })} /></label>
              <label className="admin-field"><span>About introduction</span><textarea rows={3} value={theme.experienceAboutBody} onChange={(event) => setTheme({ ...theme, experienceAboutBody: event.target.value })} /></label>
              <label className="admin-field"><span>Privacy notice</span><textarea rows={4} value={theme.experiencePrivacyText} onChange={(event) => setTheme({ ...theme, experiencePrivacyText: event.target.value })} /></label>
              <datalist id="farmose-media-images">{media.filter((asset) => asset.kind === "image").map((asset) => <option key={asset.key} value={asset.url} />)}</datalist>
              <div className="admin-actions"><button className="primary" type="submit" disabled={saving}>{saving ? "Publishing…" : "Publish site content"}</button></div>
            </section>
          </form>
        )}

        {!loading && tab === "media" && (
          <section className="admin-media-library">
            <div className="admin-section-title"><div><p>ASSET LIBRARY</p><h2>Photos & videos</h2><small>Upload files on a product, then reuse them for any product from its editor.</small></div><button type="button" onClick={() => void loadMedia()}>Refresh library</button></div>
            <div className="admin-upload"><div><strong>Add images</strong><small>Upload brand, homepage, category or product images, then choose them in the Content or Products section.</small></div><label><input type="file" accept="image/*" multiple onChange={(event) => void uploadMedia(event, "image", "library")} />{uploading === "image" ? `Uploading ${uploadProgress}%` : "Choose images"}</label></div>
            <div className="admin-media-grid">
              {media.map((asset) => <article key={asset.key}>{asset.kind === "video" ? <video controls preload="metadata" src={asset.url} /> : <img src={asset.url} alt="Farmose media asset" />}<span>{asset.kind === "video" ? "Video" : "Photo"} · {Math.max(1, Math.round(asset.size / 1024))} KB</span></article>)}
              {!media.length && <p className="admin-library-empty">No uploaded media yet. Open a product and select files from your device.</p>}
            </div>
          </section>
        )}

        {!loading && tab === "team" && adminRole === "owner" && (
          <section className="admin-team admin-orders">
            <div className="admin-section-title"><div><p>ROLE-BASED ACCESS</p><h2>Staff accounts</h2><small>Staff sign in with their own ChatGPT identity. Editors manage products/content/media; order staff manage checkouts only.</small></div></div>
            <form className="admin-team-form admin-form-grid" onSubmit={saveStaff}>
              <label><span>Staff email</span><input required type="email" value={staffDraft.email} onChange={(event) => setStaffDraft({ ...staffDraft, email: event.target.value })} /></label>
              <label><span>Display name / username</span><input required value={staffDraft.displayName} onChange={(event) => setStaffDraft({ ...staffDraft, displayName: event.target.value })} /></label>
              <label><span>Role</span><select value={staffDraft.role} onChange={(event) => setStaffDraft({ ...staffDraft, role: event.target.value as StaffUser["role"] })}><option value="editor">Store editor</option><option value="orders">Order manager</option></select></label>
              <div className="admin-actions"><button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Add or update staff"}</button></div>
            </form>
            <div className="admin-team-list">
              {staff.map((member) => <article key={member.email}><div><strong>{member.displayName}</strong><small>{member.email}</small></div><div><b>{member.role === "editor" ? "Store editor" : "Order manager"}</b><small>{member.active ? "Active" : "Disabled"}</small></div><button type="button" className="danger" onClick={() => void removeStaff(member.email)}>Remove</button></article>)}
              {!staff.length && <div className="admin-empty"><h3>No staff accounts yet.</h3><p>Add a staff email above to grant the appropriate access.</p></div>}
            </div>
          </section>
        )}

        {!loading && tab === "orders" && (
          <section className="admin-orders">
            <div className="admin-section-title"><div><p>RECENT CHECKOUTS</p><h2>Orders from the storefront</h2></div></div>
            {orders.length === 0 ? <div className="admin-empty"><h3>No past checkouts.</h3><p>The new storefront sends enquiries directly through WhatsApp.</p></div> : orders.map((order) => (
              <article key={order.id}><div><strong>{order.orderNumber}</strong><small>{order.createdAt}</small></div><div><b>{order.customerName}</b><small>{order.phone} · {order.area}</small></div><div><b>{money(order.total)}</b><small>{order.paymentMethod}</small></div><select value={order.status} onChange={(event) => void updateOrderStatus(order.id, event.target.value)}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="preparing">Preparing</option><option value="out-for-delivery">Out for delivery</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
