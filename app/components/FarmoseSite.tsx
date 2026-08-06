"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { defaultTheme, money, products as fallbackProducts, Product, SiteTheme } from "../farmose-data";

type View = "home" | "shop" | "product" | "checkout" | "wholesale" | "about";
type PurchaseType = "once" | "weekly";
type CartLine = { slug: string; quantity: number; purchaseType?: PurchaseType };

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

function whatsappUrl(message: string) {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

function linePrice(product: Product, line: CartLine) {
  return line.purchaseType === "weekly" ? product.price * 0.95 : product.price;
}

function cartMessage(lines: CartLine[], products: Product[]) {
  const selected = lines
    .map((line) => {
      const product = products.find((item) => item.slug === line.slug);
      return product ? `• ${product.name} × ${line.quantity}${line.purchaseType === "weekly" ? " (weekly)" : ""} — ${money(linePrice(product, line) * line.quantity)}` : "";
    })
    .filter(Boolean)
    .join("\n");
  const total = lines.reduce((sum, line) => {
    const product = products.find((item) => item.slug === line.slug);
    return sum + (product ? linePrice(product, line) : 0) * line.quantity;
  }, 0);
  return `Hello Farmose! I would like to order:\n\n${selected}\n\nSubtotal: ${money(total)}\n\nPlease confirm availability and delivery.`;
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (slug: string) => void }) {
  return (
    <article className="product-card-wrap">
      <div className="product-card" style={{ background: product.color }}>
        <a className="product-card-link" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          <span className="product-tag">{product.tag}</span>
          <span className="rating" aria-label={`${product.rating} out of 5 stars`}>
            ★ {product.rating} ({product.reviews})
          </span>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{ objectPosition: product.imagePosition ?? "center" }}
          />
        </a>
        <button className="quick-add" type="button" onClick={() => onAdd(product.slug)} aria-label={`Add ${product.name} to cart`}>
          <b className="plus-symbol" aria-hidden="true" />
          <span>Add</span>
        </button>
      </div>
      <a className="product-copy" href={`/products/${product.slug}`}>
        <h3>{product.name}</h3>
        <p className="product-price">{money(product.price)} · {product.unit}</p>
        <p>{product.description}</p>
      </a>
    </article>
  );
}

