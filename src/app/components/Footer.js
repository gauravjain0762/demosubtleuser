import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <span className={styles.footerLogoText}>Subtle Kitchen</span>
          </div>
          <p className={styles.footerTagline}>Refined dining for the modern workplace. Delivered daily, with care.</p>
          <a href="#" className={styles.footerSocial} aria-label="Twitter">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </a>
        </div>
        <div className={styles.footerLinks}>
          <div className={styles.footerCol}>
            <p className={styles.footerColTitle}>PLATFORM</p>
            <Link href="/menu" className={styles.footerLink}>Menu</Link>
            <Link href="/for-businesses" className={styles.footerLink}>Become a Delivery Location</Link>
            <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
          </div>
          <div className={styles.footerCol}>
            <p className={styles.footerColTitle}>COMPANY</p>
            <Link href="/contact" className={styles.footerLink}>Contact</Link>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p className={styles.footerCopy}>© 2026 Subtle Kitchen. All rights reserved.</p>
      </div>
    </footer>
  );
}
