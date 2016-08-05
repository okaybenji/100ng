## TODO
* Figure out why server needs to double paddle height and ball height to get collision detection working!
* Tune paddle container height. Player movement is too restricted. (Note: Currently reach restrictions are disabled.)
* Turn paddle reach restriction back on. Improve the formula.
* Make and use pong font for score.
* Add SFX.
* Bugfix: As long as we're randomizing player positions when a player spawns, ensure server loop is aware of new state.
* Bugfix: Ah! Why does the server always think the ball is within the paddle's y bounds when I use predictive physics? TRY: IF it's in the paddle this frame, bounce; ELSE IF it will be beyond the paddle next frame, bounce.
