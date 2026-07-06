// Unit tests for compass::UndoableDocument — the framework's generic document
// base (undo/redo/dirty/serialize), tested via a trivial concrete document.
// Headless, wx-free, doctest (dev-only).

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <string>

#include "compass/document.h"

namespace {

struct IntState {
    int value = 0;
};

// Minimal instrument document: one int, serialized as its decimal text.
class IntDoc : public compass::UndoableDocument<IntState> {
public:
    int value() const { return state().value; }
    void Set(int v) {
        IntState next = state();
        next.value = v;
        Commit(std::move(next));
    }
    std::string Serialize() const override { return std::to_string(state().value); }
    bool Deserialize(const std::string& data) override {
        try {
            IntState s;
            std::size_t pos = 0;
            s.value = std::stoi(data, &pos);
            if (pos != data.size()) return false;  // trailing junk
            ResetState(std::move(s));
            return true;
        } catch (...) {
            return false;  // never throws out to the caller
        }
    }
};

}  // namespace

TEST_CASE("fresh document is clean with no history") {
    IntDoc d;
    CHECK(d.value() == 0);
    CHECK_FALSE(d.dirty());
    CHECK_FALSE(d.CanUndo());
    CHECK_FALSE(d.CanRedo());
}

TEST_CASE("commit / undo / redo restores state and flags") {
    IntDoc d;
    d.Set(5);
    CHECK(d.value() == 5);
    CHECK(d.dirty());
    CHECK(d.CanUndo());
    d.Set(9);

    d.Undo();
    CHECK(d.value() == 5);
    CHECK(d.CanRedo());
    d.Redo();
    CHECK(d.value() == 9);
}

TEST_CASE("a new commit clears the redo stack") {
    IntDoc d;
    d.Set(1);
    d.Set(2);
    d.Undo();
    REQUIRE(d.CanRedo());
    d.Set(3);
    CHECK_FALSE(d.CanRedo());
    CHECK(d.value() == 3);
}

TEST_CASE("Serialize/Deserialize round-trips; ResetState clears history + dirty") {
    IntDoc a;
    a.Set(42);
    const std::string blob = a.Serialize();

    IntDoc b;
    REQUIRE(b.Deserialize(blob));
    CHECK(b.value() == 42);
    CHECK_FALSE(b.dirty());
    CHECK_FALSE(b.CanUndo());

    // Malformed input leaves the document unchanged and returns false.
    CHECK_FALSE(b.Deserialize("not-an-int"));
    CHECK(b.value() == 42);
}

TEST_CASE("MarkSaved clears dirty until the next commit") {
    IntDoc d;
    d.Set(3);
    d.MarkSaved();
    CHECK_FALSE(d.dirty());
    d.Set(4);
    CHECK(d.dirty());
}
