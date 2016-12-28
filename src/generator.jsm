let out = "";
function write(str) {
  out = out + str;
};

function generate(node) {
  generateBody(node.body);
  return (out);
};

function generateBody(body) {
  let ii = 0;
  while (ii < body.length) {
    generateNode(body[ii]);
    ii++;
    write(";");
  };
};

function generateArguments(args) {
  write("(");
  let ii = 0;
  while (ii < args.length) {
    write(args[ii].value);
    if (ii + 1 < args.length) {
      write(", ");
    }
    ii++;
  };
  write(")");
};

function generateNodesOfBody(body, kind) {
  let ii = 0;
  while (ii < body.length) {
    if (body[ii].kind == kind) {
      generateNode(body[ii]);
      write(";");
    }
    ii++;
  };
};

function generateNode(node) {
  let kind = node.kind;
  if (kind == NN_CLASS_PROPERTY) {
    write("this.");
    write(node.id);
    write(" = ");
    generateNode(node.init);
  }
  else if (kind == NN_CLASS_METHOD || kind == NN_CLASS_CONSTRUCTOR) {
    write(node.context.parent.node.id);
    write(".prototype.");
    write(node.id);
    write(" = ");
    generateNode(node.init);
  }
  else if (kind == NN_FUNCTION) {
    write("function ");
    if (node.id) write(node.id);
    generateArguments(node.parameter);
    write(" { ");
    generateBody(node.body);
    write(" } ");
  }
  else if (kind == NN_CLASS) {
    write("let ");
    write(node.id);
    write(" = ");
    write("(function () { ");
    write("function ");
    write(node.id);
    write("() { ");
    generateNodesOfBody(node.body, NN_CLASS_PROPERTY);
    write(" }; ");
    generateNodesOfBody(node.body, NN_CLASS_METHOD);
    write("return (");
    write(node.id);
    write(");");
    write(" })() ");
  }
  else if (kind == NN_LET) {
    write("let ");
    write(node.id);
    write(" = ");
    generateNode(node.init);
  }
  else if (kind == NN_CONST) {
    write("const ");
    write(node.id);
    write(" = ");
    generateNode(node.init);
  }
  else if (kind == NN_EXPORT) {
    if (node.node.kind == NN_FUNCTION) {
      generateNode(node.node);
      write("module.exports.");
      write(node.node.id);
      write(" = ");
      write(node.node.id);
    }
    else if (node.node.kind == NN_LET || node.node.kind == NN_CONST) {
      write("module.exports.");
      write(node.node.id);
      write(" = ");
      generateNode(node.node.init);
    }
    else if (node.node.kind == NN_LITERAL) {
      write("module.exports.");
      write(node.node.value);
      write(" = ");
      generateNode(node.node);
    }
    else {
      __imports.error("Cannot export " + node.node.kind);
    }
  }
  else if (kind == NN_IF) {
    if (node.condition) {
      write("if (");
      generateNode(node.condition);
      write(")");
    }
    write(" { ");
    generateBody(node.consequent);
    write(" } ");
    if (node.alternate) {
      write("else ");
      generateNode(node.alternate);
    }
  }
  else if (kind == NN_RETURN) {
    write("return (");
    generateNode(node.argument);
    write(")");
  }
  else if (kind == NN_WHILE) {
    write("while ");
    write("(");
    generateNode(node.condition);
    write(")");
    write(" {");
    generateBody(node.body);
    write(" } ");
  }
  else if (kind == NN_BREAK) {
    write("break");
    write("");
  }
  else if (kind == NN_CONTINUE) {
    write("continue");
    write("");
  }
  else if (kind == NN_CALL_EXPRESSION) {
    generateNode(node.callee);
    write("(");
    let ii = 0;
    while (ii < node.parameter.length) {
      generateNode(node.parameter[ii]);
      if (ii + 1 < node.parameter.length) {
        write(", ");
      }
      ii++;
    };
    write(")");
  }
  else if (kind == NN_BINARY_EXPRESSION) {
    generateNode(node.left);
    if (node.operator == "==") {
      write(" === ");
    }
    else if (node.operator == "!=") {
      write(" !== ");
    }
    else {
      write(node.operator);
    }
    generateNode(node.right);
  }
  else if (kind == NN_MEMBER_EXPRESSION) {
    generateNode(node.parent);
    write(".");
    generateNode(node.member);
  }
  else if (kind == NN_COMPUTED_MEMBER_EXPRESSION) {
    generateNode(node.parent);
    write("[");
    generateNode(node.member);
    write("]");
  }
  else if (kind == NN_UNARY_PREFIX_EXPRESSION) {
    write(node.operator);
    if (node.operator == "new") write(" ");
    generateNode(node.value);
  }
  else if (kind == NN_UNARY_POSTFIX_EXPRESSION) {
    generateNode(node.value);
    write(node.operator);
  }
  else if (kind == NN_OBJECT_EXPRESSION) {
    write("{");
    let ii = 0;
    while (ii < node.properties.length) {
      let property = node.properties[ii];
      generateNode(property.id);
      write(": ");
      generateNode(property.value);
      if (ii + 1 < node.properties.length) {
        write(", ");
      }
      ii++;
    };
    write(" }");
  }
  else if (kind == NN_ARRAY_EXPRESSION) {
    write("[");
    let ii = 0;
    while (ii < node.elements.length) {
      let element = node.elements[ii];
      generateNode(element.value);
      if (ii + 1 < node.elements.length) {
        write(", ");
      }
      ii++;
    };
    write("]");
  }
  else if (kind == NN_LITERAL) {
    write(node.value);
  }
  else if (kind == NN_STRING_LITERAL) {
    let isChar = node.isChar;
    if (isChar) write('"');
    else write("'");
    write(node.value);
    if (isChar) write('"');
    else write("'");
  }
  else {
    __imports.error("Unknown node kind " + node.kind + "!");
  }
};