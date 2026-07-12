// Compass C2 — HTML report renderer (tables + inline SVG, self-contained).

#include "compass/report.h"

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <sstream>

namespace compass {
namespace {

std::string Escape(const std::string& s) {
    std::string o;
    o.reserve(s.size());
    for (char c : s) {
        switch (c) {
            case '&': o += "&amp;"; break;
            case '<': o += "&lt;"; break;
            case '>': o += "&gt;"; break;
            case '"': o += "&quot;"; break;
            case '\'': o += "&#39;"; break;
            default: o += c;
        }
    }
    return o;
}

std::string Num(double v) {
    char buf[32];
    std::snprintf(buf, sizeof buf, "%.6g", v);
    return buf;
}

std::string Color(const std::string& c, int fallback_index) {
    if (!c.empty()) return c;
    // Deterministic fallback palette (matches the on-screen default assignment).
    static const char* kPalette[] = {"#4c6ef5", "#e8590c", "#2f9e44", "#ae3ec9",
                                     "#1098ad", "#f08c00", "#e03131", "#5c940d"};
    return kPalette[fallback_index % 8];
}

// A "nice" 1/2/5×10^k step so gridlines/ticks land on round numbers.
double NiceStep(double range, int target) {
    if (range <= 0 || target <= 0) return 1.0;
    const double raw = range / target;
    const double mag = std::pow(10.0, std::floor(std::log10(raw)));
    const double n = raw / mag;
    const double nice = (n < 1.5) ? 1 : (n < 3) ? 2 : (n < 7) ? 5 : 10;
    return nice * mag;
}

// Inline SVG line chart for one tag: a polyline per run, axes, legend, and
// annotation markers (drawn by the caller-appended <g>). Deterministic geometry.
void RenderPlot(std::ostringstream& o, const ReportSeriesGroup& g,
                const ReportData& data) {
    constexpr double W = 720, H = 320, ml = 56, mr = 140, mt = 16, mb = 40;
    const double pw = W - ml - mr, ph = H - mt - mb;

    double xmin = 0, xmax = 1, ymin = 0, ymax = 1;
    bool any = false;
    for (const auto& ln : g.lines) {
        for (auto& p : ln.points) {
            if (!any) {
                xmin = xmax = p.first;
                ymin = ymax = p.second;
                any = true;
            } else {
                xmin = std::min(xmin, p.first);
                xmax = std::max(xmax, p.first);
                ymin = std::min(ymin, p.second);
                ymax = std::max(ymax, p.second);
            }
        }
    }
    if (!any) { o << "<p class=\"muted\">no data</p>"; return; }
    if (xmax <= xmin) xmax = xmin + 1;
    if (ymax <= ymin) { ymax = ymin + 1; ymin -= 1; }
    // A little vertical headroom so lines don't touch the frame.
    const double pad = (ymax - ymin) * 0.05;
    ymin -= pad; ymax += pad;

    auto X = [&](double x) { return ml + (x - xmin) / (xmax - xmin) * pw; };
    auto Y = [&](double y) { return mt + ph - (y - ymin) / (ymax - ymin) * ph; };

    o << "<svg viewBox=\"0 0 " << Num(W) << " " << Num(H)
      << "\" class=\"plot\" role=\"img\" aria-label=\"" << Escape(g.tag)
      << " over steps\">";
    // Frame.
    o << "<rect x=\"" << Num(ml) << "\" y=\"" << Num(mt) << "\" width=\"" << Num(pw)
      << "\" height=\"" << Num(ph) << "\" fill=\"none\" stroke=\"#ccc\"/>";
    // Gridlines + ticks.
    const double xs = NiceStep(xmax - xmin, 8), ys = NiceStep(ymax - ymin, 6);
    for (double gx = std::ceil(xmin / xs) * xs; gx <= xmax; gx += xs) {
        const double px = X(gx);
        o << "<line x1=\"" << Num(px) << "\" y1=\"" << Num(mt) << "\" x2=\"" << Num(px)
          << "\" y2=\"" << Num(mt + ph) << "\" stroke=\"#eee\"/>";
        o << "<text x=\"" << Num(px) << "\" y=\"" << Num(mt + ph + 16)
          << "\" class=\"tick\" text-anchor=\"middle\">" << Num(gx) << "</text>";
    }
    for (double gy = std::ceil(ymin / ys) * ys; gy <= ymax; gy += ys) {
        const double py = Y(gy);
        o << "<line x1=\"" << Num(ml) << "\" y1=\"" << Num(py) << "\" x2=\"" << Num(ml + pw)
          << "\" y2=\"" << Num(py) << "\" stroke=\"#eee\"/>";
        o << "<text x=\"" << Num(ml - 6) << "\" y=\"" << Num(py + 4)
          << "\" class=\"tick\" text-anchor=\"end\">" << Num(gy) << "</text>";
    }
    // Series polylines.
    for (const auto& ln : g.lines) {
        const std::string col =
            Color(data.runs[ln.run_index].color, ln.run_index);
        o << "<polyline fill=\"none\" stroke=\"" << col
          << "\" stroke-width=\"1.5\" points=\"";
        for (auto& p : ln.points) o << Num(X(p.first)) << "," << Num(Y(p.second)) << " ";
        o << "\"/>";
    }
    // Annotation markers on this tag's series (step-bound).
    for (const auto& a : data.annotations) {
        if (a.tag != g.tag || a.step < 0) continue;
        if (a.step < xmin || a.step > xmax) continue;
        const double px = X(static_cast<double>(a.step));
        o << "<line x1=\"" << Num(px) << "\" y1=\"" << Num(mt) << "\" x2=\"" << Num(px)
          << "\" y2=\"" << Num(mt + ph) << "\" stroke=\"#d6336c\" stroke-dasharray=\"3 2\"/>";
        o << "<circle cx=\"" << Num(px) << "\" cy=\"" << Num(mt + 6)
          << "\" r=\"3\" fill=\"#d6336c\"><title>" << Escape(a.text)
          << "</title></circle>";
    }
    // Legend.
    double ly = mt + 4;
    for (const auto& ln : g.lines) {
        const std::string col = Color(data.runs[ln.run_index].color, ln.run_index);
        const double lx = ml + pw + 12;
        o << "<line x1=\"" << Num(lx) << "\" y1=\"" << Num(ly) << "\" x2=\"" << Num(lx + 18)
          << "\" y2=\"" << Num(ly) << "\" stroke=\"" << col << "\" stroke-width=\"2\"/>";
        o << "<text x=\"" << Num(lx + 24) << "\" y=\"" << Num(ly + 4)
          << "\" class=\"legend\">" << Escape(data.runs[ln.run_index].label)
          << "</text>";
        ly += 18;
    }
    o << "</svg>";
}

}  // namespace

std::string RenderReportHtml(const ReportData& data) {
    std::ostringstream o;
    o << "<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"utf-8\">"
      << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
      << "<title>" << Escape(data.title) << "</title><style>"
      << "body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:2rem;color:#222}"
      << "h1{font-size:1.5rem}h2{font-size:1.15rem;margin-top:2rem;border-bottom:1px solid #eee;padding-bottom:.25rem}"
      << "table{border-collapse:collapse;margin:.5rem 0}th,td{border:1px solid #ddd;padding:4px 10px;text-align:right}"
      << "th:first-child,td:first-child{text-align:left}thead th{background:#f6f6f6}"
      << ".muted{color:#888}.caveat{background:#fff3bf;border:1px solid #ffe066;padding:.5rem .75rem;border-radius:4px}"
      << ".swatch{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:middle}"
      << ".plot{max-width:100%;height:auto;margin:.5rem 0}.tick{font-size:10px;fill:#888}.legend{font-size:11px;fill:#444}"
      << "</style></head><body>";

    o << "<h1>" << Escape(data.title) << "</h1>";
    o << "<p class=\"muted\">Generated " << Escape(data.generated_at)
      << " &middot; store: <code>" << Escape(data.store_root_label) << "</code></p>";
    if (data.store_foreign) {
        o << "<p class=\"caveat\">Foreign store root: rows reflect the writer's "
             "last <strong>checkpoint</strong>, not its live state (a separate "
             "process only sees checkpointed rows). Not shown as live.</p>";
    }

    // Runs.
    o << "<h2>Runs</h2><table><thead><tr><th>Run</th><th>Experiment</th>"
      << "<th>Name</th><th>Done</th><th>Last step</th><th>Tags</th></tr></thead><tbody>";
    for (const auto& r : data.runs) {
        o << "<tr><td><span class=\"swatch\" style=\"background:"
          << Color(r.color, static_cast<int>(&r - &data.runs[0]))
          << "\"></span>" << Escape(r.label) << "</td><td>" << Escape(r.experiment)
          << "</td><td>" << Escape(r.name) << "</td><td>" << (r.last_step >= 0 ? "yes" : "")
          << "</td><td>" << r.last_step << "</td><td>" << r.tag_count << "</td></tr>";
    }
    o << "</tbody></table>";

    // Scalar stats.
    o << "<h2>Scalar summary</h2>";
    if (data.stats.empty()) {
        o << "<p class=\"muted\">No scalar data.</p>";
    } else {
        o << "<table><thead><tr><th>Tag</th>";
        for (const auto& r : data.runs)
            o << "<th>" << Escape(r.label) << " last</th><th>min</th><th>max</th>";
        o << "</tr></thead><tbody>";
        for (const auto& row : data.stats) {
            o << "<tr><td>" << Escape(row.tag) << "</td>";
            for (const auto& c : row.cells) {
                if (c.present)
                    o << "<td>" << Num(c.last) << "</td><td>" << Num(c.vmin)
                      << "</td><td>" << Num(c.vmax) << "</td>";
                else
                    o << "<td class=\"muted\">&ndash;</td><td class=\"muted\">&ndash;"
                      << "</td><td class=\"muted\">&ndash;</td>";
            }
            o << "</tr>";
        }
        o << "</tbody></table>";
    }

    // Plots.
    o << "<h2>Plots</h2>";
    if (data.series.empty()) {
        o << "<p class=\"muted\">No series.</p>";
    } else {
        for (const auto& g : data.series) {
            o << "<h3>" << Escape(g.tag) << "</h3>";
            RenderPlot(o, g, data);
        }
    }

    // Annotations.
    o << "<h2>Annotations</h2>";
    if (data.annotations.empty()) {
        o << "<p class=\"muted\">None.</p>";
    } else {
        o << "<ul>";
        for (const auto& a : data.annotations) {
            o << "<li>";
            if (!a.run_label.empty()) o << "<strong>" << Escape(a.run_label) << "</strong> ";
            if (!a.tag.empty()) o << "<code>" << Escape(a.tag) << "</code> ";
            if (a.step >= 0) o << "@step " << a.step << " ";
            o << "&mdash; " << Escape(a.text) << "</li>";
        }
        o << "</ul>";
    }

    o << "</body></html>";
    return o.str();
}

}  // namespace compass
