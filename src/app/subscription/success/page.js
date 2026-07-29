"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import AuthPanel from "../../components/AuthPanel";
import DeliveryVanAnimation from "../../components/DeliveryVanAnimation";
import { useAuth } from "../../context/AuthContext";
import styles from "./page.module.css";

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/pricing");
      return;
    }

    let stored = null;
    try {
      stored = JSON.parse(sessionStorage.getItem("sk_subscription_success") || "null");
    } catch {
      stored = null;
    }

    if (stored) {
      setSubscription(stored);
      sessionStorage.removeItem("sk_subscription_success");
    }

    setTimeout(() => setVisible(true), 100);
  }, [user, router]);

  if (!subscription) {
    return (
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.container} style={{ textAlign: "center", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  return (
    <>
      <div className={`${styles.root} ${visible ? styles.rootVisible : ""}`}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.container}>
          <div className={styles.twoCol}>
            {/* Left Panel */}
            <div className={styles.leftPanel}>
              <div className={styles.deliveryInfo}>
                <DeliveryVanAnimation />
                <p className={styles.sectionTitle} style={{ marginTop: 0 }}>Your Subscription</p>

                <div className={styles.planCard}>
                  <h2 className={styles.planName}>{subscription.planName}</h2>
                  <p className={styles.planStatus}>
                    <span className={styles.statusBadge}>● Active</span>
                  </p>
                </div>

                <p className={styles.sectionTitle}>First Delivery</p>
                <div className={styles.metaBadge}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {subscription.startDate}
                </div>

                <p className={styles.sectionTitle}>Next Billing</p>
                <div className={styles.metaBadge}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  {subscription.nextBillingDate}
                </div>
              </div>
            </div>

            {/* Right Panel */}
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
                  <h1 className={styles.heading}>Subscription Active! 🎉</h1>
                  <p className={styles.subtext}>Your subscription is ready. Meals will be delivered as scheduled.</p>
                </div>

                <div className={styles.card}>
                  <p className={styles.cardLabel}>SUBSCRIPTION DETAILS</p>
                  <div className={styles.detailsList}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Plan</span>
                      <span className={styles.detailValue}>{subscription.planName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Type</span>
                      <span className={styles.detailValue}>{subscription.planType}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Price</span>
                      <span className={styles.detailValue}>£{formatPrice(subscription.price)}/week</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status</span>
                      <span className={styles.statusBadge}>● Active</span>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link href="/subscription/dashboard" className={styles.btnPrimary}>
                    View My Subscription
                  </Link>
                  <Link href="/" className={styles.btnOutline}>
                    Back to home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </>
  );
}
