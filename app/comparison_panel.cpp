// Compass C2 — ComparisonPanel implementation.

#include "comparison_panel.h"

#include <map>
#include <vector>

#include <wx/choice.h>
#include <wx/dataview.h>
#include <wx/sizer.h>
#include <wx/splitter.h>
#include <wx/stattext.h>

#include "compass/metrics_sql.h"
#include "plot_series_canvas.h"
#include "report_builder.h"

namespace compass {

wxColour RunColor(const RunDisplay& r, int index) {
    if (!r.color.empty()) {
        wxColour c(wxString::FromUTF8(r.color));
        if (c.IsOk()) return c;
    }
    static const wxColour kPalette[] = {
        wxColour(0x4c, 0x6e, 0xf5), wxColour(0xe8, 0x59, 0x0c),
        wxColour(0x2f, 0x9e, 0x44), wxColour(0xae, 0x3e, 0xc9),
        wxColour(0x10, 0x98, 0xad), wxColour(0xf0, 0x8c, 0x00),
        wxColour(0xe0, 0x31, 0x31), wxColour(0x5c, 0x94, 0x0d)};
    return kPalette[((index % 8) + 8) % 8];
}

ComparisonPanel::ComparisonPanel(wxWindow* parent, ComparisonDocument* doc)
    : wxPanel(parent, wxID_ANY), m_doc(doc) {
    auto* root = new wxBoxSizer(wxVERTICAL);

    m_caveat = new wxStaticText(this, wxID_ANY, "");
    m_caveat->SetForegroundColour(wxColour(0x9a, 0x67, 0x00));
    m_caveat->Hide();
    root->Add(m_caveat, 0, wxEXPAND | wxALL, 4);

    auto* split = new wxSplitterWindow(this, wxID_ANY, wxDefaultPosition,
                                       wxDefaultSize, wxSP_LIVE_UPDATE | wxSP_3D);
    split->SetMinimumPaneSize(160);

    m_table = new wxDataViewListCtrl(split, wxID_ANY);

    auto* right = new wxPanel(split, wxID_ANY);
    auto* rs = new wxBoxSizer(wxVERTICAL);
    auto* tagRow = new wxBoxSizer(wxHORIZONTAL);
    tagRow->Add(new wxStaticText(right, wxID_ANY, "Tag:"), 0,
                wxALIGN_CENTER_VERTICAL | wxRIGHT, 6);
    m_tagChoice = new wxChoice(right, wxID_ANY);
    m_tagChoice->Bind(wxEVT_CHOICE, &ComparisonPanel::OnTagChanged, this);
    tagRow->Add(m_tagChoice, 1, wxALIGN_CENTER_VERTICAL);
    rs->Add(tagRow, 0, wxEXPAND | wxALL, 4);
    m_plot = new PlotSeriesCanvas(right);
    rs->Add(m_plot, 1, wxEXPAND);
    right->SetSizer(rs);

    split->SplitVertically(m_table, right, 420);
    root->Add(split, 1, wxEXPAND);
    SetSizer(root);
}

void ComparisonPanel::SetService(const CaliperMetricsV1_1* svc) {
    m_svc = svc;
    Rebuild();
}

void ComparisonPanel::SetStoreForeign(bool foreign) {
    m_foreign = foreign;
    if (foreign) {
        m_caveat->SetLabel(
            "Foreign store root: rows appear only as the writer checkpoints "
            "(a separate process's live rows are not visible) — not live.");
        m_caveat->Show();
    } else {
        m_caveat->Hide();
    }
    Layout();
}

void ComparisonPanel::OnTagChanged(wxCommandEvent&) { RebuildPlot(); }

void ComparisonPanel::Rebuild() {
    RefreshTagChoice();
    RebuildTable();
    RebuildPlot();
}

void ComparisonPanel::RefreshTagChoice() {
    const wxString prev = m_tagChoice->GetStringSelection();
    m_tagChoice->Clear();
    if (!m_svc || m_doc->runs().empty()) return;
    MetricsQuery q(m_svc);
    std::vector<int64_t> ids;
    for (auto& r : m_doc->runs()) ids.push_back(r.id);
    DecodedTable t;
    if (q.Run(SqlTagsForRuns(ids), &t))
        for (auto& row : t.rows)
            if (!row.empty()) m_tagChoice->Append(wxString::FromUTF8(row[0].text()));
    if (m_tagChoice->GetCount() > 0) {
        const int idx = m_tagChoice->FindString(prev);
        m_tagChoice->SetSelection(idx != wxNOT_FOUND ? idx : 0);
    }
}

void ComparisonPanel::RebuildTable() {
    m_table->DeleteAllItems();
    m_table->ClearColumns();
    if (!m_svc || m_doc->runs().empty()) {
        m_table->AppendTextColumn("info");
        wxVector<wxVariant> row;
        row.push_back(wxVariant(m_svc ? "No runs selected — File ▸ Open Runs…"
                                      : "metrics.v1_1 unavailable"));
        m_table->AppendItem(row);
        return;
    }

    std::vector<int64_t> ids;
    std::map<int64_t, int> index;
    for (auto& r : m_doc->runs()) { index[r.id] = (int)ids.size(); ids.push_back(r.id); }

    // Columns: Tag + (last/min/max) per run.
    m_table->AppendTextColumn("Tag");
    for (auto& r : m_doc->runs()) {
        const wxString lbl = r.label.empty() ? wxString::Format("run %lld", (long long)r.id)
                                             : wxString::FromUTF8(r.label);
        m_table->AppendTextColumn(lbl + " last");
        m_table->AppendTextColumn("min");
        m_table->AppendTextColumn("max");
    }

    MetricsQuery q(m_svc);
    // tags
    std::vector<std::string> tags;
    DecodedTable tt;
    if (q.Run(SqlTagsForRuns(ids), &tt))
        for (auto& row : tt.rows)
            if (!row.empty()) tags.push_back(row[0].text());
    // stats -> map (run,tag)
    struct S { double last, mn, mx; bool has = false; };
    std::map<std::pair<int64_t, std::string>, S> stat;
    DecodedTable st;
    if (q.Run(SqlRunStats(ids), &st)) {
        const int rc = st.column("run"), tg = st.column("tag"),
                  vl = st.column("vlast"), vmn = st.column("vmin"),
                  vmx = st.column("vmax");
        for (auto& row : st.rows) {
            if (rc < 0 || tg < 0) break;
            S s{row[vl].as_double(), row[vmn].as_double(), row[vmx].as_double(), true};
            stat[{row[rc].as_int(), row[tg].text()}] = s;
        }
    }

    for (const auto& tag : tags) {
        wxVector<wxVariant> row;
        row.push_back(wxVariant(wxString::FromUTF8(tag)));
        for (int64_t id : ids) {
            auto it = stat.find({id, tag});
            if (it != stat.end() && it->second.has) {
                row.push_back(wxVariant(wxString::Format("%.6g", it->second.last)));
                row.push_back(wxVariant(wxString::Format("%.6g", it->second.mn)));
                row.push_back(wxVariant(wxString::Format("%.6g", it->second.mx)));
            } else {
                row.push_back(wxVariant("–"));
                row.push_back(wxVariant("–"));
                row.push_back(wxVariant("–"));
            }
        }
        m_table->AppendItem(row);
    }
    if (tags.empty()) {
        wxVector<wxVariant> row;
        row.push_back(wxVariant("no scalars"));
        for (size_t i = 0; i < ids.size() * 3; ++i) row.push_back(wxVariant(""));
        m_table->AppendItem(row);
    }
}

void ComparisonPanel::RebuildPlot() {
    if (!m_svc || m_doc->runs().empty() || m_tagChoice->GetCount() == 0) {
        m_plot->SetData({}, {}, "");
        return;
    }
    const std::string tag = m_tagChoice->GetStringSelection().utf8_string();
    std::vector<int64_t> ids;
    std::map<int64_t, int> index;
    for (auto& r : m_doc->runs()) { index[r.id] = (int)ids.size(); ids.push_back(r.id); }

    MetricsQuery q(m_svc);
    DecodedTable sd;
    std::map<int64_t, PlotSeries> lines;
    if (q.Run(SqlSeries(ids, tag), &sd)) {
        const int rc = sd.column("run"), sc = sd.column("step"), vc = sd.column("value");
        for (auto& row : sd.rows) {
            if (rc < 0) break;
            const int64_t id = row[rc].as_int();
            auto& s = lines[id];
            if (sc >= 0 && vc >= 0)
                s.points.emplace_back(row[sc].as_double(), row[vc].as_double());
        }
    }
    std::vector<PlotSeries> series;
    for (auto& r : m_doc->runs()) {
        auto it = lines.find(r.id);
        if (it == lines.end()) continue;
        PlotSeries s = std::move(it->second);
        s.color = RunColor(r, index[r.id]);
        s.label = r.label.empty() ? ("run " + std::to_string(r.id)) : r.label;
        series.push_back(std::move(s));
    }
    // Annotation markers for this tag.
    std::vector<PlotMarker> markers;
    for (auto& a : m_doc->annotations()) {
        if (a.tag != tag || a.step < 0) continue;
        PlotMarker m;
        m.step = static_cast<double>(a.step);
        m.color = wxColour(0xd6, 0x33, 0x6c);
        m.text = a.text;
        markers.push_back(std::move(m));
    }
    m_plot->SetData(std::move(series), std::move(markers), tag);
}

}  // namespace compass
