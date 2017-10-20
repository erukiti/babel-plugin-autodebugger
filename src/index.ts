import {NodePath} from 'babel-traverse'

import {Injector} from './injection-to-function'

export default (babel) => {
    let injector: Injector

    const classVisitor = {
        ClassMethod(nodePath) {
            const n = nodePath.node
            const name = `${this.className}#${n.key.name}`
            injector.injectionToFunction(nodePath, name)
        },
    }

    const visitor = {
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
                            console.log(1)
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
            injector = new Injector(babel, this.opts)
        },
    }
}

const visitor = {}
