import styled from '@emotion/styled';
import React from 'react';

import Input from '../Input';
import { InputProps } from '../Input/Input';

const Container = styled('label')({
  display: 'block',
  width: '100%',
});

const Label = styled('div')({
  marginBottom: '10px',
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: 1,
  color: '#444',
});

type Props = InputProps & {
  label: string;
}

const LabeledInput = ({ className, label, ...props }: Props) => (
  <Container className={className}>
    <Label>{label}</Label>
    <Input {...props} />
  </Container>
);

export default LabeledInput;
