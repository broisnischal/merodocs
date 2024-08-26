//!this file is not used but can be used if we need pagination on basis of dates
import moment from 'moment';

export function getDateLogs(lastDate: Date) {
  const datesArray: Date[] = [];

  const lastLogDate = moment(lastDate).startOf('day');
  let current = moment().startOf('day');

  while (lastLogDate.isSameOrBefore(current)) {
    datesArray.push(current.toDate());
    current = current.subtract(1, 'days');
  }

  return datesArray;
}

export function getDateLogsWithDifference(start: Date, end: Date) {
  const datesArray: Date[] = [];

  const lastLogDate = moment(end).startOf('day');
  let current = moment(start).startOf('day');

  while (lastLogDate.isSameOrBefore(current)) {
    datesArray.push(current.toDate());
    current = current.subtract(1, 'days');
  }

  return datesArray;
}

export function getPaginationDates(props: {
  page?: string | number;
  limit?: string | number;
  dates: Date[];
}) {
  const page = Number(props?.page) || 1;
  const limit = Number(props?.limit) || 2;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedDates = props.dates.slice(startIndex, endIndex);

  return paginatedDates.map((date) => ({
    current: date,
    next: moment(date).add(1, 'days').toDate(),
  }));
}

interface PageDocProps {
  page?: string | number;
  limit?: string | number;
  count: number;
}

export const getPageDateDocs = (props: PageDocProps) => {
  const data = {
    page: Number(props.page) || 1,
    limit: Number(props.limit) || 10,
    count: props.count,
  };
  const page = Math.ceil(data.count / data.limit);

  return {
    total: {
      page,
      limit: data.count,
    },
    next: {
      page: data.page + 1 > page ? null : data.page + 1,
      limit: data.limit ? data.limit : data.count,
    },
    prev: {
      page: data.page ? (data.page - 1 <= 0 ? null : data.page - 1) : null,
      limit: data.limit ? data.limit : data.count,
    },
  };
};
