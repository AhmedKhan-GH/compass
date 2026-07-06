// Compass framework (libcompass) — Document base.
//
// Extracted from Plot Workbench (I2, CD9 rule-of-two): the generic document
// machinery every instrument needs — dirty tracking, memento undo/redo, and a
// serialize/deserialize contract the shell drives for Save/Open — with the
// domain state left to the subclass. Pure C++, wx-free.
//
//   struct MyState { ... };
//   class MyDocument : public compass::UndoableDocument<MyState> {
//     // domain mutations build a next State and call Commit(next);
//     // implement Serialize()/Deserialize().
//   };

#ifndef COMPASS_DOCUMENT_H
#define COMPASS_DOCUMENT_H

#include <string>
#include <utility>
#include <vector>

namespace compass {

// The non-template interface the workspace shell talks to. It knows nothing of
// the instrument's state — only how to undo, save, and load it.
class Document {
public:
    virtual ~Document() = default;

    bool dirty() const { return dirty_; }
    void MarkSaved() { dirty_ = false; }

    virtual bool CanUndo() const = 0;
    virtual bool CanRedo() const = 0;
    virtual void Undo() = 0;
    virtual void Redo() = 0;

    // Serialize to file contents; Deserialize returns false on malformed input
    // (leaving the document unchanged). The shell uses these for Save/Open.
    virtual std::string Serialize() const = 0;
    virtual bool Deserialize(const std::string& data) = 0;

protected:
    void set_dirty(bool d) { dirty_ = d; }

private:
    bool dirty_ = false;
};

// Memento-based undo/redo over a concrete snapshot type `State`. A subclass edits
// by building a fresh State from state() and calling Commit(); load/new use
// ResetState() to install a state with a clean history.
template <class State>
class UndoableDocument : public Document {
public:
    const State& state() const { return cur_; }

    bool CanUndo() const override { return !undo_.empty(); }
    bool CanRedo() const override { return !redo_.empty(); }

    void Undo() override {
        if (undo_.empty()) return;
        redo_.push_back(std::move(cur_));
        cur_ = std::move(undo_.back());
        undo_.pop_back();
        last_tag_ = kNoTag;
        set_dirty(true);
    }

    void Redo() override {
        if (redo_.empty()) return;
        undo_.push_back(std::move(cur_));
        cur_ = std::move(redo_.back());
        redo_.pop_back();
        last_tag_ = kNoTag;
        set_dirty(true);
    }

protected:
    static constexpr int kNoTag = -1;

    // Apply a new state as one undo step.
    void Commit(State next) {
        undo_.push_back(cur_);
        cur_ = std::move(next);
        redo_.clear();
        last_tag_ = kNoTag;
        set_dirty(true);
    }

    // Like Commit, but consecutive calls sharing the same tag (>= 0) collapse
    // into a SINGLE undo step — for live edits (e.g. typing into one field),
    // where per-keystroke undo would be useless. A different tag, or any plain
    // Commit/Undo/Redo, starts a fresh step. tag == kNoTag never coalesces.
    void CommitCoalesced(State next, int tag) {
        if (tag != kNoTag && tag == last_tag_ && !undo_.empty()) {
            cur_ = std::move(next);  // undo entry already holds the pre-edit state
        } else {
            undo_.push_back(cur_);
            cur_ = std::move(next);
            redo_.clear();
        }
        last_tag_ = tag;
        set_dirty(true);
    }

    // Install a state with empty history, marked clean (for Deserialize / New).
    void ResetState(State s) {
        cur_ = std::move(s);
        undo_.clear();
        redo_.clear();
        last_tag_ = kNoTag;
        set_dirty(false);
    }

    State cur_;

private:
    std::vector<State> undo_;
    std::vector<State> redo_;
    int last_tag_ = kNoTag;  // tag of the last CommitCoalesced, for step merging
};

}  // namespace compass

#endif  // COMPASS_DOCUMENT_H
