import styled from '@emotion/styled';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import React from 'react';

const IconContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  backgroundColor: '#ebebeb',
  borderRadius: '50%',
});

const CircularIcon = ({ color = '#888', ...props }: FontAwesomeIconProps) => (
  <IconContainer>
    <FontAwesomeIcon {...props} color={color} />
  </IconContainer>
);

export default CircularIcon;
