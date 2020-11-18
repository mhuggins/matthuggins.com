import { string, instanceOf, arrayOf } from "prop-types";

import companyShape from "../../../shapes/companyShape";
import DateRange from "../DateRange";

import styles from "./Experience.scss";

class Experience extends React.Component {
  static propTypes = {
    company: companyShape.isRequired,
    role: string.isRequired,
    start: instanceOf(Date).isRequired,
    end: instanceOf(Date),
    points: arrayOf(string),
  }

  static defaultProps = {
    end: null,
    points: [],
  }

  render() {
    return (
      <div className={styles.experience}>
        <div className={styles.role}>{this.props.role}</div>
        <div className={styles.overview}>
          {this.renderCompany()}
          {this.renderDates()}
          {this.renderLocation()}
        </div>
        {this.renderPoints()}
      </div>
    );
  }

  renderCompany = () => {
    const { name, url } = this.props.company;

    if (!url) {
      return <span className={styles.detail}>{name}</span>;
    }

    return (
      <a
        className={styles.detail}
        href={url}
        target="_blank"
      >
        {name}
      </a>
    );
  }

  renderDates = () => {
    return (
      <DateRange
        className={styles.detail}
        start={this.props.start}
        end={this.props.end}
        format={{ year: "numeric" }}
      />
    );
  }

  renderLocation = () => {
    return (
      <span className={styles.detail}>
        {this.props.company.location}
      </span>
    );
  }

  renderPoints = () => {
    const { points } = this.props;

    if (points.length === 0) {
      return null;
    }

    return (
      <ul>
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    );
  }
}

export default Experience;
