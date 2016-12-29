class Parser {

  pindex: 0;
  scope: null;
  tokens: null;
  current: null;

  createNode(kind) {
    let node = new Node(kind);
    return (node);
  }

  include(path) {
    let str = __imports.readFile(path);
    let scanner = new Scanner();
    let tokens = scanner.scan(str);
    let parser = new Parser();
    let ast = parser.parse(tokens);
    let generator = new Generator();
    let code = generator.generate(ast);
    return (code);
  }

  isBinaryOperator(token) {
    let kind = token.kind;
    return (
      (kind == OP_ASS ||
      kind == OP_ADD ||
      kind == OP_SUB ||
      kind == OP_MUL ||
      kind == OP_DIV ||
      kind == OP_OR ||
      kind == OP_AND ||
      kind == OP_NOT ||
      kind == OP_LT ||
      kind == OP_LTE ||
      kind == OP_GT ||
      kind == OP_GTE ||
      kind == OP_EQUAL ||
      kind == OP_NEQUAL ||
      kind == OP_BIN_OR ||
      kind == OP_BIN_AND) &&
      !this.isUnaryPrefixOperator(token)
    );
  }

  isUnaryPrefixOperator(token) {
    let kind = token.kind;
    return (
      kind == OP_NEW ||
      kind == OP_NOT ||
      kind == OP_ADD_ADD ||
      kind == OP_SUB_SUB
    );
  }

  isUnaryPostfixOperator(token) {
    let kind = token.kind;
    return (
      kind == OP_ADD_ADD ||
      kind == OP_SUB_SUB
    );
  }

  isLiteral(token) {
    let kind = token.kind;
    return (
      kind == TT_NULL ||
      kind == TT_STRING ||
      kind == TT_NUMBER ||
      kind == TT_BOOLEAN ||
      kind == TT_IDENTIFIER
    );
  }

  parse(tokens) {
    let node = {
      kind: NN_PROGRAM,
      body: null
    };
    this.tokens = tokens;
    this.pindex = -1;
    this.next();
    this.pushScope(node);
    this.scope.parent = null;
    this.scope.isGlobal = true;
    node.body = this.parseStatementList();
    this.popScope();
    return (node);
  }

  pushScope(node) {
    let scp = new Scope();
    scp.node = node;
    scp.parent = this.scope;
    node.context = scp;
    this.scope = scp;
  }

  popScope() {
    if (this.scope != null) {
      this.scope = this.scope.parent;
    }
  }

  parseStatementList() {
    let list = [];
    while (true) {
      if (!this.current) break;
      if (this.peek(PP_RBRACE)) break;
      let node = this.parseStatement();
      if (!node) break;
      if (node.kind != NN_IGNORE) list.push(node);
    };
    return (list);
  }

  parseStatement() {
    let node = null;
    if (this.peek(KK_LET)) {
      node = this.parseVariableDeclaration(NN_LET);
    } else if (this.peek(KK_CONST)) {
      node = this.parseVariableDeclaration(NN_CONST);
    } else if (this.peek(KK_CLASS)) {
      node = this.parseClassDeclaration();
    } else if (this.peek(KK_EXPORT)) {
      node = this.parseExportDeclaration();
    } else if (this.peek(KK_FUNCTION)) {
      node = this.parseFunctionDeclaration(true);
    } else if (this.peek(KK_RETURN)) {
      node = this.parseReturnStatement();
    } else if (this.peek(KK_IF)) {
      node = this.parseIfStatement();
    } else if (this.peek(KK_WHILE)) {
      node = this.parseWhileStatement();
    } else if (this.peek(KK_INCLUDE)) {
      this.next();
      let code = this.include(this.current.value);
      // ignore preprocessor nodes
      node = {
        kind: NN_INCLUDE,
        code: code
      };
      this.next();
    } else {
      node = this.parseExpression();
      if (node == null) {
        let current = this.current;
        __imports.error("Unknown node kind " + current.value + " in " + current.line + ":" + current.column);
      }
    }
    this.eat(PP_SEMIC);
    return (node);
  }

  parseExportDeclaration() {
    this.expect(KK_EXPORT);
    let node = {
      kind: NN_EXPORT,
      node: this.parseStatement()
    };
    node.node.isExported = true;
    return (node);
  }

  parseClassDeclaration() {
    this.expect(KK_CLASS);
    let node = {
      kind: NN_CLASS,
      id: this.current.value,
      ctor: null,
      body: null
    };
    this.expect(TT_IDENTIFIER);
    this.scope.register(node.id, node);
    this.expect(PP_LBRACE);
    this.pushScope(node);
    node.body = this.parseClassBody(node);
    this.popScope();
    this.expect(PP_RBRACE);
    return (node);
  }

  parseClassBody(parent) {
    let list = [];
    while (true) {
      if (!this.current) break;
      if (this.peek(PP_RBRACE)) break;
      let node = this.parseClassBodyItem();
      this.eat(PP_SEMIC);
      if (!node) break;
      if (node.kind == NN_CLASS_CONSTRUCTOR) {
        parent.ctor = node;
      }
      list.push(node);
    };
    return (list);
  }

  parseClassBodyItem() {
    let id = this.current.value;
    let node = null;
    this.expect(TT_IDENTIFIER);
    // method
    if (this.peek(PP_LPAREN)) {
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
      this.scope.register(node.id, node);
      this.pushScope(node);
      node.init = this.parseFunctionDeclaration(false);
      this.popScope();
    }
    // property
    else if (this.eat(PP_COLON)) {
      node = {
        id: id,
        kind: NN_CLASS_PROPERTY,
        init: this.parseExpression()
      };
      this.scope.register(node.id, node);
    }
    else __imports.error("Unexpected class token " + this.current.value);
    return (node);
  }

  parseWhileStatement() {
    let node = {
      kind: NN_WHILE,
      condition: null,
      body: null
    };
    this.expect(KK_WHILE);
    node.condition = this.parseExpression();
    this.pushScope(node);
    // braced body
    if (this.eat(PP_LBRACE)) {
      node.body = this.parseStatementList();
      this.expect(PP_RBRACE);
    // short body
    } else {
      node.body = this.parseExpression();
    }
    this.popScope();
    return (node);
  }

  parseIfStatement() {
    let node = {
      kind: NN_IF,
      condition: null,
      alternate: null,
      consequent: null
    };
    // else
    if (!this.eat(KK_IF)) {
      this.pushScope(node);
      node.consequent = this.parseIfBody();
      this.popScope();
      return (node);
    }
    this.expect(PP_LPAREN);
    node.condition = this.parseExpression();
    this.expect(PP_RPAREN);
    this.pushScope(node);
    node.consequent = this.parseIfBody();
    this.popScope();
    if (this.eat(KK_ELSE)) {
      node.alternate = this.parseIfStatement();
    }
    return (node);
  }

  parseIfBody() {
    let node = null;
    // braced if
    if (this.eat(PP_LBRACE)) {
      node = this.parseStatementList();
      this.expect(PP_RBRACE);
    // short if
    } else {
      node = [this.parseExpression()];
      this.eat(PP_SEMIC);
    }
    return (node);
  }

  parseReturnStatement() {
    this.expect(KK_RETURN);
    let node = {
      kind: NN_RETURN,
      argument: this.parseExpression()
    };
    return (node);
  }

  parseFunctionDeclaration(strict) {
    if (strict) this.expect(KK_FUNCTION);
    let node = {
      kind: NN_FUNCTION,
      id: null,
      parameter: null,
      body: null
    };
    if (this.peek(TT_IDENTIFIER)) {
      node.id = this.current.value;
      this.scope.register(node.id, node);
      this.next();
    }
    node.parameter = this.parseFunctionParameters();
    this.pushScope(node);
    if (this.eat(PP_LBRACE)) {
      node.body = this.parseStatementList();
      this.expect(PP_RBRACE);
    }
    this.popScope();
    return (node);
  }

  parseFunctionParameters() {
    let params = [];
    this.expect(PP_LPAREN);
    while (true) {
      if (this.peek(PP_RPAREN)) break;
      params.push(this.current);
      this.next();
      if (!this.eat(PP_COMMA)) break;
    };
    this.expect(PP_RPAREN);
    return (params);
  }

  parseVariableDeclaration(kind) {
    this.next();
    this.expectIdentifier();
    let node = {
      kind: kind,
      id: this.current.value,
      init: null
    };
    this.next();
    this.scope.register(node.id, node);
    this.expect(OP_ASS);
    node.init = this.parseExpression();
    return (node);
  }

  parseMemberExpression(parent) {
    this.expect(PP_DOT);
    let node = {
      kind: NN_MEMBER_EXPRESSION,
      parent: parent,
      member: this.parseExpression()
    };
    return (node);
  }

  parseComputedMemberExpression(parent) {
    this.expect(PP_LBRACK);
    let node = {
      kind: NN_COMPUTED_MEMBER_EXPRESSION,
      parent: parent,
      member: this.parseExpression()
    };
    this.expect(PP_RBRACK);
    return (node);
  }

  parseCallExpression(id) {
    let node = {
      kind: NN_CALL_EXPRESSION,
      callee: id,
      parameter: this.parseCallParameters()
    };
    return (node);
  }

  parseCallParameters() {
    let params = [];
    this.expect(PP_LPAREN);
    while (true) {
      if (this.peek(PP_RPAREN)) break;
      let expr = this.parseExpression();
      params.push(expr);
      if (!this.eat(PP_COMMA)) break;
    };
    this.expect(PP_RPAREN);
    return (params);
  }

  parseBreak() {
    this.expect(KK_BREAK);
    let node = {
      kind: NN_BREAK
    };
    return (node);
  }

  parseContinue() {
    this.expect(KK_CONTINUE);
    let node = {
      kind: NN_CONTINUE
    };
    return (node);
  }

  parseObjectExpression() {
    let node = {
      kind: NN_OBJECT_EXPRESSION,
      properties: []
    };
    this.expect(PP_LBRACE);
    while (true) {
      if (this.peek(PP_RBRACE)) break;
      let property = {
        kind: NN_OBJECT_PROPERTY,
        id: this.parseLiteral(),
        value: null
      };
      this.expect(PP_COLON);
      property.value = this.parseStatement();
      node.properties.push(property);
      if (!this.eat(PP_COMMA)) break;
    };
    this.expect(PP_RBRACE);
    return (node);
  }

  parseArrayExpression() {
    this.expect(PP_LBRACK);
    let node = {
      kind: NN_ARRAY_EXPRESSION,
      elements: []
    };
    while (true) {
      if (this.peek(PP_RBRACK)) break;
      let element = {
        kind: NN_ARRAY_ELEMENT,
        value: this.parseExpression()
      };
      node.elements.push(element);
      if (!this.eat(PP_COMMA)) break;
    };
    this.expect(PP_RBRACK);
    return (node);
  }

  parseUnaryPrefixExpression() {
    let node = {
      kind: NN_UNARY_PREFIX_EXPRESSION,
      operator: this.current.value,
      value: null
    };
    this.next();
    node.value = this.parseExpression();
    return (node);
  }

  parseUnaryPostfixExpression(left) {
    let node = {
      kind: NN_UNARY_POSTFIX_EXPRESSION,
      operator: this.current.value,
      value: left
    };
    this.next();
    return (node);
  }

  parseBinaryExpression(left) {
    let node = {
      kind: NN_BINARY_EXPRESSION,
      left: left,
      right: null,
      operator: this.current.value
    };
    this.next();
    node.right = this.parseExpression();
    return (node);
  }

  parseInfix(left) {
    if (this.isBinaryOperator(this.current)) {
      return (this.parseBinaryExpression(left));
    }
    if (this.isUnaryPostfixOperator(this.current)) {
      return (this.parseUnaryPostfixExpression(left));
    }
    if (this.peek(PP_LPAREN)) {
      return (this.parseCallExpression(left));
    }
    if (this.peek(PP_DOT)) {
      return (this.parseMemberExpression(left));
    }
    if (this.peek(PP_LBRACK)) {
      return (this.parseComputedMemberExpression(left));
    }
    return (left);
  }

  parsePrefix() {
    if (this.isLiteral(this.current)) {
      return (this.parseLiteral());
    }
    if (this.peek(PP_LBRACE)) {
      return (this.parseObjectExpression());
    }
    if (this.peek(PP_LBRACK)) {
      return (this.parseArrayExpression());
    }
    if (this.eat(PP_LPAREN)) {
      let node = this.parseExpression();
      this.expect(PP_RPAREN);
      return (node);
    }
    if (this.isUnaryPrefixOperator(this.current)) {
      return (this.parseUnaryPrefixExpression());
    }
    return (this.parseStatement());
  }

  parseExpression() {
    if (this.peek(KK_BREAK)) {
      return (this.parseBreak());
    }
    if (this.peek(KK_CONTINUE)) {
      return (this.parseContinue());
    }
    let node = this.parsePrefix();
    while (true) {
      if (!this.current) break;
      let expr = this.parseInfix(node);
      if (expr == null || expr == node) break;
      node = expr;
    };
    return (node);
  }

  parseLiteral() {
    if (this.peek(TT_STRING)) {
      return (this.parseStringLiteral());
    }
    let current = this.current;
    let node = {
      kind: NN_LITERAL,
      type: current.kind,
      value: current.value
    };
    this.next();
    return (node);
  }

  parseStringLiteral() {
    let current = this.current;
    let node = {
      kind: NN_STRING_LITERAL,
      type: current.kind,
      value: current.value,
      isChar: current.isChar
    };
    this.next();
    return (node);
  }

  expectIdentifier() {
    let current = this.current;
    if (current.kind != TT_IDENTIFIER) {
      __imports.error("Expected " + TT_IDENTIFIER + ":identifier but got " + current.kind + ":" + current.value);
    }
  }

  peek(kind) {
    return (this.current && this.current.kind == kind);
  }

  next() {
    this.pindex++;
    this.current = this.tokens[this.pindex];
  }

  back() {
    this.pindex = this.pindex - 2;
    this.next();
  }

  expect(kind) {
    let current = this.current;
    if (current.kind != kind) {
      __imports.error("Expected " + kind + " but got " + current.kind + " in " + current.line + ":" + current.column);
    } else {
      this.next();
    }
  }

  eat(kind) {
    if (this.peek(kind)) {
      this.next();
      return (true);
    }
    return (false);
  }

};