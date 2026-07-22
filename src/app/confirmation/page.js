"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "../components/Navbar";
import AuthPanel from "../components/AuthPanel";
import DeliveryVanAnimation from "../components/DeliveryVanAnimation";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

function formatDeliveryDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getDayLabel(iso) {
  if (!iso) return { day: "—", date: "—" };
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    day:  dt.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
    date: d,
  };
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <ConfirmationPageInner />
    </Suspense>
  );
}

function ConfirmationPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [visible, setVisible]   = useState(false);
  const [count, setCount]       = useState(0);
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");

  // Read order data after mount, not in a useState initializer — sessionStorage
  // is client-only, so reading it during render would make the client's first
  // hydration pass diverge from the server-rendered markup.
  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem("sk_pending_order") || "null"); }
    catch { pending = null; }
    const localItems = pending?.items || [];

    const enrichItems = (apiItems) => (apiItems?.length ? apiItems : localItems).map(apiItem => {
      const local = localItems.find(li => String(li.dishId) === String(apiItem.dishId));
      return {
        dishId:      apiItem.dishId      || local?.dishId      || "",
        dishName:    apiItem.dishName    || local?.dishName    || "",
        portionSize: apiItem.portionSize || local?.portionSize || "",
        qty:         apiItem.qty         ?? local?.qty         ?? 1,
        addons:      apiItem.addons      || local?.addons      || [],
        price:       apiItem.price       ?? local?.price       ?? 0,
        img:         apiItem.img         || local?.img         || "",
        tags:        local?.tags         || [],
      };
    });

    if (sessionId) {
      // Paid via Stripe Checkout — re-fetch the real, server-confirmed order
      // by session id rather than trusting whatever was stored before redirect.
      api.get(`/api/orders/by-session/${sessionId}`)
        .then(data => {
          setOrder({ ...data.order, items: enrichItems(data.order.items) });
          sessionStorage.removeItem("sk_pending_order");
          sessionStorage.removeItem("sk_confirmation");
        })
        .catch(err => setLoadError(err.error || "Could not load your order."))
        .finally(() => setLoading(false));
    } else {
      // No Stripe checkout — /review already stored the confirmed order.
      let stored = null;
      try { stored = JSON.parse(sessionStorage.getItem("sk_confirmation") || "null"); }
      catch { stored = null; }
      setOrder(stored);
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const items    = order?.items    || [];
  const total    = Number(order?.total)    || items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
  const subtotal = Number(order?.subtotal) || total;
  const discount = Number(order?.discount?.amount) || 0;

  const workspaceName  = user?.workspaceName  || order?.workspaceCode || "Your workspace";
  const deliveryDate   = formatDeliveryDate(order?.deliveryDate);
  const deliveryTime   = order?.lunchTime || "—";
  const { day: dayName, date: dayNum } = getDayLabel(order?.deliveryDate);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    let start = 0;
    const step = total / 40;
    const timer = setInterval(() => {
      start = Math.min(start + step, total);
      setCount(start);
      if (start >= total) clearInterval(timer);
    }, 28);
    return () => { clearTimeout(t); clearInterval(timer); };
  }, [total]);

  if (loading) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  if (loadError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, textAlign: "center", padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 600 }}>{loadError}</p>
        <Link href="/menu" style={{ textDecoration: "underline" }}>Back to menu</Link>
      </div>
    );
  }

  return (
    <>
    <div className={`${styles.root} ${visible ? styles.rootVisible : ""}`} suppressHydrationWarning>
      <Navbar onSignIn={() => setAuthOpen(true)} />

      <div className={styles.twoCol}>

        {/* ── Left panel ── */}
        <div className={styles.leftPanel}>
          <div className={styles.deliveryInfo}>

            <DeliveryVanAnimation />

            <p className={styles.sectionTitle} style={{ marginTop: 0 }}>Preferred delivery address</p>
            <div className={styles.deliveryAddrCard}>
              <div className={styles.deliveryAddrTop}>
                <div className={styles.deliveryAddrIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                </div>
                <span className={styles.deliveryAddrBadge}>Workspace</span>
              </div>
              <h2 className={styles.deliveryCompany}>{workspaceName}</h2>
              <div className={styles.deliveryDivider} />
              <p className={styles.deliveryAddr}>
                {[user?.workspaceAddress, user?.workspaceCity, user?.workspaceCounty, user?.workspacePostcode]
                  .filter(Boolean)
                  .join(", ") || user?.email || "—"}
              </p>
            </div>

            <p className={styles.sectionTitle}>Preferred delivery date</p>
            <div className={styles.metaBadge}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {deliveryDate}
            </div>

            <p className={styles.sectionTitle}>Preferred delivery time</p>
            <div className={styles.metaBadge}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {deliveryTime}
            </div>

          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={styles.rightPanel}>
          <div className={styles.rightInner}>

            <div className={styles.successHeader}>
              <div className={styles.iconWrap}>
                <div className={styles.iconRing} />
                <div className={styles.iconCircle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={styles.checkSvg}>
                    <polyline className={styles.checkPath} points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <h1 className={styles.heading}>Order confirmed! 🎉</h1>
              <p className={styles.subtext}>Your lunch is on its way to <strong>{workspaceName}.</strong></p>
            </div>

            <div className={styles.card}>
              <p className={styles.cardLabel}>YOUR ORDER</p>
              <div className={styles.orderItems}>
                {items.map((item, i) => (
                  <div key={i} className={styles.orderItem}>
                    <div className={styles.dayBadge}>
                      <span className={styles.dayName}>{dayName}</span>
                      <span className={styles.dayDate}>{dayNum}</span>
                    </div>
                    {item.img && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.img} alt={item.dishName} className={styles.mealImg} />
                    )}
                    <div className={styles.mealInfo}>
                      <span className={styles.mealName}>{item.dishName}</span>
                      <div className={styles.mealMeta}>
                        <span>{item.portionSize} Portion</span>
                        {(item.tags || []).map(t => <span key={t} className={styles.tag}>· {t}</span>)}
                        {item.qty > 1 && <span className={styles.tag}>· x{item.qty}</span>}
                      </div>
                    </div>
                    <span className={styles.mealPrice}>£{(Number(item.price) * (item.qty || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {discount > 0 && (
                <div className={styles.totalRow} style={{ opacity: 0.65 }}>
                  <span className={styles.totalLabel}>Subtotal</span>
                  <span className={styles.totalAmt}>£{subtotal.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className={styles.totalRow} style={{ color: "#22a06b" }}>
                  <span className={styles.totalLabel}>Discount ({order?.discount?.label})</span>
                  <span className={styles.totalAmt}>−£{discount.toFixed(2)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total charged</span>
                <span className={styles.totalAmt}>£{count.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/menu" className={styles.btnPrimary}>Order more</Link>
              <Link href="/" className={styles.btnOutline}>Back to home</Link>
            </div>

          </div>
        </div>

      </div>
    </div>
    {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </>
  );
}
