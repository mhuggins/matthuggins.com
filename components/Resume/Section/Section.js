import { noop } from "lodash";
import { string } from "prop-types";

import styles from "./Section.scss";

class Section extends React.Component {
  static propTypes = {
    title: string.isRequired,
  }

  render() {
    return (
      <div className={styles.section}>
        <div className={styles.title}>{this.props.title}</div>
        {this.props.children}
      </div>
    );
  }
}

export default Section;
