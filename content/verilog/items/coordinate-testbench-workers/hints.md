## 1. Run independent traffic workers

Tasks can package individual timed transfers; separate fork branches make the producer and consumer independent.

## 2. Coordinate checking and termination

Let the consumer own result comparison and normal completion. Both the consumer and watchdog can stop the named worker group. Put `$finish` after `join`.
