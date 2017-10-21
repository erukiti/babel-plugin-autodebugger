import {NodePath} from 'babel-traverse'

import {Injector} from './injection-to-function'
import {CalleeRenamer} from './callee-renamer'

export default (babel) => {
    let injector: Injector
    let calleeRenamer: CalleeRenamer
    
    const {template} = babel

    const classVisitor = {
        ClassMethod(nodePath) {
            const name = `${this.className}#${nodePath.node.key.name}`
            injector.injectionToFunction(nodePath, name)
        },
    }

    const visitor = {
        Program: {
            exit: (nodePath, state) => {
                if (state.opts.replaceProgram) {
                    const body = template(state.opts.replaceProgram)({BODY: nodePath.node.body})
                    if (Array.isArray(body)) {
                        nodePath.node.body = body
                    } else {
                        nodePath.node.body = [body]
                    }
                }
            }
        },
        CallExpression: (nodePath, state) => {
            calleeRenamer.rename(nodePath)
        },
        ClassDeclaration: nodePath => {
            nodePath.traverse(classVisitor, {className: nodePath.node.id.name})
        },
        Function: {
            enter: nodePath => {
                let name
                switch (nodePath.node.type) {
                    case 'FunctionDeclaration': {
                        name = nodePath.node.id.name
                        break
                    }
                    case 'ArrowFunctionExpression': {
                        if (
                            nodePath.parent.type === 'VariableDeclarator' &&
                            nodePath.parentPath.get('id').isIdentifier()
                        ) {
                            name = `arrow function (${nodePath.parent.id.name})`
                            break
                        }
                        name = 'arrowFunction'
                        break
                    }
                    case 'ClassMethod': {
                        return
                    }
                    default: {
                        console.log(nodePath.node)
                        name = 'unknown'
                        break
                    }
                }

                injector.injectionToFunction(nodePath, name)
            },
        },
    }

    return {
        name: 'autodebugger',
        visitor,
        pre() {
            injector = new Injector(babel, this)
            calleeRenamer = new CalleeRenamer(babel, this)
        },
    }
}

