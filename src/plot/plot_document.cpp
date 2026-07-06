// Compass — Plot Workbench (Instrument #1)
// PlotDocument implementation: mutations + memento undo + .plot JSON (spec §4)
// via nlohmann/json (compass::json). Deserialize is fully guarded: malformed
// input yields std::nullopt, never an exception or a partial document.

#include "plot/plot_document.h"

#include <utility>

#include <nlohmann/json.hpp>

using nlohmann::json;

namespace plot {

// ---------------------------------------------------------------------------
// Mutations (undo/redo + dirty come from compass::UndoableDocument)
// ---------------------------------------------------------------------------

void PlotDocument::AddExpression(const ExprEntry& e) {
    PlotState next = state();
    next.expressions.push_back(e);
    Commit(std::move(next));
}

void PlotDocument::RemoveExpression(std::size_t index) {
    if (index >= state().expressions.size()) return;
    PlotState next = state();
    next.expressions.erase(next.expressions.begin() +
                           static_cast<std::ptrdiff_t>(index));
    Commit(std::move(next));
}

void PlotDocument::EditExpressionText(std::size_t index, const std::string& text) {
    if (index >= state().expressions.size()) return;
    PlotState next = state();
    next.expressions[index].text = text;
    // Live typing into one field coalesces into a single undo step (tag = index).
    CommitCoalesced(std::move(next), static_cast<int>(index));
}

void PlotDocument::SetExpressionStyle(std::size_t index, const Style& s) {
    if (index >= state().expressions.size()) return;
    PlotState next = state();
    next.expressions[index].style = s;
    Commit(std::move(next));
}

void PlotDocument::SetView(const ViewRect& v) {
    PlotState next = state();
    next.view = v;
    Commit(std::move(next));
}

// ---------------------------------------------------------------------------
// JSON serialization (.plot, spec §4)
// ---------------------------------------------------------------------------

std::string PlotDocument::Serialize() const {
    const PlotState& st = state();
    json j;
    j["version"] = 1;
    j["view"] = {{"xmin", st.view.xmin}, {"xmax", st.view.xmax},
                 {"ymin", st.view.ymin}, {"ymax", st.view.ymax},
                 {"grid", st.view.grid}};
    j["expressions"] = json::array();
    for (const ExprEntry& e : st.expressions) {
        j["expressions"].push_back({{"text", e.text},
                                    {"color", e.style.color},
                                    {"width", e.style.width},
                                    {"visible", e.style.visible}});
    }
    return j.dump(2);
}

bool PlotDocument::Deserialize(const std::string& data) {
    try {
        json j = json::parse(data, nullptr, /*allow_exceptions=*/false);
        if (j.is_discarded() || !j.is_object()) return false;
        if (j.contains("version") && j["version"].is_number() &&
            j["version"].get<double>() > 1.0)
            return false;

        PlotState st;  // built fully before commit, so a failure changes nothing
        const Style defstyle;
        const ViewRect defview;

        if (j.contains("view")) {
            const json& v = j["view"];
            if (!v.is_object()) return false;
            st.view.xmin = v.value("xmin", defview.xmin);
            st.view.xmax = v.value("xmax", defview.xmax);
            st.view.ymin = v.value("ymin", defview.ymin);
            st.view.ymax = v.value("ymax", defview.ymax);
            st.view.grid = v.value("grid", defview.grid);
        }
        if (j.contains("expressions")) {
            if (!j["expressions"].is_array()) return false;
            for (const json& e : j["expressions"]) {
                if (!e.is_object()) return false;
                ExprEntry entry;
                entry.text = e.value("text", std::string());
                entry.style.color = e.value("color", defstyle.color);
                entry.style.width = e.value("width", defstyle.width);
                entry.style.visible = e.value("visible", defstyle.visible);
                st.expressions.push_back(std::move(entry));
            }
        }
        ResetState(std::move(st));
        return true;
    } catch (const json::exception&) {
        return false;
    }
}

std::optional<PlotDocument> PlotDocument::FromJson(const std::string& json_text) {
    PlotDocument doc;
    if (!doc.Deserialize(json_text)) return std::nullopt;
    return doc;
}

}  // namespace plot
