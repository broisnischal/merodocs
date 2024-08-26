export function calculateEndDate(startDate: Date, time: string): Date {
  const date = new Date(startDate);

  if (time === 'annually') {
    date.setFullYear(date.getFullYear() + 1);
  } else if (time === 'quaterly') {
    date.setMonth(date.getMonth() + 3);
  } else {
    date.setMonth(date.getMonth() + 6);
  }

  return date;
}
