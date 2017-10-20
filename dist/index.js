"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const injection_to_function_1 = require("./injection-to-function");
const callee_renamer_1 = require("./callee-renamer");
exports.default = (babel) => {
    let injector;
    let calleeRenamer;
    const classVisitor = {
        ClassMethod(nodePath) {
            const name = `${this.className}#${nodePath.node.key.name}`;
            injector.injectionToFunction(nodePath, name);
        },
    };
    const visitor = {
        CallExpression: (nodePath, state) => {
            calleeRenamer.rename(nodePath);
        },
        ClassDeclaration: nodePath => {
            nodePath.traverse(classVisitor, { className: nodePath.node.id.name });
        },
        Function: {
            enter: nodePath => {
                let name;
                switch (nodePath.node.type) {
                    case 'FunctionDeclaration': {
                        name = nodePath.node.id.name;
                        break;
                    }
                    case 'ArrowFunctionExpression': {
                        if (nodePath.parent.type === 'VariableDeclarator' &&
                            nodePath.parentPath.get('id').isIdentifier()) {
                            name = `arrow function (${nodePath.parent.id.name})`;
                            break;
                        }
                        name = 'arrowFunction';
                        break;
                    }
                    case 'ClassMethod': {
                        return;
                    }
                    default: {
                        console.log(nodePath.node);
                        name = 'unknown';
                        break;
                    }
                }
                injector.injectionToFunction(nodePath, name);
            },
        },
    };
    return {
        name: 'autodebugger',
        visitor,
        pre() {
            injector = new injection_to_function_1.Injector(babel, this);
            calleeRenamer = new callee_renamer_1.CalleeRenamer(babel, this);
        },
    };
};
//# sourceMappingURL=index.js.map