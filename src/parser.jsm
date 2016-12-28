let pindex = 0;
let scope = null;
let tokens = null;
let current = null;

function createNode(kind) {
  let node = new Node(kind);
  return (node);
};

function parse(tkns) {
  let node = {
    kind: NN_PROGRAM,
    body: null
  };
  tokens = tkns;
  pindex = -1;
  next();
  pushScope(node);
  scope.parent = null;
  scope.isGlobal = true;
  node.body = parseStatementList();
  popScope();
  return (node);
};

function pushScope(node) {
  let scp = new Scope();
  scp.node = node;
  scp.parent = scope;
  node.context = scp;
  scope = scp;
};

function popScope() {
  if (scope != null) {
    scope = scope.parent;
  }
};

function parseStatementList() {
  let list = [];
  while (true) {
    if (!current) break;
    if (peek(PP_RBRACE)) break;
    let node = parseStatement();
    if (!node) break;
    if (node.kind != NN_IGNORE) list.push(node);
  };
  return (list);
};

function parseStatement() {
  let node = null;
  if (peek(KK_LET)) {
    node = parseVariableDeclaration(NN_LET);
  } else if (peek(KK_CONST)) {
    node = parseVariableDeclaration(NN_CONST);
  } else if (peek(KK_CLASS)) {
    node = parseClassDeclaration();
  } else if (peek(KK_EXPORT)) {
    node = parseExportDeclaration();
  } else if (peek(KK_FUNCTION)) {
    node = parseFunctionDeclaration(true);
  } else if (peek(KK_RETURN)) {
    node = parseReturnStatement();
  } else if (peek(KK_IF)) {
    node = parseIfStatement();
  } else if (peek(KK_WHILE)) {
    node = parseWhileStatement();
  } else if (peek(KK_INCLUDE)) {
    next();
    include(current.value);
    // ignore preprocessor nodes
    node = { kind: NN_IGNORE };
    next();
  } else {
    node = parseExpression();
    if (node == null) {
      __imports.error("Unknown node kind " + current.value + " in " + current.line + ":" + current.column);
    }
  }
  eat(PP_SEMIC);
  return (node);
};

function parseExportDeclaration() {
  expect(KK_EXPORT);
  let node = {
    kind: NN_EXPORT,
    node: parseStatement()
  };
  node.node.isExported = true;
  return (node);
};

function parseClassDeclaration() {
  expect(KK_CLASS);
  let node = {
    kind: NN_CLASS,
    id: current.value,
    body: null
  };
  expect(TT_IDENTIFIER);
  scope.register(node.id, node);
  expect(PP_LBRACE);
  pushScope(node);
  node.body = parseClassBody();
  popScope();
  expect(PP_RBRACE);
  return (node);
};

function parseClassBody() {
  let list = [];
  while (true) {
    if (!current) break;
    if (peek(PP_RBRACE)) break;
    let node = parseClassBodyItem();
    eat(PP_SEMIC);
    if (!node) break;
    list.push(node);
  };
  return (list);
};

function parseClassBodyItem() {
  let id = current.value;
  let node = null;
  expect(TT_IDENTIFIER);
  // method
  if (peek(PP_LPAREN)) {
    let kind = null;
    // constructor?
    if (id == "constructor") {
      kind = NN_CLASS_CONSTRUCTOR;
    } else {
      kind = NN_CLASS_METHOD;
    }
    node = {
      id: id,
      kind: kind,
      init: null
    };
    scope.register(node.id, node);
    pushScope(node);
    node.init = parseFunctionDeclaration(false);
    popScope();
  }
  // property
  else if (eat(PP_COLON)) {
    node = {
      id: id,
      kind: NN_CLASS_PROPERTY,
      init: parseExpression()
    };
    scope.register(node.id, node);
  }
  else __imports.error("Unexpected class token " + current.value);
  return (node);
};

