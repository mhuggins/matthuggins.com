import styled from '@emotion/styled';
import React from 'react';

import DateRange from '../DateRange';

const Container = styled('div')({
  marginBottom: '18px',
  ':last-child': {
    marginBottom: 0,
  },
});

const Degree = styled('div')({
  fontSize: '20px',
  marginBottom: '4px',
});

const Details = styled('div')({
  color: '#888',
  fontSize: '14px',
});

interface Props {
  school: string;
  degree: string;
  program: string;
  start: Date;
  end?: Date;
}

const Education = ({ school, degree, program, start, end }: Props) => (
  <Container>
    <Degree>{degree}, {program}</Degree>
    <Details>
      {school}
      {' '}&middot;{' '}
      <DateRange start={start} end={end} format={{ year: 'numeric' }} />
    </Details>
  </Container>
);

export default Education;
