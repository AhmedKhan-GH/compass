// Unit tests for plot::Expression — the Plot Workbench expression parser/evaluator.
// Headless, wx-free. Built with doctest (dev-only, MIT).
//
// Build + run (from worktree root):
//   clang++ -std=c++20 -I third_party/doctest -I src \
//       tests/plot/test_expression.cpp src/plot/expression.cpp -o /tmp/test_expr \
//       && /tmp/test_expr

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <cmath>
#include <string>

#include "plot/expression.h"

using plot::Expression;

namespace {

// Approx float comparison for finite values.
bool close(double a, double b, double eps = 1e-9) {
    return std::abs(a - b) <= eps * (1.0 + std::abs(b));
}

// Convenience: compile and require success, then eval at x.
double eval(const std::string& text, double x = 0.0) {
    Expression e = Expression::Compile(text);
    REQUIRE_FALSE(e.has_error());
    return e.Eval(x);
}

}  // namespace

TEST_CASE("numbers, variable, constants") {
    CHECK(close(eval("42"), 42.0));
    CHECK(close(eval(".5"), 0.5));
    CHECK(close(eval("2."), 2.0));
    CHECK(close(eval("1e3"), 1000.0));
    CHECK(close(eval("1.5e-2"), 0.015));
    CHECK(close(eval("x", 7.0), 7.0));
    CHECK(close(eval("pi"), M_PI));
    CHECK(close(eval("e"), M_E));
}

TEST_CASE("functions against known values") {
    CHECK(close(eval("sin(0)"), 0.0));
    CHECK(close(eval("cos(0)"), 1.0));
    CHECK(close(eval("tan(0)"), 0.0));
    CHECK(close(eval("asin(1)"), M_PI / 2));
    CHECK(close(eval("acos(1)"), 0.0));
    CHECK(close(eval("atan(1)"), M_PI / 4));
    CHECK(close(eval("exp(0)"), 1.0));
    CHECK(close(eval("log(e)"), 1.0));       // natural log
    CHECK(close(eval("log10(1000)"), 3.0));
    CHECK(close(eval("sqrt(4)"), 2.0));
    CHECK(close(eval("abs(-3)"), 3.0));
    CHECK(close(eval("floor(2.7)"), 2.0));
    CHECK(close(eval("ceil(2.1)"), 3.0));
}

TEST_CASE("function of x") {
    CHECK(close(eval("sin(x)", M_PI / 2), 1.0));
    CHECK(close(eval("sqrt(x)", 9.0), 3.0));
}

TEST_CASE("precedence and associativity") {
    CHECK(close(eval("2+3*4"), 14.0));
    CHECK(close(eval("2*3+4"), 10.0));
    CHECK(close(eval("2^3^2"), 512.0));   // right-assoc: 2^(3^2)=2^9
    CHECK(close(eval("-2^2"), -4.0));     // ^ binds tighter than unary minus
    CHECK(close(eval("(2+3)*4"), 20.0));
    CHECK(close(eval("2-3-4"), -5.0));    // left-assoc
    CHECK(close(eval("100/10/2"), 5.0));  // left-assoc
    CHECK(close(eval("2^-1"), 0.5));      // unary minus as ^ RHS
}

TEST_CASE("unary minus, nested parens, whitespace") {
    CHECK(close(eval("-5"), -5.0));
    CHECK(close(eval("--5"), 5.0));
    CHECK(close(eval("-(3+4)"), -7.0));
    CHECK(close(eval("((((1))))"), 1.0));
    CHECK(close(eval("  2  +  3  "), 5.0));
    CHECK(close(eval("\t2*\n3"), 6.0));
    CHECK(close(eval("sin( x )", 0.0), 0.0));
}

TEST_CASE("larger composite expression") {
    // sin(x)/x at x=1
    CHECK(close(eval("sin(x)/x", 1.0), std::sin(1.0)));
    CHECK(close(eval("2*x^2 + 3*x - 1", 2.0), 2 * 4 + 3 * 2 - 1));
}

TEST_CASE("domain errors return non-finite without throwing") {
    CHECK(std::isnan(eval("sqrt(-1)")));
    CHECK(std::isnan(eval("log(-1)")));
    CHECK(std::isnan(eval("asin(2)")));
    // log(0) is -inf
    CHECK(std::isinf(eval("log(0)")));
    CHECK(eval("log(0)") < 0.0);
    // 1/0 -> +inf (IEEE), never a throw
    double r = eval("1/0");
    CHECK((std::isinf(r) || std::isnan(r)));
    // Overflow -> +inf
    CHECK(std::isinf(eval("exp(1000)")));
}

