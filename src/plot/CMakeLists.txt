# Plot Workbench logic library (Instrument #1, I1) — pure C++, wx-free.
# Linked by the compass app (for the canvas/panels) and by the unit tests.
add_library(compass_plot STATIC
    expression.cpp
    sampler.cpp
    plot_document.cpp
    csv_exporter.cpp
)
target_include_directories(compass_plot PUBLIC ${CMAKE_SOURCE_DIR}/src)
target_link_libraries(compass_plot PUBLIC compass_framework)
