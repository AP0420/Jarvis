// Browser Extension Bridge & Companion Generator

export interface ExtensionStatus {
  isInstalled: boolean;
  version?: string;
  activeTabsCount?: number;
  lastPing?: number;
}

class BrowserExtensionBridge {
  private status: ExtensionStatus = {
    isInstalled: false,
  };
  private listeners: ((status: ExtensionStatus) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage);
      this.checkExtensionPing();
    }
  }

  private handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'JARVIS_EXTENSION_PONG') {
      this.status = {
        isInstalled: true,
        version: event.data.version || '1.0.0',
        activeTabsCount: event.data.tabsCount || 1,
        lastPing: Date.now(),
      };
      this.notify();
    }
  };

  public checkExtensionPing() {
    if (typeof window === 'undefined') return;
    window.postMessage({ type: 'JARVIS_APP_PING' }, '*');
    setTimeout(() => {
      if (!this.status.lastPing || Date.now() - this.status.lastPing > 3000) {
        this.status.isInstalled = false;
        this.notify();
      }
    }, 1200);
  }

  public subscribe(listener: (status: ExtensionStatus) => void) {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.status));
  }

  // Safe browser tab opener
  public openUrlInNewTab(url: string, title?: string): { success: boolean; popupBlocked: boolean } {
    if (typeof window === 'undefined') return { success: false, popupBlocked: false };

    try {
      // Clean and format url
      let target = url.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = `https://${target}`;
      }

      const opened = window.open(target, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        return { success: false, popupBlocked: true };
      }
      return { success: true, popupBlocked: false };
    } catch {
      return { success: false, popupBlocked: true };
    }
  }

  // Generate Extension Files for Developer Mode unpack loading
  public generateExtensionFiles() {
    const manifest = {
      manifest_version: 3,
      name: 'JARVIS AI Companion - Browser Extension',
      version: '1.0.0',
      description: 'Supercomputer AI Browser Automation Bridge for JARVIS OS',
      permissions: ['tabs', 'scripting', 'storage', 'activeTab'],
      host_permissions: ['<all_urls>'],
      background: {
        service_worker: 'background.js',
      },
      content_scripts: [
        {
          matches: ['<all_urls>'],
          js: ['content.js'],
          run_at: 'document_end',
        },
      ],
      action: {
        default_title: 'JARVIS Companion',
        default_popup: 'popup.html',
      },
    };

    const backgroundJs = `// JARVIS Browser Extension Background Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_URL') {
    chrome.tabs.create({ url: request.url }, (tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }
  if (request.action === 'GET_TABS') {
    chrome.tabs.query({}, (tabs) => {
      sendResponse({
        success: true,
        tabs: tabs.map(t => ({ id: t.id, title: t.title, url: t.url }))
      });
    });
    return true;
  }
  if (request.action === 'READ_PAGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => document.body.innerText.slice(0, 5000)
        }, (results) => {
          sendResponse({ text: results?.[0]?.result || '' });
        });
      }
    });
    return true;
  }
});
`;

    const contentJs = `// JARVIS Content Script Bridge
window.addEventListener('message', (event) => {
  if (event.data?.type === 'JARVIS_APP_PING') {
    window.postMessage({
      type: 'JARVIS_EXTENSION_PONG',
      version: '1.0.0',
      tabsCount: 1
    }, '*');
  }
  if (event.data?.type === 'JARVIS_EXECUTE_ACTION') {
    chrome.runtime.sendMessage(event.data.action, (res) => {
      window.postMessage({ type: 'JARVIS_ACTION_RESULT', result: res }, '*');
    });
  }
});
`;

    const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f17; color: #e2e8f0; padding: 16px; margin: 0; }
    h3 { margin-top: 0; color: #38bdf8; display: flex; align-items: center; gap: 8px; font-size: 16px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 11px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); margin-bottom: 12px; }
    .btn { display: block; width: 100%; text-align: center; background: #0284c7; color: #fff; text-decoration: none; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; }
  </style>
</head>
<body>
  <h3>⚡ JARVIS Companion</h3>
  <div class="status">● Bridge Online</div>
  <p>Your browser is connected to JARVIS Supercomputer AI Assistant.</p>
  <a href="${typeof window !== 'undefined' ? window.location.origin : '#'}" target="_blank" class="btn">Open JARVIS OS</a>
</body>
</html>
`;

    return {
      'manifest.json': JSON.stringify(manifest, null, 2),
      'background.js': backgroundJs,
      'content.js': contentJs,
      'popup.html': popupHtml,
      'README.md': `# JARVIS Companion Chrome/Edge Extension

## Installation Instructions:
1. Create a new folder named \`jarvis-extension\`.
2. Save \`manifest.json\`, \`background.js\`, \`content.js\`, and \`popup.html\` into that folder.
3. In Chrome or Edge, navigate to \`chrome://extensions\` or \`edge://extensions\`.
4. Enable **Developer mode** toggle in the top-right corner.
5. Click **Load unpacked** and select the \`jarvis-extension\` folder.
6. Return to JARVIS Supercomputer to enjoy advanced browser automation!
`,
    };
  }
}

export const extensionBridge = new BrowserExtensionBridge();
