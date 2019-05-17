import Head from "next/head";
import classNames from "classnames";

import siteTitle from "../../values/siteTitle";

import styles from "./Page.scss";

const Page = ({ className, title, children }) => (
  <div className={classNames(styles.page, className)}>
    <Head>
      <title>{title} - {siteTitle}</title>
    </Head>
    <h3 className={styles.title}>{title}</h3>
    {children}
  </div>
);

export default Page;
