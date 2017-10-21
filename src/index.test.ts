import test from 'ava'

import {transform} from 'babel-core'

import plugin from './index'

const f = src => transform(src).code

test('', t => {
    const src = `
    async function hoge(url) {
        assert(typeof url === 'string')
        assert(URL.isValid(url))

        const res = await fetch(url)
        const text = await res.text()
        console.dir(res)
        console.log(text)
        if (isHogePattern(text)) {
            return toFuga(text)
        } else {
            return null
        }
    }
    `

    const opts = {
        enter: `debugLog({filename: FILENAME, line: START_LINE, column: START_COLUMN, type: 'debug'}, 'enter', {params: PARAMS})`,
        exit: `debugLog({filename: FILENAME, line: START_LINE, column: START_COLUMN, type: 'debug'}, 'exit', {result: RESULT})`,
        renames: {
            'console.log': `debugLog({filename: FILENAME, line: START_LINE, column: START_COLUMN, type: 'log'}, ARGS)`,
            'console.dir': `debugLog({filename: FILENAME, line: START_LINE, column: START_COLUMN, type: 'log'}, ARGS)`,
        }
    }

    const expected = `
    async function hoge(url) {
        debugLog({filename: "unknown", line: 2, column: 4, type: 'debug'}, 'enter', {params: {url}});
        assert(typeof url === 'string');
        assert(URL.isValid(url));
        const res = await fetch(url);
        const text = await res.text();
        debugLog({filename: "unknown", line: 8, column: 8, type: 'log'}, res);
        debugLog({filename: "unknown", line: 9, column: 8, type: 'log'}, text);
      
        if (isHogePattern(text)) {
          const _temp = toFuga(text);
          debugLog({filename: "unknown", line: 2, column: 4, type: 'debug'}, 'exit', {result: _temp});
          return _temp;
        } else {
          const _temp2 = null;
          debugLog({filename: "unknown", line: 2, column: 4, type: 'debug'}, 'exit', {result: _temp2});
          return _temp2;
        }
      
        debugLog({filename: "unknown", line: 2, column: 4, type: 'debug'}, 'exit', {result: null});
    }
    `


    const {code} = transform(src, {plugins: [[plugin, opts]]})
    t.true(f(expected) === f(code))
})

test('', t => {
    const src = `
const a = 1
console.log(a / 0)
    `.trim()

    const opts = {
        replaceProgram: `
const {trace, trap} = require('autodebugger')
try {
    BODY
} catch (e) {
    trap(e)
}
        `.trim()
    }

    const expected = `
    const {trace, trap} = require('autodebugger')
    try {
        const a = 1
        console.log(a / 0)
    } catch (e) {
        trap(e)
    }
    `

    const {code} = transform(src, {plugins: [[plugin, opts]]})
    t.true(f(expected) === f(code))
})
