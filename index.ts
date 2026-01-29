import { startCreating, buildSetup } from "./src/main.js";

(async () => {
    buildSetup();
    await startCreating();
})();
