- include opposite agent ID as context
- publish accounts payable and receivables to agent (is this a different type of event?)
- how to keep context persistent?

- is this the best architecture? stream in AP/AR, if needs money, trigger MCP to start thread. once thread is started, should just be able to run with A2A back and forth? can use context id and task id to stay aligned potentially

- how to exit out of a conversation? potential for it to be an endless loop
