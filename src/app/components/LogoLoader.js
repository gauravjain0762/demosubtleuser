import styles from "./LogoLoader.module.css";

export default function LogoLoader() {
  return (
    <div className={styles.loader}>
      <div className={styles.logoContainer}>
        <img src="/logo.png" alt="Subtle Kitchen" className={styles.logo} />
      </div>
    </div>
  );
}
