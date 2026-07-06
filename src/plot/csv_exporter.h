// Compass — Plot Workbench (Instrument #1)
// CsvExporter: sampled curve values → CSV, for use in spreadsheets/scripts.
// Pure C++, headless, wx-free.

#ifndef COMPASS_PLOT_CSV_EXPORTER_H
#define COMPASS_PLOT_CSV_EXPORTER_H

#include <string>
#include <vector>

namespace plot {

// Sample each expression at `rows` uniform x-values across [xmin, xmax] and
// format as CSV: header row "x,<expr0>,<expr1>,...", then one row per sample.
// Non-finite results (gaps) are written as empty cells. Returns "" if there are
// no expressions, rows < 1, or xmin >= xmax. Expression text used as a column
// header is CSV-escaped.
std::string ExportCsv(const std::vector<std::string>& expressions, double xmin,
                      double xmax, int rows);

}  // namespace plot

#endif  // COMPASS_PLOT_CSV_EXPORTER_H
