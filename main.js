import { loadDetailView } from "./src/detailView.js";
import "./styles/main.scss";
import { loadMainMenu } from "./src/mainMenu.js";

export const rootElement = document.getElementById("app");

// loadDetailView("Luzern");

loadMainMenu();
