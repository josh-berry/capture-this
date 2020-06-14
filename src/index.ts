browser.browserAction.onClicked.addListener(asyncEvent(async (e) => {
    const info = (await browser.tabs.executeScript(undefined, {
        code: `(${getTabInfo.toString()})()`,
    }))[0] as TabInfo;

    const url = await buildURL(info);
    const validURL = new URL(url);

    const tab = await browser.tabs.create({url});
    switch (validURL.protocol) {
        // If it's a webpage, leave it open
        case 'http:': case 'https:': case 'ftp:':
            break;

        // If it's an application, close it immediately after calling the app.
        default:
            await browser.tabs.remove(tab.id!);
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

    return `omnifocus:///add?name=${e.selection}&note=${e.title}%0A${e.url}`;
}

// This function is never executed directly, but is injected into a user tab to
// fetch details about what's in that tab.
const getTabInfo = (): TabInfo => ({
    title: document.title,
    url: window.location.href,
    selectedText: window.getSelection()?.toString() ?? '',
});

export function asyncEvent<
    U,
    T extends (this: U, ...args: any[]) => Promise<any>
>(
    async_fn: T
): T {
    return function(this: U, ...args: any[]): Promise<any> {
        return async_fn.apply(this, args).catch(console.log);
    } as T;
}