function parseWhileStatement() {
  let node = {
    kind: NN_WHILE,
    condition: null,
    body: null
  };
  expect(KK_WHILE);
  node.condition = parseExpression();
  pushScope(node);
  // braced body
  if (eat(PP_LBRACE)) {
    node.body = parseStatementList();
    expect(PP_RBRACE);
  // short body
  } else {
    node.body = parseExpression();
  }
  popScope();
  return (node);
};

function parseIfStatement() {
  let node = {
    kind: NN_IF,
    condition: null,
    alternate: null,
    consequent: null
  };
  // else
  if (!eat(KK_IF)) {
    pushScope(node);
    node.consequent = parseIfBody();
    popScope();
    return (node);
  }
  expect(PP_LPAREN);
  node.condition = parseExpression();
  expect(PP_RPAREN);
  pushScope(node);
  node.consequent = parseIfBody();
  popScope();
  if (eat(KK_ELSE)) {
    node.alternate = parseIfStatement();
  }
  return (node);
};

function parseIfBody() {
  let node = null;
  // braced if
  if (eat(PP_LBRACE)) {
    node = parseStatementList();
    expect(PP_RBRACE);
  // short if
  } else {
    node = [parseExpression()];
    eat(PP_SEMIC);
  }
  return (node);
};

function parseReturnStatement() {
  expect(KK_RETURN);
  let node = {
    kind: NN_RETURN,
    argument: parseExpression()
  };
  return (node);
};

function parseFunctionDeclaration(strict) {
  if (strict) expect(KK_FUNCTION);
  let node = {
    kind: NN_FUNCTION,
    id: null,
    parameter: null,
    body: null
  };
  if (peek(TT_IDENTIFIER)) {
    node.id = current.value;
    scope.register(node.id, node);
    next();
  }
  node.parameter = parseFunctionParameters();
  pushScope(node);
  if (eat(PP_LBRACE)) {
    node.body = parseStatementList();
    expect(PP_RBRACE);
  }
  popScope();
  return (node);
};

function parseFunctionParameters() {
  let params = [];
  expect(PP_LPAREN);
  while (true) {
    if (peek(PP_RPAREN)) break;
    params.push(current);
    next();
    if (!eat(PP_COMMA)) break;
  };
  expect(PP_RPAREN);
  return (params);
};

function parseVariableDeclaration(kind) {
  next();
  expectIdentifier();
  let node = {
    kind: kind,
    id: current.value,
    init: null
  };
  next();
  scope.register(node.id, node);
  expect(OP_ASS);
  node.init = parseExpression();
  return (node);
};

function parseMemberExpression(parent) {
  expect(PP_DOT);
  let node = {
    kind: NN_MEMBER_EXPRESSION,
    parent: parent,
    member: parseExpression()
  };
  return (node);
};

function parseComputedMemberExpression(parent) {
  expect(PP_LBRACK);
  let node = {
    kind: NN_COMPUTED_MEMBER_EXPRESSION,
    parent: parent,
    member: parseExpression()
  };
  expect(PP_RBRACK);
  return (node);
};

function parseCallExpression(id) {
  let node = {
    kind: NN_CALL_EXPRESSION,
    callee: id,
    parameter: parseCallParameters()
  };
  return (node);
};

function parseCallParameters() {
  let params = [];
  expect(PP_LPAREN);
  while (true) {
    if (peek(PP_RPAREN)) break;
    let expr = parseExpression();
    params.push(expr);
    if (!eat(PP_COMMA)) break;
  };
  expect(PP_RPAREN);
  return (params);
};

function parseBreak() {
  expect(KK_BREAK);
  let node = {
    kind: NN_BREAK
  };
  return (node);
};

function parseContinue() {
  expect(KK_CONTINUE);
  let node = {
    kind: NN_CONTINUE
  };
  return (node);
};

