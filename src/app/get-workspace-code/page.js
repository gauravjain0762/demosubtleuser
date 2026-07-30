"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import styles from "./page.module.css";

const EMPLOYEE_OPTIONS = ["1 – 10", "11 – 25", "26 – 50", "51 – 100", "101 – 250", "250+"];
const PREMISE_OPTIONS  = ["Office", "Warehouse", "Factory", "Garage", "Workshop", "Depot", "Construction site office", "Industrial unit", "Business park", "Call centre", "Clinic", "School", "College", "Gym", "Commercial studio"];
const DELIVERY_TIMES   = [
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM",  "1:30 PM",
  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "3:30 PM",
  "4:00 PM",  "4:30 PM",
  "5:00 PM",  "5:30 PM",
  "6:00 PM",  "6:30 PM",
  "7:00 PM",
];

const BENEFITS = [
  { icon: "⚡", text: "Setup in under 5 minutes" },
  { icon: "🚚", text: "Free delivery to your door" },
  { icon: "🍱", text: "Fresh chef-prepared meals daily" },
];

const COUNTRY_CODES = [
  { code: "+44", label: "🇬🇧 United Kingdom (+44)" },
  { code: "+1", label: "🇺🇸 United States (+1)" },
  { code: "+1", label: "🇨🇦 Canada (+1)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+49", label: "🇩🇪 Germany (+49)" },
  { code: "+39", label: "🇮🇹 Italy (+39)" },
  { code: "+34", label: "🇪🇸 Spain (+34)" },
  { code: "+31", label: "🇳🇱 Netherlands (+31)" },
  { code: "+32", label: "🇧🇪 Belgium (+32)" },
  { code: "+46", label: "🇸🇪 Sweden (+46)" },
  { code: "+47", label: "🇳🇴 Norway (+47)" },
  { code: "+61", label: "🇦🇺 Australia (+61)" },
  { code: "+64", label: "🇳🇿 New Zealand (+64)" },
  { code: "+91", label: "🇮🇳 India (+91)" },
];

