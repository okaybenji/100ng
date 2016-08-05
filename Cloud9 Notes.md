Note to self from Benji:
Keep server.js as is (with port 8080) and run `npm run start`
On the client, in index.js, use:
`const ws = new WebSocket('wss://l00ng-okaybenji.c9users.io:8080');`

Since the server seems to go down on occasion (not sure why yet), I've npm installed forever. To keep the server alive, run:
`forever start ./scripts/server/server.js`

If you need to restart the server, try `forever restart`
You can stop it with `forever stop`
If you accidentally run `forever start ./scripts/server/server.js` more than once, run `forever stopall` to stop all processes.