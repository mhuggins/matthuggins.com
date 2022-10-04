import styled from '@emotion/styled';

const Button = styled('button')({
  display: 'inline-block',
  minWidth: '160px',
  height: '40px',
  padding: '0 20px',
  border: '1px solid #c62641',
  color: '#fff',
  background: '#c62641',
  fontFamily: '"Josefin Sans", Arial, sans-serif',
  fontSize: '11px',
  fontWeight: 600,
  textAlign: 'center',
  textDecoration: 'none',
  textTransform: 'uppercase',
  outline: 0,
  cursor: 'pointer',
  transition: 'all 0.1s ease-in-out',
  ':focus': {
    boxShadow: '0 3px 7px 0 rgba(0, 0, 0, 0.15)',
  },
  ':hover': {
    boxShadow: '0 10px 20px 0 rgba(0, 0, 0, 0.15)',
  },
});

export default Button;
