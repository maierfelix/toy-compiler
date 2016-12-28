#include "scope.jsm"
#include "token.jsm"
#include "scanner.jsm"
#include "parser.jsm"
#include "generator.jsm"
#include "inference.jsm"

let errors = [];
let __imports = {
  error: function(msg) {
    console.error("Error: " + msg);
    errors.push(msg);
  },
  readFile: function(path) {
    return (require("fs").readFileSync("src/" + path, "utf-8"));
  },
  getPlatformName: function() {
    return (require("os").platform());
  }
};

export function compile(str) {
  write('(function() { "use strict"; \n');
  let tokens = scan(str);
  let ast = parse(tokens);
  let code = generate(ast);
  code = code + "\n})();"
  return ({
    output: code,
    errors: errors
  });
};

export function include(path) {
  let str = __imports.readFile(path);
  let tkns = scan(str);
  let tmp_pindex = pindex;
  let tmp_tokens = tokens;
  let tmp_current = current;
  let tmp_scope = scope;
  let ast = parse(tkns);
  let code = generate(ast);
  pindex = tmp_pindex;
  tokens = tmp_tokens;
  current = tmp_current;
  scope = tmp_scope;
  return (code);
};