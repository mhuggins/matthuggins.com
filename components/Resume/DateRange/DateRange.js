import Duration from "duration";
import pluralize from "pluralize";
import classNames from "classnames";
import { bool, instanceOf, string } from "prop-types";

import dateFormatShape from "../../../shapes/dateFormatShape";

import styles from "./DateRange.scss";

const DEFAULT_FORMAT = {
  year: "numeric",
  month: "short",
};

class DateRange extends React.Component {
  static propTypes = {
    className: string,
    start: instanceOf(Date).isRequired,
    end: instanceOf(Date),
    format: dateFormatShape,
    separator: string,
  }

  static defaultProps = {
    className: null,
    format: DEFAULT_FORMAT,
    separator: " - "
  }

  render() {
    const { start, end, format, separator, className } = this.props;

    return (
      <span className={classNames(styles.dateRange, className)}>
        {start.toLocaleDateString("en-US", format)}
        {separator}
        {end ? end.toLocaleDateString("en-US", format) : "Present"}
      </span>
    );
  }
}

export default DateRange;
