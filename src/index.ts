browser.browserAction.onClicked.addListener(asyncEvent(async (e) => {
    const curtab = await browser.tabs.getCurrent();
    const info = (await browser.tabs.executeScript(curtab.id, {
        code: `(${getTabInfo.toString()})()`,
    }))[0] as TabInfo;
    const launchtab = await browser.tabs.create({url: await buildURL(info)})

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
        selectedText: encodeURIComponent(info.selectedText),
    };

    return `omnifocus:///add?name=${e.selectedText}&note=${e.title}%0A${e.url}`;
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
