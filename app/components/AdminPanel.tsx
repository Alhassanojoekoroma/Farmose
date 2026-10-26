"use client";
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { defaultTheme, money, Product, SiteTheme } from "../farmose-data";
import type { ManagedProduct } from "../catalog-server";
import { rolePermissions, type AdminPermission, type AdminRole } from "../../lib/permissions";
import type { PublicUpdate } from "../../lib/updates";
import { SignOutButton } from "./AdminLogin";

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

type Tab = "products" | "appearance" | "media" | "orders" | "updates" | "team";
type StaffUser = { email: string; displayName: string; role: AdminRole; permissions: AdminPermission[]; active: boolean };
type UpdateDraft = Omit<PublicUpdate, "endsAt"> & { endsAt: string };

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

const editablePermissions: AdminPermission[] = ["products", "content", "media", "orders", "updates"];
const permissionLabels: Record<AdminPermission, string> = {
  products: "Products", content: "Site content", media: "Media", orders: "Orders",
  updates: "News & offers", team: "Staff access",
};
const localDateTime = (iso: string) => {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const blankUpdate = (): UpdateDraft => ({
  id: "", kind: "news", title: "", summary: "", body: "", imageUrl: "",
  linkUrl: "", startsAt: localDateTime(new Date().toISOString()), endsAt: "", published: false,
});

export function AdminPanel({ adminEmail, adminName, adminRole, permissions }: { adminEmail: string; adminName: string; adminRole: AdminRole; permissions: AdminPermission[] }) {
  const can = (permission: AdminPermission) => permissions.includes(permission);
  const firstTab: Tab = can("products") ? "products" : can("orders") ? "orders" : can("content") ? "appearance" : can("updates") ? "updates" : can("media") ? "media" : "team";
  const [tab, setTab] = useState<Tab>(firstTab);
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [theme, setTheme] = useState<SiteTheme>(defaultTheme);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [staffDraft, setStaffDraft] = useState<StaffUser>({ email: "", displayName: "", role: "editor", permissions: [...rolePermissions.editor], active: true });
  const [updates, setUpdates] = useState<PublicUpdate[]>([]);
  const [updateDraft, setUpdateDraft] = useState<UpdateDraft>(blankUpdate());
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<ManagedProduct>(blankProduct(0));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(() => Date.now());

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
    if (!can("team")) return;
    try {
      const response = await fetch("/api/admin/team", { cache: "no-store" });
      const result = await readApiResponse<{ users?: StaffUser[] }>(response);
      if (!response.ok) throw new Error(result.error || "Staff access could not be loaded.");
      setStaff(result.users ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Staff access could not be loaded.");
    }
  }

  async function loadUpdates() {
    if (!can("updates")) return;
    try {
      const response = await fetch("/api/admin/updates", { cache: "no-store" });
      const result = await readApiResponse<{ updates?: PublicUpdate[] }>(response);
      if (!response.ok) throw new Error(result.error || "News and offers could not be loaded.");
      setUpdates(result.updates ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "News and offers could not be loaded.");
    }
  }

  useEffect(() => {
    const clockTimer = window.setInterval(() => setClock(Date.now()), 60_000);
    const timer = window.setTimeout(() => {
      void load();
      if (can("media")) void loadMedia();
      if (can("team")) void loadTeam();
      if (can("updates")) void loadUpdates();
    }, 0);
    return () => { window.clearTimeout(timer); window.clearInterval(clockTimer); };
    // This is the one-time admin bootstrap; later refreshes are explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveStaff(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/team", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(staffDraft) });
      const result = await readApiResponse<Record<string, never>>(response);
      if (!response.ok) throw new Error(result.error || "Account access could not be saved.");
      setNotice("Account access saved. Share the Farmose admin link so they can create their own password and verify their email.");
      setStaffDraft({ email: "", displayName: "", role: "editor", permissions: [...rolePermissions.editor], active: true });
      await loadTeam();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Account access could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function removeStaff(email: string) {
    if (!window.confirm(`Remove admin access for ${email}?`)) return;
    const response = await fetch(`/api/admin/team?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    if (!response.ok) setError("Staff access could not be removed.");
    else { setNotice("Staff access removed."); await loadTeam(); }
  }

  function editUpdate(item: PublicUpdate) {
    setUpdateDraft({
      ...item,
      startsAt: localDateTime(item.startsAt),
      endsAt: item.endsAt ? localDateTime(item.endsAt) : "",
    });
    setNotice("");
    setError("");
  }

  async function saveUpdate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/updates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updateDraft,
          startsAt: new Date(updateDraft.startsAt).toISOString(),
          endsAt: updateDraft.endsAt ? new Date(updateDraft.endsAt).toISOString() : null,
        }),
      });
      const result = await readApiResponse<{ id?: string }>(response);
      if (!response.ok) throw new Error(result.error || "The update could not be saved.");
      setNotice(updateDraft.published ? "Update published for its scheduled period." : "Draft update saved.");
      setUpdateDraft(blankUpdate());
      await loadUpdates();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The update could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function removeUpdate(id: string) {
    if (!window.confirm("Delete this update?")) return;
    const response = await fetch(`/api/admin/updates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = await readApiResponse<Record<string, never>>(response);
    if (!response.ok) setError(result.error || "The update could not be deleted.");
    else {
      setNotice("Update deleted.");
      if (updateDraft.id === id) setUpdateDraft(blankUpdate());
      await loadUpdates();
    }
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

  function updateProductDraft<K extends keyof ManagedProduct>(key: K, value: ManagedProduct[K]) {
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
    destination: "product" | "library" | "update" | ThemeImageKey = "product",
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
          updateProductDraft("video", firstUploaded.url);
        }
      }
      if (firstUploaded && destination === "update" && kind === "image") {
        setUpdateDraft((current) => ({ ...current, imageUrl: firstUploaded.url }));
      }
      if (firstUploaded && destination !== "product" && destination !== "library" && destination !== "update" && kind === "image") {
        setTheme((current) => ({ ...current, [destination]: firstUploaded.url }));
      }
      setMedia((current) => [...uploaded, ...current]);
      if (destination === "product") {
        setNotice(`${uploaded.length} ${kind}${uploaded.length === 1 ? "" : "s"} added. The first file is selected for this product — save the product to publish it.`);
      } else if (destination === "library") {
        setNotice(`${uploaded.length} ${kind}${uploaded.length === 1 ? "" : "s"} added to the media library.`);
      } else if (destination === "update") {
        setNotice("Photo uploaded and selected. Save the update to publish it.");
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
        {can("media") && <div className="admin-upload admin-upload-compact">
          <div><strong>Upload {label.toLowerCase()}</strong><small>Choose an image directly from this device.</small></div>
          <label><input type="file" accept="image/*" onChange={(event) => void uploadMedia(event, "image", key)} />{uploading === "image" ? `Uploading ${uploadProgress}%` : "Choose image"}</label>
        </div>}
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
          {can("products") && <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><span>▦</span>Products <b>{activeCount}</b></button>}
          {can("content") && <button className={tab === "appearance" ? "active" : ""} onClick={() => setTab("appearance")}><span>◐</span>Content</button>}
          {can("orders") && <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><span>◎</span>Orders {newOrders > 0 && <b>{newOrders}</b>}</button>}
          {can("updates") && <button className={tab === "updates" ? "active" : ""} onClick={() => { setTab("updates"); void loadUpdates(); }}><span>✦</span>News & offers</button>}
          {can("media") && <button className={tab === "media" ? "active" : ""} onClick={() => { setTab("media"); void loadMedia(); }}><span>▧</span>Media</button>}
          {can("team") && <button className={tab === "team" ? "active" : ""} onClick={() => { setTab("team"); void loadTeam(); }}><span>♙</span>Team</button>}
        </nav>
        <div className="admin-account"><small>Signed in as</small><strong>{adminName}</strong><SignOutButton /></div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div><p>FARMOSE ADMINISTRATION · {adminRole.toUpperCase()}</p><h1>{tab === "products" ? "Products" : tab === "appearance" ? "Storefront content" : tab === "media" ? "Media library" : tab === "updates" ? "News & offers" : tab === "team" ? "Team & roles" : "Customer orders"}</h1></div>
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
              <div className="admin-section-title"><div><p>{selectedSlug ? "EDIT PRODUCT" : "NEW PRODUCT"}</p><h2>{draft.name || "Untitled product"}</h2></div><label className="admin-switch"><input type="checkbox" checked={draft.siteVisible} onChange={(event) => updateProductDraft("siteVisible", event.target.checked)} /><span>Show on new site</span></label></div>
              <div className="admin-product-preview" style={{ background: draft.color }}><span>{draft.tag || "PRODUCT"}</span><img src={draft.image} alt="Product preview" /><b>{money(Number(draft.price) || 0)}</b></div>
              <div className="admin-form-grid">
                <label><span>Product name</span><input required value={draft.name} onChange={(event) => updateProductDraft("name", event.target.value)} /></label>
                <label><span>Short name</span><input required value={draft.shortName} onChange={(event) => updateProductDraft("shortName", event.target.value)} /></label>
                <label><span>URL slug</span><input required disabled={Boolean(selectedSlug)} value={draft.slug} onChange={(event) => updateProductDraft("slug", event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))} /></label>
                <label><span>Category</span><select value={draft.category} onChange={(event) => updateProductDraft("category", event.target.value as Product["category"])}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label><span>Price (Le)</span><input required min="0" step="0.01" type="number" value={draft.price} onChange={(event) => updateProductDraft("price", Number(event.target.value))} /></label>
                <label><span>Unit</span><input required value={draft.unit} onChange={(event) => updateProductDraft("unit", event.target.value)} placeholder="e.g. 950 g jar" /></label>
                <label><span>{draft.slug.startsWith("pantry-") ? "Product type" : "Card label"}</span><input value={draft.tag} onChange={(event) => updateProductDraft("tag", event.target.value.toUpperCase())} /></label>
                <label><span>Card background</span><input type="color" value={draft.color} onChange={(event) => updateProductDraft("color", event.target.value)} /></label>
                <label><span>Display order</span><input type="number" value={draft.sortOrder} onChange={(event) => updateProductDraft("sortOrder", Number(event.target.value))} /></label>
                <label><span>Available for enquiry</span><input type="checkbox" checked={draft.active} onChange={(event) => updateProductDraft("active", event.target.checked)} /></label>
                <label><span>Stock quantity (0 = untracked)</span><input type="number" min="0" value={draft.stockQuantity ?? 0} onChange={(event) => updateProductDraft("stockQuantity", Number(event.target.value))} /></label>
                <label><span>Image position</span><select value={draft.imagePosition || "center"} onChange={(event) => updateProductDraft("imagePosition", event.target.value)}><option>center</option><option>top</option><option>bottom</option><option>left</option><option>right</option></select></label>
              </div>
              <label className="admin-field"><span>{draft.slug.startsWith("pantry-") ? "Product description" : "Short card description"}</span><textarea required rows={3} value={draft.description} onChange={(event) => updateProductDraft("description", event.target.value)} /></label>
              <label className="admin-field"><span>{draft.slug.startsWith("pantry-") ? "Pack format" : "Product page description"}</span><textarea required rows={4} value={draft.details} onChange={(event) => updateProductDraft("details", event.target.value)} /></label>
              <div className="admin-form-grid features-fields">{[0, 1, 2].map((index) => <label key={index}><span>{draft.slug.startsWith("pantry-") ? ["Serving ideas", "Storage", "Product fact"][index] : `Feature ${index + 1}`}</span><input value={draft.features[index] || ""} onChange={(event) => updateProductDraft("features", [0, 1, 2].map((featureIndex) => featureIndex === index ? event.target.value : draft.features[featureIndex] || ""))} /></label>)}</div>
              <label className="admin-field"><span>Product photo URL</span><input value={draft.image} onChange={(event) => { updateProductDraft("image", event.target.value); updateProductDraft("imageUrl", event.target.value); }} placeholder="https://... or /images/..." /></label>
              {can("media") && <div className="admin-upload"><div><strong>Product photos</strong><small>Select one or several images directly from this device. Files up to 12 MB are uploaded safely in small parts.</small></div><label><input type="file" accept="image/*" multiple onChange={(event) => void uploadMedia(event, "image")} />{uploading === "image" ? `Uploading ${uploadProgress}%` : "Choose photos from device"}</label></div>}
              {can("media") && <div className="admin-upload"><div><strong>Product video</strong><small>Choose an MP4 or WebM directly from this device (up to 40 MB).</small></div><label><input type="file" accept="video/mp4,video/webm,video/*" onChange={(event) => void uploadMedia(event, "video")} />{uploading === "video" ? `Uploading ${uploadProgress}%` : "Choose video from device"}</label>{draft.video && <button type="button" className="admin-clear-media" onClick={() => updateProductDraft("video", "")}>Remove selected video</button>}</div>}
              {can("media") && <section className="admin-media-picker" aria-label="Product media library">
                <div className="admin-section-title"><div><p>YOUR MEDIA LIBRARY</p><h2>Choose the product photo</h2><small>Click any image to use it for this product. No image URLs are needed.</small></div><button type="button" onClick={() => void loadMedia()}>Refresh</button></div>
                <div className="admin-media-grid compact">
                  {media.filter((asset) => asset.kind === "image").map((asset) => <button className={draft.image === asset.url ? "selected" : ""} type="button" key={asset.key} onClick={() => { setDraft((current) => ({ ...current, image: asset.url, imageUrl: asset.url })); setNotice("Photo selected. Save product to publish it."); }}><img src={asset.url} alt="Uploaded product option" /><span>{draft.image === asset.url ? "Selected" : "Use this photo"}</span></button>)}
                  {!media.some((asset) => asset.kind === "image") && <p className="admin-library-empty">Upload photos above and they will stay here for every product.</p>}
                </div>
              </section>}
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

        {!loading && tab === "updates" && can("updates") && (
          <section className="admin-updates">
            <div className="admin-section-title"><div><p>PUBLIC JOURNAL</p><h2>News, promotions & visits</h2><small>Published items appear only from their start time until their end time. Leave the end blank to keep an item visible.</small></div><a href="/updates" target="_blank" rel="noreferrer">View public page ↗</a></div>
            <div className="admin-updates-layout">
              <form className="admin-editor admin-update-editor" onSubmit={saveUpdate}>
                <div className="admin-section-title"><div><p>{updateDraft.id ? "EDIT UPDATE" : "NEW UPDATE"}</p><h2>{updateDraft.title || "Untitled update"}</h2></div></div>
                <div className="admin-form-grid">
                  <label><span>Type</span><select value={updateDraft.kind} onChange={(event) => setUpdateDraft({ ...updateDraft, kind: event.target.value as PublicUpdate["kind"] })}><option value="promotion">Promotion</option><option value="news">News</option><option value="visit">Place visited</option><option value="program">Program attended</option></select></label>
                  <label><span>Title</span><input required maxLength={160} value={updateDraft.title} onChange={(event) => setUpdateDraft({ ...updateDraft, title: event.target.value })} /></label>
                </div>
                <label><span>Short introduction</span><textarea rows={3} maxLength={350} value={updateDraft.summary} onChange={(event) => setUpdateDraft({ ...updateDraft, summary: event.target.value })} /></label>
                <label><span>Full story or offer details</span><textarea rows={6} maxLength={6000} value={updateDraft.body} onChange={(event) => setUpdateDraft({ ...updateDraft, body: event.target.value })} /></label>
                <div className="admin-form-grid">
                  <label><span>Show from</span><input required type="datetime-local" value={updateDraft.startsAt} onChange={(event) => setUpdateDraft({ ...updateDraft, startsAt: event.target.value })} /></label>
                  <label><span>Hide after (optional)</span><input type="datetime-local" min={updateDraft.startsAt} value={updateDraft.endsAt} onChange={(event) => setUpdateDraft({ ...updateDraft, endsAt: event.target.value })} /></label>
                </div>
                 <small>Times use your device&apos;s local time. The website applies them automatically.</small>
                <label><span>Photo URL (optional)</span><input type="url" value={updateDraft.imageUrl} onChange={(event) => setUpdateDraft({ ...updateDraft, imageUrl: event.target.value })} placeholder="https://..." /></label>
                <div className="admin-upload admin-upload-compact"><div><strong>Add a photo</strong><small>Choose an image from your device or enter a photo URL.</small></div><label><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadMedia(event, "image", "update")} />{uploading === "image" ? `Uploading ${uploadProgress}%` : "Choose photo"}</label></div>
                {can("media") && media.some((asset) => asset.kind === "image") && <div className="admin-media-grid compact">{media.filter((asset) => asset.kind === "image").slice(0, 12).map((asset) => <button key={asset.key} type="button" className={updateDraft.imageUrl === asset.url ? "selected" : ""} onClick={() => setUpdateDraft({ ...updateDraft, imageUrl: asset.url })}><img src={asset.url} alt="" /><span>{updateDraft.imageUrl === asset.url ? "Selected" : "Use photo"}</span></button>)}</div>}
                <label><span>More information link (optional)</span><input type="url" value={updateDraft.linkUrl} onChange={(event) => setUpdateDraft({ ...updateDraft, linkUrl: event.target.value })} placeholder="https://..." /></label>
                <label className="admin-switch"><input type="checkbox" checked={updateDraft.published} onChange={(event) => setUpdateDraft({ ...updateDraft, published: event.target.checked })} /><span>Publish during the scheduled period</span></label>
                <div className="admin-actions"><button type="button" onClick={() => setUpdateDraft(blankUpdate())}>New update</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save update"}</button></div>
              </form>
              <section className="admin-orders admin-update-list" aria-label="Saved updates">
                <div className="admin-section-title"><div><p>SAVED UPDATES</p><h2>Schedule</h2></div></div>
                {updates.map((item) => {
                   const now = clock;
                  const status = !item.published ? "Draft" : now < Date.parse(item.startsAt) ? "Scheduled" : item.endsAt && now >= Date.parse(item.endsAt) ? "Expired" : "Live";
                  return <article key={item.id}><div><strong>{item.title}</strong><small>{item.kind} · {status}</small><small>{new Date(item.startsAt).toLocaleString()} {item.endsAt ? `to ${new Date(item.endsAt).toLocaleString()}` : "onward"}</small></div><div className="admin-update-list-actions"><button type="button" onClick={() => editUpdate(item)}>Edit</button><button type="button" className="danger" onClick={() => void removeUpdate(item.id)}>Delete</button></div></article>;
                })}
                {!updates.length && <div className="admin-empty"><h3>No updates yet.</h3><p>Add your first announcement when you are ready.</p></div>}
              </section>
            </div>
          </section>
        )}

        {!loading && tab === "team" && can("team") && (
          <section className="admin-team admin-orders">
             <div className="admin-section-title"><div><p>ROLE-BASED ACCESS</p><h2>Business owners &amp; staff</h2><small>Approve an email and choose its access. Business owners can manage Farmose and the team. Each person creates their own password and verifies their email at the Farmose admin link.</small></div></div>
            <form className="admin-team-form admin-form-grid" onSubmit={saveStaff}>
              <label><span>Account email</span><input required type="email" value={staffDraft.email} onChange={(event) => setStaffDraft({ ...staffDraft, email: event.target.value })} /></label>
              <label><span>Display name / username</span><input required value={staffDraft.displayName} onChange={(event) => setStaffDraft({ ...staffDraft, displayName: event.target.value })} /></label>
              <label><span>Role</span><select value={staffDraft.role} onChange={(event) => {
                const role = event.target.value as StaffUser["role"];
                setStaffDraft({ ...staffDraft, role, permissions: role === "custom" ? staffDraft.permissions.filter((permission) => permission !== "team") : [...rolePermissions[role]] });
              }}><option value="owner">Business owner — full control</option><option value="editor">Store editor</option><option value="orders">Order manager</option><option value="content">Content editor</option><option value="media">Media manager</option><option value="updates">News & offers editor</option><option value="custom">Custom permissions</option></select></label>
              <label className="admin-switch"><input type="checkbox" checked={staffDraft.active} onChange={(event) => setStaffDraft({ ...staffDraft, active: event.target.checked })} /><span>Access active</span></label>
              <fieldset className="admin-permissions" disabled={staffDraft.role === "owner"}><legend>{staffDraft.role === "owner" ? "Full control, including team management" : "Allowed sections"}</legend>{editablePermissions.map((permission) => <label key={permission}><input type="checkbox" checked={staffDraft.permissions.includes(permission)} onChange={(event) => setStaffDraft((current) => ({ ...current, role: "custom", permissions: event.target.checked ? [...current.permissions, permission] : current.permissions.filter((value) => value !== permission) }))} />{permissionLabels[permission]}</label>)}</fieldset>
              <div className="admin-actions"><button type="button" onClick={() => setStaffDraft({ email: "", displayName: "", role: "editor", permissions: [...rolePermissions.editor], active: true })}>Clear form</button><button className="primary" type="submit" disabled={saving || !staffDraft.permissions.length}>{saving ? "Saving…" : "Save account access"}</button></div>
            </form>
            <div className="admin-team-list">
              {staff.map((member) => <article key={member.email}><div><strong>{member.displayName}</strong><small>{member.email}</small></div><div><b>{member.role === "owner" ? "Business owner" : member.role === "custom" ? "Custom" : member.role}</b><small>{member.permissions.map((permission) => permissionLabels[permission]).join(", ")}</small><small>{member.active ? "Active" : "Disabled"}</small></div><div className="admin-staff-actions"><button type="button" disabled={member.email === adminEmail} onClick={() => setStaffDraft({ ...member })}>Edit</button><button type="button" className="danger" disabled={member.email === adminEmail} onClick={() => void removeStaff(member.email)}>Remove</button></div></article>)}
              {!staff.length && <div className="admin-empty"><h3>No additional accounts yet.</h3><p>Add a business owner or staff email above to approve their access.</p></div>}
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
