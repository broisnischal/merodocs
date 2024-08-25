import moment from 'moment-timezone';

export const formatDateTime = (date: Date) => {
  return moment(date).tz('Asia/Kathmandu').format('hh:mm A');
};
