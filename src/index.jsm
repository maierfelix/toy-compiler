// vim: syntax=javascript

#include "token.jsm"
#include "scanner.jsm"
#include "parser.jsm"
#include "generator.jsm"

__exports.compile = function(str) {
  let tokens = scan(str);
  let ast = parse(tokens);
  return (generate(ast));
};

__exports.include = function(path) {
  let str = __imports.readFile(path);
  let tkns = scan(str);
  let tmp_pindex = pindex;
  let tmp_tokens = tokens;
  let tmp_current = current;
  let ast = parse(tkns);
  let code = generate(ast);
  pindex = tmp_pindex;
  tokens = tmp_tokens;
  current = tmp_current;
  return (code);
};