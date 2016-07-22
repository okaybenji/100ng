## TODO
* Fix server tracking of player positions.
* Tune paddle container height. Player movement is too restricted.
* Make and use pong font for score.
* Add SFX.
* Bugfix: We add player to right side team if there's an odd number of players, even if the right side team has more players.
* Bugfix: As long as we're randomizing player positions when a player spawns, ensure server loop is aware of new state.
* Temporarily increased server update rate from 6 to 12 to help prevent ball from passing through paddles. Undo this, and add a check to see if ball would have passed through a paddle between frames.
