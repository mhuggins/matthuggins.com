import Page from "../Page";

import LabeledInput from "./LabeledInput";
import Button from "./Button";
import styles from "./Contact.scss";

class Contact extends React.Component {
  render() {
    return (
      <Page className={styles.contact} title="Contact">
        <form action="https://formspree.io/matt.huggins+website@gmail.com" method="POST">
          <div className={styles.row}>
            <LabeledInput className={styles.cell} label="Name" type="text" name="name" autoFocus />
            <LabeledInput className={styles.cell} label="Email" type="email" name="_replyto" />
          </div>

          <div className={styles.row}>
            <LabeledInput label="Message" multiline name="message" />
          </div>

          <Button type="submit">Send Message</Button>
        </form>
      </Page>
    );
  }
}

export default Contact;
