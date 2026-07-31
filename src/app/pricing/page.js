"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import AuthPanel from "../components/AuthPanel";
import { api } from "../lib/api";
import styles from "./page.module.css";

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    api.get("/api/subscriptions/available-plans")
      .then(data => {
        const plansArray = data?.plans || data || [];
        setPlans(Array.isArray(plansArray) ? plansArray : []);
      })
      .catch(err => {
        setError(err?.error || "Failed to load plans");
        setPlans([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.page} style={{ textAlign: "center", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Loading plans...</p>
        </div>
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

          <div className={styles.plansGrid}>
            {plans.map(plan => (
              <div key={plan._id} className={styles.planCard}>
                <div className={styles.planHeader}>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>


                <div className={styles.planDetails}>
                  {plan.type === "weekly" && plan.deliveryDays && (
                    <div className={styles.deliveryDays}>
                      <p className={styles.detailLabel}>Delivery Days:</p>
                      <div className={styles.daysList}>
                        {plan.deliveryDays.map(day => (
                          <span key={day} className={styles.dayBadge}>{day}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.type === "one-off" && plan.patterns && plan.patterns.length > 0 && (
                    <div className={styles.patterns}>
                      <p className={styles.detailLabel}>Delivery Patterns:</p>
                      <div className={styles.patternsList}>
                        {plan.patterns.map(pattern => (
                          <div key={pattern.id} className={styles.patternItem}>
                            <span className={styles.patternName}>{pattern.name}</span>
                            <span className={styles.patternDays}>{pattern.days.join(", ")}</span>
                          </div>
                        ))}
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
        </div>
      </div>
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </>
  );
}
