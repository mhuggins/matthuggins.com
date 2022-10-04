import React from 'react';

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
};

interface Props {
  className?: string;
  start: Date;
  end?: Date;
  format?: Intl.DateTimeFormatOptions;
  separator?: string;
}

const DateRange = ({
  className,
  start,
  end,
  format = DEFAULT_FORMAT,
  separator = ' - ',
}: Props) => (
  <span className={className}>
    {start.toLocaleDateString("en-US", format)}
    {separator}
    {end ? end.toLocaleDateString("en-US", format) : 'Present'}
  </span>
);

export default DateRange;
