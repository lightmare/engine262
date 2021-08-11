import { Value } from '../value.mjs';
import { ResolveBinding } from '../abstract-ops/all.mjs';
import { Q } from '../completion.mjs';

// #sec-var-keyword-runtime-semantics-evaluation
// PrimaryExpression : `var`
export function Evaluate_Var(_PrimaryExpression) {
  return Q(ResolveBinding(Value.var, undefined, true));
}
