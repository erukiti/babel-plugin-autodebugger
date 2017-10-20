"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const babel_core_1 = require("babel-core");
const injection_to_function_1 = require("./injection-to-function");
const getPlugin = () => {
    let injector;
    return babel => {
        return {
            visitor: {
                Function: (nodePath, state) => {
                    injector.injectionToFunction(nodePath, 'HOGE');
                },
            },
            pre() {
                injector = new injection_to_function_1.Injector(babel, this);
            }
        };
    };
};
const f = src => babel_core_1.transform(src).code;
ava_1.default('default', t => {
    const src = 'const f = (a, b) => a + 1';
    const opts = {};
    const expected = `
    const f = (a, b) => {
        console.log("enter HOGE: unknown:1:10", {params: {a, b}})
        const _temp = a + 1
        console.log("exit  HOGE: unknown:1:25", {result: _temp})
        return _temp
    }
    `;
    const plugin = getPlugin();
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    t.true(f(expected) === f(code));
});
ava_1.default('opts', t => {
    const src = 'const f = a => a + 1';
    const opts = {
        enter: 'debug(NAME, FILENAME, START_LINE, START_COLUMN, END_LINE, END_COLUMN)',
        exit: 'debug()'
    };
    const expected = `
    const f = a => {
        debug("HOGE", "unknown", 1, 10, 1, 20)
        const _temp = a + 1
        debug()
        return _temp
    }
    `;
    const plugin = getPlugin();
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    t.true(f(expected) === f(code));
});
ava_1.default('', t => {
    const src = 'const f = a => {a + 1}';
    const opts = {
        enter: 'enter(PARAMS)',
        exit: 'exit(RESULT)',
    };
    const expected = `
    const f = a => {
        enter({a})
        a + 1
        exit(null)
    }
    `;
    const plugin = getPlugin();
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    t.true(f(expected) === f(code));
});
ava_1.default('', t => {
    const src = `
    const f = a => {
        return a + 1
    }
    `;
    const opts = {
        enter: 'enter()',
        exit: 'exit()'
    };
    const expected = `
    const f = a => {
        enter()
        const _temp = a + 1
        exit()
        return _temp
    }
    `;
    const plugin = getPlugin();
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    t.true(f(expected) === f(code));
});
ava_1.default('', t => {
    const src = `
    const f = a => {
        if (a < 0) {
            return a - 1
        } else {
            return a + 1
        }
    }
    `;
    const opts = {
        enter: 'enter()',
        exit: 'exit()'
    };
    const expected = `
    const f = a => {
        enter()
        if (a < 0) {
            const _temp = a - 1
            exit()
            return _temp
        } else {
            const _temp2 = a + 1
            exit()
            return _temp2
        }
        exit()
    }
    `;
    const plugin = getPlugin();
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    t.true(f(expected) === f(code));
});
ava_1.default('', t => {
    const src = `
const f = a => {
    const b = () => 1
    return a + b()
}`.trim();
    const opts = {
        enter: 'enter(START_LINE)',
        exit: 'exit(END_LINE)'
    };
    const expected = `
    const f = a => {
        enter(1)

        const b = () => {
            enter(2)
            const _temp2 = 1
            exit(2)
            return _temp2
        }

        const _temp = a + b()
        exit(4)
        return _temp
    }
    `;
    const plugin = getPlugin();
    const { code } = babel_core_1.transform(src, { plugins: [[plugin, opts]] });
    t.true(f(expected) === f(code));
});
//# sourceMappingURL=injection-to-function.test.js.map