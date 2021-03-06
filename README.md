# TKE Bid Vote
Voting app I wrote for my fraternity's bid vote. Uses node.js and socket.io to facilitate live voting, without the user needing to refresh the page.

Features:
- Voting happens in real-time.
- Voter can log in at any point in the vote and will still be able to vote.
- Admin can ban voters from voting on a specific vote.
- Protections keep votes from getting dropped or double counted.

Limitations:
- Live voting currently only works for one "room", i.e. the app can only be used by one group at a time.
- There is no support for users, so no password protection.
- No login information gets stored, so refreshing the page causes a sign-out.

To-Do:
- Add user support (using a database)
- Restyle website to look more professional. (Color palette change?)
- Store user info using a cookie or session variable, so user stays signed in when they refresh the page.
- Add support for multiple "rooms", i.e. multiple instances of the app running at once.
