// Compass — Plot Workbench (Instrument #1)
// Expression: single-variable math expression parser/evaluator.
//
// Pure C++, headless, wx-free. Compile once, Eval(x) many times.
// Domain errors (sqrt(-1), log(0), overflow) yield NaN/±inf and NEVER throw.
// Parse errors are reported via has_error()/error() with a 0-based column.
//
// Grammar (recursive descent):
//   expr    := term  (('+' | '-') term)*
//   term    := unary (('*' | '/') unary)*
//   unary   := '-' unary | power
//   power   := primary ('^' unary)?        // right-assoc; RHS is unary so 2^-1 works
//   primary := number | 'x' | 'pi' | 'e'
//            | name '(' expr ')'           // function call
//            | '(' expr ')'
//
// Note precedence: '^' binds tighter than unary minus, so -2^2 == -4.

#ifndef COMPASS_PLOT_EXPRESSION_H
#define COMPASS_PLOT_EXPRESSION_H

#include <memory>
#include <string>

namespace plot {

// A parse failure: 0-based column into the source text plus a human message.
struct ParseError {
    int column = 0;
    std::string message;
};

// Opaque AST node (defined in the .cpp).
struct Node;

class Expression {
public:
    // Compile source text into an evaluable expression.
    // On success: has_error() == false.
    // On failure: has_error() == true and error() describes the problem.
    static Expression Compile(const std::string& text);

    bool has_error() const { return has_error_; }
    const ParseError& error() const { return error_; }  // valid only if has_error()

    // Evaluate at the given x. Returns NaN/±inf on domain errors; never throws.
    // If has_error(), returns NaN.
    double Eval(double x) const;

    // Movable, copyable-disabled (owns a unique AST). Default-constructible as an
    // error state so it can live in containers.
    Expression();
    Expression(Expression&&) noexcept;
    Expression& operator=(Expression&&) noexcept;
    Expression(const Expression&) = delete;
    Expression& operator=(const Expression&) = delete;
    ~Expression();

private:
    std::shared_ptr<const Node> root_;  // shared so the type stays simple to move
    bool has_error_ = true;
    ParseError error_{0, "empty expression"};
};

}  // namespace plot

#endif  // COMPASS_PLOT_EXPRESSION_H
