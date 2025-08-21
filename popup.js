chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs.length) return;
  const url = tabs[0].url || "";

  function safeUrl(url) {
    return url.startsWith("https://") || url.startsWith("http://");
  }

  // Determine if current page is restricted
  let isRestricted = !safeUrl(url);

  // Update storage flag on popup open
  chrome.storage.local.set({ restrictedPage: isRestricted }, () => {
    const message = document.getElementById("message");
    if (isRestricted) {
      message.textContent = "OH! NO This is Restricted Page";
      message.style.color = 'red';
      // Optionally set badge here as well
      chrome.action.setBadgeText({ tabId: tabs.id, text: "!" });
      chrome.action.setBadgeBackgroundColor({ tabId: tabs.id, color: "red" });
    } else {
      message.textContent = "Select a word and Click define";
      chrome.action.setBadgeText({ tabId: tabs.id, text: "" });
      message.style.color = 'green';
    }
  });
});
