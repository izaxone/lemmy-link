const instanceInput = document.getElementById("instance") as HTMLInputElement;

instanceInput!.addEventListener("input", (event) => {
  if (instanceInput.validity.patternMismatch) {
    instanceInput.setCustomValidity(
      "Please enter your instance's hostname e.g. pawb.social"
    );
    instanceInput.reportValidity();
  } else {
    instanceInput.setCustomValidity("");
  }
});

// Saves options to chrome.storage
function save_options() {
  var instance = (document.getElementById("instance") as HTMLInputElement)!
    .value;
  chrome.storage.sync.set(
    {
      instance: instance,
    },
    function () {
      // Update status to let user know options were saved.
      var status = document.getElementById("status");
      status!.textContent = "Options saved.";
      setTimeout(function () {
        status!.textContent = "";
      }, 1500);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
// @ts-ignore
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get(
    {
      instance: "pawb.social",
    },
    function (items) {
      (document.getElementById("instance") as HTMLInputElement).value =
        items.instance;
    }
  );
}

document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save")!.addEventListener("click", save_options);