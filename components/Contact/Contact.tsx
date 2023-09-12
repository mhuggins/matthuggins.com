import styled from '@emotion/styled';
import { Card, CardContent } from '@mui/material';
import React from 'react';
import Button from './Button';
import LabeledInput from './LabeledInput';
import Page from '../Page';

const FormRow = styled('div')({
  display: 'flex',
  gap: '20px',
  marginBottom: '20px',
});

const Contact = () => (
  <Page title="Contact">
    <Card>
      <CardContent>
        <form action="https://formspree.io/matt.huggins+website@gmail.com" method="POST">
          <FormRow>
            <LabeledInput label="Name" type="text" name="name" autoFocus />
            <LabeledInput label="Email Address" type="email" name="_replyto" />
          </FormRow>

          <FormRow>
            <LabeledInput label="Message" multiline name="message" />
          </FormRow>

          <Button type="submit">Send Message</Button>
        </form>
      </CardContent>
    </Card>
  </Page>
);

export default Contact;
