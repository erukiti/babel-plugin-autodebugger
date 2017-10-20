"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const babel_core_1 = require("babel-core");
const callee_renamer_1 = require("./callee-renamer");
const getPlugin = () => {
    let calleeRenamer;
    return babel => {
        return {
            visitor: {
                CallExpression: (nodePath, state) => {
                    calleeRenamer.rename(nodePath);
                },
            },
            pre() {
                calleeRenamer = new callee_renamer_1.CalleeRenamer(babel, this);
            },
        };
    };
};
const f = src => babel_core_1.transform(src).code;
ava_1.default('default', t => {
    const src = 'console.log(1)';
    const opts = {
        renames: {
            'console.log': `debugLog({filename: FILENAME, line: START_LINE, column: START_COLUMN, type: 'log'}, ARGS)`,
        }
    };
    const expected = `debugLog({filename: "unknown", line: 1, column: 0, type: 'log'}, 1)`;
    const plugin = getPlugin();
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    t.true(f(expected) === f(code));
});
//# sourceMappingURL=callee-renamer.test.js.map