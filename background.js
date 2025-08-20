function safeUrl(url) {
  return url.startsWith("https://") || url.startsWith("http://");
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "getWordMeaning",
    title: "Get Meaning",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "getWordMeaning" && tab.id) {
    const url = tab.url || "";
    if (!safeUrl(url)) {
      console.log("Restricted or unsupported page URL, ignoring action:", url);
      await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "red" });
      await chrome.storage.local.set({ restrictedPage: true });
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) =>
        window.dispatchEvent(new CustomEvent("play-word-meaning", { detail: text })),
      args: [info.selectionText || ""],
      world: "MAIN"
    });

    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    await chrome.storage.local.set({ restrictedPage: false });
  }
});
