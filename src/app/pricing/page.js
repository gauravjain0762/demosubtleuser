"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import AuthPanel from "../components/AuthPanel";
import Footer from "../components/Footer";
import LogoLoader from "../components/LogoLoader";
import { api } from "../lib/api";
import styles from "./page.module.css";

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedPatterns, setSelectedPatterns] = useState({});
  const [promos, setPromos] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/subscriptions/available-plans"),
      fetch("https://plain-frog-28dcsubtle.gauravjain0762.workers.dev/api/promo").then(res => res.json())
    ])
      .then(([plansData, promosData]) => {
        const plansArray = plansData?.plans || plansData || [];
        setPlans(Array.isArray(plansArray) ? plansArray : []);
        if (promosData?.promoCodes) {
          setPromos(promosData.promoCodes);
        }
      })
      .catch(err => {
        setError(err?.error || "Failed to load plans");
        setPlans([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)" }}>
        <img src="/logo.png" alt="Loading" style={{ width: "120px", height: "120px", objectFit: "contain" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.page} style={{ textAlign: "center", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <p style={{ color: "#c0392b", marginBottom: 16 }}>{error}</p>
            <Link href="/contact" className={styles.btnPrimary}>Contact us</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.page} style={{ textAlign: "center", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <p>No plans available at the moment</p>
            <Link href="/contact" className={styles.btnPrimary}>Contact us</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.page}>
          <div className={styles.header}>
            <h1 className={styles.heading}>Subscription Plans</h1>
            <p className={styles.subheading}>Choose the plan that works best for your team</p>
          </div>

          {selectedPromo && (
            <div className={styles.promoModalOverlay} onClick={() => setSelectedPromo(null)}>
              <div className={styles.promoModal} onClick={e => e.stopPropagation()}>
                <button className={styles.promoModalClose} onClick={() => setSelectedPromo(null)}>✕</button>

                <div className={styles.promoModalContent}>
                  <div className={styles.promoModalDiscount}>
                    {selectedPromo.type === "percentage" ? `${selectedPromo.value}%` : `£${selectedPromo.value}`}
                  </div>

                  <h2 className={styles.promoModalLabel}>{selectedPromo.label}</h2>
                  <p className={styles.promoModalDescription}>{selectedPromo.description}</p>

                  <div className={styles.promoCodeBox}>
                    <span className={styles.promoCodeLabel}>Use Code:</span>
                    <code className={styles.promoCode}>{selectedPromo.code}</code>
                  </div>

                  {selectedPromo.restrictions && selectedPromo.restrictions.length > 0 && (
                    <div className={styles.promoRestrictions}>
                      <p className={styles.promoRestrictionsTitle}>Restrictions:</p>
                      {selectedPromo.restrictions.map((res, idx) => (
                        <span key={idx} className={styles.promoRestrictionItem}>✓ {res}</span>
                      ))}
                    </div>
                  )}

                  <button className={styles.promoCloseBtn} onClick={() => setSelectedPromo(null)}>Got it</button>
                </div>
              </div>
            </div>
          )}

          <div className={styles.plansGrid}>
            {plans.map(plan => (
              <div key={plan._id} className={styles.planCard}>
                <div className={styles.planHeader}>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>


                <div className={styles.planDetails}>
                  {plan.type === "weekly" && (
                    <div className={styles.deliveryDays}>
                      <p className={styles.detailLabel}>Delivery Days:</p>
                      <div className={styles.daysList}>
                        {(plan.deliveryDays || ["Mon", "Tue", "Wed", "Thu", "Fri"]).map(day => (
                          <span key={day} className={styles.dayBadge}>{day}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.type === "one-off" && plan.patterns && plan.patterns.length > 0 && (
                    <div className={styles.patterns}>
                      <p className={styles.detailLabel}>Delivery Patterns:</p>
                      <div className={styles.patternsList}>
                        {plan.patterns.map(pattern => {
                          const isSelected = selectedPatterns[plan._id] === pattern.id;
                          return (
                            <div
                              key={pattern.id}
                              className={`${styles.patternItem} ${isSelected ? styles.patternItemSelected : ""}`}
                              onClick={() => setSelectedPatterns({ ...selectedPatterns, [plan._id]: pattern.id })}
                            >
                              <span className={styles.patternName}>{pattern.name}</span>
                              <span className={styles.patternDays}>{pattern.days.join(", ")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => router.push("/menu")} className={styles.orderNowBtn}>
                  Order Now
                </button>
              </div>
            ))}
          </div>

          {promos.length > 0 && (
            <div className={styles.trendingOffersSection}>
              <h3 className={styles.trendingOffersTitle}>Currently Trending Offers</h3>
              <div className={styles.trendingOffersList}>
                {promos.map(promo => (
                  <div
                    key={promo.code}
                    className={styles.trendingOfferCard}
                    onClick={() => setSelectedPromo(promo)}
                  >
                    <div className={styles.trendingOfferContent}>
                      <div className={styles.trendingOfferDiscount}>
                        {promo.type === "percentage" ? `${promo.value}%` : `£${promo.value}`}
                      </div>
                      <div className={styles.trendingOfferInfo}>
                        <p className={styles.trendingOfferLabel}>{promo.label}</p>
                        <p className={styles.trendingOfferDescription}>{promo.description}</p>
                      </div>
                    </div>
                    <div className={styles.trendingOfferArrow}>→</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </>
  );
}