function Header({ cartCount, onCart, products, announcement }: { cartCount: number; onCart: () => void; products: Product[]; announcement: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="top-navigation">
      <div className="announcement">{announcement}</div>
      <header className="site-header">
        <nav className="nav-shell" aria-label="Main navigation">
          <div className="nav-left desktop-nav">
            <button className="nav-link nav-menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
              Shop <span className="nav-dot">⌄</span>
            </button>
            <a className="nav-link" href="/about">Our story</a>
            <a className="nav-link" href="/#reviews">Reviews</a>
          </div>
          <button className="mobile-menu" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu">
            ☰
          </button>
          <a className="brand-logo" href="/" aria-label="Farmose home">
            <img src="/images/farmose-logo.png" alt="Farmose" />
          </a>
          <div className="nav-right desktop-nav">
            <a href="/wholesale">WHOLESALE</a>
            <a href="/#visit">VISIT US</a>
          </div>
          <button className="cart-button" type="button" onClick={onCart} aria-label={`Open cart with ${cartCount} items`}>
            <span className="bag-icon" aria-hidden="true"><i /></span>
            <b>{cartCount}</b>
          </button>
        </nav>
      </header>
      {menuOpen && (
        <div className="mega-menu" role="dialog" aria-label="Shop menu">
          <button className="mega-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
          <div>
            <p className="eyebrow">SHOP BY CATEGORY</p>
            <a href="/shop?category=Pantry">Pantry favourites</a>
            <a href="/shop?category=Fresh%20Seafood">Fresh seafood</a>
            <a href="/shop?category=Meat%20%26%20Poultry">Meat & poultry</a>
            <a href="/shop?category=Fresh%20Produce">Fresh produce</a>
            <a className="button dark small" href="/shop">Shop all produce</a>
          </div>
          <div>
            <p className="eyebrow">WHY FARMOSE</p>
            <a href="/about">Our clean standard</a>
            <a href="/wholesale">Restaurant & hotel supply</a>
            <a href="/#visit">Freetown store</a>
          </div>
          <div className="mega-featured">
            {products.slice(0, 3).map((product) => (
              <a key={product.slug} href={`/products/${product.slug}`}>
                <div style={{ background: product.color }}>
                  <img src={product.image} alt="" style={{ objectPosition: product.imagePosition }} />
                </div>
                <span>{product.shortName}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CartDrawer({
  open,
  lines,
  onClose,
  onQuantity,
  products,
}: {
  open: boolean;
  lines: CartLine[];
  onClose: () => void;
  onQuantity: (slug: string, quantity: number) => void;
  products: Product[];
}) {
  const subtotal = lines.reduce((sum, line) => {
    const product = products.find((item) => item.slug === line.slug);
    return sum + (product ? linePrice(product, line) : 0) * line.quantity;
  }, 0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button className="drawer-scrim" type="button" onClick={onClose} aria-label="Close cart" />
      <aside className="cart-drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">YOUR FARMOSE BASKET</p>
            <h2>My Cart</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close cart">×</button>
        </div>
        <div className="delivery-progress">
          <p>{subtotal >= 500 ? "You have free Freetown delivery!" : `${money(500 - subtotal)} away from free Freetown delivery`}</p>
          <span><i style={{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }} /></span>
        </div>
        <div className="drawer-items">
          {lines.length === 0 && (
            <div className="empty-cart">
              <span>◯</span>
              <h3>Your basket is waiting.</h3>
              <p>Add some clean, local goodness and we’ll keep it here for you.</p>
              <a className="button dark" href="/shop">Explore the shop</a>
            </div>
          )}
          {lines.map((line) => {
            const product = products.find((item) => item.slug === line.slug);
            if (!product) return null;
            return (
              <article className="drawer-item" key={line.slug}>
                <div style={{ background: product.color }}>
                  <img src={product.image} alt="" style={{ objectPosition: product.imagePosition }} />
                </div>
                <section>
                  <h3>{product.name}</h3>
                  <p>{product.unit}{line.purchaseType === "weekly" ? " · weekly delivery" : ""}</p>
                  <div className="qty">
                    <button type="button" onClick={() => onQuantity(line.slug, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => onQuantity(line.slug, line.quantity + 1)} aria-label="Increase quantity">＋</button>
                  </div>
                </section>
                <b>{money(linePrice(product, line) * line.quantity)}</b>
              </article>
            );
          })}
        </div>
        {lines.length > 0 && (
          <div className="drawer-footer">
            <label className="gift-option"><input type="checkbox" /><span>Is this a gift?</span></label>
            <div className="subtotal"><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <a className="button dark wide" href="/checkout">Checkout — {money(subtotal)}</a>
            <a className="button whatsapp wide" href={whatsappUrl(cartMessage(lines, products))} target="_blank" rel="noreferrer">
              <FaWhatsapp className="whatsapp-icon" aria-hidden="true" /> Order this cart via WhatsApp
            </a>
            <small>Delivery fee is calculated at checkout.</small>
          </div>
        )}
      </aside>
    </div>
  );
}

function Home({ onAdd, products, theme }: { onAdd: (slug: string) => void; products: Product[]; theme: SiteTheme }) {
  return (
    <main>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="sticker">CLEAN LOCAL FOOD</span>
          <h1>{theme.heroTitle} <em>{theme.heroEmphasis}</em></h1>
          <p>{theme.heroBody}</p>
          <div className="button-row">
            <a className="button dark" href="/shop">Shop local produce</a>
            <a className="text-link" href="/wholesale">Buying for a business? <u>Go wholesale</u></a>
          </div>
          <div className="hero-promise">
            <b>100%</b>
            <span>sand-free promise<br />on processed ingredients</span>
          </div>
        </div>
        <div className="hero-image">
          <img src={theme.heroImage} alt="Fresh locally grown produce prepared by Farmose" />
          <div className="image-note"><b>Local colour.</b><br />Handled with care.</div>
        </div>
      </section>

      <section className="promise-strip" aria-label="Farmose promises">
        <span>✦ Meticulously pre-cleaned</span>
        <span>✦ Proudly Sierra Leonean</span>
        <span>✦ Retail & wholesale</span>
        <span>✦ Easy Freetown delivery</span>
      </section>

      <section className="section products-section">
        <div className="section-heading">
          <div><p className="eyebrow">SHOP THE FAVOURITES</p><h2>Local staples, without the extra work.</h2></div>
          <a className="text-link" href="/shop">See everything →</a>
        </div>
        <div className="product-grid home-grid">
          {products.slice(0, 4).map((product) => <ProductCard key={product.slug} product={product} onAdd={onAdd} />)}
        </div>
      </section>

      <section className="standard-section" id="standard">
        <div className="standard-photo">
          <img src="/images/farmose-groundnut-display.webp" alt="Farmose groundnut paste jars displayed at the store" />
          <span className="round-seal">CLEAN<br />LOCAL<br />GOOD</span>
        </div>
        <div className="standard-copy">
          <p className="eyebrow">THE FARMOSE STANDARD</p>
          <h2>Clean is not a claim.<br /><em>It is the process.</em></h2>
          <p className="lead">Your favourite local ingredients should not come with hours of sorting, washing and grit at the bottom of the pot.</p>
          <div className="steps-list">
            <article><b>01</b><div><h3>Carefully sourced</h3><p>We work with local growers, fishers and trusted suppliers.</p></div></article>
            <article><b>02</b><div><h3>Washed & sorted</h3><p>Dust, sand, stones and unwanted particles are removed.</p></div></article>
            <article><b>03</b><div><h3>Hygienically packed</h3><p>Your ingredients arrive clean, fresh and ready for the kitchen.</p></div></article>
          </div>
          <a className="button outline" href="/shop">Taste the difference</a>
        </div>
      </section>

      <section className="category-section">
        <div className="section-heading centered">
          <div><p className="eyebrow">FIND WHAT YOU NEED</p><h2>A clean market for every kind of cook.</h2></div>
        </div>
        <div className="category-grid">
          <a href="/shop?category=Fresh%20Seafood" className="category-card sea"><span>Fresh seafood</span><b>Cleaned to your preference →</b></a>
          <a href="/shop?category=Pantry" className="category-card pantry"><span>Pantry essentials</span><b>Open, cook, enjoy →</b></a>
          <a href="/shop?category=Fresh%20Produce" className="category-card produce"><span>Fresh produce</span><b>Local harvest, neatly packed →</b></a>
        </div>
      </section>

      <section className="wholesale-band">
        <div>
          <span className="sticker blue">RESTAURANTS · HOTELS · CATERERS</span>
          <h2>Good kitchens need a dependable clean supply.</h2>
        </div>
        <div>
          <p>Tell us what you use and how often. We’ll help with bulk quantities, cleaning preferences and a reliable supply plan.</p>
          <a className="button light" href="/wholesale">Start a wholesale order</a>
        </div>
      </section>

      <section className="reviews-section" id="reviews">
        <p className="eyebrow">WHY PEOPLE CHOOSE FARMOSE</p>
        <h2>“I can go straight from the pack to the pot.”</h2>
        <div className="review-meta"><span>★★★★★</span><b>Made for busy Freetown kitchens</b></div>
      </section>
    </main>
  );
}

function Shop({ onAdd, products }: { onAdd: (slug: string) => void; products: Product[] }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const categories = ["All", "Pantry", "Fresh Seafood", "Meat & Poultry", "Fresh Produce"];
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("category");
    if (requested && categories.includes(requested)) setCategory(requested);
  }, []);
  const visible = products.filter((product) =>
    (category === "All" || product.category === category) &&
    `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main>
      <section className="collection-hero">
        <span className="sticker">THE CLEAN MARKET</span>
        <h1>Local food, ready for <em>real life.</em></h1>
        <p>Fresh seafood, pantry favourites, meats and seasonal produce — with the washing, sorting and prep already handled.</p>
        <div className="category-pills" role="group" aria-label="Filter products by category">
          {categories.map((item) => (
            <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
      </section>
      <section className="section shop-section">
        <div className="shop-tools">
          <p>{visible.length} clean local products</p>
          <label><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the market" aria-label="Search products" /></label>
        </div>
        <div className="product-grid shop-grid">
          {visible.map((product) => <ProductCard key={product.slug} product={product} onAdd={onAdd} />)}
        </div>
        {visible.length === 0 && <div className="no-results"><h2>Nothing in this basket yet.</h2><p>Try another category or search.</p></div>}
      </section>
    </main>
  );
}

function ProductPage({ product, products, onAdd }: { product: Product; products: Product[]; onAdd: (slug: string, quantity?: number, purchaseType?: PurchaseType) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<"once" | "weekly">("once");
  const selectedPrice = purchaseType === "weekly" ? product.price * 0.95 : product.price;
  const message = `Hello Farmose! I would like ${quantity} × ${product.name} (${product.unit})${purchaseType === "weekly" ? " as a weekly delivery" : ""} at ${money(selectedPrice)} each. Please confirm availability and delivery.`;
  return (
    <main className="product-page">
      <section className="product-detail">
        <div className="product-gallery" style={{ background: product.color }}>
          <img src={product.image} alt={product.name} style={{ objectPosition: product.imagePosition }} />
          <button className="gallery-arrow" type="button" aria-label="View next product photo">→</button>
          <div className="feature-icons">
            {product.features.map((feature, index) => <div key={feature}><span>{["✓", "◌", "✦"][index]}</span><b>{feature}</b></div>)}
          </div>
        </div>
        <div className="product-info">
          <div className="product-breadcrumb"><a href="/shop">Shop</a><span>→</span><span>{product.category}</span></div>
          <p className="rating large">★★★★★ <span>{product.rating} ({product.reviews} reviews)</span></p>
          <span className="product-tag detail-tag">{product.tag}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">{money(product.price)} <span>/ {product.unit}</span></p>
          <p className="detail-description">{product.details}</p>
          <div className="availability"><i /> Available for Freetown delivery or pickup</div>
          <div className="purchase-options" aria-label="Purchase type">
            <label className={purchaseType === "once" ? "selected" : ""}>
              <input type="radio" name="purchase-type" checked={purchaseType === "once"} onChange={() => setPurchaseType("once")} />
              <span><b>One-time purchase</b><small>Order only when you need it</small></span>
              <strong>{money(product.price)}</strong>
            </label>
            <label className={purchaseType === "weekly" ? "selected" : ""}>
              <input type="radio" name="purchase-type" checked={purchaseType === "weekly"} onChange={() => setPurchaseType("weekly")} />
              <span><b>Weekly delivery & save</b><small>Save 5% on a regular weekly order</small></span>
              <strong>{money(product.price * 0.95)}</strong>
            </label>
          </div>
          <div className="purchase-row">
            <div className="qty big">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">＋</button>
            </div>
            <button className="button dark grow" type="button" onClick={() => onAdd(product.slug, quantity, purchaseType)}>Add to cart — {money(selectedPrice * quantity)}</button>
          </div>
          <a className="button whatsapp wide product-whatsapp" href={whatsappUrl(message)} target="_blank" rel="noreferrer"><FaWhatsapp className="whatsapp-icon" aria-hidden="true" /> Order this item via WhatsApp</a>
          <p className="microcopy">Fresh-item availability may vary. We confirm every order before delivery.</p>
          {product.video && (
            <section className="product-video-block">
              <p className="eyebrow">WATCH THE PRODUCT</p>
              <video controls playsInline preload="metadata" poster={product.image}>
                <source src={product.video} />
                Your browser does not support product videos.
              </video>
            </section>
          )}
          <hr />
          <div className="use-block">
            <p className="eyebrow">FROM PACK TO POT</p>
            <h2>Less prep. More good food.</h2>
            <div className="use-steps">
              <article><b>01</b><h3>Open</h3><p>Hygienically packed and easy to store.</p></article>
              <article><b>02</b><h3>Cook</h3><p>Use directly or follow your usual recipe.</p></article>
              <article><b>03</b><h3>Enjoy</h3><p>Local flavour, with the grit left out.</p></article>
            </div>
          </div>
        </div>
      </section>
      <section className="section recommendations">
        <div className="section-heading"><div><p className="eyebrow">YOU MAY ALSO LIKE</p><h2>More from the clean market.</h2></div></div>
        <div className="product-grid home-grid">
          {products.filter((item) => item.slug !== product.slug).slice(0, 4).map((item) => <ProductCard key={item.slug} product={item} onAdd={onAdd} />)}
        </div>
      </section>
    </main>
  );
}

function Checkout({ lines, clearCart, products }: { lines: CartLine[]; clearCart: () => void; products: Product[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const subtotal = lines.reduce((sum, line) => {
    const product = products.find((item) => item.slug === line.slug);
    return sum + (product ? linePrice(product, line) : 0) * line.quantity;
  }, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 25;
  const total = subtotal + deliveryFee;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      address: form.get("address"),
      area: form.get("area"),
      notes: form.get("notes"),
      paymentMethod: form.get("payment"),
      items: lines.map((line) => {
        const product = products.find((item) => item.slug === line.slug)!;
        return { slug: line.slug, name: product.name, quantity: line.quantity, price: linePrice(product, line) };
      }),
      subtotal,
      deliveryFee,
      total,
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = (await response.json()) as { orderNumber?: string; error?: string };
      if (!response.ok || !result.orderNumber) throw new Error(result.error || "We could not place your order.");
      setOrderNumber(result.orderNumber);
      clearCart();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not place your order.");
    } finally {
      setLoading(false);
    }
  }

  if (orderNumber) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card">
          <span>✓</span><p className="eyebrow">ORDER RECEIVED</p><h1>Thank you. We’re checking your basket.</h1>
          <p>Your order number is <b>{orderNumber}</b>. Farmose will confirm availability, delivery timing and Mobile Money details before dispatch.</p>
          <a className="button whatsapp wide" href={whatsappUrl(`Hello Farmose! I have just placed order ${orderNumber} for ${money(total)}. Please help me confirm it.`)} target="_blank" rel="noreferrer"><FaWhatsapp className="whatsapp-icon" aria-hidden="true" /> Confirm order on WhatsApp</a>
          <a className="text-link" href="/shop">Continue shopping →</a>
        </div>
      </main>
    );
  }

  if (lines.length === 0) {
    return <main className="confirmation-page"><div className="confirmation-card"><p className="eyebrow">YOUR BASKET</p><h1>Nothing to check out yet.</h1><p>Choose a few Farmose favourites and come back when you’re ready.</p><a className="button dark" href="/shop">Shop local produce</a></div></main>;
  }

  return (
    <main className="checkout-page">
      <section className="checkout-form-wrap">
        <a className="back-link" href="/shop">← Continue shopping</a>
        <p className="eyebrow">SECURE CHECKOUT</p>
        <h1>Where should we bring the good stuff?</h1>
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-grid">
            <label><span>Full name</span><input required name="name" autoComplete="name" /></label>
            <label><span>Phone number</span><input required name="phone" type="tel" autoComplete="tel" placeholder="+232" /></label>
          </div>
          <label><span>Email <small>(optional)</small></span><input name="email" type="email" autoComplete="email" /></label>
          <div className="form-grid">
            <label><span>Delivery area</span><select required name="area" defaultValue=""><option value="" disabled>Select area</option><option>Hill Station / Regent</option><option>Central Freetown</option><option>Aberdeen / Lumley</option><option>Juba / Wilberforce</option><option>Other Freetown area</option><option>Store pickup</option></select></label>
            <label><span>Street address</span><input required name="address" autoComplete="street-address" /></label>
          </div>
          <label><span>Delivery note <small>(optional)</small></span><textarea name="notes" rows={3} placeholder="Landmark, cleaning preference, or best delivery time" /></label>
          <fieldset className="payment-options">
            <legend>How would you like to pay?</legend>
            <label><input type="radio" name="payment" value="Orange Money" defaultChecked /><span><b>Orange Money</b><small>Payment instructions sent after stock confirmation</small></span><strong>OM</strong></label>
            <label><input type="radio" name="payment" value="AfriMoney" /><span><b>AfriMoney</b><small>Payment instructions sent after stock confirmation</small></span><strong>AM</strong></label>
            <label><input type="radio" name="payment" value="Cash on delivery" /><span><b>Cash on delivery</b><small>Pay when your Farmose order arrives</small></span><strong>Le</strong></label>
          </fieldset>
          {error && <div className="form-error">{error} <a href={whatsappUrl(cartMessage(lines, products))} target="_blank" rel="noreferrer">Send this order on WhatsApp instead.</a></div>}
          <button className="button dark wide" type="submit" disabled={loading}>{loading ? "Placing your order…" : `Place order — ${money(total)}`}</button>
          <p className="checkout-note">Your order is confirmed only after Farmose checks fresh-item availability and delivery timing.</p>
        </form>
      </section>
      <aside className="order-summary">
        <p className="eyebrow">ORDER SUMMARY</p>
        {lines.map((line) => {
          const product = products.find((item) => item.slug === line.slug)!;
          return <article key={line.slug}><div style={{ background: product.color }}><img src={product.image} alt="" style={{ objectPosition: product.imagePosition }} /><b>{line.quantity}</b></div><span><strong>{product.shortName}</strong><small>{product.unit}{line.purchaseType === "weekly" ? " · weekly" : ""}</small></span><em>{money(linePrice(product, line) * line.quantity)}</em></article>;
        })}
        <hr /><p><span>Subtotal</span><b>{money(subtotal)}</b></p><p><span>Delivery</span><b>{deliveryFee === 0 ? "Free" : money(deliveryFee)}</b></p><p className="summary-total"><span>Total</span><b>{money(total)}</b></p>
      </aside>
    </main>
  );
}

function Wholesale() {
  const [form, setForm] = useState({ business: "", name: "", need: "", cadence: "Weekly" });
  const message = `Hello Farmose wholesale team!\n\nBusiness: ${form.business || "Not entered"}\nContact: ${form.name || "Not entered"}\nSupply needed: ${form.need || "I would like to discuss options"}\nFrequency: ${form.cadence}\n\nPlease help me with a bulk supply quote.`;
  return (
    <main>
      <section className="wholesale-hero">
        <div><span className="sticker blue">FARMOSE WHOLESALE</span><h1>A cleaner supply line for <em>busy kitchens.</em></h1><p>Reliable local produce for restaurants, hotels, caterers and food businesses — cleaned, prepared and packed around the way your kitchen works.</p></div>
        <div className="wholesale-stats"><article><b>01</b><span>Tell us what you use</span></article><article><b>02</b><span>Choose quantity & prep</span></article><article><b>03</b><span>Get your supply plan</span></article></div>
      </section>
      <section className="wholesale-body">
        <div>
          <p className="eyebrow">BUILT FOR HOSPITALITY</p><h2>Less sorting. Less waste. More consistency.</h2>
          <ul><li><b>Flexible bulk quantities</b><span>From regular restaurant orders to event-sized supply.</span></li><li><b>Cleaning to your preference</b><span>Fish processed, descaled and cleaned to your kitchen standard.</span></li><li><b>Local pantry staples</b><span>Sand-free grains, beans, groundnuts, Benny and more.</span></li><li><b>Direct WhatsApp coordination</b><span>Quick ordering that works with your team’s daily rhythm.</span></li></ul>
        </div>
        <form className="wholesale-form" onSubmit={(event) => event.preventDefault()}>
          <p className="eyebrow">START A CONVERSATION</p><h2>What does your kitchen need?</h2>
          <label><span>Business name</span><input value={form.business} onChange={(event) => setForm({ ...form, business: event.target.value })} /></label>
          <label><span>Your name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label><span>Products and quantities</span><textarea rows={4} value={form.need} onChange={(event) => setForm({ ...form, need: event.target.value })} placeholder="e.g. 20 kg cleaned catfish, 10 jars groundnut paste…" /></label>
          <label><span>How often?</span><select value={form.cadence} onChange={(event) => setForm({ ...form, cadence: event.target.value })}><option>One-time order</option><option>Weekly</option><option>Twice weekly</option><option>Monthly</option><option>Not sure yet</option></select></label>
          <a className="button whatsapp wide" href={whatsappUrl(message)} target="_blank" rel="noreferrer"><FaWhatsapp className="whatsapp-icon" aria-hidden="true" /> Send wholesale request on WhatsApp</a>
          <small>This opens a ready-written message. You can review it before sending.</small>
        </form>
      </section>
    </main>
  );
}

function About({ theme }: { theme: SiteTheme }) {
  return (
    <main>
      <section className="about-hero">
        <div>
          <span className="sticker">OUR STORY</span>
          <h1>Local food deserves a <em>cleaner journey.</em></h1>
        </div>
        <p>Farmose is a premium farm-to-market grocery and agricultural supplier built for people who love local food but do not have hours to wash, sort and process every ingredient.</p>
      </section>
      <section className="about-story">
        <div className="about-image"><img src="/images/farmose-groundnut-display.webp" alt="Farmose products displayed in the Hill Station store" /></div>
        <div className="about-copy">
          <p className="eyebrow">FROM FARM TO FREETOWN</p>
          <h2>The market experience, thoughtfully prepared.</h2>
          <p>We source familiar Sierra Leonean staples, fresh seafood, local meats and seasonal produce, then handle the work that normally slows a good meal down.</p>
          <p>Ingredients are carefully sorted, washed or processed as appropriate, and packed in a hygienic environment. The result is local food that feels dependable, premium and ready for real life.</p>
          <a className="button dark" href="/shop">Explore the clean market</a>
        </div>
      </section>
      <section className="process-section">
        <div className="section-heading">
          <div><p className="eyebrow">OUR CLEAN STANDARD</p><h2>Care at every handoff.</h2></div>
        </div>
        <div className="process-grid">
          <article><span>01</span><h3>Source</h3><p>We choose local growers, fishers and suppliers who take freshness seriously.</p></article>
          <article><span>02</span><h3>Sort</h3><p>Dust, sand, stones and unwanted particles are removed with careful handling.</p></article>
          <article><span>03</span><h3>Prepare</h3><p>Seafood and poultry can be cleaned and processed to suit your kitchen.</p></article>
          <article><span>04</span><h3>Pack</h3><p>Every order is packed neatly for pickup, home delivery or wholesale supply.</p></article>
        </div>
      </section>
      <section className="visit-section" id="contact">
        <div>
          <p className="eyebrow">VISIT FARMOSE</p>
          <h2>Come see what is fresh.</h2>
          <p>{theme.storeAddress}<br /><small>{theme.storeLandmark}</small><br /><small>{theme.storeHours}</small></p>
          <a className="text-link directions-link" href={theme.directionsUrl} target="_blank" rel="noreferrer">Open directions ↗</a>
        </div>
        <div className="visit-card">
          <p className="eyebrow">NEED HELP?</p>
          <h3>Talk to the Farmose team.</h3>
          <p>Ask about availability, cleaning preferences, delivery areas or a regular wholesale supply.</p>
          <a className="button whatsapp wide" href={whatsappUrl("Hello Farmose! I would like to ask about your products and store.")} target="_blank" rel="noreferrer"><FaWhatsapp className="whatsapp-icon" aria-hidden="true" /> Open WhatsApp</a>
        </div>
      </section>
    </main>
  );
}

function Footer({ theme }: { theme: SiteTheme }) {
  return (
    <footer className="site-footer" id="visit">
      <div className="footer-top">
        <a className="brand-logo footer-logo" href="/" aria-label="Farmose home"><img src="/images/farmose-logo.png" alt="Farmose" /></a>
        <h2>Good food starts <em>clean.</em></h2>
        <a className="button light" href="/shop">Shop Farmose</a>
      </div>
      <div className="footer-grid">
        <div><p className="eyebrow">VISIT</p><p>{theme.storeAddress}<br /><small>{theme.storeLandmark}</small><br /><small>{theme.storeHours}</small></p><a href={theme.directionsUrl} target="_blank" rel="noreferrer">Open directions ↗</a></div>
        <div><p className="eyebrow">SHOP</p><a href="/shop">All produce</a><a href="/shop?category=Pantry">Pantry</a><a href="/shop?category=Fresh%20Seafood">Seafood</a></div>
        <div><p className="eyebrow">BUSINESS</p><a href="/wholesale">Wholesale supply</a><a href="/about">About & contact</a><a href={whatsappUrl("Hello Farmose! I have a question about your products.")} target="_blank" rel="noreferrer">WhatsApp us</a></div>
        <div><p className="eyebrow">THE FARM NOTE</p><p>Seasonal produce, kitchen tips and what’s fresh.</p><form onSubmit={(event) => event.preventDefault()}><input type="email" aria-label="Email address" placeholder="Your email address" /><button type="submit" aria-label="Subscribe">→</button></form></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Farmose Sierra Leone</span><span>Clean local food, thoughtfully prepared.</span></div>
    </footer>
  );
}

export function FarmoseSite({ view, slug }: { view: View; slug?: string }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [theme, setTheme] = useState<SiteTheme>(defaultTheme);
  const product = products.find((item) => item.slug === slug) ?? products[0] ?? fallbackProducts[0];

  const safeLines = Array.isArray(lines) ? lines : [];

  useEffect(() => {
    let active = true;
    fetch("/api/catalog")
      .then((response) => response.json())
      .then((data: { products?: Product[]; theme?: SiteTheme }) => {
        if (!active) return;
        if (data.products?.length) setProducts(data.products);
        if (data.theme) setTheme(data.theme);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("farmose-cart");
      if (stored) setLines(JSON.parse(stored));
    } catch {
      setLines([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("farmose-cart", JSON.stringify(lines));
  }, [lines]);

  const count = useMemo(() => safeLines.reduce((sum, line) => sum + line.quantity, 0), [safeLines]);
  function add(slugToAdd: string, quantity = 1, purchaseType: PurchaseType = "once") {
    setLines((current) => {
      const existing = current.find((line) => line.slug === slugToAdd);
      return existing ? current.map((line) => line.slug === slugToAdd ? { ...line, quantity: line.quantity + quantity, purchaseType } : line) : [...current, { slug: slugToAdd, quantity, purchaseType }];
    });
    setCartOpen(true);
  }
  function changeQuantity(slugToChange: string, quantity: number) {
    setLines((current) => quantity <= 0 ? current.filter((line) => line.slug !== slugToChange) : current.map((line) => line.slug === slugToChange ? { ...line, quantity } : line));
  }

  const themeStyle = {
    "--forest": theme.primaryColor,
    "--cream": theme.backgroundColor,
    "--orange": theme.accentColor,
    "--sky": theme.highlightColor,
    "--sans": theme.bodyFont,
    "--serif": theme.headingFont,
    "--base-font-size": `${theme.baseFontSize}px`,
    "--heading-max-size": `${theme.headingMaxSize}px`,
    "--button-radius": `${theme.buttonRadius}px`,
  } as CSSProperties;

  return (
    <div className="site-shell" style={themeStyle}>
      <Header cartCount={count} onCart={() => setCartOpen(true)} products={products} announcement={theme.announcement} />
      {view === "home" && <Home onAdd={add} products={products} theme={theme} />}
      {view === "shop" && <Shop onAdd={add} products={products} />}
      {view === "product" && <ProductPage product={product} products={products} onAdd={add} />}
      {view === "checkout" && <Checkout lines={safeLines} clearCart={() => setLines([])} products={products} />}
      {view === "wholesale" && <Wholesale />}
      {view === "about" && <About theme={theme} />}
      <Footer theme={theme} />
      <CartDrawer open={cartOpen} lines={safeLines} onClose={() => setCartOpen(false)} onQuantity={changeQuantity} products={products} />
      <a className="floating-whatsapp" href={whatsappUrl("Hello Farmose! I would like help with an order.")} target="_blank" rel="noreferrer" aria-label="Chat with Farmose on WhatsApp"><FaWhatsapp className="whatsapp-icon" aria-hidden="true" /><span>WhatsApp</span></a>
    </div>
  );
}
