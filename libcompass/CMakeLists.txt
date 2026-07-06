# libcompass — Layer 1, the instrument framework (PLATFORM.md §5.3).
# Extracted from Instrument #1 at I2 (CD9). Header-only for now (compass::Document);
# App / DocumentFrame / export helpers join as they're extracted from the shell.
add_library(compass_framework INTERFACE)
target_include_directories(compass_framework INTERFACE include)
target_compile_features(compass_framework INTERFACE cxx_std_20)
