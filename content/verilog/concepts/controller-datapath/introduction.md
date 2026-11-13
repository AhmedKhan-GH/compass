The **datapath** stores values and does calculations. The **controller** decides when to do each step. When a job takes several clock edges, accepting a request and carrying out the job are separate steps.

Before coding, list the values you need to store, what can change them, and when each change should happen. With nonblocking assignments, the controller reads the values from before the clock edge and schedules the new values together.

A completion pulse lasts one cycle, but the result can stay available afterward. Decide what happens when a request asks for no work, or when a new request arrives before the current job is done.
