// Unit tests for plot::PlotDocument — the .plot worksheet model.
// Headless, wx-free, doctest (dev-only).

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "plot/plot_document.h"

using plot::ExprEntry;
using plot::PlotDocument;
using plot::Style;
using plot::ViewRect;

namespace {
ExprEntry Expr(const char* text) {
    ExprEntry e;
    e.text = text;
    return e;
}
}  // namespace

TEST_CASE("new document is empty, clean, and cannot undo") {
    PlotDocument d;
    CHECK(d.expressions().empty());
    CHECK_FALSE(d.dirty());
    CHECK_FALSE(d.can_undo());
    CHECK_FALSE(d.can_redo());
    CHECK(d.view().xmin == doctest::Approx(-10.0));
}

TEST_CASE("AddExpression appends and dirties") {
    PlotDocument d;
    d.AddExpression(Expr("sin(x)"));
    REQUIRE(d.expressions().size() == 1);
    CHECK(d.expressions()[0].text == "sin(x)");
    CHECK(d.dirty());
    CHECK(d.can_undo());
}

TEST_CASE("undo/redo restores expression list exactly") {
    PlotDocument d;
    d.AddExpression(Expr("a"));
    d.AddExpression(Expr("b"));
    REQUIRE(d.expressions().size() == 2);

    d.Undo();
    REQUIRE(d.expressions().size() == 1);
    CHECK(d.expressions()[0].text == "a");
    CHECK(d.can_redo());

    d.Redo();
    REQUIRE(d.expressions().size() == 2);
    CHECK(d.expressions()[1].text == "b");
}

TEST_CASE("a new mutation clears the redo stack") {
    PlotDocument d;
    d.AddExpression(Expr("a"));
    d.AddExpression(Expr("b"));
    d.Undo();
    REQUIRE(d.can_redo());
    d.AddExpression(Expr("c"));   // diverge
    CHECK_FALSE(d.can_redo());
    REQUIRE(d.expressions().size() == 2);
    CHECK(d.expressions()[1].text == "c");
}

TEST_CASE("edit, style, remove, and view are each one undo step") {
    PlotDocument d;
    d.AddExpression(Expr("x"));
    d.EditExpressionText(0, "x*x");
    CHECK(d.expressions()[0].text == "x*x");

    Style s;
    s.color = "#FF0000";
    s.visible = false;
    d.SetExpressionStyle(0, s);
    CHECK(d.expressions()[0].style.color == "#FF0000");
    CHECK_FALSE(d.expressions()[0].style.visible);

    ViewRect v;
    v.xmin = -1;
    v.xmax = 1;
    d.SetView(v);
    CHECK(d.view().xmax == doctest::Approx(1.0));

    // Four mutations after the add → undo four times returns to just "x".
    d.Undo();  // view
    d.Undo();  // style
    d.Undo();  // edit
    CHECK(d.expressions()[0].text == "x");
    CHECK(d.expressions()[0].style.color == "#4C6EF5");
    CHECK(d.view().xmax == doctest::Approx(10.0));
}

TEST_CASE("out-of-range mutations are no-ops (no undo step, no dirty)") {
    PlotDocument d;
    d.RemoveExpression(5);
    d.EditExpressionText(0, "nope");
    d.SetExpressionStyle(3, Style{});
    CHECK_FALSE(d.dirty());
    CHECK_FALSE(d.can_undo());
    CHECK(d.expressions().empty());
}

TEST_CASE("MarkSaved clears dirty until the next mutation") {
    PlotDocument d;
    d.AddExpression(Expr("x"));
    d.MarkSaved();
    CHECK_FALSE(d.dirty());
    d.SetView(ViewRect{});
    CHECK(d.dirty());
}

TEST_CASE("JSON round-trip preserves view and expressions") {
    PlotDocument d;
    ViewRect v;
    v.xmin = -3.5;
    v.xmax = 7.25;
    v.ymin = -2.0;
    v.ymax = 2.0;
    v.grid = false;
    d.SetView(v);
    Style s;
    s.color = "#12AB34";
    s.width = 3.5;
    s.visible = false;
    ExprEntry e;
    e.text = "sin(x)/x";
    e.style = s;
    d.AddExpression(e);
    d.AddExpression(Expr("cos(x)"));

    std::string json = d.ToJson();
    auto loaded = PlotDocument::FromJson(json);
    REQUIRE(loaded.has_value());
    CHECK_FALSE(loaded->dirty());
    CHECK_FALSE(loaded->can_undo());

    CHECK(loaded->view().xmin == doctest::Approx(-3.5));
    CHECK(loaded->view().xmax == doctest::Approx(7.25));
    CHECK_FALSE(loaded->view().grid);
    REQUIRE(loaded->expressions().size() == 2);
    CHECK(loaded->expressions()[0].text == "sin(x)/x");
    CHECK(loaded->expressions()[0].style.color == "#12AB34");
    CHECK(loaded->expressions()[0].style.width == doctest::Approx(3.5));
    CHECK_FALSE(loaded->expressions()[0].style.visible);
    CHECK(loaded->expressions()[1].text == "cos(x)");
}

TEST_CASE("text with quotes/backslashes survives the JSON round-trip") {
    PlotDocument d;
    ExprEntry e;
    e.text = "a\"b\\c";  // pathological, but must not corrupt the file
    d.AddExpression(e);
    auto loaded = PlotDocument::FromJson(d.ToJson());
    REQUIRE(loaded.has_value());
    CHECK(loaded->expressions()[0].text == "a\"b\\c");
}

TEST_CASE("malformed or unsupported JSON is rejected, never crashes") {
    CHECK_FALSE(PlotDocument::FromJson("").has_value());
    CHECK_FALSE(PlotDocument::FromJson("not json").has_value());
    CHECK_FALSE(PlotDocument::FromJson("{").has_value());              // truncated
    CHECK_FALSE(PlotDocument::FromJson("[]").has_value());             // not an object
    CHECK_FALSE(PlotDocument::FromJson("{} garbage").has_value());     // trailing junk
    CHECK_FALSE(PlotDocument::FromJson("{\"version\":2}").has_value()); // future version
    CHECK_FALSE(PlotDocument::FromJson("{\"view\":5}").has_value());    // wrong type
    CHECK_FALSE(PlotDocument::FromJson("{\"expressions\":{}}").has_value());  // not array
}

TEST_CASE("missing optional fields take defaults") {
    // A minimal but valid document: empty object.
    auto d = PlotDocument::FromJson("{}");
    REQUIRE(d.has_value());
    CHECK(d->view().xmin == doctest::Approx(-10.0));
    CHECK(d->view().grid);
    CHECK(d->expressions().empty());
    // An expression missing its style fields defaults them.
    auto d2 = PlotDocument::FromJson("{\"expressions\":[{\"text\":\"x\"}]}");
    REQUIRE(d2.has_value());
    REQUIRE(d2->expressions().size() == 1);
    CHECK(d2->expressions()[0].style.color == "#4C6EF5");
    CHECK(d2->expressions()[0].style.width == doctest::Approx(2.0));
    CHECK(d2->expressions()[0].style.visible);
}
