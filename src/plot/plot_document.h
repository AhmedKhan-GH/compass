// Compass — Plot Workbench (Instrument #1)
// PlotDocument: the .plot worksheet. Domain state + mutations + JSON; the generic
// undo/dirty/serialize machinery comes from compass::UndoableDocument (libcompass).
// Pure C++, headless, wx-free.

#ifndef COMPASS_PLOT_PLOT_DOCUMENT_H
#define COMPASS_PLOT_PLOT_DOCUMENT_H

#include <cstddef>
#include <optional>
#include <string>
#include <vector>

#include "compass/document.h"

namespace plot {

// Per-curve styling. Defaults match the spec's example worksheet.
struct Style {
    std::string color = "#4C6EF5";  // "#RRGGBB"
    double width = 2.0;
    bool visible = true;
};

// One expression row: source text plus styling. Text is stored verbatim even if
// it fails to parse (a saved worksheet never loses user input).
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

// The document's undoable snapshot: everything that Save persists and Undo restores.
struct PlotState {
    std::vector<ExprEntry> expressions;
    ViewRect view;
};

class PlotDocument : public compass::UndoableDocument<PlotState> {
public:
    // --- state accessors ---
    const std::vector<ExprEntry>& expressions() const { return state().expressions; }
    const ViewRect& view() const { return state().view; }
    bool can_undo() const { return CanUndo(); }  // snake-case app/test aliases
    bool can_redo() const { return CanRedo(); }

    // --- mutations (each is exactly one undo step; each sets dirty) ---
    void AddExpression(const ExprEntry& e);
    void RemoveExpression(std::size_t index);                 // out-of-range: no-op
    void EditExpressionText(std::size_t index, const std::string& text);  // no-op if oob
    void SetExpressionStyle(std::size_t index, const Style& s);           // no-op if oob
    void SetView(const ViewRect& v);

    // --- framework serialize contract (.plot JSON, spec §4) ---
    std::string Serialize() const override;
    bool Deserialize(const std::string& data) override;

    // Compatibility helpers used by the app and tests.
    std::string ToJson() const { return Serialize(); }
    // Parse a .plot document; nullopt on malformed JSON, wrong types, or version > 1.
    static std::optional<PlotDocument> FromJson(const std::string& json);
};

}  // namespace plot

#endif  // COMPASS_PLOT_PLOT_DOCUMENT_H
