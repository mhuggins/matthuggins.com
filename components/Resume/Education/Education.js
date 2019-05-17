import { string, instanceOf } from "prop-types";

import DateRange from "../DateRange";

import styles from "./Education.scss";

class Education extends React.Component {
  static propTypes = {
    school: string.isRequired,
    degree: string.isRequired,
    program: string.isRequired,
    start: instanceOf(Date).isRequired,
    end: instanceOf(Date),
  }

  render() {
    return (
      <div className={styles.education}>
        <div className={styles.degree}>{this.props.degree}, {this.props.program}</div>
        <div className={styles.overview}>
          {this.props.school}
          {" "}&middot;{" "}
          {this.renderDates()}
        </div>
        {this.props.children}
      </div>
    );
  }

  renderDates = () => {
    return (
      <DateRange
        start={this.props.start}
        end={this.props.end}
        format={{ year: "numeric" }}
      />
    );
  }
}

export default Education;
