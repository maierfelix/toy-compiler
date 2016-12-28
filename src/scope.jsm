class Scope {
  node: null;
  parent: null;
  symbols: {};
  isGlobal: false;
  resolve(id) {
    if (this.symbols[id]) {
      return (this.symbols[id]);
    } else {
      if (this.parent) {
        return (this.parent.resolve(id));
      }
    }
    return (null);
  };
  register(id, node) {
    this.symbols[id] = node;
  };
};