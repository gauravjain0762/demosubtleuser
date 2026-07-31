"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { label: "How it works",              href: "/how-it-works" },
  { label: "Order now",                  href: "/menu" },
  { label: "Become a Delivery Location", href: "/for-businesses" },
  { label: "Pricing & Subscriptions",   href: "/pricing" },
  { label: "Contact us",                href: "/contact" },
];

function getFirstName(user) {
  if (user?.firstName) return user.firstName;
  if (user?.name) return user.name.split(" ")[0];
  if (user?.email) {
    const local = user.email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "there";
}

function ProfileMenu({ user, logout }) {
  const firstName = getFirstName(user);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);

  const handleEnter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      className={styles.profileWrap}
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button className={styles.profileBtn} aria-label="Profile menu">
        <span className={styles.profileAvatar}>
          {firstName[0].toUpperCase()}
        </span>
        <span className={styles.profileName}>
          Welcome {firstName}
        </span>
        <svg className={`${styles.profileChevron} ${open ? styles.profileChevronOpen : ""}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div className={`${styles.dropdown} ${open ? styles.dropdownOpen : ""}`}>
        {/* User identity block */}
        <div className={styles.dropdownHeader}>
          <div className={styles.dropdownAvatarLg}>
            {firstName[0].toUpperCase()}
          </div>
          <div className={styles.dropdownIdentity}>
            <span className={styles.dropdownFullName}>Hii {firstName}</span>
            <span className={styles.dropdownEmail}>{user?.email}</span>
          </div>
        </div>

        <div className={styles.dropdownDivider} />

        <Link href="/profile" className={styles.dropdownItem} onClick={() => setOpen(false)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
          My account
        </Link>

        <div className={styles.dropdownDivider} />

        <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={() => { logout(); setOpen(false); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Navbar({ onSignIn }) {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on route change / resize
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else          document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const links = NAV_LINKS;

  const close = () => { setMenuOpen(false); setMobileProfileOpen(false); };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.logoLink} onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Subtle Kitchen" className={styles.logo} />
        </Link>

        {/* Desktop links */}
        <ul className={styles.navLinks}>
          {links.map(link => (
            <li key={link.label}>
              {link.disabled
                ? <span className={`${styles.navLink} ${styles.navLinkDisabled}`}>{link.label}</span>
                : <Link href={link.href} className={styles.navLink}>{link.label}</Link>
              }
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className={styles.navActions}>
          {user ? (
            <ProfileMenu user={user} logout={logout} />
          ) : (
            <button className={styles.signIn} onClick={onSignIn}>Sign in</button>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && <div className={styles.mobileOverlay} onClick={close} />}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
        <ul className={styles.mobileLinks}>
          {links.map(link => (
            <li key={link.label}>
              {link.disabled
                ? <span className={`${styles.mobileLink} ${styles.mobileLinkDisabled}`}>{link.label}</span>
                : <Link href={link.href} className={styles.mobileLink} onClick={close}>{link.label}</Link>
              }
            </li>
          ))}
        </ul>
        <div className={styles.mobileDivider} />
        {user ? (
          <div className={styles.mobileUser}>
            <button
              className={styles.mobileUserInfo}
              onClick={() => setMobileProfileOpen(v => !v)}
              aria-expanded={mobileProfileOpen}
            >
              <span className={styles.mobileUserAvatar}>{getFirstName(user)[0].toUpperCase()}</span>
              <div className={styles.mobileUserText}>
                <p className={styles.mobileUserName}>{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || user?.email}</p>
                {user?.companyCode && <p className={styles.mobileUserCode}>{user.companyCode}</p>}
              </div>
              <svg
                className={`${styles.mobileProfileChevron} ${mobileProfileOpen ? styles.mobileProfileChevronOpen : ""}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {mobileProfileOpen && (
              <div className={styles.mobileProfileItems}>
                <Link href="/profile" className={styles.mobileLink} onClick={close}>My account</Link>
                <button className={styles.mobileSignOut} onClick={() => { logout(); close(); }}>Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <button className={styles.mobileSignIn} onClick={() => { onSignIn(); close(); }}>Sign in</button>
        )}
      </div>
    </nav>
  );
}