function parseObjectExpression() {
  let node = {
    kind: NN_OBJECT_EXPRESSION,
    properties: []
  };
  expect(PP_LBRACE);
  while (true) {
    if (peek(PP_RBRACE)) break;
    let property = {
      kind: NN_OBJECT_PROPERTY,
      id: parseLiteral(),
      value: null
    };
    expect(PP_COLON);
    property.value = parseStatement();
    node.properties.push(property);
    if (!eat(PP_COMMA)) break;
  };
  expect(PP_RBRACE);
  return (node);
};

function parseArrayExpression() {
  expect(PP_LBRACK);
  let node = {
    kind: NN_ARRAY_EXPRESSION,
    elements: []
  };
  while (true) {
    if (peek(PP_RBRACK)) break;
    let element = {
      kind: NN_ARRAY_ELEMENT,
      value: parseExpression()
    };
    node.elements.push(element);
    if (!eat(PP_COMMA)) break;
  };
  expect(PP_RBRACK);
  return (node);
};

function parseUnaryPrefixExpression() {
  let node = {
    kind: NN_UNARY_PREFIX_EXPRESSION,
    operator: current.value,
    value: null
  };
  next();
  node.value = parseExpression();
  return (node);
};

function parseUnaryPostfixExpression(left) {
  let node = {
    kind: NN_UNARY_POSTFIX_EXPRESSION,
    operator: current.value,
    value: left
  };
  next();
  return (node);
};

function parseBinaryExpression(left) {
  let node = {
    kind: NN_BINARY_EXPRESSION,
    left: left,
    right: null,
    operator: current.value
  };
  next();
  node.right = parseExpression();
  return (node);
};

function parseInfix(left) {
  if (isBinaryOperator(current)) {
    return (parseBinaryExpression(left));
  }
  if (isUnaryPostfixOperator(current)) {
    return (parseUnaryPostfixExpression(left));
  }
  if (peek(PP_LPAREN)) {
    return (parseCallExpression(left));
  }
  if (peek(PP_DOT)) {
    return (parseMemberExpression(left));
  }
  if (peek(PP_LBRACK)) {
    return (parseComputedMemberExpression(left));
  }
  return (left);
};

function parsePrefix() {
  if (isLiteral(current)) {
    return (parseLiteral());
  }
  if (peek(PP_LBRACE)) {
    return (parseObjectExpression());
  }
  if (peek(PP_LBRACK)) {
    return (parseArrayExpression());
  }
  if (eat(PP_LPAREN)) {
    let node = parseExpression();
    expect(PP_RPAREN);
    return (node);
  }
  if (isUnaryPrefixOperator(current)) {
    return (parseUnaryPrefixExpression());
  }
  return (parseStatement());
};

function parseExpression() {
  if (peek(KK_BREAK)) {
    return (parseBreak());
  }
  if (peek(KK_CONTINUE)) {
    return (parseContinue());
  }
  let node = parsePrefix();
  while (true) {
    if (!current) break;
    let expr = parseInfix(node);
    if (expr == null || expr == node) break;
    node = expr;
  };
  return (node);
};

function parseLiteral() {
  if (peek(TT_STRING)) {
    return (parseStringLiteral());
  }
  let node = {
    kind: NN_LITERAL,
    type: current.kind,
    value: current.value
  };
  next();
  return (node);
};

function parseStringLiteral() {
  let node = {
    kind: NN_STRING_LITERAL,
    type: current.kind,
    value: current.value,
    isChar: current.isChar
  };
  next();
  return (node);
};

function expectIdentifier() {
  if (current.kind != TT_IDENTIFIER) {
    __imports.error("Expected " + TT_IDENTIFIER + ":identifier but got " + current.kind + ":" + current.value);
  }
};

function peek(kind) {
  return (current && current.kind == kind);
};

function next() {
  pindex++;
  current = tokens[pindex];
};

function back() {
  pindex = pindex - 2;
  next();
};

function expect(kind) {
  if (current.kind != kind) {
    __imports.error("Expected " + kind + " but got " + current.kind + " in " + current.line + ":" + current.column);
  } else {
    next();
  }
};

function eat(kind) {
  if (peek(kind)) {
    next();
    return (true);
  }
  return (false);
};