import { surroundingAgent } from '../engine.mjs';
import {
  GetIdentifierReference,
  NewDeclarativeEnvironment,
} from '../environment.mjs';
import { Evaluate } from '../evaluator.mjs';
import { GetValue } from '../abstract-ops/all.mjs';
import { Value } from '../value.mjs';
import { Q } from '../completion.mjs';

// #sec-comma-operator-runtime-semantics-evaluation
//   Expression :
//     AssignmentExpression
//     Expression `,` AssignmentExpression
export function* Evaluate_CommaOperator({ ExpressionList }) {

  if (!surroundingAgent.feature('var-expression')) {
    return yield* Evaluate_ExpressionList(null, ExpressionList);
  }

  // 1. Let oldEnv be the running execution context's LexicalEnvironment.
  const oldEnv = surroundingAgent.runningExecutionContext.LexicalEnvironment;

  // 2. Let commaEnv be NewDeclarativeEnvironment(oldEnv).
  const commaEnv = NewDeclarativeEnvironment(oldEnv);

  // 3. FIXME initialize var binding from enclosing environment
  const varRef = GetIdentifierReference(oldEnv, Value.var, Value.true);
  const varValue = GetValue(varRef);
  commaEnv.InitializeBinding(Value.var, varValue);

  // 4. Set the running execution context's LexicalEnvironment to commaEnv.
  surroundingAgent.runningExecutionContext.LexicalEnvironment = commaEnv;

  // 5. Let commaValue be the result of evaluating ExpressionList.
  const commaValue = yield* Evaluate_ExpressionList(commaEnv, ExpressionList);

  // 6. Set the running execution context's LexicalEnvironment to oldEnv.
  surroundingAgent.runningExecutionContext.LexicalEnvironment = oldEnv;

  // 7. Return commaValue.
  return commaValue;
}

function* Evaluate_ExpressionList(commaEnv, ExpressionList) {
  let result;
  for (const Expression of ExpressionList) {
    const lref = yield* Evaluate(Expression);
    result = Q(GetValue(lref));
    if (commaEnv) {
      commaEnv.SetMutableBinding(Value.var, result, Value.true);
    }
  }
  return result;
}
