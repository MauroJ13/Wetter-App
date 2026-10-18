import { rootElement } from "../main.js";

export function renderLoadingScreen(message = "Lade...") {
  rootElement.innerHTML = getLoadingHtml(message);
}

function getLoadingHtml(message) {
  return `
     <div class="loading">
        <div class="loading__message">${message}</div>
        <span class="loader"></span>
      </div>
    `;
}
