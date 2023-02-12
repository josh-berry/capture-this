import {createApp, type ExtractPropTypes, type MethodOptions} from "vue";

export default function launch<
  C extends {props?: object; provide?: object; methods?: MethodOptions},
>(
  component: C,
  options: () => Promise<{
    propsData: Readonly<ExtractPropTypes<C["props"]>>;
    provide?: {[k: string]: any};
    methods?: MethodOptions & Partial<C["methods"]>;
  }>,
): void {
  const loader = async () => {
    const opts = await options();
    const app = createApp(
      {
        ...component,
        provide: {
          ...(component.provide ?? {}),
          ...(opts.provide ?? {}),
        },
        methods: {
          ...(component.methods ?? {}),
          ...(opts.methods ?? {}),
        },
      },
      opts.propsData,
    );
    Object.assign(<any>globalThis, {app, app_options: opts});
    app.mount("body");
  };

  window.addEventListener("load", loader);
}
