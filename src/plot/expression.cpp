// Compass — Plot Workbench (Instrument #1)
// Expression parser/evaluator implementation.
//
// Pipeline: tokenize -> recursive-descent parse -> AST; Eval(x) walks the tree.
// Domain errors (sqrt(-1), log(0), overflow) rely on <cmath>/IEEE producing
// NaN/±inf rather than throwing — Eval never throws.

#include "plot/expression.h"

#include <cctype>
#include <cmath>
#include <cstdlib>
#include <string>
#include <vector>

namespace plot {
namespace {

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

enum class FuncId {
    Sin, Cos, Tan, Asin, Acos, Atan, Exp, Log, Log10, Sqrt, Abs, Floor, Ceil
};

// Returns true and sets `out` if `name` is a known function.
bool LookupFunction(const std::string& name, FuncId& out) {
    if (name == "sin")   { out = FuncId::Sin;   return true; }
    if (name == "cos")   { out = FuncId::Cos;   return true; }
    if (name == "tan")   { out = FuncId::Tan;   return true; }
    if (name == "asin")  { out = FuncId::Asin;  return true; }
    if (name == "acos")  { out = FuncId::Acos;  return true; }
    if (name == "atan")  { out = FuncId::Atan;  return true; }
    if (name == "exp")   { out = FuncId::Exp;   return true; }
    if (name == "log")   { out = FuncId::Log;   return true; }
    if (name == "log10") { out = FuncId::Log10; return true; }
    if (name == "sqrt")  { out = FuncId::Sqrt;  return true; }
    if (name == "abs")   { out = FuncId::Abs;   return true; }
    if (name == "floor") { out = FuncId::Floor; return true; }
    if (name == "ceil")  { out = FuncId::Ceil;  return true; }
    return false;
}

double ApplyFunction(FuncId f, double v) {
    switch (f) {
        case FuncId::Sin:   return std::sin(v);
        case FuncId::Cos:   return std::cos(v);
        case FuncId::Tan:   return std::tan(v);
        case FuncId::Asin:  return std::asin(v);
        case FuncId::Acos:  return std::acos(v);
        case FuncId::Atan:  return std::atan(v);
        case FuncId::Exp:   return std::exp(v);
        case FuncId::Log:   return std::log(v);
        case FuncId::Log10: return std::log10(v);
        case FuncId::Sqrt:  return std::sqrt(v);
        case FuncId::Abs:   return std::fabs(v);
        case FuncId::Floor: return std::floor(v);
        case FuncId::Ceil:  return std::ceil(v);
    }
    return std::nan("");
}

}  // namespace

// Node lives in the plot namespace so the forward decl in the header matches.
struct Node {
    enum class Kind { Num, Var, Neg, Add, Sub, Mul, Div, Pow, Func } kind;
    double value = 0.0;                 // Num
    FuncId func = FuncId::Sin;          // Func
    std::shared_ptr<const Node> a;      // unary operand / binary lhs / func arg
    std::shared_ptr<const Node> b;      // binary rhs
};

namespace {

using NodePtr = std::shared_ptr<const Node>;

NodePtr MakeNum(double v) {
    auto n = std::make_shared<Node>();
    n->kind = Node::Kind::Num;
    n->value = v;
    return n;
}
NodePtr MakeVar() {
    auto n = std::make_shared<Node>();
    n->kind = Node::Kind::Var;
    return n;
}
NodePtr MakeUnary(Node::Kind k, NodePtr a) {
    auto n = std::make_shared<Node>();
    n->kind = k;
    n->a = std::move(a);
    return n;
}
NodePtr MakeBinary(Node::Kind k, NodePtr a, NodePtr b) {
    auto n = std::make_shared<Node>();
    n->kind = k;
    n->a = std::move(a);
    n->b = std::move(b);
    return n;
}
NodePtr MakeFunc(FuncId f, NodePtr arg) {
    auto n = std::make_shared<Node>();
    n->kind = Node::Kind::Func;
    n->func = f;
    n->a = std::move(arg);
    return n;
}

double EvalNode(const Node& n, double x) {
    switch (n.kind) {
        case Node::Kind::Num:  return n.value;
        case Node::Kind::Var:  return x;
        case Node::Kind::Neg:  return -EvalNode(*n.a, x);
        case Node::Kind::Add:  return EvalNode(*n.a, x) + EvalNode(*n.b, x);
        case Node::Kind::Sub:  return EvalNode(*n.a, x) - EvalNode(*n.b, x);
        case Node::Kind::Mul:  return EvalNode(*n.a, x) * EvalNode(*n.b, x);
        case Node::Kind::Div:  return EvalNode(*n.a, x) / EvalNode(*n.b, x);
        case Node::Kind::Pow:  return std::pow(EvalNode(*n.a, x), EvalNode(*n.b, x));
        case Node::Kind::Func: return ApplyFunction(n.func, EvalNode(*n.a, x));
    }
    return std::nan("");
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

struct Token {
    enum class Type {
        Num, Ident, Plus, Minus, Star, Slash, Caret, LParen, RParen, End, Invalid
    } type;
    int column = 0;
    double num = 0.0;    // Num
    std::string text;    // Ident, or the offending char for Invalid
};

bool IsIdentStart(char c) { return std::isalpha(static_cast<unsigned char>(c)) != 0; }
bool IsIdentChar(char c) {
    return std::isalnum(static_cast<unsigned char>(c)) != 0;
}
bool IsDigit(char c) { return std::isdigit(static_cast<unsigned char>(c)) != 0; }

// Tokenize the whole string. Always ends with an End token whose column is the
// string length. Unknown characters become Invalid tokens (parser reports them).
std::vector<Token> Tokenize(const std::string& s) {
    std::vector<Token> out;
    const int n = static_cast<int>(s.size());
    int i = 0;
    while (i < n) {
        char c = s[i];
        if (std::isspace(static_cast<unsigned char>(c))) { i++; continue; }

        const int col = i;

        // Number: starts with a digit, or a '.' immediately followed by a digit.
        if (IsDigit(c) || (c == '.' && i + 1 < n && IsDigit(s[i + 1]))) {
            int j = i;
            while (j < n && IsDigit(s[j])) j++;
            if (j < n && s[j] == '.') {
                j++;
                while (j < n && IsDigit(s[j])) j++;
            }
            // Exponent: only consume 'e'/'E' if a valid exponent follows.
            if (j < n && (s[j] == 'e' || s[j] == 'E')) {
                int k = j + 1;
                if (k < n && (s[k] == '+' || s[k] == '-')) k++;
                if (k < n && IsDigit(s[k])) {
                    k++;
                    while (k < n && IsDigit(s[k])) k++;
                    j = k;
                }
            }
            Token t;
            t.type = Token::Type::Num;
            t.column = col;
            // std::strtod (not std::stod) so the parser never throws — spec §3.
            // Overflow yields +/-HUGE_VAL (inf), underflow yields 0; both are the
            // IEEE degradations we want, with no exception to propagate.
            t.num = std::strtod(s.substr(i, j - i).c_str(), nullptr);
            out.push_back(std::move(t));
            i = j;
            continue;
        }

        // Identifier: [A-Za-z][A-Za-z0-9]*
        if (IsIdentStart(c)) {
            int j = i + 1;
            while (j < n && IsIdentChar(s[j])) j++;
            Token t;
            t.type = Token::Type::Ident;
            t.column = col;
            t.text = s.substr(i, j - i);
            out.push_back(std::move(t));
            i = j;
            continue;
        }

        Token t;
        t.column = col;
        switch (c) {
            case '+': t.type = Token::Type::Plus;   break;
            case '-': t.type = Token::Type::Minus;  break;
            case '*': t.type = Token::Type::Star;   break;
            case '/': t.type = Token::Type::Slash;  break;
            case '^': t.type = Token::Type::Caret;  break;
            case '(': t.type = Token::Type::LParen; break;
            case ')': t.type = Token::Type::RParen; break;
            default:
                t.type = Token::Type::Invalid;
                t.text = std::string(1, c);
                break;
        }
        out.push_back(std::move(t));
        i++;
    }

    Token end;
    end.type = Token::Type::End;
    end.column = n;
    out.push_back(std::move(end));
    return out;
}

// Human-readable rendering of a token for error messages.
std::string Describe(const Token& t) {
    switch (t.type) {
        case Token::Type::Num:     return "number";
        case Token::Type::Ident:   return "'" + t.text + "'";
        case Token::Type::Plus:    return "'+'";
        case Token::Type::Minus:   return "'-'";
        case Token::Type::Star:    return "'*'";
        case Token::Type::Slash:   return "'/'";
        case Token::Type::Caret:   return "'^'";
        case Token::Type::LParen:  return "'('";
        case Token::Type::RParen:  return "')'";
        case Token::Type::End:     return "end of input";
        case Token::Type::Invalid: return "'" + t.text + "'";
    }
    return "token";
}

bool CanStartPrimary(const Token& t) {
    return t.type == Token::Type::Num ||
           t.type == Token::Type::Ident ||
           t.type == Token::Type::LParen;
}

// ---------------------------------------------------------------------------
// Parser (recursive descent)
// ---------------------------------------------------------------------------

class Parser {
public:
    explicit Parser(const std::vector<Token>& toks) : toks_(toks) {}

    // Parse a complete expression. On failure, failed() is true and error() set.
    NodePtr Parse() {
        NodePtr root = ParseExpr();
        if (failed_) return nullptr;
        const Token& t = Cur();
        if (t.type != Token::Type::End) {
            // Something is left over after a complete expression.
            if (CanStartPrimary(t)) {
                Fail(t.column,
                     "unexpected " + Describe(t) +
                         "; use '*' for multiplication (e.g. '2*x') at column " +
                         std::to_string(t.column));
            } else {
                Fail(t.column, "unexpected token " + Describe(t) + " at column " +
                                   std::to_string(t.column));
            }
            return nullptr;
        }
        return root;
    }

    bool failed() const { return failed_; }
    const ParseError& error() const { return error_; }

private:
    const Token& Cur() const { return toks_[pos_]; }
    const Token& Peek() const {
        return (pos_ + 1 < toks_.size()) ? toks_[pos_ + 1] : toks_.back();
    }
    void Advance() {
        if (pos_ + 1 < toks_.size()) pos_++;
    }
    void Fail(int column, std::string message) {
        if (!failed_) {
            failed_ = true;
            error_ = ParseError{column, std::move(message)};
        }
    }

    NodePtr ParseExpr() {
        NodePtr left = ParseTerm();
        while (!failed_ && (Cur().type == Token::Type::Plus ||
                            Cur().type == Token::Type::Minus)) {
            Node::Kind k = (Cur().type == Token::Type::Plus) ? Node::Kind::Add
                                                             : Node::Kind::Sub;
            Advance();
            NodePtr right = ParseTerm();
            if (failed_) return nullptr;
            left = MakeBinary(k, std::move(left), std::move(right));
        }
        return left;
    }

    NodePtr ParseTerm() {
        NodePtr left = ParseUnary();
        while (!failed_ && (Cur().type == Token::Type::Star ||
                            Cur().type == Token::Type::Slash)) {
            Node::Kind k = (Cur().type == Token::Type::Star) ? Node::Kind::Mul
                                                             : Node::Kind::Div;
            Advance();
            NodePtr right = ParseUnary();
            if (failed_) return nullptr;
            left = MakeBinary(k, std::move(left), std::move(right));
        }
        return left;
    }

    // Unary minus binds looser than '^' so that -2^2 == -(2^2) == -4.
    NodePtr ParseUnary() {
        if (Cur().type == Token::Type::Minus) {
            Advance();
            NodePtr operand = ParseUnary();
            if (failed_) return nullptr;
            return MakeUnary(Node::Kind::Neg, std::move(operand));
        }
        return ParsePower();
    }

    // Right-associative '^'; RHS is a unary so 2^-1 and 2^3^2 parse correctly.
    NodePtr ParsePower() {
        NodePtr base = ParsePrimary();
        if (failed_) return nullptr;
        if (Cur().type == Token::Type::Caret) {
            Advance();
            NodePtr exp = ParseUnary();
            if (failed_) return nullptr;
            return MakeBinary(Node::Kind::Pow, std::move(base), std::move(exp));
        }
        return base;
    }

    NodePtr ParsePrimary() {
        const Token& t = Cur();
        switch (t.type) {
            case Token::Type::Num: {
                double v = t.num;
                Advance();
                return MakeNum(v);
            }
            case Token::Type::LParen: {
                Advance();
                NodePtr inner = ParseExpr();
                if (failed_) return nullptr;
                if (Cur().type != Token::Type::RParen) {
                    Fail(Cur().column, "expected ')' at column " +
                                           std::to_string(Cur().column));
                    return nullptr;
                }
                Advance();  // consume ')'
                return inner;
            }
            case Token::Type::Ident:
                return ParseIdent();
            default:
                Fail(t.column, "unexpected token " + Describe(t) +
                                   "; expected an expression at column " +
                                   std::to_string(t.column));
                return nullptr;
        }
    }

    NodePtr ParseIdent() {
        const Token& t = Cur();
        const std::string name = t.text;
        const int col = t.column;

        FuncId fid;
        const bool is_func = LookupFunction(name, fid);

        if (Peek().type == Token::Type::LParen) {
            // Function-call syntax `name(...)`.
            if (!is_func) {
                Fail(col, "unknown function '" + name + "' at column " +
                              std::to_string(col));
                return nullptr;
            }
            Advance();  // consume name
            Advance();  // consume '('
            NodePtr arg = ParseExpr();
            if (failed_) return nullptr;
            if (Cur().type != Token::Type::RParen) {
                Fail(Cur().column, "expected ')' to close '" + name +
                                       "(' at column " +
                                       std::to_string(Cur().column));
                return nullptr;
            }
            Advance();  // consume ')'
            return MakeFunc(fid, std::move(arg));
        }

        // Bare identifier: variable or constant.
        Advance();  // consume name
        if (name == "x")  return MakeVar();
        if (name == "pi") return MakeNum(M_PI);
        if (name == "e")  return MakeNum(M_E);
        if (is_func) {
            Fail(col, "expected '(' after function '" + name + "' at column " +
                          std::to_string(col));
            return nullptr;
        }
        Fail(col, "unknown identifier '" + name + "' at column " +
                      std::to_string(col));
        return nullptr;
    }

    const std::vector<Token>& toks_;
    size_t pos_ = 0;
    bool failed_ = false;
    ParseError error_{0, ""};
};

}  // namespace

// ---------------------------------------------------------------------------
// Expression — public surface
// ---------------------------------------------------------------------------

Expression::Expression() = default;
Expression::Expression(Expression&&) noexcept = default;
Expression& Expression::operator=(Expression&&) noexcept = default;
Expression::~Expression() = default;

Expression Expression::Compile(const std::string& text) {
    Expression expr;

    std::vector<Token> tokens = Tokenize(text);

    // Empty (or whitespace-only) input: only an End token remains.
    if (tokens.size() == 1 && tokens.front().type == Token::Type::End) {
        expr.has_error_ = true;
        expr.error_ = ParseError{0, "empty expression"};
        return expr;
    }

    Parser parser(tokens);
    NodePtr root = parser.Parse();
    if (parser.failed() || root == nullptr) {
        expr.has_error_ = true;
        expr.error_ = parser.error();
        return expr;
    }

    expr.root_ = std::move(root);
    expr.has_error_ = false;
    expr.error_ = ParseError{0, ""};
    return expr;
}

double Expression::Eval(double x) const {
    if (has_error_ || !root_) return std::nan("");
    return EvalNode(*root_, x);
}

}  // namespace plot
