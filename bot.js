import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import fs from "fs";
import fetch from "node-fetch";
// import { whatsapp, facebook, tweet, fbDelete } from './socialAPI.js';
import { facebook, whatsapp, tweet, fbDelete } from "./socialAPI.js";
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

bot.use(async (ctx, next) => { 
  const photos = ctx.message ? ctx.message.photo : ctx.channelPost ?  ctx.channelPost.photo : null
  const msg = ctx.message ? ctx.message : ctx.channelPost ?  ctx.channelPost : null
  // console.log("Photos  ",photos, " Ctx : ",ctx);
  if (photos && photos.length > 0) {
    //Send Images
    let largestPhoto = photos[0];
    for (const photo of photos) {
      if (photo.file_size > largestPhoto.file_size) {
        largestPhoto = photo;
      }
    }
    const file_id = largestPhoto.file_id;
    const file_unique_id = largestPhoto.file_unique_id;
    const file = await bot.telegram.getFileLink(file_id, file_unique_id);
    const localLink = await downloadImage(file.href);
    whatsapp({ image: file.href, caption: msg.caption });
    facebook(msg.caption, file.href);
    if (localLink) tweet(msg.caption, localLink);
  }
  if (msg && msg.text) {
    whatsapp(msg.text);
    facebook(msg.text);
    if (msg.text.length <= 280) {
      tweet(msg.text);
    } else {
      console.log(
        "Tweet failed. Characters are more than tweet limit of 280. "
      );
    }
  }
  await next();
});

async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to download image");
    }

    const file = await response.arrayBuffer(); // Use response.arrayBuffer() to get the binary data of the image

    const path = "./image.png"; // Set the path where you want to save the downloaded image
    fs.writeFileSync(path, Buffer.from(file)); // Write the binary data to the file

    console.log(`File written to disk: ${path}`);
    return path;
  } catch (err) {
    console.error("Error downloading image:", err.message);
  }
}

bot.start((ctx) => {
  ctx.reply("You started the bot");
});
bot.help((ctx) => {
  ctx.reply("You started help");
});

bot.settings((ctx) => {
  ctx.reply("You started settings");
});

bot.launch();
