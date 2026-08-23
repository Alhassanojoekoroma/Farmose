"use client";

import Image from "next/image";
import Link from "next/link";
import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { defaultTheme, money, products as fallbackProducts, Product, SiteTheme } from "../farmose-data";
import { CylinderCarousel } from "./CylinderCarousel";

type View = "home" | "shop" | "product" | "checkout" | "wholesale" | "about";
type PurchaseType = "once" | "weekly";
type CartLine = { slug: string; quantity: number; purchaseType?: PurchaseType };
type StorefrontProps = { view: View; slug?: string; category?: string; products?: Product[]; theme?: SiteTheme };

function whatsappUrl(message: string, configuredNumber = defaultTheme.whatsappNumber) {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || configuredNumber).replace(/\D/g, "");
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

function linePrice(product: Product, line: CartLine) {
  return line.purchaseType === "weekly" ? product.price * 0.95 : product.price;
}

function cartMessage(lines: CartLine[], products: Product[]) {
  const selected = lines.map((line) => {
    const product = products.find((item) => item.slug === line.slug);
    return product ? `• ${product.name} × ${line.quantity}${line.purchaseType === "weekly" ? " (weekly)" : ""} — ${money(linePrice(product, line) * line.quantity)}` : "";
  }).filter(Boolean).join("\n");
  const total = lines.reduce((sum, line) => {
    const product = products.find((item) => item.slug === line.slug);
    return sum + (product ? linePrice(product, line) : 0) * line.quantity;
  }, 0);
  return `Hello Farmose! I would like to order:\n\n${selected}\n\nSubtotal: ${money(total)}\n\nPlease confirm availability and delivery.`;
}

function productImageSource(product: Product) {
  return product.image || product.imageUrl || "/images/farmose-groundnut-display.webp";
}

function ProductImage({ product, sizes, priority = false, alt = product.name }: { product: Product; sizes: string; priority?: boolean; alt?: string }) {
  const source = productImageSource(product);
  return <Image src={source} alt={alt} fill sizes={sizes} priority={priority} unoptimized={source.startsWith("http") && !source.startsWith("https://res.cloudinary.com/")} style={{ objectPosition: product.imagePosition ?? "center" }} />;
}

function ProductCard({ product, onAdd, priority = false }: { product: Product; onAdd: (slug: string) => void; priority?: boolean }) {
  return (
    <article className="product-card-wrap">
      <a className="product-card" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
        <ProductImage product={product} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={priority} />
      </a>
      <div className="product-copy">
        <a href={`/products/${product.slug}`}><h3>{product.name}</h3><p className="product-price">{money(product.price)} <span>· {product.unit}</span></p></a>
        <button className="quick-add" type="button" onClick={() => onAdd(product.slug)} aria-label={`Add ${product.name} to cart`}>Add</button>
      </div>
    </article>
  );
}