TEST_CASE("division by zero as a gap, evaluated per-x") {
    Expression e = Expression::Compile("1/x");
    REQUIRE_FALSE(e.has_error());
    CHECK(close(e.Eval(2.0), 0.5));
    CHECK(std::isinf(e.Eval(0.0)));  // gap marker; never throws
}

TEST_CASE("parse error: empty input") {
    Expression e = Expression::Compile("");
    CHECK(e.has_error());
    CHECK(e.error().column == 0);
    CHECK(std::isnan(e.Eval(1.0)));  // eval on error state -> NaN, no throw
}

TEST_CASE("parse error: whitespace-only input") {
    Expression e = Expression::Compile("   ");
    CHECK(e.has_error());
}

TEST_CASE("parse error: unbalanced parens") {
    Expression e = Expression::Compile("(1+2");
    CHECK(e.has_error());
    // Missing ')' reported at end of input (column 4, 0-based).
    CHECK(e.error().column == 4);

    Expression e2 = Expression::Compile("1+2)");
    CHECK(e2.has_error());
    CHECK(e2.error().column == 3);  // unexpected ')' at column 3
    CHECK(e2.error().message.find(')') != std::string::npos);
}

TEST_CASE("parse error: trailing operator") {
    Expression e = Expression::Compile("2+");
    CHECK(e.has_error());
    CHECK(e.error().column == 2);  // expected an operand at end
}

TEST_CASE("parse error: leading binary operator") {
    Expression e = Expression::Compile("*3");
    CHECK(e.has_error());
    CHECK(e.error().column == 0);
}

TEST_CASE("parse error: implicit multiplication '2x' suggests '*'") {
    Expression e = Expression::Compile("2x");
    CHECK(e.has_error());
    CHECK(e.error().column == 1);  // 'x' starts at column 1
    CHECK(e.error().message.find('*') != std::string::npos);

    Expression e2 = Expression::Compile("2 x");
    CHECK(e2.has_error());
    CHECK(e2.error().message.find('*') != std::string::npos);

    Expression e3 = Expression::Compile("2pi");
    CHECK(e3.has_error());
    CHECK(e3.error().message.find('*') != std::string::npos);

    // Parenthesized implicit mult: 2(3)
    Expression e4 = Expression::Compile("2(3)");
    CHECK(e4.has_error());
    CHECK(e4.error().message.find('*') != std::string::npos);
}

TEST_CASE("parse error: unknown identifier / function") {
    Expression e = Expression::Compile("foo");
    CHECK(e.has_error());
    CHECK(e.error().column == 0);

    Expression e2 = Expression::Compile("bar(1)");
    CHECK(e2.has_error());
    CHECK(e2.error().column == 0);

    Expression e3 = Expression::Compile("y");  // 'x' is the only variable
    CHECK(e3.has_error());
}

TEST_CASE("parse error: function without parens / wrong arity") {
    Expression e = Expression::Compile("sin");
    CHECK(e.has_error());  // function name used as a value

    Expression e2 = Expression::Compile("sin()");
    CHECK(e2.has_error());  // no argument
}

TEST_CASE("parse error: garbage character") {
    Expression e = Expression::Compile("1 @ 2");
    CHECK(e.has_error());
    CHECK(e.error().column == 2);
}

TEST_CASE("parse error: trailing junk after complete expression") {
    Expression e = Expression::Compile("1 2");
    CHECK(e.has_error());  // no implicit anything
}

TEST_CASE("error state is stable and non-throwing") {
    Expression e = Expression::Compile("(((");
    REQUIRE(e.has_error());
    // Repeated eval is safe.
    CHECK(std::isnan(e.Eval(0.0)));
    CHECK(std::isnan(e.Eval(100.0)));
    // error() accessor stable.
    CHECK(e.error().column >= 0);
    CHECK_FALSE(e.error().message.empty());
}

TEST_CASE("move semantics preserve behavior") {
    Expression a = Expression::Compile("x*x");
    REQUIRE_FALSE(a.has_error());
    Expression b = std::move(a);
    CHECK(close(b.Eval(3.0), 9.0));
}

TEST_CASE("overflowing numeric literal does not throw") {
    // std::stod throws std::out_of_range on overflow; Compile must not propagate
    // it (spec §3: overflow -> +/-inf, never an exception).
    Expression e = Expression::Compile("1e999999");
    REQUIRE_FALSE(e.has_error());        // it is a valid (if infinite) literal
    CHECK(std::isinf(e.Eval(0.0)));      // degrades to +inf, not a crash
}

TEST_CASE("large-but-finite literal still parses finite") {
    Expression e = Expression::Compile("1e300");
    REQUIRE_FALSE(e.has_error());
    CHECK(std::isfinite(e.Eval(0.0)));
    CHECK(e.Eval(0.0) == doctest::Approx(1e300));
}
