import styled from '@emotion/styled';
import React from 'react';

const baseStyles = {
  display: 'block',
  width: '100%',
  margin: 0,
  padding: '0 15px',
  border: '1px solid rgba(68, 68, 68, 0.2)',
  outline: 0,
  lineHeight: 1,
  fontSize: '13px',
  verticalAlign: 'baseline',
  transition: '0.2s all cubic-bezier(.4,0,.2,1)',
  webkitAppearance: 'none',
};

const StyledInput = styled('input')({
  ...baseStyles,
  height: '40px',
});

const StyledTextArea = styled('textarea')({
  ...baseStyles,
  minHeight: '200px',
  padding: '15px',
  resize: 'vertical',
});

interface WrappedInputProps extends React.HTMLProps<HTMLInputElement> {
  multiline?: false;
}

interface WrappedTextAreaProps extends React.HTMLProps<HTMLTextAreaElement> {
  multiline: true;
}

export type InputProps = WrappedInputProps | WrappedTextAreaProps;

const Input = ({ multiline, ...props }: InputProps) => {
  const Tag = multiline ? StyledTextArea : StyledInput;
  // @ts-expect-error
  return <Tag {...props} />;
};

export default Input;
