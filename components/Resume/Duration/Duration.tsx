import pluralize from 'pluralize';
import React from 'react';

const getMonthCount = (a: Date, b: Date) => {
  const months = (b.getFullYear() - a.getFullYear()) * 12 - a.getMonth() + b.getMonth() + 1;
  return months <= 0 ? 0 : months;
};

const getDuration = (start: Date, end: Date = new Date()) => {
  const totalMonths = getMonthCount(start, end);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths - (years * 12);

  const parts = []

  if (years > 0) {
    parts.push(pluralize('yr', years, true));
  }

  if (months > 0) {
    parts.push(pluralize('mo', months, true));
  }

  return parts.join(' ');
}

interface Props {
  start: Date;
  end?: Date;
}

const Duration = ({ start, end }: Props) => (
  <span>{getDuration(start, end)}</span>
);

export default Duration;
