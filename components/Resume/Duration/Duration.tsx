// @ts-expect-error -- no type definitions available, look into replacing this package
import DurationJS from 'duration';
import pluralize from 'pluralize';
import React from 'react';

const getDuration = (start: Date, end: Date = new Date()) => {
  const { year, month } = new DurationJS(start, end);

  const parts = []

  if (year > 0) {
    parts.push(pluralize('yr', year, true));
  }

  if (month > 0) {
    parts.push(pluralize('mo', month, true));
  }

  return parts.join(' ');
}

interface Props {
  className?: string;
  start: Date;
  end?: Date;
}

const Duration = ({ className, start, end }: Props) => (
  <span className={className}>{getDuration(start, end)}</span>
);

export default Duration;
