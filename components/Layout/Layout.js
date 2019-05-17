import Link from 'next/link';

import styles from "./Layout.scss";

const Layout = (props) => (
  <div className={styles.layout}>
    <div className={styles.headerBackground} />
    <div className={styles.header}>
      <div className={styles.title}>
        <h1>Matt Huggins</h1>
        <h2>Web &amp; Mobile Developer</h2>
      </div>
      <ul className={styles.links}>
        <li><Link href="/"><a>Resume</a></Link></li>
        <li><a href="https://github.com/mhuggins" target="_blank">GitHub</a></li>
        <li><a href="https://www.linkedin.com/in/huggie/" target="_blank">LinkedIn</a></li>
        <li><Link href="/contact"><a>Contact</a></Link></li>
      </ul>
    </div>

    {props.children}
  </div>
);

export default Layout;
