import {browser} from 'webextension-polyfill-ts';
import options from './options';

type TabInfo = {
    url: string,
    title: string,
    selection: string,
};

browser.contextMenus.create({id: 'capture', title: "Capture This", contexts: ['link', 'page', 'selection']});

browser.contextMenus.onClicked.addListener(async ev => {
    let info: TabInfo;

    if (ev.linkUrl) {
        const title = ev.linkText ?? ev.selectionText ?? ev.linkUrl;
        info = {title, url: ev.linkUrl, selection: ''};

    } else {
        const tab = (await browser.tabs.query({active: true}))[0];
        if (! tab) return;

        info = {title: tab.title ?? '', url: tab.url ?? '', selection: ev.selectionText ?? ''};
    }

    await launchURL(new URL(buildURL(info)));
});

browser.browserAction.onClicked.addListener(async (e) => {
    const curtab = (await browser.tabs.query({active: true}))[0];
    if (! curtab) return;

    const info = await runInUserTab(getTabInfo);
    await launchURL(new URL(buildURL(info)));
});



async function launchURL(url: URL) {
    console.log(url);
    switch (url.protocol) {
        // If it's a webpage, open it in a new tab
        case 'http:': case 'https:': case 'ftp:': case 'data:':
            await browser.tabs.create({url: url.href});
            break;

        // If it's an application, launch it by piggybacking off the current
        // tab, which avoids all kinds of weird lifecycle issues...
        default:
            await runInUserTab(launchAppURL, url.href);
            break;
    }
}

const TEMPLATE_RE = /\$\{([^\}|]+(\|([^}]+))?)\}/g;

function buildURL(info: TabInfo): string {
    const filters: {[k: string]: (_: string) => string} = {
        uri: encodeURIComponent,
    };

    const template = info.selection
        ? (options.url_sel || options.url_nosel)
        : (options.url_nosel || options.url_sel);

    return template.replace(TEMPLATE_RE, (_match, name, _pipe, filt) => {
        const txt = info[name as keyof TabInfo] ?? '';
        const filter = filters[filt as keyof typeof filters] ?? encodeURIComponent;
        return filter(txt);
    });
}



// Functions which execute in a user tab

// This function is never executed directly, but is injected into a user tab to
// fetch details about what's in that tab.
const getTabInfo = (): TabInfo => ({
    title: document.title,
    url: window.location.href,
    selection: window.getSelection()?.toString() ?? '',
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
