(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function handleStartCountry(button) {
    var State = window.FS.State;
    var Render = window.FS.Render;
    var countryInput = document.getElementById("careerCountry");
    var countryDropdown = document.getElementById("careerCountryDropdown");
    var nameInput;
    var openDetails;

    if (countryInput) { countryInput.value = button.dataset.startCountry; }
    nameInput = document.getElementById("careerName");
    if (nameInput && (!nameInput.value || nameInput.value === "Влад" || nameInput.dataset.autoName === "1")) {
      nameInput.value = (State.suggestNameForCountry ? State.suggestNameForCountry(button.dataset.startCountry, Date.now()) : nameInput.value);
      nameInput.dataset.autoName = "1";
    }
    if (countryDropdown && Render.startCountryDropdown) {
      countryDropdown.innerHTML = Render.startCountryDropdown(button.dataset.startCountry);
    }
    openDetails = button.closest("details");
    if (openDetails) { openDetails.open = false; }
    return true;
  }

  function handle(ctx) {
    var button = ctx.button;
    var Storage = window.FS.Storage;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.startCountry) { return handleStartCountry(button); }

    if (button.dataset.action === "continue-career") {
      ctx.continueCareer();
      return true;
    }

    if (button.dataset.action === "import-save") {
      ctx.importSave();
      return true;
    }

    if (button.dataset.action === "reset-save") {
      if (window.confirm("Удалить сохранение?")) {
        Storage.clear();
        ctx.setState(null);
        ctx.render();
      }
      return true;
    }

    if (button.dataset.action === "create-career") {
      ctx.createCareerFromForm();
      return true;
    }

    return false;
  }

  window.FS.AppActions.BootstrapActions = {
    handle: handle
  };
}());
