chrome.storage.local.get("restrictedPage", (data) => {
  const message = document.getElementById("message");
  if (data.restrictedPage) {
    message.textContent = "This site doesn't allow word lookup.";
  } else {
    message.textContent = "Select a word and right-click to get its meaning.";
  }
});
