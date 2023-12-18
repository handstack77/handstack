export let NodeType;

(function (NodeType) {
  NodeType["statement"] = "statement";
  NodeType["clause"] = "clause";
  NodeType["set_operation"] = "set_operation";
  NodeType["function_call"] = "function_call";
  NodeType["array_subscript"] = "array_subscript";
  NodeType["property_access"] = "property_access";
  NodeType["parenthesis"] = "parenthesis";
  NodeType["between_predicate"] = "between_predicate";
  NodeType["case_expression"] = "case_expression";
  NodeType["case_when"] = "case_when";
  NodeType["case_else"] = "case_else";
  NodeType["limit_clause"] = "limit_clause";
  NodeType["all_columns_asterisk"] = "all_columns_asterisk";
  NodeType["literal"] = "literal";
  NodeType["identifier"] = "identifier";
  NodeType["keyword"] = "keyword";
  NodeType["parameter"] = "parameter";
  NodeType["operator"] = "operator";
  NodeType["comma"] = "comma";
  NodeType["line_comment"] = "line_comment";
  NodeType["block_comment"] = "block_comment";
})(NodeType || (NodeType = {}));
//# sourceMappingURL=ast.js.map