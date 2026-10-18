export function formatTemperature(temperature) {
  return Math.floor(temperature);
}

export function formatHourlyTime(time) {
  return time.split(" ")[1].split(":")[0];
}

export function get24HoursForecastFromNow(forecast, lastUpdatedEpoch) {
  const todaysForecast = forecast[0].hour;
  const tomorrowsForecast = forecast[1].hour;

  const newForecast = [];

  const firstFutureTimeIndex = todaysForecast.findIndex(
    (hour) => hour.time_epoch > lastUpdatedEpoch,
  );

  for (let i = firstFutureTimeIndex - 1; i < todaysForecast.length; i++) {
    newForecast.push(todaysForecast[i]);
  }

  let tommorowIndex = 0;

  while (newForecast.length < 24) {
    newForecast.push(tomorrowsForecast[tommorowIndex]);
    tommorowIndex++;
  }

  return newForecast;
}

export function getDayOfWeek(date) {
  const dateObj = new Date(date);

  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  return days[dateObj.getDay()];
}

export function formatToMilitaryTime(time) {
  const isAM = time.includes("AM");

  const timeWithoutSuffix = time.split(" ")[0];

  if (isAM) {
    return timeWithoutSuffix;
  }

  const [hours, minutes] = timeWithoutSuffix.split(":");

  const newHour = Number(hours) + 12;

  return newHour + ":" + minutes;
}

export function debounce(callback, delay) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
