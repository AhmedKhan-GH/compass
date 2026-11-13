## 1. Continue when the camera is ready now or later

The condition wait in the introduction checks whether readiness is already true and waits if it is not. An event control waits for a future change.

## 2. Give startup a bounded deadline

Initialize a local elapsed count and the output flag from the immediate observation. Continue only while readiness has not been observed and time remains. Each iteration waits one microsecond, advances the count, and observes readiness again. Checking the limit before the delay lets a call with a zero time limit return immediately.
