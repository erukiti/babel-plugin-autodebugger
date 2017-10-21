import {NodePath} from 'babel-traverse'

export class CalleeRenamer {
    babel
    opts
    filename: string

    constructor(babel, pluginPass) {
        this.babel = babel
        this.opts = pluginPass.opts.renames || {}
        if (pluginPass.file) {
            this.filename = pluginPass.file.opts.filename
        } else {
            this.filename = 'unknown'
        }

    }

    rename(nodePath: NodePath) {
        if (!nodePath.node || !nodePath.node.loc) {
            return
        }

        const {types: t, template} = this.babel
        
        const n = nodePath.node
        const getFills = (opts) => {
            return Object.assign({}, {
                FILENAME: t.stringLiteral(this.filename),
                START_LINE: t.numericLiteral(n.loc.start.line),
                START_COLUMN: t.numericLiteral(n.loc.start.column + 1),
                END_LINE: t.numericLiteral(n.loc.end.line),
                END_COLUMN: t.numericLiteral(n.loc.end.column + 1),
                ARGS: nodePath.node.arguments,
                CALLEE_NAME: t.stringLiteral(nodePath.get('callee').getSource() || 'unknown'),
                CALLEE: nodePath.node.callee,
            }, opts)
        }

        // console.log(nodePath.getSource())
        // console.log(nodePath.node.arguments)

        const callee = nodePath.get('callee')

        const key = Object.keys(this.opts).find(key => callee.matchesPattern(key))
        if (key) {
            nodePath.replaceWith(template(this.opts[key])(getFills({})))
        } else if ('*' in this.opts) {
            nodePath.replaceWith(template(this.opts['*'])(getFills({})))
        }
    }
}