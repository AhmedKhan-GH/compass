// Compass — Plot Workbench (Instrument #1)
// PlotDocument: the .plot worksheet — expressions + view rect + undo/redo + JSON.
//
// Pure C++, headless, wx-free. Undo is memento-based (each mutation snapshots the
// document state); the mutation methods ARE the commands from the design spec §5.
// A drag/wheel gesture in the UI coalesces into a single SetView call, so each
// method invocation is exactly one undo step.

#ifndef COMPASS_PLOT_PLOT_DOCUMENT_H
#define COMPASS_PLOT_PLOT_DOCUMENT_H

#include <cstddef>
#include <optional>
#include <string>
#include <vector>

namespace plot {

// Per-curve styling. Defaults match the spec's example worksheet.
struct Style {
    std::string color = "#4C6EF5";  // "#RRGGBB"
    double width = 2.0;
    bool visible = true;
};

// One expression row: the source text plus its styling. The text is stored
// verbatim even if it fails to parse (a saved worksheet never loses user input).
struct ExprEntry {
    std::string text;
    Style style;
};

// The visible plot rectangle plus grid toggle.
struct ViewRect {
    double xmin = -10.0;
    double xmax = 10.0;
    double ymin = -5.0;
    double ymax = 5.0;
    bool grid = true;
};

class PlotDocument {
public:
    // --- state ---
    const std::vector<ExprEntry>& expressions() const { return cur_.expressions; }
    const ViewRect& view() const { return cur_.view; }
    bool dirty() const { return dirty_; }
    void MarkSaved() { dirty_ = false; }  // call after a successful save

    // --- mutations (each is exactly one undo step; each sets dirty) ---
    void AddExpression(const ExprEntry& e);
    void RemoveExpression(std::size_t index);                 // out-of-range: no-op
    void EditExpressionText(std::size_t index, const std::string& text);  // no-op if oob
    void SetExpressionStyle(std::size_t index, const Style& s);           // no-op if oob
    void SetView(const ViewRect& v);

    // --- undo/redo ---
    bool can_undo() const { return !undo_.empty(); }
    bool can_redo() const { return !redo_.empty(); }
    void Undo();
    void Redo();

    // --- persistence (.plot JSON, spec §4) ---
    std::string ToJson() const;
    // Parse a .plot document. Returns nullopt on malformed JSON, wrong types, or
    // an unsupported version (> 1). Unknown fields are ignored; missing optional
    // fields take their defaults. The returned document is clean (dirty()==false)
    // with an empty undo history.
    static std::optional<PlotDocument> FromJson(const std::string& json);

private:
    struct State {
        std::vector<ExprEntry> expressions;
        ViewRect view;
    };
    void Commit(State next);  // push undo, adopt next, clear redo, mark dirty

    State cur_;
    std::vector<State> undo_;
    std::vector<State> redo_;
    bool dirty_ = false;
};

}  // namespace plot

#endif  // COMPASS_PLOT_PLOT_DOCUMENT_H
