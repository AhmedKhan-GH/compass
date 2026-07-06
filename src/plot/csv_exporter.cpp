// Compass — Plot Workbench (Instrument #1)
// CsvExporter implementation.

#include "plot/csv_exporter.h"

#include <cmath>
#include <cstdio>

#include "plot/expression.h"

namespace plot {
namespace {

std::string NumToStr(double v) {
    char buf[32];
    std::snprintf(buf, sizeof(buf), "%.10g", v);
    return buf;
}

// Quote per RFC 4180 only when needed (comma, quote, CR, or LF present).
std::string CsvEscape(const std::string& s) {
    bool needs = false;
    for (char c : s) {
        if (c == ',' || c == '"' || c == '\n' || c == '\r') { needs = true; break; }
    }
    if (!needs) return s;
    std::string out = "\"";
    for (char c : s) {
        if (c == '"') out += "\"\"";
        else out += c;
    }
    out += "\"";
    return out;
}

}  // namespace

std::string ExportCsv(const std::vector<std::string>& expressions, double xmin,
                      double xmax, int rows) {
    if (expressions.empty() || rows < 1 || !(xmin < xmax)) return "";

    std::vector<Expression> compiled;
    compiled.reserve(expressions.size());
    for (const std::string& text : expressions) {
        compiled.push_back(Expression::Compile(text));
    }

    std::string out = "x";
    for (const std::string& text : expressions) out += "," + CsvEscape(text);
    out += "\n";

    const double step = (rows > 1) ? (xmax - xmin) / (rows - 1) : 0.0;
    for (int i = 0; i < rows; ++i) {
        const double x = (i == rows - 1) ? xmax : xmin + i * step;
        out += NumToStr(x);
        for (const Expression& e : compiled) {
            const double y = e.Eval(x);
            out += ",";
            if (std::isfinite(y)) out += NumToStr(y);  // else empty cell
        }
        out += "\n";
    }
    return out;
}

}  // namespace plot
