import { rootElement } from "../main";
import {
  getFavouriteCities,
  getForecastWeather,
  removeCityFromFavourites,
  searchLocation,
} from "./api";
import { loadDetailView } from "./detailView";
import { renderLoadingScreen } from "./loading";
import { getConditionImagePath } from "./conditions";
import { formatTemperature, debounce } from "./utils";

export async function loadMainMenu() {
  rootElement.classList.remove("show-background");
  renderLoadingScreen("Lade Übersicht...");
  await renderMainMenu();
}

async function renderMainMenu() {
  rootElement.innerHTML = `
        <div class="main-menu">
            ${getMenuHeaderHtml()}
            ${await getCityListHtml()}
        </div>
    `;

  registerEventListener();
}

function getMenuHeaderHtml() {
  return `
    <div class="main-menu__heading">
          Wetter <button class="main-menu__edit">Bearbeiten</button>
        </div>
        <div class="main-menu__search-bar">
          <svg class="main-menu__search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            class="main-menu__search-input"
            placeholder="Nach Stadt suchen..."
          />
          <div class="main-menu__search-results"></div>
        </div>
    `;
}

const deleteIcon = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>

`;

async function getCityListHtml() {
  const favouriteCities = getFavouriteCities();

  if (!favouriteCities || favouriteCities.length < 1) {
    return `
      <div class="main-menu__empty">
        <strong>Noch keine Favoriten gespeichert.</strong>
        <p>Such oben nach einer Stadt und tippe auf den Stern.</p>
      </div>
    `;
  }

  const favouriteCityElements = [];

  for (let city of favouriteCities) {
    const weatherData = await getForecastWeather(city, 1);

    const { location, current, forecast } = weatherData;
    const currentDay = forecast.forecastday[0];

    const conditionImage = getConditionImagePath(
      current.condition.code,
      current.is_day !== 1,
    );

    const cityHtml = `
    <div class="city-wrapper">
        <div class="city-wrapper__delete" data-city-id="${city}">${deleteIcon}</div>
            <div
              class="city"
              data-city-name="${location.name}"
              data-city-id="${city}"
              ${
                conditionImage
                  ? `style="
                --condition-image: url(${conditionImage});
              "`
                  : ""
              }
            >
              <div class="city__left-column">
                <h2 class="city__name">${location.name}</h2>
                <div class="city__country">${location.country}</div>
                <div class="city__condition">${current.condition.text}</div>
              </div>
              <div class="city__right-column">
                <div class="city__temperature">${formatTemperature(current.temp_c)}°</div>
                <div class="city__min-max-temperature">H:${formatTemperature(currentDay.day.maxtemp_c)}° T:${formatTemperature(currentDay.day.mintemp_c)}°</div>
              </div>
            </div>
          </div>
    `;

    favouriteCityElements.push(cityHtml);
  }

  const favouriteCitiesHtml = favouriteCityElements.join("");

  return `
    <div class="main-menu__cities-list">
          ${favouriteCitiesHtml}
        </div>
    `;
}

function renderSearchResults(searchResults) {
  const searchResultElements = searchResults.map(
    (result) => `
        <div class="search-result" data-city-name="${result.name}" data-city-id="${result.id}">
            <h3 class="search-result__name">${result.name}</h3>
            <p class="search-result__country">${result.region ? result.region + ", " : ""}${result.country}</p>
        </div>
    `,
  );

  const searchResultsHtml = searchResultElements.join("");

  const searchResultsDiv = document.querySelector(".main-menu__search-results");
  searchResultsDiv.innerHTML = searchResultsHtml;
}

function renderSearchResultsLoading() {
  const searchResultsDiv = document.querySelector(".main-menu__search-results");
  searchResultsDiv.innerHTML = `<div class="search-result">Lade Vorschläge...</div>`;
}

function registerSearchResultsEventListener() {
  const searchResults = document.querySelectorAll(".search-result");

  searchResults.forEach((searchResult) => {
    searchResult.addEventListener("click", () => {
      const cityName = searchResult.getAttribute("data-city-name");
      const cityId = searchResult.getAttribute("data-city-id");
      loadDetailView(cityName, cityId);
    });
  });
}

function bodyClickHandler(e) {
  const searchWrapper = document.querySelector(".main-menu__search-bar");

  if (!searchWrapper) {
    document.removeEventListener("click", bodyClickHandler);
    return;
  }

  if (!searchWrapper.contains(e.target)) {
    const searchResults = document.querySelector(".main-menu__search-results");
    searchResults.classList.add("main-menu__search-results__hidden");
  }
}

function registerEventListener() {
  const editButton = document.querySelector(".main-menu__edit");
  const deleteButtons = document.querySelectorAll(".city-wrapper__delete");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      removeCityFromFavourites(btn.getAttribute("data-city-id"));
      btn.parentElement.remove();
    });
  });

  editButton.addEventListener("click", () => {
    const EDIT_ATTRIBUTE = "data-edit-mode";

    if (!editButton.getAttribute(EDIT_ATTRIBUTE)) {
      editButton.setAttribute(EDIT_ATTRIBUTE, "true");
      editButton.textContent = "Fertig";

      deleteButtons.forEach((btn) => {
        btn.classList.add("city-wrapper__delete--show");
      });
    } else {
      editButton.removeAttribute(EDIT_ATTRIBUTE);
      editButton.textContent = "Bearbeiten";

      deleteButtons.forEach((btn) => {
        btn.classList.remove("city-wrapper__delete--show");
      });
    }
  });

  const searchBar = document.querySelector(".main-menu__search-input");

  searchBar.addEventListener(
    "input",
    debounce(async (e) => {
      const q = e.target.value;

      let searchResults = [];

      if (q.length > 1) {
        renderSearchResultsLoading();
        searchResults = await searchLocation(q);
      }

      renderSearchResults(searchResults);
      registerSearchResultsEventListener();
    }, 500),
  );

  document.addEventListener("click", bodyClickHandler);

  searchBar.addEventListener("focusin", () => {
    const searchResults = document.querySelector(".main-menu__search-results");
    searchResults.classList.remove("main-menu__search-results__hidden");
  });

  const cities = document.querySelectorAll(".city");

  cities.forEach((city) =>
    city.addEventListener("click", () => {
      const cityName = city.getAttribute("data-city-name");
      const cityId = city.getAttribute("data-city-id");
      loadDetailView(cityName, cityId);
    }),
  );
}
