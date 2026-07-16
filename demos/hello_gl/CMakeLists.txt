# GL hello — window + buttons + an animated GL 3.3 sine wave on compass::Canvas2D.
# The "Your first app" tutorial (docs/wiki/tutorials/first-app.md) walks this file.
add_executable(hello_gl WIN32 hello_gl.cpp)
target_link_libraries(hello_gl PRIVATE compass_shell wxWidgets::wxWidgets)
