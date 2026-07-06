// Compass — Signal Workbench (Instrument #2, I3)
// SignalDocument: the annotation session. References an EDF recording by path and
// holds a list of labeled time ranges, with undo + JSON sidecar persistence. The
// generic undo/dirty/serialize machinery comes from compass::UndoableDocument.
// Pure C++, headless, wx-free.

#ifndef COMPASS_SIGNAL_SIGNAL_DOCUMENT_H
#define COMPASS_SIGNAL_SIGNAL_DOCUMENT_H

#include <cstddef>
#include <optional>
#include <string>
#include <vector>

#include "compass/document.h"

namespace sig {

// A labeled time range on the recording (seconds). start == end is a point marker.
struct Annotation {
    double start = 0.0;
    double end = 0.0;
    std::string label;
};

struct SignalState {
    std::string edf_path;  // relative or absolute path to the .edf recording
    std::vector<Annotation> annotations;
};

class SignalDocument : public compass::UndoableDocument<SignalState> {
public:
    const std::string& edf_path() const { return state().edf_path; }
    const std::vector<Annotation>& annotations() const { return state().annotations; }
    bool can_undo() const { return CanUndo(); }
    bool can_redo() const { return CanRedo(); }

    void SetEdfPath(const std::string& path);
    void AddAnnotation(const Annotation& a);
    void RemoveAnnotation(std::size_t index);                  // out-of-range: no-op
    void EditAnnotation(std::size_t index, const Annotation& a);  // no-op if oob

    std::string Serialize() const override;
    bool Deserialize(const std::string& data) override;

    std::string ToJson() const { return Serialize(); }
    static std::optional<SignalDocument> FromJson(const std::string& json);
};

}  // namespace sig

#endif  // COMPASS_SIGNAL_SIGNAL_DOCUMENT_H
