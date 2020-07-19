import {VueConstructor} from 'vue/types/vue';

type PropsForConstructor<V extends VueConstructor> = V extends {
    new (options?: {propsData?: infer P}): any;
} ? P : never;

type FnOrPropsFor<V extends VueConstructor> =
    PropsForConstructor<V> | (() => Promise<PropsForConstructor<V>>);

export default function<V extends VueConstructor>(
    component: V, props: FnOrPropsFor<V>,
) {
    window.addEventListener('load', () => {
        const run = (props: PropsForConstructor<V>) => {
            const vue = new component({propsData: props});
            vue.$mount('main');

            Object.assign(<any>globalThis, {vue, props});
        };

        if (props instanceof Function) {
            props().then(run).catch(console.error);
        } else {
            run(props);
        }
    });
}
