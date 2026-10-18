const API_BASE_URL = "https://api.weatherapi.com/v1";
const API_KEY = "9714928e5ec04521a60170931260506";
const FAVOURITE_CITIES_KEY = "favourite-cities";

export async function getForecastWeather(location, days = 3) {
  const response = await fetch(
    `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=id:${location}&days=${days}&lang=de`,
  );
  const weatherData = await response.json();

  console.log(weatherData);

  return weatherData;
}

export async function searchLocation(q) {
  const response = await fetch(
    `${API_BASE_URL}/search.json?key=${API_KEY}&q=${q}&lang=de`,
  );

  const searchResults = await response.json();

  return searchResults;
}

export function getFavouriteCities() {
  return JSON.parse(localStorage.getItem(FAVOURITE_CITIES_KEY)) || [];
}

export function saveCityAsFavourite(city) {
  const favourites = getFavouriteCities();

  if (favourites.find((favourite) => favourite === city)) {
    alert(city + " wurde bereits den Favoriten hinzugefügt!");
    return;
  }

  favourites.push(city);

  localStorage.setItem(FAVOURITE_CITIES_KEY, JSON.stringify(favourites));
}

export function removeCityFromFavourites(city) {
  const favourites = getFavouriteCities();

  const filteredFavourites = favourites.filter(
    (favourite) => favourite !== city,
  );

  localStorage.setItem(
    FAVOURITE_CITIES_KEY,
    JSON.stringify(filteredFavourites),
  );
}
