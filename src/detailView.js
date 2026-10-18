import { rootElement } from "../main.js";
import {
  getFavouriteCities,
  getForecastWeather,
  saveCityAsFavourite,
} from "./api.js";
import {
  formatHourlyTime,
  formatTemperature,
  formatToMilitaryTime,
  get24HoursForecastFromNow,
  getDayOfWeek,
} from "./utils.js";
import { renderLoadingScreen } from "./loading.js";
import { getConditionImagePath } from "./conditions.js";
import { loadMainMenu } from "./mainMenu.js";

export async function loadDetailView(cityName, cityId) {
  console.log("Start loading");
  renderLoadingScreen("Lade Wetter für " + cityName + "...");

  const weatherData = await getForecastWeather(cityId);
  console.log("Weather loaded:", weatherData);
  renderDetailView(weatherData, cityId);
  registerEventListener(cityId);
}

function renderDetailView(weatherData, cityId) {
  const { location, current, forecast } = weatherData;
  const currentDay = forecast.forecastday[0];

  const conditionImage = getConditionImagePath(
    current.condition.code,
    current.is_day !== 1,
  );

  if (conditionImage) {
    rootElement.style.setProperty(
      "--detail-condition-image",
      `url("${conditionImage}")`,
    );
    rootElement.classList.add("show-background");
  }

  const isFavourite = getFavouriteCities().find((city) => city === cityId);

  if (conditionImage) {
    rootElement.style.setProperty(
      "--detail-condition-image",
      `url(${conditionImage})`,
    );
    rootElement.classList.add("show-background");
  }

  rootElement.innerHTML =
    getActionBarHtml(!isFavourite) +
    getHeaderHtml(
      location.name,
      formatTemperature(current.temp_c),
      current.condition.text,
      formatTemperature(currentDay.day.maxtemp_c),
      formatTemperature(currentDay.day.mintemp_c),
    ) +
    getTodayForecastHtml(
      currentDay.day.condition.text,
      currentDay.day.maxwind_kph,
      forecast.forecastday,
      current.last_updated_epoch,
    ) +
    getForecastHtml(forecast.forecastday) +
    getMiniStatsHtml(
      current.humidity,
      current.feelslike_c,
      currentDay.astro.sunrise,
      currentDay.astro.sunset,
      current.precip_mm,
      current.uv,
    );
}

function getActionBarHtml(showFavouritesButton = true) {
  const backIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
`;

  const favouriteIcon = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
</svg>
`;

  return `
  <div class="action-bar">
    <div class="action-bar__back" title="Zurück">${backIcon}</div>
    ${showFavouritesButton ? `<div class="action-bar__favourite" title="Zu Favoriten hinzufügen">${favouriteIcon}</div>` : ""}
  </div>
  `;
}

function getHeaderHtml(location, currentTemp, condition, maxTemp, minTemp) {
  return `
    <div class="current-weather">
        <h2 class="current-weather__location">${location}</h2>
        <h1 class="current-weather__current-temperature">${currentTemp}°</h1>
        <p class="current-weather__condition">${condition}</p>
        <div class="current-weather__day-temperatures">
          <span class="current-weather__max-temperature">H:${maxTemp}°</span>
          <span class="current-weather__min-temperature">T:${minTemp}°</span>
        </div>
    </div>    
    `;
}

function getTodayForecastHtml(
  condition,
  maxWind,
  forecastdays,
  lastUpdatedEpoch,
) {
  const hourlyForecastElements = get24HoursForecastFromNow(
    forecastdays,
    lastUpdatedEpoch,
  )
    .filter((el) => el !== undefined)
    .map(
      (hour, i) => `
    <div class="hourly-forecast">
            <div class="hourly-forecast__time">${i === 0 ? "Jetzt" : formatHourlyTime(hour.time) + " Uhr"}</div>
              <img
                src="https:${hour.condition.icon}"
                alt=""
                class="hourly-forecast__icon"
              />
            <div class="hourly-forecast__temperature">${formatTemperature(hour.temp_c)}°</div>
      </div>
    `,
    );

  const hourlyForecastHtml = hourlyForecastElements.join("");

  return `
  
      <div class="today-forecast">
        <div class="today-forecast__conditions">
          Heute ${condition}. Wind bis zu ${maxWind} km/h.
        </div>
        <div class="today-forecast__hours">
          ${hourlyForecastHtml}
        </div>
      </div>
  `;
}

function getForecastHtml(forecast) {
  // Für den Temperatur-Balken: tiefster und höchster Wert über alle Tage
  const lowest = Math.min(...forecast.map((d) => d.day.mintemp_c));
  const highest = Math.max(...forecast.map((d) => d.day.maxtemp_c));
  const span = highest - lowest || 1;
  const toPercent = (value) => ((value - lowest) / span) * 100;

  const forecastElements = forecast.map(
    (forecastDay, i) => `
    <div class="forecast-day">
            <div class="forecast-day__day">${i === 0 ? "Heute" : getDayOfWeek(forecastDay.date)}</div>
            <img
              src="https:${forecastDay.day.condition.icon}"
              alt=""
              class="forecast-day__icon"
            />
            <div class="forecast-day_min-temp">${formatTemperature(forecastDay.day.mintemp_c)}°</div>
            <div class="forecast-day__range">
              <span style="--start: ${toPercent(forecastDay.day.mintemp_c)}%; --end: ${100 - toPercent(forecastDay.day.maxtemp_c)}%"></span>
            </div>
            <div class="forecast-day_max-temp">${formatTemperature(forecastDay.day.maxtemp_c)}°</div>
            <div class="forecast-day__wind">${Math.round(forecastDay.day.maxwind_kph)} km/h</div>
          </div>
    `,
  );

  const forecastHtml = forecastElements.join("");

  return `
  
      <div class="forecast">
        <div class="forecast__title">Vorhersage für 3 Tage</div>
        <div class="forecast__days">
          ${forecastHtml}
        </div>
      </div>
  `;
}

function getMiniStatsHtml(
  humidity,
  feelsLike,
  sunrise,
  sunset,
  precip,
  uvindex,
) {
  return `
      <div class="mini-stats">
        <div class="mini-stat">
          <div class="mini-stat__heading">Feuchtigkeit</div>
          <div class="mini-stat__value">${humidity}%</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__heading">Gefühlt</div>
          <div class="mini-stat__value">${formatTemperature(feelsLike)}°</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__heading">Sonnenaufgang</div>
          <div class="mini-stat__value">${formatToMilitaryTime(sunrise)}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__heading">Sonnenuntergang</div>
          <div class="mini-stat__value">${formatToMilitaryTime(sunset)}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__heading">Niederschlag</div>
          <div class="mini-stat__value">${precip}mm</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__heading">UV-Index</div>
          <div class="mini-stat__value">${formatTemperature(uvindex)}</div>
        </div>
      </div>
`;
}

function registerEventListener(cityId) {
  const backButton = document.querySelector(".action-bar__back");

  backButton.addEventListener("click", () => {
    loadMainMenu();
  });

  const favouriteButton = document.querySelector(".action-bar__favourite");

  favouriteButton?.addEventListener("click", () => {
    saveCityAsFavourite(cityId);
    favouriteButton.remove();
  });
}
