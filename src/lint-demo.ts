// This file contains intentional lint errors to demonstrate automatic fixing

const unusedVariable = 'This variable is not used';

function noReturnType(param) {
  if (param) {
    return true;
  } else {
    return false;
  }
}

async function asyncFunctionWithoutAwait() {
  const promise = new Promise((resolve) =>
    setTimeout(() => resolve('done'), 100),
  );
  return promise; // Missing await
}

const obj: any = { key: 'value' };
const value = obj.key; // Unsafe member access

export { noReturnType, asyncFunctionWithoutAwait };
