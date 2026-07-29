"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Navbar from "../../components/Navbar";
import AuthPanel from "../../components/AuthPanel";
import DeliveryVanAnimation from "../../components/DeliveryVanAnimation";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import styles from "./page.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).catch((err) => {
  console.error("Stripe loading error:", err);
  return null;
});

function CheckoutForm({ subscription, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !elementReady) {
      setError("Payment form is not ready. Please try again.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setError(err.message || "Payment failed");
      setProcessing(false);
    }
  };

  const sub = subscription.subscription;

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <div className={styles.paymentElement}>
        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && <div className={styles.paymentError}>{error}</div>}

      <button
        type="submit"
        disabled={!stripe || !elementReady || processing}
        className={styles.confirmBtn}
      >
        {processing ? "Processing Payment..." : `Pay £${sub.price.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function SubscriptionCheckout() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/pricing");
      return;
    }

    let stored = null;
    try {
      stored = JSON.parse(sessionStorage.getItem("sk_subscription") || "null");
    } catch {
      stored = null;
    }

    if (!stored) {
      setError("Subscription data not found. Please select a plan again.");
      setLoading(false);
      return;
    }

    setSubscription(stored);
    setLoading(false);
  }, [user, router]);

  const handleConfirmClick = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    if (!subscription) return;

    setConfirming(true);
    try {
      const data = await api.post("/api/subscriptions/checkout", {
        planId: subscription.planId,
        patternId: subscription.patternId,
        paymentIntentId
      });

      sessionStorage.removeItem("sk_subscription");
      sessionStorage.setItem("sk_subscription_success", JSON.stringify(data.subscription));

      router.push("/subscription/success");
    } catch (err) {
      setError(err.error || "Failed to complete subscription");
      setConfirming(false);
      setShowPayment(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.container} style={{ textAlign: "center", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <p className={styles.errorText}>{error || "Unable to load subscription"}</p>
            {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
              <p className={styles.errorText} style={{ fontSize: "13px" }}>
                ⚠️ Stripe key not configured. Please check .env.local
              </p>
            )}
            <Link href="/pricing" className={styles.btnPrimary}>
              Back to Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sub = subscription.subscription;

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    } catch {
      return isoString;
    }
  };

  const getDayName = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-GB", { weekday: "long" });
    } catch {
      return isoString;
    }
  };

  if (showPayment && subscription.clientSecret) {
    return (
      <>
        <div className={styles.root}>
          <Navbar onSignIn={() => setAuthOpen(true)} />
          <div className={styles.container}>
            <div className={styles.content}>
              {/* Left Panel - Summary */}
              <div className={styles.leftPanel}>
                <div className={styles.deliveryInfo}>
                  <DeliveryVanAnimation />
                  <p className={styles.sectionTitle} style={{ marginTop: 0 }}>Subscription Plan</p>

                  <div className={styles.planCard}>
                    <h2 className={styles.planName}>{sub.planName}</h2>
                    <p className={styles.planType}>Plan Type: {sub.planType}</p>
                  </div>

                  <p className={styles.sectionTitle}>Delivery Days</p>
                  <div className={styles.daysList}>
                    {(sub.selectedDays || []).map(day => (
                      <span key={day} className={styles.dayBadge}>{day}</span>
                    ))}
                  </div>

                  {sub.nextDeliveries && sub.nextDeliveries.length > 0 && (
                    <>
                      <p className={styles.sectionTitle}>First Deliveries</p>
                      <div className={styles.deliveryList}>
                        {sub.nextDeliveries.slice(0, 4).map((d, i) => (
                          <div key={i} className={styles.deliveryItem}>
                            <span className={styles.deliveryDay}>{getDayName(d.date)}</span>
                            <span className={styles.deliveryDate}>{formatDate(d.date)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Panel - Payment */}
              <div className={styles.rightPanel}>
                <div className={styles.header}>
                  <button
                    onClick={() => setShowPayment(false)}
                    className={styles.cancelLink}
                    style={{ display: "block", marginBottom: "20px", fontSize: "14px" }}
                  >
                    ← Back
                  </button>
                  <h1 className={styles.heading}>Complete Payment</h1>
                  <p className={styles.subtext}>Enter your card details to activate subscription</p>
                </div>

                <div className={styles.card}>
                  <div className={styles.row}>
                    <span>Plan Name</span>
                    <span className={styles.value}>{sub.planName}</span>
                  </div>
                  <div className={styles.row}>
                    <span>Amount</span>
                    <span className={styles.priceValue}>£{sub.price.toFixed(2)}</span>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.row}>
                    <span>Billing</span>
                    <span className={styles.value}>Weekly</span>
                  </div>
                </div>

                <Elements stripe={stripePromise} options={{ clientSecret: subscription.clientSecret }}>
                  <CheckoutForm subscription={subscription} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            </div>
          </div>
        </div>
        {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <div className={styles.root}>
        <Navbar onSignIn={() => setAuthOpen(true)} />
        <div className={styles.container}>
          <div className={styles.content}>
            {/* Left Panel */}
            <div className={styles.leftPanel}>
              <div className={styles.deliveryInfo}>
                <DeliveryVanAnimation />
                <p className={styles.sectionTitle} style={{ marginTop: 0 }}>Subscription Plan</p>

                <div className={styles.planCard}>
                  <h2 className={styles.planName}>{sub.planName}</h2>
                  <p className={styles.planType}>Plan Type: {sub.planType}</p>
                </div>

                <p className={styles.sectionTitle}>Delivery Days</p>
                <div className={styles.daysList}>
                  {(sub.selectedDays || []).map(day => (
                    <span key={day} className={styles.dayBadge}>{day}</span>
                  ))}
                </div>

                {sub.nextDeliveries && sub.nextDeliveries.length > 0 && (
                  <>
                    <p className={styles.sectionTitle}>First Deliveries</p>
                    <div className={styles.deliveryList}>
                      {sub.nextDeliveries.slice(0, 4).map((d, i) => (
                        <div key={i} className={styles.deliveryItem}>
                          <span className={styles.deliveryDay}>{getDayName(d.date)}</span>
                          <span className={styles.deliveryDate}>{formatDate(d.date)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className={styles.rightPanel}>
              <div className={styles.header}>
                <h1 className={styles.heading}>Confirm Subscription</h1>
                <p className={styles.subtext}>Review your subscription details and proceed to payment</p>
              </div>

              <div className={styles.card}>
                <div className={styles.row}>
                  <span>Plan Name</span>
                  <span className={styles.value}>{sub.planName}</span>
                </div>
                <div className={styles.row}>
                  <span>Plan Type</span>
                  <span className={styles.value}>{sub.planType}</span>
                </div>
                <div className={styles.row}>
                  <span>Frequency</span>
                  <span className={styles.value}>Weekly</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.row}>
                  <span>Price per week</span>
                  <span className={styles.priceValue}>£{sub.price.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.terms}>
                <p>✓ By subscribing, you agree to our terms and conditions</p>
                <p>✓ You can pause or cancel anytime from your dashboard</p>
                <p>✓ First charge will be applied today</p>
              </div>

              <div className={styles.actions}>
                <button onClick={handleConfirmClick} className={styles.confirmBtn}>
                  Confirm & Proceed to Payment
                </button>
                <Link href="/pricing" className={styles.cancelLink}>
                  Back to Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </>
  );
}
