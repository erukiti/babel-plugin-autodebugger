import {NodePath} from 'babel-traverse'
import * as log from 'babel-log'

export class Injector {
    babel
    opts
    filename: string
    enter
    exit

    constructor(babel, pluginPass) {
        this.babel = babel
        this.opts = pluginPass.opts
        this.enter = babel.template(this.opts.enter || 'console.log(`enter ${NAME}: ${FILENAME}:${START_LINE}:${START_COLUMN}`, {params: PARAMS})')
        this.exit = babel.template(this.opts.exit || 'console.log(`exit  ${NAME}: ${FILENAME}:${END_LINE}:${END_COLUMN}`, {result: RESULT})')
        if (pluginPass.file) {
            this.filename = pluginPass.file.opts.filename
        } else {
            this.filename = 'unknown'
        }
    }

    injectionToFunction(nodePath: NodePath, name: string) {
        const getFills = (opts) => {
            return Object.assign({}, {
                FILENAME: t.stringLiteral(this.filename),
                NAME: t.stringLiteral(name),
                START_LINE: t.numericLiteral(n.loc.start.line),
                START_COLUMN: t.numericLiteral(n.loc.start.column),
                END_LINE: t.numericLiteral(n.loc.end.line),
                END_COLUMN: t.numericLiteral(n.loc.end.column),
                RESULT: t.nullLiteral(),
            }, opts)
        }

        const {types: t, template, traverse} = this.babel
        if (!nodePath.node || !nodePath.node.loc) {
            return
        }

        const n = nodePath.node

        const params = t.ObjectExpression(nodePath.node.params.map(param => {
            if (t.isIdentifier(param)) {
                return t.objectProperty(param, param, false, true)
            } else if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
                return t.objectProperty(param.left, param.left, false, true)
            }
        }))
        const nodeEnter = this.enter(getFills({PARAMS: params}))
        const body = nodePath.get('body')

        let newAst
        if (nodePath.type === 'ArrowFunctionExpression' && body.isExpression()) {
            const uid = nodePath.scope.generateUidIdentifier()
            const bodies = [
                nodeEnter,
                t.variableDeclaration('const', [t.variableDeclarator(uid, body.node)]),
                this.exit(getFills({RESULT: uid})),
                t.returnStatement(uid),
            ]
            newAst = t.blockStatement(bodies)
            body.replaceWith(newAst)
        } else if (body.isBlockStatement()) {
            const bodies = [nodeEnter, ...body.node.body]
            body.node.body = bodies
            body.traverse({
                Function: (innerPath) => {
                    innerPath.stop()
                },
                ReturnStatement: (innerPath) => {
                    if (!innerPath.node || !innerPath.node.loc) {
                        return
                    }

                    const scope = nodePath.parentPath.scope
                    const uid = scope.generateUidIdentifier()
                    const b2 =
                    [
                        t.variableDeclaration('const', [t.variableDeclarator(uid, innerPath.node.argument)]),
                        this.exit(getFills({RESULT: uid})),
                        t.returnStatement(uid)
                    ]
                    innerPath.replaceWithMultiple(b2)
                }
            })

            if (!t.isReturnStatement(body.node.body[body.node.body.length - 1])) {
                body.pushContainer('body', this.exit(getFills({})))
            }
        }

        const toLiteral = {
            string: value => t.stringLiteral(value),
            number: value => t.numericLiteral(value),
            boolean: value => t.booleanLiteral(value),
            null: value => t.nullLiteral(),
        }
        
        const valueToLiteral = value => {
            return toLiteral[typeof value](value)
        }

        nodePath.traverse({
            exit: innerPath => {
                if (t.isImmutable(innerPath)) {
                    return
                }
                const {confident, value} = innerPath.evaluate()
                if (confident && typeof value !== 'object') {
                    innerPath.replaceWith(valueToLiteral(value))
                }
            },
        })
    }
}
