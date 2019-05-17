import pluralize from "pluralize";
import { number, string } from "prop-types";

import styles from "./Skill.scss";

const Skill = (props) => (
  <div className={styles.skill}>
    <span className={styles.name}>{props.name}</span>
    <span className={styles.duration}>{pluralize("yr", props.years, true)}</span>
    <span className={styles.proficiency}>{props.proficiency}</span>
  </div>
);

Skill.propTypes = {
  name: string.isRequired,
  years: number.isRequired,
  proficiency: string.isRequired,
};

export default Skill;
