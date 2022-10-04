import styled from '@emotion/styled';
import React from 'react';

import Button from './Button';
import LabeledInput from './LabeledInput';
import Page from '../Page';

const FormRow = styled('div')({
  display: 'flex',
  marginBottom: '20px',
});

const StyledLabeledInput = styled(LabeledInput)({
  flex: '1 1 auto',
  margin: '0 10px',
  ':first-child': {
    marginLeft: 0,
  },
  ':last-child': {
    marginRight: 0,
  },
});

const Contact = () => (
  <Page title="Contact">
    <form action="https://formspree.io/matt.huggins+website@gmail.com" method="POST">
      <FormRow>
        <StyledLabeledInput label="Name" type="text" name="name" autoFocus />
        <StyledLabeledInput label="Email" type="email" name="_replyto" />
      </FormRow>

      <FormRow>
        <LabeledInput label="Message" multiline name="message" />
      </FormRow>

      <Button type="submit">Send Message</Button>
    </form>
  </Page>
);

export default Contact;
