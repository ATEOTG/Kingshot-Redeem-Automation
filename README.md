## Kingshot Gift Code Redeemer

This project is a Node.js automation script built with Playwright that redeems a Kingshot gift code for multiple player IDs in sequence. It simulates real user behavior by interacting with the official gift code webpage, handling login, redemption, logout. The script accepts a gift code via a CLI argument, iterates over a list of player IDs, and safely redeems the code while respecting server limits using delays. Requires Node.js and Playwright to run.

### How to Run

1. Install dependencies:
   `npm install`
2. Install Playwright browsers (required once):
   `npx playwright install`
3. Populate playerId.js with the player IDs you want to redeem the gift code for.
4. Run the script with the gift code:
   `npm run redeem -- --giftcode=XXXXX`
