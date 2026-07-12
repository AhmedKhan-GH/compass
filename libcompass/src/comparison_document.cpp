// Compass C2 — ComparisonDocument edits (each commits one undo step).

#include "compass/comparison_document.h"

#include <utility>

namespace compass {

void ComparisonDocument::SetStoreRoot(std::string root) {
    ComparisonState next = state();
    next.store_root = std::move(root);
    Commit(std::move(next));
}

void ComparisonDocument::SetRuns(std::vector<RunDisplay> runs) {
    ComparisonState next = state();
    next.runs = std::move(runs);
    Commit(std::move(next));
}

void ComparisonDocument::SetLayout(std::string perspective) {
    // Layout tracks the AUI perspective; coalesce so repeated dock drags don't
    // flood undo, and never dirty if unchanged.
    if (state().layout == perspective) return;
    ComparisonState next = state();
    next.layout = std::move(perspective);
    Commit(std::move(next));
}

int64_t ComparisonDocument::AddAnnotation(int64_t run, int64_t step,
                                          std::string tag, std::string text) {
    ComparisonState next = state();
    Annotation a;
    a.id = next.next_annotation_id++;
    a.run = run;
    a.step = step;
    a.tag = std::move(tag);
    a.text = std::move(text);
    const int64_t id = a.id;
    next.annotations.push_back(std::move(a));
    Commit(std::move(next));
    return id;
}

bool ComparisonDocument::EditAnnotation(int64_t id, std::string text) {
    ComparisonState next = state();
    for (auto& a : next.annotations) {
        if (a.id == id) {
            a.text = std::move(text);
            Commit(std::move(next));
            return true;
        }
    }
    return false;
}

bool ComparisonDocument::DeleteAnnotation(int64_t id) {
    ComparisonState next = state();
    const auto before = next.annotations.size();
    for (auto it = next.annotations.begin(); it != next.annotations.end(); ++it) {
        if (it->id == id) {
            next.annotations.erase(it);
            break;
        }
    }
    if (next.annotations.size() == before) return false;
    Commit(std::move(next));
    return true;
}

}  // namespace compass