export default function GetWorkspaceCodePage() {
  const [step, setStep]         = useState(1);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [referenceId, setReferenceId] = useState("");

  const [workspace, setWorkspace] = useState({
    name: "", address1: "",
    town: "", city: "", county: "", postcode: "",
    country: "GB",
    deliveryTimes: [""],   // index 0 = main, 1+ = Break 1, Break 2…
    employees: "", premiseType: "",
  });
  const [contact, setContact] = useState({
    firstName: "", lastName: "", email: "", countryCode: "+44", phone: "", notes: "",
  });

  const setW  = (k, v) => { setWorkspace(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };
  const setCt = (k, v) => { setContact(p => ({ ...p, [k]: v }));   setErrors(e => ({ ...e, [k]: "" })); };

  const updateTime = (i, v) => {
    setWorkspace(p => { const t = [...p.deliveryTimes]; t[i] = v; return { ...p, deliveryTimes: t }; });
    setErrors(e => ({ ...e, deliveryTimes: "" }));
  };
  const addTime    = () => setWorkspace(p => ({ ...p, deliveryTimes: [...p.deliveryTimes, ""] }));
  const removeTime = (i) => setWorkspace(p => ({ ...p, deliveryTimes: p.deliveryTimes.filter((_, idx) => idx !== i) }));

  const validateStep1 = () => {
    const e = {};
    if (!workspace.name.trim())                 e.name          = "Required";
    if (!workspace.town.trim())                 e.town          = "Required";
    if (!workspace.city.trim())                 e.city          = "Required";
    if (!workspace.postcode.trim())             e.postcode      = "Required";
    if (!workspace.deliveryTimes[0].trim())     e.deliveryTimes = "At least one delivery time is required";
    if (!workspace.employees)                   e.employees     = "Required";
    if (!workspace.premiseType)                 e.premiseType   = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!contact.firstName.trim()) e.firstName = "Required";
    if (!contact.lastName.trim())  e.lastName  = "Required";
    if (!contact.email.trim() || !/\S+@\S+\.\S+/.test(contact.email)) e.email = "Valid email required";
    if (!contact.phone.trim())     e.phone     = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const data = await api.post("/api/workspace-code", {
        workspace: {
          name:          workspace.name,
          address1:      workspace.address1,
          town:          workspace.town,
          city:          workspace.city,
          county:        workspace.county,
          postcode:      workspace.postcode,
          country:       workspace.country,
          deliveryTimes: workspace.deliveryTimes.filter(t => t.trim()),
          employees:     workspace.employees,
          premiseType:   workspace.premiseType,
        },
        contact: {
          firstName: contact.firstName,
          lastName:  contact.lastName,
          email:     contact.email,
          countryCode: contact.countryCode,
          phone:     contact.phone,
          notes:     contact.notes,
        },
      });
      setReferenceId(data.referenceId || "");
      setStep(3);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setSubmitError(err.error || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const progress = step === 3 ? 100 : step === 2 ? 66 : 33;
  const filledTimes = workspace.deliveryTimes.filter(t => t.trim());

  return (
    <div className={styles.root}>

      {/* ── Left panel ── */}
      <div className={styles.left}>
        <Link href="/" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to home
        </Link>

        <div className={styles.leftContent}>
          <h1 className={styles.leftHeading}>
            Get your<br />
            <span className={styles.leftAccent}>workspace</span><br />
            code
          </h1>
          <p className={styles.leftSub}>
            Register your workplace and we'll set up a dedicated lunch programme with your own unique code.
          </p>
          <ul className={styles.benefits}>
            {BENEFITS.map((b, i) => (
              <li key={i} className={styles.benefit} style={{ animationDelay: (0.1 + i * 0.08) + "s" }}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                <span className={styles.benefitText}>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={styles.right}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: progress + "%" }} />
        </div>

        <div className={styles.formWrap}>
          {step < 3 && (
            <div className={styles.stepRow}>
              <span className={styles.stepBadge}>Step {step} of 2</span>
              <span className={styles.stepLabel}>{step === 1 ? "Workspace details" : "Contact details"}</span>
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className={styles.formStep} key="step1">
              <h2 className={styles.formHeading}>
                Tell us about your <span className={styles.formAccent}>workspace</span>
              </h2>
              <p className={styles.formSub}>We'll set up your delivery location and generate your unique code.</p>

              <div className={styles.fields}>

                {/* Workspace name */}
                <div className={styles.field} style={{ "--fi": 0 }}>
                  <label className={styles.label}>Workspace name <span className={styles.req}>*</span></label>
                  <input className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                    placeholder="e.g. Acme HQ" value={workspace.name}
                    onChange={e => setW("name", e.target.value)} autoFocus />
                  {errors.name && <p className={styles.errMsg}>{errors.name}</p>}
                </div>

                {/* Address */}
                <div className={styles.field} style={{ "--fi": 1 }}>
                  <label className={styles.label}>Address <span className={styles.req}>*</span></label>
                  <input
                    className={`${styles.input} ${errors.address1 ? styles.inputError : ""}`}
                    placeholder="e.g. 12 Business Park, Canary Wharf"
                    value={workspace.address1}
                    onChange={e => setW("address1", e.target.value)}
                  />
                  {errors.address1 && <p className={styles.errMsg}>{errors.address1}</p>}
                </div>

                <div className={styles.row}>
                  <div className={styles.field} style={{ "--fi": 2 }}>
                    <label className={styles.label}>Town <span className={styles.req}>*</span></label>
                    <input className={`${styles.input} ${errors.town ? styles.inputError : ""}`}
                      placeholder="e.g. Canary Wharf" value={workspace.town}
                      onChange={e => setW("town", e.target.value)} />
                    {errors.town && <p className={styles.errMsg}>{errors.town}</p>}
                  </div>
                  <div className={styles.field} style={{ "--fi": 3 }}>
                    <label className={styles.label}>City <span className={styles.req}>*</span></label>
                    <input className={`${styles.input} ${errors.city ? styles.inputError : ""}`}
                      placeholder="e.g. London" value={workspace.city}
                      onChange={e => setW("city", e.target.value)} />
                    {errors.city && <p className={styles.errMsg}>{errors.city}</p>}
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field} style={{ "--fi": 4 }}>
                    <label className={styles.label}>County</label>
                    <input className={styles.input}
                      placeholder="e.g. Yorkshire" value={workspace.county}
                      onChange={e => setW("county", e.target.value)} />
                  </div>
                  <div className={styles.field} style={{ "--fi": 5 }}>
                    <label className={styles.label}>Postcode <span className={styles.req}>*</span></label>
                    <input className={`${styles.input} ${errors.postcode ? styles.inputError : ""}`}
                      placeholder="e.g. E14 5AB" value={workspace.postcode}
                      onChange={e => setW("postcode", e.target.value.toUpperCase())} />
                    {errors.postcode && <p className={styles.errMsg}>{errors.postcode}</p>}
                  </div>
                </div>

                <div className={styles.field} style={{ "--fi": 6 }}>
                  <label className={styles.label}>Country <span className={styles.req}>*</span></label>
                  <select className={`${styles.input} ${styles.select}`}
                    value={workspace.country} onChange={e => setW("country", e.target.value)}>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="NZ">🇳🇿 New Zealand</option>
                    <option value="IN">🇮🇳 India</option>
                    <option value="SG">🇸🇬 Singapore</option>
                  </select>
                </div>

                {/* Delivery times */}
                <div className={styles.field} style={{ "--fi": 7 }}>
                  <label className={styles.label}>
                    Lunch delivery time <span className={styles.req}>*</span>
                  </label>

                  <div className={styles.timeSlotsWrap}>
                    {workspace.deliveryTimes.map((t, i) => (
                      <div key={i} className={styles.timeSlotRow} style={{ animationDelay: (i * 0.06) + "s" }}>
                        <span className={styles.timeSlotTag}>Break {i + 1}</span>
                        <select
                          className={`${styles.input} ${styles.select} ${styles.timeSelect} ${i === 0 && errors.deliveryTimes ? styles.inputError : ""}`}
                          value={t}
                          onChange={e => updateTime(i, e.target.value)}
                        >
                          <option value="">Select time…</option>
                          {DELIVERY_TIMES.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        {i > 0 && (
                          <button type="button" className={styles.timeRemoveBtn} onClick={() => removeTime(i)} aria-label="Remove">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    {workspace.deliveryTimes.length < 3 && (
                      <button type="button" className={styles.timeAddBtn} onClick={addTime}>
                        <span className={styles.timeAddIcon}>+</span>
                        Add another time slot
                      </button>
                    )}
                  </div>
                  {errors.deliveryTimes && <p className={styles.errMsg}>{errors.deliveryTimes}</p>}
                </div>

                {/* Employees + Premise */}
                <div className={styles.row}>
                  <div className={styles.field} style={{ "--fi": 9 }}>
                    <label className={styles.label}>No. of employees <span className={styles.req}>*</span></label>
                    <select className={`${styles.input} ${styles.select} ${errors.employees ? styles.inputError : ""}`}
                      value={workspace.employees} onChange={e => setW("employees", e.target.value)}>
                      <option value="">Select…</option>
                      {EMPLOYEE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {errors.employees && <p className={styles.errMsg}>{errors.employees}</p>}
                  </div>
                  <div className={styles.field} style={{ "--fi": 10 }}>
                    <label className={styles.label}>Business type <span className={styles.req}>*</span></label>
                    <select className={`${styles.input} ${styles.select} ${errors.premiseType ? styles.inputError : ""}`}
                      value={workspace.premiseType} onChange={e => setW("premiseType", e.target.value)}>
                      <option value="">Select…</option>
                      {PREMISE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {errors.premiseType && <p className={styles.errMsg}>{errors.premiseType}</p>}
                  </div>
                </div>
              </div>

              <button className={styles.btnPrimary} onClick={handleNext}>
                Continue
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <form className={styles.formStep} key="step2" onSubmit={handleSubmit} noValidate>
              <h2 className={styles.formHeading}>
                <span className={styles.formAccent}>Designated</span> contact details
              </h2>
              <p className={styles.formSub}>We'll send your workspace code and setup instructions on your email.</p>

              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field} style={{ "--fi": 0 }}>
                    <label className={styles.label}>First name <span className={styles.req}>*</span></label>
                    <input className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                      placeholder="Jane" value={contact.firstName}
                      onChange={e => setCt("firstName", e.target.value)} autoFocus />
                    {errors.firstName && <p className={styles.errMsg}>{errors.firstName}</p>}
                  </div>
                  <div className={styles.field} style={{ "--fi": 1 }}>
                    <label className={styles.label}>Last name <span className={styles.req}>*</span></label>
                    <input className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                      placeholder="Smith" value={contact.lastName}
                      onChange={e => setCt("lastName", e.target.value)} />
                    {errors.lastName && <p className={styles.errMsg}>{errors.lastName}</p>}
                  </div>
                </div>

                <div className={styles.field} style={{ "--fi": 2 }}>
                  <label className={styles.label}>Designated person email <span className={styles.req}>*</span></label>
                  <input type="email" className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                    placeholder="jane@workspace.com" value={contact.email}
                    onChange={e => setCt("email", e.target.value)} />
                  {errors.email && <p className={styles.errMsg}>{errors.email}</p>}
                </div>

                <div className={styles.field} style={{ "--fi": 3 }}>
                  <label className={styles.label}>Designated phone number <span className={styles.req}>*</span></label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div className={styles.countryCodeDropdown}>
                      <select
                        value={contact.countryCode}
                        onChange={e => setCt("countryCode", e.target.value)}
                        className={styles.countryCodeSelect}
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code + c.label} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <span className={styles.countryCodeDisplay}>
                        {COUNTRY_CODES.find(c => c.code === contact.countryCode)?.label.split(" ")[0]} {contact.countryCode}
                      </span>
                    </div>
                    <input
                      type="tel"
                      className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                      placeholder="7700 000000"
                      value={contact.phone}
                      onChange={e => setCt("phone", e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  {errors.phone && <p className={styles.errMsg}>{errors.phone}</p>}
                </div>

                <div className={styles.field} style={{ "--fi": 4 }}>
                  <label className={styles.label}>Additional notes</label>
                  <textarea
                    className={styles.input}
                    style={{ resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
                    placeholder="e.g. cutlery required, spice preference, allergy notes…"
                    value={contact.notes}
                    onChange={e => setCt("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.summaryPill} style={{ "--fi": 5 }}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryIcon}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    {workspace.name}
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryIcon}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </span>
                    {[workspace.town, workspace.city, workspace.county].filter(Boolean).join(", ")}
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryIcon}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </span>
                    {filledTimes.map((t, i) => `Break ${i + 1}: ${t}`).join("  ·  ")}
                  </div>
                </div>
              </div>

              {submitError && <p className={styles.errMsg} style={{ textAlign: "center" }}>{submitError}</p>}
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading
                  ? <span className={styles.spinner} />
                  : <>Get my workspace code</>
                }
              </button>
              <button type="button" className={styles.btnGhost} onClick={() => setStep(1)}>← Back to workspace details</button>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className={styles.formStep} key="step3">
              <div className={styles.successRing}>
                <div className={styles.successIcon}>
                  <svg className={styles.tickSvg} width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline className={styles.tickPath} points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>

              <h2 className={`${styles.formHeading} ${styles.successHeading}`}>
                You&apos;re all set, <span className={styles.formAccent}>{contact.firstName}!</span>
              </h2>
              <p className={`${styles.formSub} ${styles.successSub}`}>
                Your application is under review. We&apos;ll email your workspace code to <strong>{contact.email}</strong> within 1–2 business days once approved.
              </p>
              {referenceId && (
                <p className={`${styles.formSub} ${styles.successSub}`} style={{ marginTop: -8, fontSize: 13, opacity: 0.6 }}>
                  Reference: <strong>{referenceId}</strong>
                </p>
              )}

              <div className={styles.successCard}>
                <div className={styles.successRow}>
                  <span className={styles.successLabel}>Workspace</span>
                  <span className={styles.successVal}>{workspace.name}</span>
                </div>
                <div className={styles.successDivider} />
                <div className={styles.successRow}>
                  <span className={styles.successLabel}>Address</span>
                  <span className={styles.successVal}>{[workspace.town, workspace.city, workspace.county, workspace.postcode].filter(Boolean).join(", ")}, UK</span>
                </div>
                <div className={styles.successDivider} />
                <div className={styles.successRow}>
                  <span className={styles.successLabel}>Delivery</span>
                  <span className={styles.successVal}>
                    {workspace.deliveryTimes.filter(t => t.trim()).map((t, i) => (
                      <span key={i} className={styles.timeTag}>
                        Break {i + 1}: {t}
                      </span>
                    ))}
                  </span>
                </div>
                <div className={styles.successDivider} />
                <div className={styles.successRow}>
                  <span className={styles.successLabel}>Contact</span>
                  <span className={styles.successVal}>{contact.firstName} {contact.lastName}</span>
                </div>
              </div>

              <Link href="/" className={styles.btnPrimary} style={{ textDecoration: "none", justifyContent: "center" }}>
                Back to home
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
