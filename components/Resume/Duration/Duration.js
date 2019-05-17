import DurationJS from "duration";
import pluralize from "pluralize";
import classNames from "classnames";
import { string, instanceOf } from "prop-types";

import styles from "./Duration.scss";

class Duration extends React.Component {
  static propTypes = {
    className: string,
    start: instanceOf(Date).isRequired,
    end: instanceOf(Date),
  }

  static defaultProps = {
    className: null,
  }

  render() {
    return (
      <span className={classNames(styles.duration, this.props.className)}>
        {this.getDuration()}
      </span>
    );
  }

  getDuration = () => {
    const { year, month } = new DurationJS(this.props.start, this.props.end || new Date());

    const parts = []

    if (year > 0) {
      parts.push(pluralize("yr", year, true));
    }

    if (month > 0) {
      parts.push(pluralize("mo", month, true));
    }

    return parts.join(" ");
  }
}

export default Duration;
