"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CalleeRenamer {
    constructor(babel, pluginPass) {
        this.babel = babel;
        this.opts = pluginPass.opts.renames || {};
        if (pluginPass.file) {
            this.filename = pluginPass.file.opts.filename;
        }
        else {
            this.filename = 'unknown';
        }
    }
    rename(nodePath) {
        if (!nodePath.node || !nodePath.node.loc) {
            return;
        }
        const n = nodePath.node;
        const getFills = (opts) => {
            return Object.assign({}, {
                FILENAME: t.stringLiteral(this.filename),
                START_LINE: t.numericLiteral(n.loc.start.line),
                START_COLUMN: t.numericLiteral(n.loc.start.column),
                END_LINE: t.numericLiteral(n.loc.end.line),
                END_COLUMN: t.numericLiteral(n.loc.end.column),
                ARGS: nodePath.node.arguments,
            }, opts);
        };
        const { types: t, template } = this.babel;
        const callee = nodePath.get('callee');
        const key = Object.keys(this.opts).find(key => callee.matchesPattern(key));
        if (key) {
            nodePath.replaceWith(template(this.opts[key])(getFills({})));
        }
    }
}
exports.CalleeRenamer = CalleeRenamer;
//# sourceMappingURL=callee-renamer.js.map