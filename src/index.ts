if (! globalThis.browser) (<any>globalThis.browser) = require("webextension-polyfill");

browser.browserAction.onClicked.addListener(asyncEvent(async (e) => {
    const curtab = (await browser.tabs.query({active: true}))[0];
    if (! curtab) return;

    const info = await runInUserTab(getTabInfo);
    const url = await buildURL(info);
    const validURL = new URL(url);

    console.log(url);
    switch (validURL.protocol) {
        // If it's a webpage, open it in a new tab
        case 'http:': case 'https:': case 'ftp:':
            await browser.tabs.create({url});
            break;

        // If it's an application, launch it by piggybacking off the current
        // tab, which avoids all kinds of weird lifecycle issues...
        default:
            await runInUserTab(launchAppURL, url);
            break;
    }
}));

type TabInfo = {
    url: string,
    title: string,
    selectedText: string,
};

async function buildURL(info: TabInfo): Promise<string> {
    const e = {
        title: encodeURIComponent(info.title),
        url: encodeURIComponent(info.url),
        selection: encodeURIComponent(info.selectedText),
    };

    if (e.selection) {
        return `omnifocus:///add?name=${e.selection}&note=${e.title}%0A${e.url}`;
    } else {
        return `omnifocus:///add?name=${e.title}&note=${e.title}%0A${e.url}`;
    }
}



// Functions which execute in a user tab

// This function is never executed directly, but is injected into a user tab to
// fetch details about what's in that tab.
const getTabInfo = (): TabInfo => ({
    title: document.title,
    url: window.location.href,
    selectedText: window.getSelection()?.toString() ?? '',
});

const launchAppURL = (url: string) => {
    // The weird order in which we do things is to make sure (a) the iframe
    // never appears to the user, and (b) the load event is never fired before
    // we've actually registered for it, so the iframe will always be cleaned up
    // at the end.
    console.log(`[Capture This] Opening URL: ${url}`);

    const el = document.createElement('iframe');
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
        el.remove()
    }, 5000);
    el.src = url;
};



// Utility functions

async function runInUserTab<F extends (...args: any) => any>(
    fn: F,
    ...args: Parameters<F>
): Promise<ReturnType<F>> {
    return (await browser.tabs.executeScript(undefined, {
        code: `(${fn.toString()}).apply(undefined, ${JSON.stringify(args)})`
    }))[0] as unknown as ReturnType<F>;
}

function asyncEvent<U, T extends (this: U, ...args: any[]) => Promise<any>>(
    async_fn: T
): T {
    return function(this: U, ...args: any[]): Promise<any> {
        return async_fn.apply(this, args).catch(console.log);
    } as T;
}
