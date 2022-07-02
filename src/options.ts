import browser from 'webextension-polyfill';
import {reactive} from 'vue';

function intercept<O extends {[k: string]: any}>(
    object: O,
    setters: {[k in keyof O]: (value: O[k]) => void}
): O {
    const intercepted: any = {};
    const props: PropertyDescriptorMap = {};
    for (const key in object) {
        props[key] = {
            configurable: true,
            enumerable: true,
            get: () => object[key],
            set: key in setters ? setters[key] : undefined,
        };
    }
    Object.defineProperties(intercepted, props);
    return intercepted;
}

function intercept_all<O extends {[k: string]: any}>(
    object: O,
    setter: (key: keyof O, value: O[typeof key]) => void,
): O {
    const setters: any = {};
    for (const key in object) {
        setters[key] = (value: O[typeof key]) => setter(key, value);
    }
    return intercept(object, setters);
}

const OPTIONS = reactive({
    urlWithLink: "",
    urlWithSelection: "",
    url: "",
});

(async() => {
    Object.assign(OPTIONS, await browser.storage.sync.get(Object.keys(OPTIONS)));
    browser.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;

        for (const k of Object.keys(changes)) {
            if (! Object.keys(OPTIONS).includes(k)) continue;
            OPTIONS[k as keyof typeof OPTIONS] = changes[k].newValue;
        }
    });
})();

export default intercept_all(OPTIONS, async(key, value) => {
    await browser.storage.sync.set({[key]: value});
    OPTIONS[key] = value;
});
