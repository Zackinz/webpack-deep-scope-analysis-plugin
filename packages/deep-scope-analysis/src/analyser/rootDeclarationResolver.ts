import { RootDeclaration, RootDeclarationType } from "./rootDeclaration";
import * as ESTree from "estree";
import { Dictionary } from "./moduleAnalyser";
import { Variable } from "../variable";
import { ScopeManager } from "../scopeManager";
import { Reference } from "../reference";

export default (
  declarations: RootDeclaration[],
  scopeManager: ScopeManager,
) => (variable: Variable) => {
  const def = variable.defs[0];

  const resolver: any = {
    FunctionDeclaration(node: ESTree.FunctionDeclaration) {
        declarations.push(
          new RootDeclaration(
            RootDeclarationType.Function,
            variable.name,
            def.node,
            scopeManager.__nodeToScope.get(def.node)!,
          ),
        );

    },
    ClassDeclaration(node: ESTree.ClassDeclaration) {
      declarations.push(
        new RootDeclaration(
          RootDeclarationType.Class,
          variable.name,
          def.node,
          scopeManager.__nodeToScope.get(def.node)!,
        ),
      );
    },
    VariableDeclarator(node: ESTree.VariableDeclarator) {
      if (node.init) {
        const { init } = node;
        if (def.kind === "let" || def.kind === "var") {
          for (let i = 1; i < variable.references.length; i++) {
            const ref = variable.references[i];
            if (
              ref.flag === Reference.WRITE  ||
              ref.flag === Reference.RW
            ) return;
          }
        } else if (def.kind !== "const") {
          return;
        }

        if (init.type === "ClassExpression") {
          declarations.push(
            new RootDeclaration(
              RootDeclarationType.Class,
              variable.name,
              init,
              scopeManager.__nodeToScope.get(init)!,
            ),
          );
        } else if (
          init.type === "FunctionExpression" ||
          init.type === "ArrowFunctionExpression"
        ) {
          declarations.push(
            new RootDeclaration(
              RootDeclarationType.Function,
              variable.name,
              init,
              scopeManager.__nodeToScope.get(init)!,
            ),
          );
        }
      }
    },
  };

  if (resolver[def.node.type]) {
    resolver[def.node.type].call(undefined, def.node);
  }
};