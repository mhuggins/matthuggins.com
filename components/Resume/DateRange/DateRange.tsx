import React from 'react';

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
};

interface Props {
  start: Date;
  end?: Date;
  format?: Intl.DateTimeFormatOptions;
  separator?: string;
}

const DateRange = ({
  start,
  end,
  format = DEFAULT_FORMAT,
  separator = ' - ',
}: Props) => (
  <span>
    {start.toLocaleDateString("en-US", format)}
    {separator}
    {end ? end.toLocaleDateString("en-US", format) : 'Present'}
  </span>
);

export default DateRange;
