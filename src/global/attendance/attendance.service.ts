import { Injectable } from '@nestjs/common';
import moment from 'moment';

@Injectable()
export class AttendanceService {
  constructor() {}

  createAttendanceDetails() {
    const date = moment().utcOffset(0, true).format('YYYY-MM-DD');

    const clockedTime = moment().toDate();

    return {
      date,
      clockedTime,
    };
  }
  calculateTimeDifferenceFormatted(start: moment.Moment, end: moment.Moment) {
    const duration = moment.duration(end.diff(start));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();

    let formattedDuration = '';

    if (hours > 0) {
      formattedDuration += `${hours} hr `;
    }

    if (minutes > 0) {
      formattedDuration += `${minutes} mins`;
    } else if (hours === 0) {
      formattedDuration = 'Less than a minute';
    }

    return formattedDuration.trim();
  }

  getAllDaysinMonth(date: string, lastweek: boolean = false) {
    const momentDate = moment(date);
    const startOfMonth = momentDate.clone().startOf('month');
    const endOfMonth = momentDate.clone().endOf('month');
    const startOfWeek = moment(startOfMonth.toDate()).startOf('week');
    const endOfWeek = moment(endOfMonth.toDate()).endOf('week');

    const days: {
      date: string;
      day: number;
      pastmonth: boolean;
      futuremonth: boolean;
    }[] = [];

    let currentDay = moment(startOfWeek.toDate());

    if (!lastweek) {
      while (!currentDay.isAfter(endOfWeek, 'date')) {
        days.push({
          date: currentDay.format('YYYY-MM-DD'),
          day: currentDay.date(),
          pastmonth: currentDay.isBefore(startOfMonth, 'day'),
          futuremonth: currentDay.isAfter(endOfMonth, 'day'),
        });
        currentDay.add(1, 'day');
      }
    } else {
      while (!currentDay.isAfter(endOfMonth, 'date')) {
        days.push({
          date: currentDay.format('YYYY-MM-DD'),
          day: currentDay.date(),
          pastmonth: currentDay.isBefore(startOfMonth, 'day'),
          futuremonth: currentDay.isAfter(endOfMonth, 'day'),
        });
        currentDay.add(1, 'day');
      }
    }

    return {
      startOfMonth: startOfWeek.clone().startOf('day').toDate(),
      endOfMonth: endOfWeek.clone().endOf('day').toDate(),
      days,
    };
  }

  //Not used as this is for all days in that month purely but not for
  // getAllDaysInMonthClient(date: string) {
  //   const momentDate = moment(date);
  //   const today = moment().startOf('day'); // Get today's date
  //   const startOfMonth = momentDate.clone().startOf('month');
  //   const endOfMonth = momentDate.clone().endOf('month');

  //   const startOfWeek = startOfMonth.clone().startOf('week');

  //   const days: {
  //     date: string;
  //     day: number;
  //   }[] = [];

  //   let currentDay = startOfWeek.clone();

  //   while (currentDay.isSameOrBefore(endOfMonth, 'day')) {
  //     // Check if the current day is within the month and not after today
  //     if (
  //       currentDay.isSameOrAfter(startOfMonth, 'day') &&
  //       currentDay.isSameOrBefore(today, 'day')
  //     ) {
  //       days.push({
  //         date: currentDay.format('YYYY-MM-DD'),
  //         day: currentDay.date(),
  //       });
  //     }
  //     currentDay.add(1, 'day');

  //     // Break the loop if we've reached today's date
  //     if (currentDay.isAfter(today, 'day')) {
  //       break;
  //     }
  //   }

  //   return {
  //     startOfMonth: startOfMonth.toDate(),
  //     endOfMonth: endOfMonth.toDate(),
  //     days,
  //   };
  // }

  getAllMonthsInYear(date: string) {
    const momentDate = moment(date);
    //  const currentYear = moment().year();
    const providedYear = momentDate.year();
    //  const currentMonth = moment().month();
    const data: {
      month: string;
      start: Date;
      end: Date;
    }[] = [];

    for (let i = 0; i < 12; i++) {
      const month = moment().year(providedYear).month(i);
      data.push({
        month: month.format('MMM'),
        start: month.clone().startOf('month').startOf('day').toDate(),
        end: month.clone().endOf('month').startOf('day').toDate(),
      }); // Format month name (e.g., 'Jan', 'Feb', etc.)
    }

    return data;
  }
}
