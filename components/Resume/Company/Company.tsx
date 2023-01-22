import styled from '@emotion/styled';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import CircularIcon from '../../CircularIcon';

import DateRange from '../DateRange';
import Duration from '../Duration';

const Container = styled('div')({
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid #ebebeb',
  ':last-child': {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 0,
  },
  'ul': {
    marginLeft: 0,
    paddingLeft: 0,
    fontSize: '14px',
    'li': {
      margin: '0 0 4px 1em',
      lineHeight: '1.25em',
    },
  },
});

const Header = styled('div')({
  display: 'flex',
  gap: '24px',
  marginBottom: '12px',
});

const Heading = styled('div')({
  fontSize: '20px',
  marginBottom: '4px',
});

const SubHeading = styled('div')({
  marginBottom: '4px',
  color: '#444',
});

const Role = styled('div')({
  marginBottom: '4px',
});

const Details = styled('div')({
  color: '#888',
  fontSize: '14px',
  marginBottom: '4px',
});

const Entity = styled('div', { shouldForwardProp: (propName) => propName !== 'showPath' })<{
  showPath: boolean;
}>(
  {
    position: 'relative',
    marginLeft: 'calc(48px + 24px)',
    marginBottom: '12px',
  },
  ({ showPath }) => showPath && {
    ':before': {
      content: '""',
      position: 'absolute',
      left: 'calc((-48px - 2px) / 2 - 24px)',
      top: 'calc(8px * 2 + 6px)',
      height: 'calc(100% - 8px)',
      width: '2px',
      backgroundColor: '#ebebeb',
    },
  },
);

const Bullet = styled('div')({
  position: 'absolute',
  borderRadius: '50%',
  height: '8px',
  width: '8px',
  backgroundColor: '#ebebeb',
  top: '6px',
  left: 'calc((-48px - 8px) / 2 - 24px)',
  marginBottom: '8px',
});

interface RoleType {
  title: string;
  start: Date;
  end?: Date;
  points: string[];
}

export interface CompanyProps {
  location: string;
  name: string,
  roles: RoleType[];
  icon?: IconProp;
}

const Company = ({ location, name, roles, icon = faBuilding }: CompanyProps) => (
  <Container>
    <Header>
      <div>
        <CircularIcon icon={icon} />
      </div>
      <div>
        {roles.length === 1 ? (
          <>
            <Heading>{roles[0].title}</Heading>
            <SubHeading>{name}</SubHeading>
            <Details>
              <DateRange start={roles[0].start} end={roles[0].end} format={{ year: 'numeric', month: 'short' }} />
              &nbsp;&nbsp;
              (<Duration start={roles[0].start} end={roles[0].end} />)
            </Details>
            <Details>{location}</Details>
          </>
        ) : (
          <>
            <Heading>{name}</Heading>
            <Details>
              <Duration start={roles[roles.length - 1].start} end={roles[0].end} />
            </Details>
            <Details>
              {location}
            </Details>
          </>
        )}
      </div>
    </Header>
    {roles.map((role, index) => (
      <Entity
        key={`${role.title}-${role.start}-${role.end}`}
        showPath={index !== roles.length - 1}
      >
        {roles.length > 1 && <Bullet />}
        <div>
          {roles.length > 1 && <Role>{role.title}</Role>}
          {roles.length > 1 && (
            <Details>
              <DateRange start={role.start} end={role.end} format={{ year: 'numeric', month: 'short' }} />
            </Details>
          )}
          {role.points.length > 0 && (
            <ul>
              {role.points.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          )}
        </div>
      </Entity>
    ))}
  </Container>
);

export default Company;
