import classNames from "classnames";
import { bool, string } from "prop-types";

import styles from "./Input.scss";

const Input = ({ className, multiline, ...props }) => {
  const Tag = multiline ? "textarea" : "input";

  const classes = classNames(styles.input, className, {
    [styles.multiline]: multiline,
  });

  return <Tag className={classes} {...props} />;
};

Input.propTypes = {
  className: string,
  multiline: bool,
};

Input.defaultProps = {
  className: null,
  multiline: false,
};

export default Input;
