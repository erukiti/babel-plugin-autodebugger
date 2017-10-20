"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const babel_core_1 = require("babel-core");
exports.default = (src, pluginObject, opts) => {
    const plugin = babel => {
        return pluginObject;
    };
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    return code;
};
//# sourceMappingURL=helper.js.map