function Header({ cartCount, onCart, announcement, logoImage }: { cartCount: number; onCart: () => void; announcement: string; logoImage: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  return (
    <div className="top-navigation">
      <div className="announcement">{announcement}</div>
      <header className="site-header">
        <nav className="nav-shell" aria-label="Main navigation">
          <button className="mobile-menu" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close menu" : "Open menu"}><span aria-hidden="true">{menuOpen ? "×" : "☰"}</span></button>
          <div className="nav-left desktop-nav"><a href="/shop">Shop</a><a href="/about">About</a></div>
          <Link className="brand-logo" href="/" aria-label="Farmose home"><Image src={logoImage} width={112} height={70} sizes="112px" alt="Farmose" priority /></Link>
          <div className="nav-right desktop-nav"><a href="/wholesale">Bulk orders</a><a href="/about#contact">Contact</a></div>
          <button className="cart-button" type="button" onClick={onCart} aria-label={`Open cart with ${cartCount} items`}><span className="bag-icon" style={{ display: "block" }} aria-hidden="true"><i /></span><b>{cartCount}</b></button>
        </nav>
      </header>
      {menuOpen && <nav className="mobile-navigation" id="mobile-navigation" aria-label="Mobile navigation"><a href="/shop">Shop products</a><a href="/wholesale">Bulk orders</a><a href="/about">About Farmose</a><a href="/about#contact">Contact</a></nav>}
    </div>
  );
}

function CartDrawer({ open, lines, onClose, onQuantity, products, whatsappNumber }: { open: boolean; lines: CartLine[]; onClose: () => void; onQuantity: (slug: string, quantity: number) => void; products: Product[]; whatsappNumber: string }) {
  const subtotal = lines.reduce((sum, line) => {
    const product = products.find((item) => item.slug === line.slug);
    return sum + (product ? linePrice(product, line) : 0) * line.quantity;
  }, 0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.classList.add("drawer-open");
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.classList.remove("drawer-open"); window.removeEventListener("keydown", onKeyDown); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button className="drawer-scrim" type="button" onClick={onClose} aria-label="Close cart" />
      <aside className="cart-drawer">
        <div className="drawer-header"><div><p className="eyebrow">YOUR BASKET</p><h2>Cart</h2></div><button type="button" onClick={onClose} aria-label="Close cart">×</button></div>
        <div className="drawer-items">
          {lines.length === 0 && <div className="empty-cart"><h3>Your basket is empty.</h3><p>Browse clean local produce and add what you need.</p><a className="button dark" href="/shop">Explore products</a></div>}
          {lines.map((line) => {
            const product = products.find((item) => item.slug === line.slug);
            if (!product) return null;
            return <article className="drawer-item" key={line.slug}><div className="drawer-item-image"><ProductImage product={product} sizes="72px" alt="" /></div><section><h3>{product.name}</h3><p>{product.unit}{line.purchaseType === "weekly" ? " · weekly" : ""}</p><div className="qty"><button type="button" onClick={() => onQuantity(line.slug, line.quantity - 1)} aria-label={`Decrease ${product.name} quantity`}>−</button><span aria-live="polite">{line.quantity}</span><button type="button" onClick={() => onQuantity(line.slug, line.quantity + 1)} aria-label={`Increase ${product.name} quantity`}>＋</button></div></section><b>{money(linePrice(product, line) * line.quantity)}</b></article>;
          })}
        </div>
        {lines.length > 0 && <div className="drawer-footer"><div className="subtotal"><span>Subtotal</span><b>{money(subtotal)}</b></div><p>{subtotal >= 500 ? "Freetown delivery is free." : "Free Freetown delivery from Le 500."}</p><a className="button dark wide" href="/checkout">Checkout — {money(subtotal)}</a><a className="text-action" href={whatsappUrl(cartMessage(lines, products), whatsappNumber)} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> Order this cart via WhatsApp</a></div>}
      </aside>
    </div>
  );
}

function Home({ onAdd, products, theme }: { onAdd: (slug: string) => void; products: Product[]; theme: SiteTheme }) {
  const categories = Array.from(new Set(products.map((product) => product.category)));
  const carouselImages = products.slice(0, 3).map((product) => ({
    src: productImageSource(product),
    alt: product.name,
    position: product.imagePosition,
  }));
  while (carouselImages.length < 3) {
    carouselImages.push({ src: theme.heroImage, alt: "Farmose local produce", position: "center" });
  }
  return (
    <main>
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="hero-copy"><p className="eyebrow">CLEAN LOCAL FOOD · SIERRA LEONE</p><h1 id="home-hero-title">{theme.heroTitle} <em>{theme.heroEmphasis}</em></h1><p>{theme.heroBody}</p><div className="button-row"><a className="button dark" href="/shop">Explore products</a><a className="button outline" href="/wholesale">Bulk orders</a></div></div>
        <CylinderCarousel images={carouselImages} aria-label="Featured Farmose products" />
        <div className="hero-trust" aria-label="Why shop Farmose"><span><i aria-hidden="true">✓</i> Carefully prepared</span><span><i aria-hidden="true">✓</i> Freetown delivery</span><span><i aria-hidden="true">✓</i> Bulk supply</span></div>
      </section>
      <section className="section products-section">
        <div className="section-heading compact-heading"><div><p className="eyebrow">SHOP FARMOSE</p><h2>{theme.categoryHeading}</h2></div><a className="text-link" href="/shop">View all products <span aria-hidden="true">→</span></a></div>
        <nav className="category-links" aria-label="Product categories">{categories.map((category) => <a key={category} href={`/shop?category=${encodeURIComponent(category)}`}>{category}</a>)}</nav>
        <div className="product-grid home-grid">{products.slice(0, 4).map((product, index) => <ProductCard key={product.slug} product={product} onAdd={onAdd} priority={index < 2} />)}</div>
      </section>
      <section className="standard-section">
        <div className="standard-photo"><Image src={theme.standardImage} alt="Farmose products in the Freetown store" fill sizes="(max-width: 760px) 100vw, 48vw" /></div>
        <div className="standard-copy"><p className="eyebrow">{theme.standardEyebrow}</p><h2>{theme.standardTitle} {theme.standardEmphasis}</h2><p className="lead">{theme.standardBody}</p><a className="text-link" href="/about">How Farmose works <span aria-hidden="true">→</span></a></div>
      </section>
      <section className="wholesale-band"><div><p className="eyebrow">FOR BUSINESS</p><h2>Need a dependable bulk supply?</h2></div><a className="button light" href="/wholesale">Start a wholesale order</a></section>
    </main>
  );
}

function Shop({ onAdd, products, initialCategory }: { onAdd: (slug: string) => void; products: Product[]; initialCategory?: string }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const [category, setCategory] = useState(initialCategory && categories.includes(initialCategory) ? initialCategory : "All");
  const [search, setSearch] = useState("");
  const visible = products.filter((product) => (category === "All" || product.category === category) && `${product.name} ${product.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <main className="shop-page"><section className="section shop-section">
      <header className="shop-intro"><p className="eyebrow">PRODUCTS</p><h1>Shop Farmose</h1><p>Clean local food for home and business.</p></header>
      <div className="shop-tools"><div className="category-pills" role="group" aria-label="Filter products by category">{categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-field"><span className="sr-only">Search products</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products" /></label></div>
      <p className="result-count" aria-live="polite">{visible.length} {visible.length === 1 ? "product" : "products"}</p>
      <div className="product-grid shop-grid">{visible.map((product, index) => <ProductCard key={product.slug} product={product} onAdd={onAdd} priority={index < 4} />)}</div>
      {visible.length === 0 && <div className="no-results"><h2>No matching products.</h2><p>Try another category or search term.</p></div>}
      <aside className="shop-bulk-note"><div><h2>Ordering for a business?</h2><p>Ask about regular supply, custom quantities and preparation.</p></div><a className="button outline" href="/wholesale">Bulk orders</a></aside>
    </section></main>
  );
}

function ProductPage({ product, products, onAdd }: { product: Product; products: Product[]; onAdd: (slug: string, quantity?: number, purchaseType?: PurchaseType) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("once");
  const selectedPrice = purchaseType === "weekly" ? product.price * 0.95 : product.price;
  return (
    <main className="product-page">
      <section className="product-detail">
        <div className="product-gallery"><div className="product-main-image"><ProductImage product={product} sizes="(max-width: 820px) 100vw, 50vw" priority /></div><ul className="feature-list" aria-label="Product highlights">{product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></div>
        <div className="product-info"><nav className="product-breadcrumb" aria-label="Breadcrumb"><a href="/shop">Shop</a><span>/</span><a href={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</a></nav><p className="eyebrow">{product.tag}</p><h1>{product.name}</h1><p className="detail-price">{money(product.price)} <span>/ {product.unit}</span></p><p className="detail-description">{product.details}</p><p className="availability"><i /> Available for Freetown delivery or pickup</p>
          <fieldset className="purchase-options"><legend>Order frequency</legend><label className={purchaseType === "once" ? "selected" : ""}><input type="radio" name="purchase-type" checked={purchaseType === "once"} onChange={() => setPurchaseType("once")} /><span><b>One-time</b><small>{money(product.price)}</small></span></label><label className={purchaseType === "weekly" ? "selected" : ""}><input type="radio" name="purchase-type" checked={purchaseType === "weekly"} onChange={() => setPurchaseType("weekly")} /><span><b>Weekly · save 5%</b><small>{money(product.price * 0.95)}</small></span></label></fieldset>
          <div className="purchase-row"><div className="qty big" aria-label="Quantity"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">＋</button></div><button className="button dark grow" type="button" onClick={() => onAdd(product.slug, quantity, purchaseType)}>Add to cart — {money(selectedPrice * quantity)}</button></div>
          <div className="product-help"><span>Buying in volume?</span><a href="/wholesale">Request a bulk quote →</a></div><p className="microcopy">We confirm fresh-item availability and delivery timing after you order.</p>
        </div>
      </section>
      <section className="product-content section"><article><p className="eyebrow">ABOUT THIS PRODUCT</p><h2>{product.shortName}, prepared the Farmose way.</h2><p>{product.description}</p></article><article><p className="eyebrow">HOW TO USE IT</p><h2>Less prep. More good food.</h2><p>Open the pack, follow your usual recipe and enjoy familiar local flavour with less sorting and cleaning.</p></article></section>
      {product.video && <section className="product-video-block section"><div><p className="eyebrow">SEE THE PRODUCT</p><h2>Prepared for your kitchen.</h2></div><video controls playsInline preload="metadata" poster={product.image}><source src={product.video} />Your browser does not support product videos.</video></section>}
      <section className="section recommendations"><div className="section-heading compact-heading"><div><p className="eyebrow">MORE FROM FARMOSE</p><h2>You may also like.</h2></div><a className="text-link" href="/shop">Shop all →</a></div><div className="product-grid home-grid">{products.filter((item) => item.slug !== product.slug).slice(0, 4).map((item) => <ProductCard key={item.slug} product={item} onAdd={onAdd} />)}</div></section>
    </main>
  );
}

function Checkout({ lines, clearCart, products, whatsappNumber }: { lines: CartLine[]; clearCart: () => void; products: Product[]; whatsappNumber: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const subtotal = lines.reduce((sum, line) => { const product = products.find((item) => item.slug === line.slug); return sum + (product ? linePrice(product, line) : 0) * line.quantity; }, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 25;
  const total = subtotal + deliveryFee;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = { customerName: form.get("name"), phone: form.get("phone"), email: form.get("email"), address: form.get("address"), area: form.get("area"), notes: form.get("notes"), paymentMethod: form.get("payment"), items: lines.map((line) => { const product = products.find((item) => item.slug === line.slug)!; return { slug: line.slug, name: product.name, quantity: line.quantity, price: linePrice(product, line) }; }), subtotal, deliveryFee, total };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = (await response.json()) as { orderNumber?: string; error?: string };
      if (!response.ok || !result.orderNumber) throw new Error(result.error || "We could not place your order.");
      setOrderNumber(result.orderNumber); clearCart();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not place your order."); } finally { setLoading(false); }
  }
  if (orderNumber) return <main className="confirmation-page"><div className="confirmation-card"><p className="eyebrow">ORDER RECEIVED</p><h1>Thank you. We’re checking your order.</h1><p>Your order number is <b>{orderNumber}</b>. Farmose will confirm availability, delivery timing and payment details.</p><a className="button dark wide" href={whatsappUrl(`Hello Farmose! I have just placed order ${orderNumber} for ${money(total)}. Please help me confirm it.`, whatsappNumber)} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> Confirm on WhatsApp</a><a className="text-link" href="/shop">Continue shopping →</a></div></main>;
  if (lines.length === 0) return <main className="confirmation-page"><div className="confirmation-card"><p className="eyebrow">YOUR BASKET</p><h1>Nothing to check out yet.</h1><p>Choose a few Farmose products and come back when you’re ready.</p><a className="button dark" href="/shop">Explore products</a></div></main>;
  return (
    <main className="checkout-page">
      <section className="checkout-form-wrap"><a className="back-link" href="/shop">← Continue shopping</a><p className="eyebrow">CHECKOUT</p><h1>Delivery details</h1><form className="checkout-form" onSubmit={submit}>
        <div className="form-grid"><label><span>Full name</span><input required name="name" autoComplete="name" /></label><label><span>Phone number</span><input required name="phone" type="tel" autoComplete="tel" placeholder="+232" /></label></div>
        <label><span>Email <small>(optional)</small></span><input name="email" type="email" autoComplete="email" /></label>
        <div className="form-grid"><label><span>Delivery area</span><select required name="area" defaultValue=""><option value="" disabled>Select area</option><option>Hill Station / Regent</option><option>Central Freetown</option><option>Aberdeen / Lumley</option><option>Juba / Wilberforce</option><option>Other Freetown area</option><option>Store pickup</option></select></label><label><span>Street address</span><input required name="address" autoComplete="street-address" /></label></div>
        <label><span>Order note <small>(optional)</small></span><textarea name="notes" rows={3} placeholder="Landmark, cleaning preference or preferred delivery time" /></label>
        <fieldset className="payment-options"><legend>Payment method</legend><label><input type="radio" name="payment" value="Orange Money" defaultChecked /><span><b>Orange Money</b><small>Details sent after stock confirmation</small></span></label><label><input type="radio" name="payment" value="AfriMoney" /><span><b>AfriMoney</b><small>Details sent after stock confirmation</small></span></label><label><input type="radio" name="payment" value="Cash on delivery" /><span><b>Cash on delivery</b><small>Pay when your order arrives</small></span></label></fieldset>
        {error && <div className="form-error" role="alert">{error} <a href={whatsappUrl(cartMessage(lines, products), whatsappNumber)} target="_blank" rel="noreferrer">Send this order on WhatsApp instead.</a></div>}
        <button className="button dark wide" type="submit" disabled={loading}>{loading ? "Placing your order…" : `Place order — ${money(total)}`}</button><p className="checkout-note">Farmose confirms fresh-item availability and delivery timing before dispatch.</p>
      </form></section>
      <aside className="order-summary"><p className="eyebrow">ORDER SUMMARY</p>{lines.map((line) => { const product = products.find((item) => item.slug === line.slug)!; return <article key={line.slug}><div className="summary-image"><ProductImage product={product} sizes="64px" alt="" /><b>{line.quantity}</b></div><span><strong>{product.shortName}</strong><small>{product.unit}{line.purchaseType === "weekly" ? " · weekly" : ""}</small></span><em>{money(linePrice(product, line) * line.quantity)}</em></article>; })}<hr /><p><span>Subtotal</span><b>{money(subtotal)}</b></p><p><span>Delivery</span><b>{deliveryFee === 0 ? "Free" : money(deliveryFee)}</b></p><p className="summary-total"><span>Total</span><b>{money(total)}</b></p></aside>
    </main>
  );
}

function Wholesale({ whatsappNumber }: { whatsappNumber: string }) {
  const [form, setForm] = useState({ business: "", name: "", need: "", cadence: "Weekly" });
  const message = `Hello Farmose wholesale team!\n\nBusiness: ${form.business || "Not entered"}\nContact: ${form.name || "Not entered"}\nSupply needed: ${form.need || "I would like to discuss options"}\nFrequency: ${form.cadence}\n\nPlease help me with a bulk supply quote.`;
  return (
    <main className="wholesale-page"><section className="wholesale-hero"><div><p className="eyebrow">BULK ORDERS</p><h1>Reliable local food for busy kitchens.</h1><p>Farmose supplies restaurants, hotels, caterers and food businesses with cleaned, prepared and neatly packed local ingredients.</p></div><ol><li><b>01</b><span>Tell us what you need</span></li><li><b>02</b><span>Choose quantity and preparation</span></li><li><b>03</b><span>Receive your supply quote</span></li></ol></section>
      <section className="wholesale-body"><div className="wholesale-benefits"><p className="eyebrow">WHAT WE SUPPORT</p><h2>Built around your operation.</h2><ul><li><b>Flexible quantities</b><span>From one-off events to recurring supply.</span></li><li><b>Preparation preferences</b><span>Cleaning and processing suited to your kitchen.</span></li><li><b>Reliable local staples</b><span>Fresh produce, seafood, meat and pantry goods.</span></li></ul></div>
        <form className="wholesale-form" onSubmit={(event) => event.preventDefault()}><p className="eyebrow">REQUEST A QUOTE</p><h2>What does your kitchen need?</h2><label><span>Business name</span><input required value={form.business} onChange={(event) => setForm({ ...form, business: event.target.value })} /></label><label><span>Your name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label><span>Products and quantities</span><textarea required rows={4} value={form.need} onChange={(event) => setForm({ ...form, need: event.target.value })} placeholder="e.g. 20 kg cleaned catfish, 10 jars groundnut paste" /></label><label><span>How often?</span><select value={form.cadence} onChange={(event) => setForm({ ...form, cadence: event.target.value })}><option>One-time order</option><option>Weekly</option><option>Twice weekly</option><option>Monthly</option><option>Not sure yet</option></select></label><a className="button dark wide" href={whatsappUrl(message, whatsappNumber)} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> Send request on WhatsApp</a><small>You can review the message before sending.</small></form>
      </section>
    </main>
  );
}

function About({ theme }: { theme: SiteTheme }) {
  return (
    <main className="about-page"><section className="about-hero"><div><p className="eyebrow">ABOUT FARMOSE</p><h1>Local food deserves a cleaner journey.</h1></div><p>Farmose is a Freetown grocery and agricultural supplier for people and businesses who value local food without hours of washing, sorting and processing.</p></section>
      <section className="about-story"><div className="about-image"><Image src="/images/farmose-groundnut-display.webp" alt="Farmose products displayed in the Hill Station store" fill sizes="(max-width: 760px) 100vw, 48vw" /></div><div className="about-copy"><p className="eyebrow">FROM FARM TO FREETOWN</p><h2>Care at every handoff.</h2><p>We source familiar Sierra Leonean staples, fresh seafood, local meats and seasonal produce. Each ingredient is sorted, washed or processed as appropriate, then packed neatly for home kitchens and food businesses.</p><ol><li><b>01</b><span>Source locally</span></li><li><b>02</b><span>Clean and prepare</span></li><li><b>03</b><span>Pack for pickup or delivery</span></li></ol></div></section>
      <section className="visit-section" id="contact"><div><p className="eyebrow">VISIT FARMOSE</p><h2>Find us in Freetown.</h2><p>{theme.storeAddress}<br /><small>{theme.storeLandmark}</small><br /><small>{theme.storeHours}</small></p><a className="text-link" href={theme.directionsUrl} target="_blank" rel="noreferrer">Open directions ↗</a></div><div className="visit-card"><p className="eyebrow">CONTACT</p><h3>Talk to the Farmose team.</h3><p>Ask about products, delivery, preparation preferences or a bulk order.</p><a className="button dark wide" href={whatsappUrl("Hello Farmose! I would like to ask about your products and store.", theme.whatsappNumber)} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> Contact us on WhatsApp</a></div></section>
    </main>
  );
}

function Footer({ theme }: { theme: SiteTheme }) {
  return (
    <footer className="site-footer" id="visit"><div className="footer-main"><div className="footer-brand"><Link className="brand-logo footer-logo" href="/" aria-label="Farmose home"><Image src={theme.logoImage} width={112} height={70} alt="Farmose" /></Link><p>Clean local food, thoughtfully prepared in Freetown.</p></div><nav aria-label="Shop links"><p className="eyebrow">SHOP</p><a href="/shop">All products</a><a href="/wholesale">Bulk orders</a></nav><nav aria-label="Company links"><p className="eyebrow">FARMOSE</p><a href="/about">About</a><a href="/about#contact">Contact</a><a href={theme.directionsUrl} target="_blank" rel="noreferrer">Directions ↗</a></nav><div><p className="eyebrow">VISIT</p><p>{theme.storeAddress}<br /><small>{theme.storeLandmark}</small><br /><small>{theme.storeHours}</small></p><a className="text-link" href={whatsappUrl("Hello Farmose! I have a question about your products.", theme.whatsappNumber)} target="_blank" rel="noreferrer">WhatsApp us →</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Farmose Sierra Leone</span><span>Home delivery · Pickup · Bulk supply</span></div></footer>
  );
}

export function FarmoseSite({ view, slug, category, products: initialProducts = fallbackProducts, theme: initialTheme = defaultTheme }: StorefrontProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const skipFirstCartWrite = useRef(true);
  const products = initialProducts.length ? initialProducts : fallbackProducts;
  const theme = {
    ...initialTheme,
    heroImage: initialTheme.heroImage || defaultTheme.heroImage,
    logoImage: initialTheme.logoImage || defaultTheme.logoImage,
    standardImage: initialTheme.standardImage || defaultTheme.standardImage,
  };
  const product = products.find((item) => item.slug === slug) ?? products[0];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("farmose-cart");
      if (!stored) return;
      const parsed = JSON.parse(stored) as CartLine[];
      // Restoring device-local cart state is intentionally a post-hydration update.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(parsed)) setLines(parsed.filter((line) => typeof line.slug === "string" && Number.isFinite(line.quantity) && line.quantity > 0));
    } catch { /* Ignore invalid device-local cart data. */ }
  }, []);
  useEffect(() => {
    if (skipFirstCartWrite.current) {
      skipFirstCartWrite.current = false;
      return;
    }
    window.localStorage.setItem("farmose-cart", JSON.stringify(lines));
  }, [lines]);

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  function add(slugToAdd: string, quantity = 1, purchaseType: PurchaseType = "once") {
    setLines((current) => {
      const existing = current.find((line) => line.slug === slugToAdd && (line.purchaseType ?? "once") === purchaseType);
      return existing ? current.map((line) => line === existing ? { ...line, quantity: line.quantity + quantity } : line) : [...current, { slug: slugToAdd, quantity, purchaseType }];
    });
    setCartOpen(true);
  }
  function changeQuantity(slugToChange: string, quantity: number) { setLines((current) => quantity <= 0 ? current.filter((line) => line.slug !== slugToChange) : current.map((line) => line.slug === slugToChange ? { ...line, quantity } : line)); }

  const backgroundColor = theme.backgroundColor.toLowerCase() === "#fbf7e9" ? "#e6fcd5" : theme.backgroundColor;
  const themeStyle = { "--forest": theme.primaryColor, "--cream": backgroundColor, "--sans": theme.bodyFont, "--serif": theme.headingFont, "--base-font-size": `${theme.baseFontSize}px`, "--heading-max-size": `${theme.headingMaxSize}px`, "--button-radius": `${Math.min(theme.buttonRadius, 14)}px` } as CSSProperties;

  return (
    <div className="site-shell" style={themeStyle}>
      <Header cartCount={count} onCart={() => setCartOpen(true)} announcement={theme.announcement} logoImage={theme.logoImage} />
      {view === "home" && <Home onAdd={add} products={products} theme={theme} />}
      {view === "shop" && <Shop onAdd={add} products={products} initialCategory={category} />}
      {view === "product" && product && <ProductPage product={product} products={products} onAdd={add} />}
      {view === "checkout" && <Checkout lines={lines} clearCart={() => setLines([])} products={products} whatsappNumber={theme.whatsappNumber} />}
      {view === "wholesale" && <Wholesale whatsappNumber={theme.whatsappNumber} />}
      {view === "about" && <About theme={theme} />}
      <Footer theme={theme} />
      <CartDrawer open={cartOpen} lines={lines} onClose={() => setCartOpen(false)} onQuantity={changeQuantity} products={products} whatsappNumber={theme.whatsappNumber} />
    </div>
  );
}
