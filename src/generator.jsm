class Generator {
  out: "";
  write(str) {
    this.out = this.out + str;
  }

  generate(node) {
    this.generateBody(node.body);
    return (this.out);
  }

  generateBody(body) {
    let ii = 0;
    while (ii < body.length) {
      this.generateNode(body[ii]);
      ii++;
      this.write(";");
    };
  }

  generateArguments(args) {
    this.write("(");
    let ii = 0;
    while (ii < args.length) {
      this.write(args[ii].value);
      if (ii + 1 < args.length) {
        this.write(", ");
      }
      ii++;
    };
    this.write(")");
  }

  generateNodesOfBody(body, kind) {
    let ii = 0;
    while (ii < body.length) {
      if (body[ii].kind == kind) {
        this.generateNode(body[ii]);
        this.write(";");
      }
      ii++;
    };
  }

  generateNode(node) {
    let kind = node.kind;
    if (kind == NN_CLASS_PROPERTY) {
      this.write("this.");
      this.write(node.id);
      this.write(" = ");
      this.generateNode(node.init);
    }
    else if (kind == NN_CLASS_METHOD || kind == NN_CLASS_CONSTRUCTOR) {
      this.write(node.context.parent.node.id);
      this.write(".prototype.");
      this.write(node.id);
      this.write(" = ");
      this.generateNode(node.init);
    }
    else if (kind == NN_FUNCTION) {
      this.write("function ");
      if (node.id) this.write(node.id);
      this.generateArguments(node.parameter);
      this.write(" { ");
      this.generateBody(node.body);
      this.write(" } ");
    }
    else if (kind == NN_CLASS) {
      this.write("let ");
      this.write(node.id);
      this.write(" = ");
      this.write("(function () { ");
      this.write("function ");
      this.write(node.id);
      if (node.ctor != null) {
        this.generateArguments(node.ctor.init.parameter);
        this.write(" { ");
        this.generateBody(node.ctor.init.body);
        this.write(" } ");
      } else {
        this.write("() { ");
        this.generateNodesOfBody(node.body, NN_CLASS_PROPERTY);
        this.write(" }; ");
      }
      this.generateNodesOfBody(node.body, NN_CLASS_METHOD);
      this.write("return (");
      this.write(node.id);
      this.write(");");
      this.write(" })() ");
    }
    else if (kind == NN_LET) {
      this.write("let ");
      this.write(node.id);
      this.write(" = ");
      this.generateNode(node.init);
    }
    else if (kind == NN_CONST) {
      this.write("const ");
      this.write(node.id);
      this.write(" = ");
      this.generateNode(node.init);
    }
    else if (kind == NN_EXPORT) {
      if (node.node.kind == NN_FUNCTION) {
        this.generateNode(node.node);
        this.write("module.exports.");
        this.write(node.node.id);
        this.write(" = ");
        this.write(node.node.id);
      }
      else if (node.node.kind == NN_LET || node.node.kind == NN_CONST) {
        this.write("module.exports.");
        this.write(node.node.id);
        this.write(" = ");
        this.generateNode(node.node.init);
      }
      else if (node.node.kind == NN_LITERAL) {
        this.write("module.exports.");
        this.write(node.node.value);
        this.write(" = ");
        this.generateNode(node.node);
      }
      else {
        __imports.error("Cannot export " + node.node.kind);
      }
    }
    else if (kind == NN_IF) {
      if (node.condition) {
        this.write("if (");
        this.generateNode(node.condition);
        this.write(")");
      }
      this.write(" { ");
      this.generateBody(node.consequent);
      this.write(" } ");
      if (node.alternate) {
        this.write("else ");
        this.generateNode(node.alternate);
      }
    }
    else if (kind == NN_RETURN) {
      this.write("return (");
      this.generateNode(node.argument);
      this.write(")");
    }
    else if (kind == NN_WHILE) {
      this.write("while ");
      this.write("(");
      this.generateNode(node.condition);
      this.write(")");
      this.write(" {");
      this.generateBody(node.body);
      this.write(" } ");
    }
    else if (kind == NN_BREAK) {
      this.write("break");
      this.write("");
    }
    else if (kind == NN_CONTINUE) {
      this.write("continue");
      this.write("");
    }
    else if (kind == NN_CALL_EXPRESSION) {
      this.generateNode(node.callee);
      this.write("(");
      let ii = 0;
      while (ii < node.parameter.length) {
        this.generateNode(node.parameter[ii]);
        if (ii + 1 < node.parameter.length) {
          this.write(", ");
        }
        ii++;
      };
      this.write(")");
    }
    else if (kind == NN_BINARY_EXPRESSION) {
      this.generateNode(node.left);
      if (node.operator == "==") {
        this.write(" === ");
      }
      else if (node.operator == "!=") {
        this.write(" !== ");
      }
      else {
        this.write(node.operator);
      }
      this.generateNode(node.right);
    }
    else if (kind == NN_MEMBER_EXPRESSION) {
      this.generateNode(node.parent);
      this.write(".");
      this.generateNode(node.member);
    }
    else if (kind == NN_COMPUTED_MEMBER_EXPRESSION) {
      this.generateNode(node.parent);
      this.write("[");
      this.generateNode(node.member);
      this.write("]");
    }
    else if (kind == NN_UNARY_PREFIX_EXPRESSION) {
      this.write(node.operator);
      if (node.operator == "new") this.write(" ");
      this.generateNode(node.value);
    }
    else if (kind == NN_UNARY_POSTFIX_EXPRESSION) {
      this.generateNode(node.value);
      this.write(node.operator);
    }
    else if (kind == NN_OBJECT_EXPRESSION) {
      this.write("{");
      let ii = 0;
      while (ii < node.properties.length) {
        let property = node.properties[ii];
        this.generateNode(property.id);
        this.write(": ");
        this.generateNode(property.value);
        if (ii + 1 < node.properties.length) {
          this.write(", ");
        }
        ii++;
      };
      this.write(" }");
    }
    else if (kind == NN_ARRAY_EXPRESSION) {
      this.write("[");
      let ii = 0;
      while (ii < node.elements.length) {
        let element = node.elements[ii];
        this.generateNode(element.value);
        if (ii + 1 < node.elements.length) {
          this.write(", ");
        }
        ii++;
      };
      this.write("]");
    }
    else if (kind == NN_LITERAL) {
      this.write(node.value);
    }
    else if (kind == NN_STRING_LITERAL) {
      let isChar = node.isChar;
      if (isChar) this.write('"');
      else this.write("'");
      this.write(node.value);
      if (isChar) this.write('"');
      else this.write("'");
    }
    else if (kind == NN_INCLUDE) {
      this.write(node.code);
    }
    else {
      __imports.error("Unknown node kind " + node.kind + "!");
    }
  }

}