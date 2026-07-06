// Compass — Plot Workbench (Instrument #1)
// PlotDocument implementation: mutations + memento undo + a compact JSON
// serializer/parser for the .plot format (spec §4). The parser is deliberately
// self-contained (no JSON library admitted for I1) and defensive: any malformed
// input yields std::nullopt rather than an exception or a partial document.

#include "plot/plot_document.h"

#include <cctype>
#include <cstdio>
#include <map>
#include <utility>

namespace plot {

// ---------------------------------------------------------------------------
// Mutations + undo/redo (memento)
// ---------------------------------------------------------------------------

void PlotDocument::Commit(State next) {
    undo_.push_back(cur_);
    cur_ = std::move(next);
    redo_.clear();
    dirty_ = true;
}

void PlotDocument::AddExpression(const ExprEntry& e) {
    State next = cur_;
    next.expressions.push_back(e);
    Commit(std::move(next));
}

void PlotDocument::RemoveExpression(std::size_t index) {
    if (index >= cur_.expressions.size()) return;
    State next = cur_;
    next.expressions.erase(next.expressions.begin() +
                           static_cast<std::ptrdiff_t>(index));
    Commit(std::move(next));
}

void PlotDocument::EditExpressionText(std::size_t index, const std::string& text) {
    if (index >= cur_.expressions.size()) return;
    State next = cur_;
    next.expressions[index].text = text;
    Commit(std::move(next));
}

void PlotDocument::SetExpressionStyle(std::size_t index, const Style& s) {
    if (index >= cur_.expressions.size()) return;
    State next = cur_;
    next.expressions[index].style = s;
    Commit(std::move(next));
}

void PlotDocument::SetView(const ViewRect& v) {
    State next = cur_;
    next.view = v;
    Commit(std::move(next));
}

void PlotDocument::Undo() {
    if (undo_.empty()) return;
    redo_.push_back(std::move(cur_));
    cur_ = std::move(undo_.back());
    undo_.pop_back();
    dirty_ = true;
}

void PlotDocument::Redo() {
    if (redo_.empty()) return;
    undo_.push_back(std::move(cur_));
    cur_ = std::move(redo_.back());
    redo_.pop_back();
    dirty_ = true;
}

// ---------------------------------------------------------------------------
// JSON serialization
// ---------------------------------------------------------------------------

namespace {

std::string NumToStr(double v) {
    char buf[32];
    std::snprintf(buf, sizeof(buf), "%.17g", v);
    return buf;
}

std::string QuoteString(const std::string& s) {
    std::string out = "\"";
    for (char c : s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    char u[8];
                    std::snprintf(u, sizeof(u), "\\u%04x", c);
                    out += u;
                } else {
                    out += c;
                }
        }
    }
    out += "\"";
    return out;
}

}  // namespace

std::string PlotDocument::ToJson() const {
    std::string out = "{\"version\":1,\"view\":{";
    out += "\"xmin\":" + NumToStr(cur_.view.xmin);
    out += ",\"xmax\":" + NumToStr(cur_.view.xmax);
    out += ",\"ymin\":" + NumToStr(cur_.view.ymin);
    out += ",\"ymax\":" + NumToStr(cur_.view.ymax);
    out += std::string(",\"grid\":") + (cur_.view.grid ? "true" : "false");
    out += "},\"expressions\":[";
    for (std::size_t i = 0; i < cur_.expressions.size(); ++i) {
        const ExprEntry& e = cur_.expressions[i];
        if (i) out += ",";
        out += "{\"text\":" + QuoteString(e.text);
        out += ",\"color\":" + QuoteString(e.style.color);
        out += ",\"width\":" + NumToStr(e.style.width);
        out += std::string(",\"visible\":") + (e.style.visible ? "true" : "false");
        out += "}";
    }
    out += "]}";
    return out;
}

// ---------------------------------------------------------------------------
// A compact, defensive JSON parser (object/array/string/number/bool/null).
// Returns nullopt on any malformed input; never throws.
// ---------------------------------------------------------------------------

namespace {

struct JsonValue {
    enum class Type { Null, Bool, Number, String, Array, Object } type = Type::Null;
    bool b = false;
    double num = 0.0;
    std::string str;
    std::vector<JsonValue> arr;
    std::map<std::string, JsonValue> obj;
};

class JsonParser {
public:
    explicit JsonParser(const std::string& s) : s_(s) {}

