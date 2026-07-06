// Compass — Signal Workbench (Instrument #2, I3)
// SignalDocument implementation. JSON sidecar via nlohmann/json (compass::json).

#include "signal/signal_document.h"

#include <nlohmann/json.hpp>

using nlohmann::json;

namespace sig {

void SignalDocument::SetEdfPath(const std::string& path) {
    SignalState next = state();
    next.edf_path = path;
    Commit(std::move(next));
}

void SignalDocument::AddAnnotation(const Annotation& a) {
    SignalState next = state();
    next.annotations.push_back(a);
    Commit(std::move(next));
}

void SignalDocument::RemoveAnnotation(std::size_t index) {
    if (index >= state().annotations.size()) return;
    SignalState next = state();
    next.annotations.erase(next.annotations.begin() +
                           static_cast<std::ptrdiff_t>(index));
    Commit(std::move(next));
}

void SignalDocument::EditAnnotation(std::size_t index, const Annotation& a) {
    if (index >= state().annotations.size()) return;
    SignalState next = state();
    next.annotations[index] = a;
    Commit(std::move(next));
}

std::string SignalDocument::Serialize() const {
    json j;
    j["version"] = 1;
    j["edf_path"] = state().edf_path;
    j["annotations"] = json::array();
    for (const Annotation& a : state().annotations) {
        j["annotations"].push_back(
            {{"start", a.start}, {"end", a.end}, {"label", a.label}});
    }
    return j.dump(2);
}

bool SignalDocument::Deserialize(const std::string& data) {
    // Fully guarded: parse without exceptions, and wrap typed access so any
    // structural surprise degrades to "not a valid sidecar" (never throws).
    try {
        json j = json::parse(data, nullptr, /*allow_exceptions=*/false);
        if (j.is_discarded() || !j.is_object()) return false;
        if (j.contains("version") && j["version"].is_number() &&
            j["version"].get<double>() > 1.0)
            return false;

        SignalState st;
        if (j.contains("edf_path") && j["edf_path"].is_string())
            st.edf_path = j["edf_path"].get<std::string>();

        if (j.contains("annotations")) {
            if (!j["annotations"].is_array()) return false;
            for (const auto& e : j["annotations"]) {
                if (!e.is_object()) return false;
                Annotation a;
                a.start = e.value("start", 0.0);
                a.end = e.value("end", 0.0);
                a.label = e.value("label", std::string());
                st.annotations.push_back(std::move(a));
            }
        }
        ResetState(std::move(st));
        return true;
    } catch (const json::exception&) {
        return false;
    }
}

std::optional<SignalDocument> SignalDocument::FromJson(const std::string& json_text) {
    SignalDocument doc;
    if (!doc.Deserialize(json_text)) return std::nullopt;
    return doc;
}

}  // namespace sig
