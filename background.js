chrome.action.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, { action: 'getSourceData' }, function(res) {
    if (chrome.runtime.lastError || !res) {
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ['content.js'] },
        function() {
          chrome.tabs.sendMessage(tab.id, { action: 'getSourceData' }, function(res2) {
            if (res2) openViewer(res2, tab);
          });
        }
      );
      return;
    }
    openViewer(res, tab);
  });
});
function openViewer(data, sourceTab) {
  chrome.storage.session.set({ viewerData: data }, function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html'), index: sourceTab.index + 1 });
  });
}