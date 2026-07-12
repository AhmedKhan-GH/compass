// Compass C2 — ComparisonState JSON codec (nlohmann/json).

#include "compass/comparison_state.h"

#include <nlohmann/json.hpp>

namespace compass {
namespace {
using nlohmann::json;

json ToJson(const RunDisplay& r) {
    return json{{"id", r.id},
                {"label", r.label},
                {"color", r.color},
                {"visible_tags", r.visible_tags}};
}

json ToJson(const Annotation& a) {
    return json{{"id", a.id},
                {"run", a.run},
                {"step", a.step},
                {"tag", a.tag},
                {"text", a.text}};
}

// Read with a default — tolerant of missing keys (forward/backward slack).
template <class T>
T Get(const json& j, const char* key, T fallback) {
    auto it = j.find(key);
    if (it == j.end() || it->is_null()) return fallback;
    try {
        return it->get<T>();
    } catch (...) {
        return fallback;
    }
}
}  // namespace

std::string SerializeState(const ComparisonState& s) {
    json runs = json::array();
    for (const auto& r : s.runs) runs.push_back(ToJson(r));
    json anns = json::array();
    for (const auto& a : s.annotations) anns.push_back(ToJson(a));

    json doc{{"format", "compass.comparison"},
             {"version", s.version},
             {"store_root", s.store_root},
             {"runs", std::move(runs)},
             {"annotations", std::move(anns)},
             {"layout", s.layout},
             {"next_annotation_id", s.next_annotation_id}};
    return doc.dump(2);
}

bool DeserializeState(const std::string& text, ComparisonState* out) {
    json doc = json::parse(text, /*cb=*/nullptr, /*allow_exceptions=*/false);
    if (doc.is_discarded() || !doc.is_object()) return false;

    // Honest version refusal: a file from a newer Compass is NOT guessed at.
    const int version = Get<int>(doc, "version", kComparisonVersion);
    if (version > kComparisonVersion) return false;

    ComparisonState s;
    s.version = version;
    s.store_root = Get<std::string>(doc, "store_root", "");
    s.layout = Get<std::string>(doc, "layout", "");
    s.next_annotation_id = Get<int64_t>(doc, "next_annotation_id", 1);

    if (auto it = doc.find("runs"); it != doc.end() && it->is_array()) {
        for (const auto& jr : *it) {
            if (!jr.is_object()) continue;
            RunDisplay r;
            r.id = Get<int64_t>(jr, "id", 0);
            r.label = Get<std::string>(jr, "label", "");
            r.color = Get<std::string>(jr, "color", "");
            r.visible_tags =
                Get<std::vector<std::string>>(jr, "visible_tags", {});
            s.runs.push_back(std::move(r));
        }
    }
    if (auto it = doc.find("annotations"); it != doc.end() && it->is_array()) {
        for (const auto& ja : *it) {
            if (!ja.is_object()) continue;
            Annotation a;
            a.id = Get<int64_t>(ja, "id", 0);
            a.run = Get<int64_t>(ja, "run", -1);
            a.step = Get<int64_t>(ja, "step", -1);
            a.tag = Get<std::string>(ja, "tag", "");
            a.text = Get<std::string>(ja, "text", "");
            s.annotations.push_back(std::move(a));
        }
    }
    *out = std::move(s);
    return true;
}

}  // namespace compass
