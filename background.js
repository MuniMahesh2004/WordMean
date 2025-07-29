function isRestrictedUrl(url) {
  return (
    url.startsWith("chrome://") ||
    url.includes("chrome.google.com/webstore") ||
    url.startsWith("edge://")
  );
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "getWordMeaning",
    title: "Get Meaning",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "getWordMeaning") {
    const url = tab.url || "";

    if (isRestrictedUrl(url)) {
      // Show badge if restricted
      await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "red" });

      // Optionally, store state if needed
      chrome.storage.local.set({ restrictedPage: true });
    } else {
      // Normal case: inject script
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["inject.js"],
        world: "MAIN"
      });

      // Dispatch event with the selected word
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => {
          window.dispatchEvent(new CustomEvent("play-word-meaning", { detail: text }));
        },
        args: [info.selectionText],
        world: "MAIN"
      });

      // Clear badge
      chrome.action.setBadgeText({ tabId: tab.id, text: "" });
      chrome.storage.local.set({ restrictedPage: false });
    }
  }
});