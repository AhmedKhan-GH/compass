# Signal Workbench logic library (Instrument #2, I3) — pure C++, wx-free.
# EDF parsing, waveform decimation, and the annotation document. Linked by the
# signal instrument and by the unit tests.
add_library(compass_signal STATIC
    edf_reader.cpp
    waveform_decimator.cpp
    signal_document.cpp
)
target_include_directories(compass_signal PUBLIC ${CMAKE_SOURCE_DIR}/src)
target_link_libraries(compass_signal PUBLIC compass_framework compass::json)
