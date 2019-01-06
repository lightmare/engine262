import {
  Assert,
  CreateBuiltinFunction,
  SetFunctionName,
  SetFunctionLength,
  ToInt32,
  ToString,
} from '../abstract-ops/all.mjs';
import { Q, X } from '../completion.mjs';
import { Value } from '../value.mjs';
import { searchNotStrWhiteSpaceChar } from '../grammar/numeric-string.mjs';

function digitToNumber(digit) {
  digit = digit.charCodeAt(0);
  if (digit < 0x30 /* 0 */) {
    return NaN;
  }
  if (digit <= 0x39 /* 9 */) {
    return digit - 0x30;
  }
  // Convert to lower case.
  digit &= ~0x20; // eslint-disable-line no-bitwise
  if (digit < 0x41 /* A */) {
    return NaN;
  }
  if (digit <= 0x5a /* Z */) {
    return digit - 0x41 /* A */ + 10;
  }
  return NaN;
}

function stringToRadixNumber(str, R) {
  let num = 0;
  for (let i = 0; i < str.length; i += 1) {
    const power = str.length - i - 1;
    const multiplier = R ** power;
    const dig = digitToNumber(str[i]);
    Assert(!Number.isNaN(dig) && dig < R);
    num += dig * multiplier;
  }
  return num;
}

function searchNotRadixDigit(str, R) {
  for (let i = 0; i < str.length; i += 1) {
    const num = digitToNumber(str[i]);
    if (Number.isNaN(num) || num >= R) {
      return i;
    }
  }
  return str.length;
}

function ParseInt([string = Value.undefined, radix = Value.undefined]) {
  const inputString = Q(ToString(string)).stringValue();
  let S = inputString.slice(searchNotStrWhiteSpaceChar(inputString));
  let sign = 1;
  if (S !== '' && S[0] === '\x2D') {
    sign = -1;
  }
  if (S !== '' && (S[0] === '\x2B' || S[0] === '\x2D')) {
    S = S.slice(1);
  }

  let R = Q(ToInt32(radix)).numberValue();
  let stripPrefix = true;
  if (R !== 0) {
    if (R < 2 || R > 36) {
      return new Value(NaN);
    }
    if (R !== 16) {
      stripPrefix = false;
    }
  } else {
    R = 10;
  }
  if (stripPrefix === true) {
    if (S.length >= 2 && (S.startsWith('0x') || S.startsWith('0X'))) {
      S = S.slice(2);
      R = 16;
    }
  }
  const Z = S.slice(0, searchNotRadixDigit(S, R));
  if (Z === '') {
    return new Value(NaN);
  }
  const mathInt = stringToRadixNumber(Z, R);
  if (mathInt === 0) {
    if (sign === -1) {
      return new Value(-0);
    }
    return new Value(+0);
  }
  const number = mathInt;
  return new Value(sign * number);
}

export function CreateParseInt(realmRec) {
  const fn = CreateBuiltinFunction(ParseInt, [], realmRec);
  X(SetFunctionName(fn, new Value('parseInt')));
  X(SetFunctionLength(fn, new Value(2)));
  realmRec.Intrinsics['%parseInt%'] = fn;
}