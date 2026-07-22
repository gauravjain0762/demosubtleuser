"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import AuthPanel from "../components/AuthPanel";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import DeliveryVanAnimation from "../components/DeliveryVanAnimation";


function formatCouponHeadline(c) {
  if (c.type === "percentage") return `Get ${c.value}% off`;
  return `Get £${c.value} off`;
}

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // ── Order from sessionStorage ──
  // Read after mount (not in a useState initializer) so the server-rendered
  // markup and the client's first hydration pass match — sessionStorage is
  // only available on the client, so reading it during render would make
  // the client's initial render diverge from what the server sent.
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let parsed = null;
    try { parsed = JSON.parse(sessionStorage.getItem("sk_order") || "null"); }
    catch { parsed = null; }
    setOrder(parsed);
    setItems(parsed?.items || []);
  }, []);

  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  // ── Promo ──
  const [promo, setPromo]                   = useState("");
  const [promoApplied, setPromoApplied]     = useState(false);
  const [promoDiscount, setPromoDiscount]   = useState(null); // { type, value, label }
  const [promoError, setPromoError]         = useState("");
  const [checking, setChecking]             = useState(false);
  const [promoOpen, setPromoOpen]           = useState(false);
  const [promoInput, setPromoInput]         = useState("");
  const [availableCodes, setAvailableCodes] = useState([]);
  const [expandedCoupons, setExpandedCoupons] = useState(new Set());

  const toggleCouponExpanded = (code) => {
    setExpandedCoupons(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  useEffect(() => {
    const wc = order?.workspaceCode || user?.workspaceCode || "";
    api.get(`/api/promo${wc ? `?workspaceCode=${encodeURIComponent(wc)}` : ""}`)
      .then(data => { if (data.promoCodes) setAvailableCodes(data.promoCodes); })
      .catch(() => {});
  }, [order, user]);

  const applyPromo = async (code) => {
    const val = (code || promoInput).trim().toUpperCase();
    if (!val) return;
    setChecking(true);
    setPromoError("");
    try {
      const data = await api.post("/api/promo/validate", {
        code: val,
        workspaceCode: order?.workspaceCode || user?.workspaceCode || "",
      });
      if (data.valid) {
        setPromo(val);
        setPromoDiscount(data.discount);
        setPromoApplied(true);
        setPromoOpen(false);
      } else {
        setPromoError(data.error || "Invalid or expired promo code");
        setPromoApplied(false);
      }
    } catch {
      setPromoError("Could not validate code. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  // ── Order submission ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const discount = promoApplied && promoDiscount
    ? promoDiscount.type === "percentage"
      ? subtotal * (promoDiscount.value / 100)
      : Math.min(promoDiscount.value, subtotal)
    : 0;
  const total = subtotal - discount;

  const handlePlaceOrder = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!order) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const data = await api.post("/api/orders", {
        workspaceCode:       order.workspaceCode || user.workspaceCode,
        deliveryDate:        order.deliveryDate,
        lunchTime:           order.lunchTime,
        isWeeklySubscription: order.isWeeklySubscription || false,
        ...(promoApplied && promo ? { promoCode: promo } : {}),
        items: items.map(item => ({
          dishId:      item.dishId,
          portionSize: item.portionSize || (item.portion === "large" ? "Large" : "Regular"),
          qty:         item.qty || 1,
          addons:  item.addons || [],
        })),
        useStripeCheckout: true,
      });

      const localItems = order?.items || [];
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

      sessionStorage.removeItem("sk_order");

      if (data.checkoutUrl) {
        // Stash local image/name data so /confirmation can enrich the order
        // it re-fetches by Stripe session id once payment completes.
        sessionStorage.setItem("sk_pending_order", JSON.stringify({ items: localItems }));
        setConfirming(true);
        setTimeout(() => { window.location.href = data.checkoutUrl; }, 600);
        return;
      }

      // No Stripe checkout — order is already confirmed, go straight there.
      sessionStorage.setItem("sk_confirmation", JSON.stringify({
        ...data.order,
        items: enrichItems(data.order.items),
      }));
      router.push("/confirmation");
    } catch (err) {
      setSubmitError(err.error || "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className={styles.root} suppressHydrationWarning>
      <Navbar onSignIn={() => setAuthOpen(true)} />

      <div className={styles.twoCol}>

        {/* ── Left: delivery info ── */}
        <div className={styles.addrPanel}>
          <div className={styles.deliveryInfo}>
            <DeliveryVanAnimation />
            <p className={styles.sectionTitle} style={{ marginTop: 0 }}>Delivery address</p>

            <div className={styles.deliveryAddrCard}>
              <div className={styles.deliveryAddrCardTop}>
                <div className={styles.deliveryAddrCardIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                </div>
                <span className={styles.deliveryAddrCardBadge}>Workspace</span>
              </div>
              <h2 className={styles.deliveryInfoCompany}>{user?.workspaceName || order?.workspaceCode || "Your workspace"}</h2>
              <div className={styles.deliveryAddrDivider} />
              <p className={styles.deliveryInfoAddr}>
                {[user?.workspaceAddress, user?.workspaceCity, user?.workspaceCounty, user?.workspacePostcode]
                  .filter(Boolean)
                  .join(", ") || user?.email}
              </p>
            </div>

            <p className={styles.sectionTitle}>Delivery date</p>
            <div className={styles.deliveryInfoEtaBadge}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {order?.deliveryDateDisplay || order?.deliveryDate || "—"}
            </div>

            <p className={styles.sectionTitle}>Delivery time</p>
            <div className={styles.deliveryInfoEtaBadge}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {order?.lunchTime || "—"}
            </div>
          </div>
        </div>

        {/* ── Right: review order ── */}
        <div className={styles.main}>
          <div className={styles.mainInner}>
            <div className={styles.header}>
              <h1 className={styles.heading}>Review your order</h1>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", opacity: 0.5 }}>
                <p>No items in your order. <Link href="/menu" className={styles.backToMenuLink}>Go back to menu →</Link></p>
              </div>
            ) : (
              <div className={styles.orderCard}>
                {items.map((item, i) => {
                  return (
                    <div key={i} className={styles.orderItem} style={{ animationDelay: (i * 0.1) + "s" }}>
                      <div className={styles.orderItemLeft}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {item.img && <img src={item.img} alt={item.dishName} className={styles.itemImg} />}
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.dishName}</span>
                          <span className={styles.portionTag}>{item.portionSize || item.portion} · x{item.qty}</span>
                          {item.addons?.length > 0 && (
                            <span className={styles.portionTag} style={{ opacity: 0.6 }}>
                              + {item.addons.map(a => typeof a === "string" ? a : `${a.name}${a.qty > 1 ? ` ×${a.qty}` : ""}`).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.orderItemRight}>
                        <span className={styles.itemPrice}>£{((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                        <button className={styles.removeItemBtn} onClick={() => removeItem(i)} aria-label="Remove">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className={styles.divider} />
                <div className={styles.totals}>
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Subtotal</span>
                    <span className={styles.totalVal}>£{subtotal.toFixed(2)}</span>
                  </div>
                  {promoApplied && promoDiscount && (
                    <div className={`${styles.totalRow} ${styles.discountRow}`}>
                      <span className={styles.totalLabel}>Discount ({promoDiscount.label})</span>
                      <span className={styles.discountVal}>−£{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Delivery</span>
                    <span className={styles.freeTag}>FREE</span>
                  </div>
                  <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                    <span>Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Promo */}
            <div
              className={`${styles.promoTrigger} ${items.length === 0 ? styles.promoTriggerDisabled : ""}`}
              role="button"
              tabIndex={items.length === 0 ? -1 : 0}
              aria-disabled={items.length === 0}
              onClick={() => { if (items.length === 0) return; setPromoOpen(true); setPromoInput(""); setPromoError(""); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              {promoApplied
                ? <span className={styles.promoTriggerApplied}>✓ {promo} applied — {promoDiscount?.label}!</span>
                : <span>Have a promo code?</span>}
              {promoApplied
                ? <button className={styles.promoRemoveBtn} onClick={e => { e.stopPropagation(); setPromoApplied(false); setPromo(""); setPromoDiscount(null); }}>Remove</button>
                : <span className={styles.promoTriggerArrow}>›</span>}
            </div>

            {promoOpen && (
              <div className={styles.promoOverlay} onClick={() => setPromoOpen(false)}>
                <div className={styles.promoModal} onClick={e => e.stopPropagation()}>
                  <div className={styles.promoModalHeader}>
                    <h3 className={styles.promoModalTitle}>Apply Coupon</h3>
                    <button className={styles.promoModalClose} onClick={() => setPromoOpen(false)}>✕</button>
                  </div>
                  <div className={styles.promoModalInputRow}>
                    <input
                      className={styles.promoModalInput}
                      placeholder="Enter coupon code"
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                      onKeyDown={e => e.key === "Enter" && applyPromo()}
                      autoFocus
                    />
                    <button className={styles.promoModalApplyBtn} onClick={() => applyPromo()} disabled={checking || !promoInput}>
                      {checking ? <span className={styles.spinner} /> : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className={styles.promoModalError}>{promoError}</p>}
                  {availableCodes.length > 0 && (
                    <>
                      <p className={styles.promoModalSectionLabel}>Available Coupons</p>
                      <div className={styles.promoModalList}>
                        {availableCodes.map(c => {
                          const expanded = expandedCoupons.has(c.code);
                          return (
                            <div key={c.code} className={styles.promoCouponCard}>
                              <div className={styles.promoCouponBadge}>
                                <span className={styles.promoCouponBadgeIcon}>🎟️</span>
                                {c.code}
                              </div>

                              <p className={styles.promoCouponHeadline}>{formatCouponHeadline(c)}</p>
                              <p className={styles.promoCouponSub}>
                                Use code <strong>{c.code}</strong> & {formatCouponHeadline(c).replace(/^Get /, "").toLowerCase()}
                              </p>

                              {c.description && (
                                <>
                                  <button
                                    type="button"
                                    className={styles.promoCouponMoreBtn}
                                    onClick={() => toggleCouponExpanded(c.code)}
                                  >
                                    {expanded ? "− Less" : "+ More"}
                                  </button>
                                  {expanded && (
                                    <div className={styles.promoCouponDesc}>
                                      {c.description.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                                      {c.expiresAt && (
                                        <p className={styles.promoCouponExpiry}>
                                          Valid till {new Date(c.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}

                              <button
                                className={styles.promoCouponApply}
                                onClick={() => { setPromoInput(c.code); applyPromo(c.code); }}
                              >
                                Apply Coupon
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {submitError && (
              <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{submitError}</p>
            )}

            <div className={styles.ctaWrap}>
              <button
                className={styles.checkoutBtn}
                onClick={handlePlaceOrder}
                disabled={submitting || items.length === 0}
              >
                <span className={styles.checkoutBtnLeft}>
                  {submitting ? "Placing order…" : "Place order"}
                </span>
                <span className={styles.checkoutBtnPrice}>£{total.toFixed(2)}</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
    {confirming && (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 300 }}>
          <DeliveryVanAnimation />
          <p style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>Please wait order is confirming</p>
        </div>
      </div>
    )}
    {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </>
  );
}
