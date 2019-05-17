import classNames from "classnames";

import Input from "../Input";

import styles from "./LabeledInput.scss";

const LabeledInput = ({ className, label, ...props }) => (
  <label className={classNames(styles.labeledInput, className)}>
    <div className={styles.label}>{label}</div>
    <Input {...props} />
  </label>
);

export default LabeledInput;
