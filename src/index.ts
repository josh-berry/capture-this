import browser from "webextension-polyfill";
import options from "./options";

type TabInfo = {
  pageTitle: string;
  pageUrl: string;
  linkTitle: string;
  linkUrl: string;
  selection: string;
};

browser.contextMenus.create({
  id: "capture",
  title: "Capture This",
  contexts: ["link", "page", "selection"],
});

browser.contextMenus.onClicked.addListener(async ev => {
  const info: TabInfo = {
    ...(await runInUserTab(getTabInfo)),
    linkTitle: ev.linkText || ev.selectionText || "",
    linkUrl: ev.linkUrl || "",
  };

  await launchURL(buildURL(info));
});

browser.pageAction.onClicked.addListener(async e => {
  const info = await runInUserTab(getTabInfo);
  await launchURL(buildURL(info));
});

const TEMPLATE_RE = /\$\{([^\}|]+(\|([^}]+))?)\}/g;

function buildURL(info: TabInfo): string {
  const filters: {[k: string]: (_: string) => string} = {
    uri: encodeURIComponent,
  };

  let template = "";
  if (info.linkUrl) {
    template = options.urlWithLink || options.urlWithSelection || options.url;
  } else if (info.selection) {
    template = options.urlWithSelection || options.url || options.urlWithLink;
  } else {
    template = options.url || options.urlWithSelection || options.urlWithLink;
  }

  return template.replace(TEMPLATE_RE, (_match, name, _pipe, filt) => {
    const txt = info[name as keyof TabInfo] ?? "";
    const filter = filters[filt as keyof typeof filters] ?? encodeURIComponent;
    return filter(txt);
  });
}

async function launchURL(url_text: string) {
  console.log(`[Capture This] Opening URL: ${url_text}`);

  try {
    const url = new URL(url_text);
    switch (url.protocol) {
      // If it's a webpage, open it in a new tab
      case "http:":
      case "https:":
      case "ftp:":
      case "data:":
        await browser.tabs.create({url: url.href});
        break;

      // If it's an application, launch it by piggybacking off the current
      // tab, which avoids all kinds of weird lifecycle issues...
      default:
        await runInUserTab(launchAppURL, url.href);
        break;
    }
  } catch (e) {
    // Show the options page if we hit an error, because the URL is probably
    // invalid somehow.
    console.log(e);
    browser.runtime.openOptionsPage();
  }
}

// Functions which execute in a user tab

// This function is never executed directly, but is injected into a user tab to
// fetch details about what's in that tab.
const getTabInfo = (): TabInfo => ({
  pageTitle: document.title,
  pageUrl: window.location.href,
  linkTitle: "", // Filled in later
  linkUrl: "", // Filled in later
  selection: window.getSelection()?.toString() ?? "",
});

const launchAppURL = (url: string) => {
  // The weird order in which we do things is to make sure (a) the iframe
  // never appears to the user, and (b) the load event is never fired before
  // we've actually registered for it, so the iframe will always be cleaned up
  // at the end.

  const el = document.createElement("iframe");
  el.style.display = "none";
  document.body.appendChild(el);

  // Waiting for <iframe> loads seems to be unreliable, so we just wait a bit
  // for the browser to do its thing, and then cleanup.  The timeout here is
  // long because keeping an <iframe> around for a while isn't really a big
  // deal, and some browsers will prompt the user while loading, and then
  // cancel the load if the <iframe> is deleted before the user responds.
  // This is a huge hack, but IMO it's better than leaving <iframe>s hanging
  // around in pages where they shouldn't be. :/
  window.setTimeout(() => {
    console.log(`[Capture This] Cleaning up from URL: ${url}`);
    el.remove();
  }, 5000);
  el.src = url;
};

// Utility functions

async function runInUserTab<F extends (...args: any) => any>(
  fn: F,
  ...args: Parameters<F>
): Promise<ReturnType<F>> {
  return (
    await browser.tabs.executeScript(undefined, {
      code: `(${fn.toString()}).apply(undefined, ${JSON.stringify(args)})`,
    })
  )[0] as unknown as ReturnType<F>;
}
