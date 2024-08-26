import moment from 'moment';

export function getTimeDifference(date1: Date, date2: Date) {
  const momentDate1 = moment(date1);
  const momentDate2 = moment(date2);

  let duration = moment.duration(momentDate2.diff(momentDate1));

  let days = duration.days();
  let hours = duration.hours();
  let minutes = duration.minutes();

  let formattedDuration = '';

  if (days > 0) {
    formattedDuration += days + ' day' + (days > 1 ? 's' : '') + ' ';
  }
  if (hours > 0) {
    formattedDuration += hours + ' hr' + (hours > 1 ? 's' : '') + ' ';
  }
  if (minutes > 0) {
    formattedDuration += minutes + ' min' + (minutes > 1 ? 's' : '') + ' ';
  }

  return formattedDuration;
}

export function getTimeDifferenceInHrsMins(date1: Date, date2: Date) {
  const momentDate1 = moment(date1);
  const momentDate2 = moment(date2);

  let duration = moment.duration(momentDate2.diff(momentDate1));

  const hours = duration.hours();
  const minutes = duration.minutes();

  return {
    hours,
    minutes,
  };
}

export function timeDifference(current: Date, end: Date) {
  const msPerSecond = 1000;
  const msPerMinute = 60 * msPerSecond;
  const msPerHour = 60 * msPerMinute;
  const msPerDay = 24 * msPerHour;

  const remainingTime = end.getTime() - current.getTime();

  if (remainingTime < 0) {
    return 'Expired';
  }

  const days = Math.floor(remainingTime / msPerDay);
  const hours = Math.floor((remainingTime % msPerDay) / msPerHour);
  const minutes = Math.floor((remainingTime % msPerHour) / msPerMinute);

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else {
    return 'Less than a minute';
  }
}
