Got it — shape list + connection list, no code. Here's the DOUCSOFT main user journey in your exact visual grammar.

## Legend (match your sample)

| Shape | Meaning | Use for |
|---|---|---|
| White rounded pill | Terminator | START / END |
| Blue rect | Action / screen | a tap or a screen |
| Yellow diamond | Decision | any question |
| Purple parallelogram | Feedback / data | what the system returns |

## Main user flow

**Shapes** — number them, they're the connect list IDs:

| # | Shape | Text to type |
|---|---|---|
| 1 | Pill | START |
| 2 | Rect | Open the app |
| 3 | Diamond | Already logged in? |
| 4 | Rect | Welcome screen, pick language |
| 5 | Diamond | Sign up or log in? |
| 6 | Rect | Create account, choose role |
| 7 | Rect | Confirm your email |
| 8 | Rect | Fill in your profile |
| 9 | Rect | Housing feed with listings |
| 10 | Rect | Search or tap a filter |
| 11 | Diamond | Found a place? |
| 12 | Rect | Open the listing |
| 13 | Diamond | Your own listing? |
| 14 | Rect | Edit title, price, availability |
| 15 | Rect | Tap *Contact owner* |
| 16 | Rect | Chat opens |
| 17 | Rect | Send a message |
| 18 | Diamond | Save it? |
| 19 | Rect | Tap the heart to save |
| 20 | Diamond | Want to list something? |
| 21 | Rect | Press the **+** button |
| 22 | Diamond | Rent a place or sell an item? |
| 23 | Rect | Housing form, room to studio |
| 24 | Rect | Marketplace form, item for sale |
| 25 | Rect | Add photos and details |
| 26 | Rect | Listing goes live immediately |
| 27 | Parallelogram | Feedback: listing live, message sent |
| 28 | Pill | END |

**Connections:**

```
1  → 2
2  → 3
3  --YES--> 9
3  --NO---> 4
4  → 5
5  --Log in--> 9
5  --Sign up--> 6
6  → 7
7  → 8
8  → 9
9  → 10
10 → 11
11 --YES--> 12
11 --NO---> 20
12 → 13
13 --YES--> 14
13 --NO---> 15
14 → 20
15 → 16
16 → 17
17 → 18
18 --YES--> 19
18 --NO---> 20
19 → 20
20 --NO---> 28
20 --YES--> 21
21 → 22
22 --Rent a place--> 23
22 --Sell an item---> 24
23 → 25
24 → 25
25 → 26
26 → 9
```

`26 → 9` is the loop back to the feed, and `27` hangs off `26` as the feedback block.

## Verification sub-flow (separate diagram, two actors)

**User side:**

| # | Shape | Text |
|---|---|---|
| V1 | Pill | START |
| V2 | Diamond | Owner or agency? |
| V3 | Rect | Tap *Get verified* |
| V4 | Rect | Upload ID document |
| V5 | Parallelogram | Feedback: waiting for review |
| V6 | Diamond | Approved? |
| V7 | Rect | Verified badge appears |
| V8 | Pill | END |

```
V1 → V2
V2 --YES--> V3 → V4 → V5 → V6
V6 --YES--> V7 → V8
V6 --NO---> V5
V2 --NO---> V8
```

**Admin side:**

| # | Shape | Text |
|---|---|---|
| A1 | Pill | START |
| A2 | Rect | Log in to admin panel |
| A3 | Diamond | Is an admin? |
| A4 | Rect | Open verification queue |
| A5 | Diamond | Pending request? |
| A6 | Rect | Open the ID document |
| A7 | Diamond | Approve or reject? |
| A8 | Rect | Ask for a reason |
| A9 | Parallelogram | Feedback: user is notified |
| A10 | Rect | Open moderation queue |
| A11 | Pill | END |

```
A1 → A2 → A3
A3 --NO---> A11
A3 --YES--> A4 → A5
A5 --YES--> A6 → A7
A7 --Approve--> A9
A7 --Reject---> A8 → A9
A5 --NO---> A10 → A11
```

## Two things to know before you draw

**Box 10 is misleading if you leave it as-is.** In the real app `/housing/filters` and `/marketplace/filters` hold their filters in local state and just `router.back()` — they never reach the feed. Only the search bar and the housing type chips actually filter. Either label box 10 *"Search or tap a type chip"* to be accurate, or draw the filter screen as a dashed disconnected box.

**Box 3 has no failure path.** Only `src/app/index.tsx` checks the session. `/create`, `/housing/new`, `/onboarding` and everything under Account render with nobody logged in — RLS blocks the writes, but the user just sees a broken screen. If you want that on the diagram, insert a second diamond after 2: *"Route guarded?"* — NO → 4.

Want me to add a marketplace-only variant, or a separate diagram for the messaging thread (the dedup-on-recontact logic is the one genuinely tricky part)?