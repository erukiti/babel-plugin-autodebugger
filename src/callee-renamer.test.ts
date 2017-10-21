import test from 'ava'
import {transform} from 'babel-core'

import {CalleeRenamer} from './callee-renamer'

const getPlugin = () => {
    let calleeRenamer: CalleeRenamer
    return babel => {
        return {
            visitor: {
                CallExpression: (nodePath, state) => {
                    calleeRenamer.rename(nodePath)
                },
            },
            pre() {
                calleeRenamer = new CalleeRenamer(babel, this)
            },
        }
    }
}

const f = src => transform(src).code

test('default', t => {
    const src = 'console.log(1)'

    const opts = {
        renames: {
            'console.log': `debugLog({filename: FILENAME, line: START_LINE, column: START_COLUMN, type: 'log', callee: CALLEE, calleeName: CALLEE_NAME}, ARGS)`,
        }
    }

    const expected = `debugLog({filename: "unknown", line: 1, column: 1, type: 'log', callee: console.log, calleeName: "console.log"}, 1)`

    const plugin = getPlugin()

    const {code} = transform(src, {plugins: [[plugin, opts]]})
    t.true(f(expected) === f(code))
})
