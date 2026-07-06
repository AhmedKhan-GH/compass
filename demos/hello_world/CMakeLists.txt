# Hello-world demo: the smallest binary the Compass architecture produces.
# Links static wx only — the fresh-install guarantee at its most minimal.
add_executable(hello_world WIN32 hello_world.cpp)
target_link_libraries(hello_world PRIVATE wxWidgets::wxWidgets)
