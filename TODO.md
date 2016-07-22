## TODO
* Fix server tracking of player positions.
* Tune paddle container height. Player movement is too restricted.
* Make and use pong font for score.
* Add SFX.
* Bugfix: We add player to right side team if there's an odd number of players, even if the right side team has more players.
* Bugfix: As long as we're randomizing player positions when a player spawns, ensure server loop is aware of new state.
* Bugfix: Ah! Why does the server always think the ball is within the paddle's y bounds when I use predictive physics?
