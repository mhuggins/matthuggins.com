import classNames from "classnames";
import { string } from "prop-types";

import styles from "./Button.scss";

const Button = ({ className, ...props }) => (
  <button className={classNames(styles.button, className)} {...props} />
);

Button.propTypes = {
  className: string,
};

Button.defaultProps = {
  className: null,
};

export default Button;