    std::optional<JsonValue> Parse() {
        SkipWs();
        JsonValue v;
        if (!ParseValue(v)) return std::nullopt;
        SkipWs();
        if (pos_ != s_.size()) return std::nullopt;  // trailing junk
        return v;
    }

private:
    const std::string& s_;
    std::size_t pos_ = 0;

    char Cur() const { return pos_ < s_.size() ? s_[pos_] : '\0'; }
    void SkipWs() {
        while (pos_ < s_.size()) {
            char c = s_[pos_];
            if (c == ' ' || c == '\t' || c == '\n' || c == '\r') pos_++;
            else break;
        }
    }
    bool Literal(const char* lit) {
        std::size_t n = 0;
        while (lit[n]) n++;
        if (s_.compare(pos_, n, lit) == 0) { pos_ += n; return true; }
        return false;
    }

    bool ParseValue(JsonValue& out) {
        SkipWs();
        char c = Cur();
        if (c == '{') return ParseObject(out);
        if (c == '[') return ParseArray(out);
        if (c == '"') return ParseString(out);
        if (c == 't') { if (!Literal("true")) return false;  out.type = JsonValue::Type::Bool; out.b = true;  return true; }
        if (c == 'f') { if (!Literal("false")) return false; out.type = JsonValue::Type::Bool; out.b = false; return true; }
        if (c == 'n') { if (!Literal("null")) return false;  out.type = JsonValue::Type::Null; return true; }
        if (c == '-' || (c >= '0' && c <= '9')) return ParseNumber(out);
        return false;
    }

    bool ParseObject(JsonValue& out) {
        out.type = JsonValue::Type::Object;
        pos_++;  // consume '{'
        SkipWs();
        if (Cur() == '}') { pos_++; return true; }
        while (true) {
            SkipWs();
            if (Cur() != '"') return false;
            JsonValue key;
            if (!ParseString(key)) return false;
            SkipWs();
            if (Cur() != ':') return false;
            pos_++;  // consume ':'
            JsonValue val;
            if (!ParseValue(val)) return false;
            out.obj[key.str] = std::move(val);
            SkipWs();
            if (Cur() == ',') { pos_++; continue; }
            if (Cur() == '}') { pos_++; return true; }
            return false;
        }
    }

    bool ParseArray(JsonValue& out) {
        out.type = JsonValue::Type::Array;
        pos_++;  // consume '['
        SkipWs();
        if (Cur() == ']') { pos_++; return true; }
        while (true) {
            JsonValue val;
            if (!ParseValue(val)) return false;
            out.arr.push_back(std::move(val));
            SkipWs();
            if (Cur() == ',') { pos_++; continue; }
            if (Cur() == ']') { pos_++; return true; }
            return false;
        }
    }

    bool ParseString(JsonValue& out) {
        out.type = JsonValue::Type::String;
        if (Cur() != '"') return false;
        pos_++;  // consume opening quote
        std::string result;
        while (pos_ < s_.size()) {
            char c = s_[pos_++];
            if (c == '"') { out.str = std::move(result); return true; }
            if (c == '\\') {
                if (pos_ >= s_.size()) return false;
                char e = s_[pos_++];
                switch (e) {
                    case '"':  result += '"';  break;
                    case '\\': result += '\\'; break;
                    case '/':  result += '/';  break;
                    case 'n':  result += '\n'; break;
                    case 'r':  result += '\r'; break;
                    case 't':  result += '\t'; break;
                    case 'b':  result += '\b'; break;
                    case 'f':  result += '\f'; break;
                    case 'u': {
                        if (pos_ + 4 > s_.size()) return false;
                        int cp = 0;
                        for (int k = 0; k < 4; ++k) {
                            char h = s_[pos_++];
                            cp <<= 4;
                            if (h >= '0' && h <= '9') cp |= h - '0';
                            else if (h >= 'a' && h <= 'f') cp |= h - 'a' + 10;
                            else if (h >= 'A' && h <= 'F') cp |= h - 'A' + 10;
                            else return false;
                        }
                        // Minimal UTF-8 encoding (enough for our ASCII-ish text).
                        if (cp < 0x80) {
                            result += static_cast<char>(cp);
                        } else if (cp < 0x800) {
                            result += static_cast<char>(0xC0 | (cp >> 6));
                            result += static_cast<char>(0x80 | (cp & 0x3F));
                        } else {
                            result += static_cast<char>(0xE0 | (cp >> 12));
                            result += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
                            result += static_cast<char>(0x80 | (cp & 0x3F));
                        }
                        break;
                    }
                    default: return false;
                }
            } else {
                result += c;
            }
        }
        return false;  // unterminated string
    }

