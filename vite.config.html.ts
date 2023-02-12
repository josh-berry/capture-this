import base from "./vite.config.base";

base.build!.rollupOptions!.input = {
  options: "src/options.html",
};

export default base;
