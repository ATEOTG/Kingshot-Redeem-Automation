import { PLAYER_IDS } from "./playerId.js";
import { firefox } from "playwright";
import fs from "fs";

const baseUrl = "https://ks-giftcode.centurygame.com/";
const result = {};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(min = 300, max = 800) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getGiftCode() {
  const args = process.argv.slice(2);
  const giftCodeArg = args.find((arg) => arg.startsWith("--giftcode="));
  const giftCode = giftCodeArg?.split("=")[1];
  return giftCode;
}

async function waitingButtonActionCompletion(page, endpoint, button) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes(endpoint) && r.request().method() === "POST",
      {}
    ),
    button.click(),
  ]);

  return await response.json();
}

async function loginAccount(page, playerId) {
  const loginInput = page.locator('input[placeholder="Player ID"]');
  const loginBtn = page.locator("div.login_btn");

  await loginInput.fill(playerId);

  const response = await waitingButtonActionCompletion(
    page,
    "/api/player",
    loginBtn
  );

  const errorCode = response.err_code;

  if (errorCode == 40004) {
    throw new Error(`Login failed for playerId - ${playerId}`);
  }
}

async function redeemGiftCode(page, giftCode, playerId) {
  const giftCodeInput = page.locator('input[placeholder="Enter Gift Code"]');
  const confirmGiftCodeBtn = page.locator("div.exchange_btn");

  await giftCodeInput.fill(giftCode);

  const response = await waitingButtonActionCompletion(
    page,
    "/api/gift_code",
    confirmGiftCodeBtn
  );

  const errorCode = response.err_code;

  if (errorCode == 40014) {
    throw new Error(`Gift Code not found - ${giftCode}`);
  } else if (errorCode == 40005 || errorCode === 40007) {
    throw Error(`Gift Code has expired - ${giftCode}`);
  } else if (errorCode == 40008) {
    console.log(`Gift Code already claimed for playerId - ${playerId}`);
    result[playerId] = "ALREADY CLAIMED";
  } else {
    console.log(`Gift code claimed for player - ${playerId}`);
    result[playerId] = "SUCCESSFULLY CLAIMED";
  }
}

async function logoutAccount(page) {
  const closeBtn = page.locator("div.close_btn");
  const retreatBtn = page.locator("div.exit_con");

  await closeBtn.click();
  await retreatBtn.click();
}

async function redemption(giftCode) {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  for (const playerId of PLAYER_IDS) {
    await loginAccount(page, playerId);
    await redeemGiftCode(page, giftCode, playerId);
    await logoutAccount(page);
    await sleep(jitter(1000, 2000));
  }

  await browser.close();
}

(async () => {
  const giftCode = getGiftCode();
  if (!giftCode) {
    console.error("You did not input a giftcode!");
    console.error("Usage: node kingshotRedeem.js --giftcode=XXXX");
    process.exit(1);
  }
  console.log("Reedeeming with Gift Code: " + giftCode);
  await redemption(giftCode);
  console.log("Redemption Complete.");
  fs.writeFileSync("kingshot_redeem_results.json", JSON.stringify(result));
})();