    bool ParseNumber(JsonValue& out) {
        std::size_t start = pos_;
        if (Cur() == '-') pos_++;
        while (std::isdigit(static_cast<unsigned char>(Cur()))) pos_++;
        if (Cur() == '.') { pos_++; while (std::isdigit(static_cast<unsigned char>(Cur()))) pos_++; }
        if (Cur() == 'e' || Cur() == 'E') {
            pos_++;
            if (Cur() == '+' || Cur() == '-') pos_++;
            while (std::isdigit(static_cast<unsigned char>(Cur()))) pos_++;
        }
        if (pos_ == start) return false;
        out.type = JsonValue::Type::Number;
        out.num = std::strtod(s_.substr(start, pos_ - start).c_str(), nullptr);
        return true;
    }
};

// Field lookups that quietly fall back to a default on wrong/absent types.
const JsonValue* Find(const JsonValue& o, const char* key) {
    if (o.type != JsonValue::Type::Object) return nullptr;
    auto it = o.obj.find(key);
    return it == o.obj.end() ? nullptr : &it->second;
}
double NumOr(const JsonValue& o, const char* key, double def) {
    const JsonValue* v = Find(o, key);
    return (v && v->type == JsonValue::Type::Number) ? v->num : def;
}
bool BoolOr(const JsonValue& o, const char* key, bool def) {
    const JsonValue* v = Find(o, key);
    return (v && v->type == JsonValue::Type::Bool) ? v->b : def;
}
std::string StrOr(const JsonValue& o, const char* key, const std::string& def) {
    const JsonValue* v = Find(o, key);
    return (v && v->type == JsonValue::Type::String) ? v->str : def;
}

}  // namespace

std::optional<PlotDocument> PlotDocument::FromJson(const std::string& json) {
    JsonParser parser(json);
    std::optional<JsonValue> root = parser.Parse();
    if (!root || root->type != JsonValue::Type::Object) return std::nullopt;

    // Version gate: absent → treat as 1; present and > 1 → unsupported.
    const JsonValue* ver = Find(*root, "version");
    if (ver) {
        if (ver->type != JsonValue::Type::Number || ver->num > 1.0) return std::nullopt;
    }

    PlotDocument doc;
    Style defstyle;  // for per-field defaults
    ViewRect defview;

    if (const JsonValue* v = Find(*root, "view")) {
        if (v->type != JsonValue::Type::Object) return std::nullopt;
        doc.cur_.view.xmin = NumOr(*v, "xmin", defview.xmin);
        doc.cur_.view.xmax = NumOr(*v, "xmax", defview.xmax);
        doc.cur_.view.ymin = NumOr(*v, "ymin", defview.ymin);
        doc.cur_.view.ymax = NumOr(*v, "ymax", defview.ymax);
        doc.cur_.view.grid = BoolOr(*v, "grid", defview.grid);
    }

    if (const JsonValue* exprs = Find(*root, "expressions")) {
        if (exprs->type != JsonValue::Type::Array) return std::nullopt;
        for (const JsonValue& e : exprs->arr) {
            if (e.type != JsonValue::Type::Object) return std::nullopt;
            ExprEntry entry;
            entry.text = StrOr(e, "text", "");
            entry.style.color = StrOr(e, "color", defstyle.color);
            entry.style.width = NumOr(e, "width", defstyle.width);
            entry.style.visible = BoolOr(e, "visible", defstyle.visible);
            doc.cur_.expressions.push_back(std::move(entry));
        }
    }

    doc.dirty_ = false;  // freshly loaded == clean, empty history
    return doc;
}

}  // namespace plot
