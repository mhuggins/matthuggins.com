import styled from '@emotion/styled';
import { Card, CardContent, Typography } from '@mui/material';
import React from 'react';

const Title = styled('div')({
  margin: '0 0 24px',
  color: '#888',
  fontFamily: '"Josefin Sans", Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '600px',
  textTransform: 'uppercase',
});

interface Props {
  children: React.ReactNode;
  title: string;
}

const Section = ({ children, title }: Props) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

export default Section;
