import FB from "fb";
import { TwitterApi } from "twitter-api-v2";
//Documentation is here: https://www.npmjs.com/package/twitter-api-v2
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// Read the JSON file and parse its contents
const tokenFile = fs.readFileSync("token.json", "utf8");
const token = JSON.parse(tokenFile);

// Set the access token for Facebook Graph API
FB.setAccessToken(token.access_token);

let twitter = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_KEY_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
  bearerToken: process.env.TWITTER_BEARER_TOKEN,
});
twitter = twitter.readWrite;

export function facebook(post, image) {
  if (
    process.env.FACEBOOK_PAGE_ID &&
    process.env.FACEBOOK_USER_ID &&
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_SECRET &&
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  ) {
    if (image) {
      // If an image URL is provided, upload the image first
      FB.api(
        `/${process.env.FACEBOOK_PAGE_ID}/photos`,
        "POST",
        {
          url: image,
          caption: post,
        },
        function (response) {
          if (!response || response.error) {
            console.log("Facebook Image Upload Error: ", response.error);
            return;
          }

          // The response will contain the ID of the uploaded photo, which we can use in the post
          const photoId = response.id;

          // Now, create a post with a link to the uploaded photo
          FB.api(
            `/${process.env.FACEBOOK_PAGE_ID}/feed`,
            "POST",
            {
              message: post,
              link: `https://www.facebook.com/photo.php?fbid=${photoId}`, // Link to the uploaded photo
            },
            function (postResponse) {
              if (!postResponse || postResponse.error) {
                console.log(
                  "Facebook Page Posting Error: ",
                  postResponse.error
                );
                return;
              } else {
                console.log("Successfully posted on Facebook: ", postResponse);
              }
            }
          );
        }
      );
    } else {
      // If no image URL is provided, just create a text post
      FB.api(
        `/${process.env.FACEBOOK_PAGE_ID}/feed`,
        "POST",
        { message: post },
        function (postResponse) {
          if (!postResponse || postResponse.error) {
            if (
              postResponse.error &&
              postResponse.error.code === 190 &&
              postResponse.error.error_subcode === 463
            ) {
              console.log("Error: Access token has expired.");
              // Perform actions to refresh or obtain a new access token if necessary
              // For example, you can call a function to renew the access token and retry the post
              // renewAccessToken().then(() => retryPost());
            } else {
              console.error(
                "Facebook Page Posting Error: ",
                postResponse.error
              );
            }
          } else {
            console.log("Successfully posted on Facebook: ", postResponse);
          }
        }
      );
    }
  } else {
    console.log("Posting on Facebook require settings first. Not able to Post");
  }
}

export function fbDelete(post_id) {
  if (
    process.env.FACEBOOK_PAGE_ID &&
    process.env.FACEBOOK_USER_ID &&
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_SECRET &&
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  ) {
    FB.api(post_id, "delete", function (response) {
      if (!response || response.error) {
        console.log("Error occured", response);
      } else {
        console.log("Post was deleted");
      }
    });
  } else {
    console.log(
      "Deleting on Facebook require settings first. Not able to Post"
    );
  }
}
export async function tweet(post, image) {
  if (
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_KEY_SECRET &&
    process.env.TWITTER_BEARER_TOKEN &&
    process.env.TWITTER_CLIENT_ID &&
    process.env.TWITTER_CLIENT_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_SECRET
  ) {
    try {
      // Check if an image was provided
      if (image) {
        // Upload the image to Twitter
        const mediaId = await twitter.v1.uploadMedia(image);
        // Create the tweet
        const tweet = {
          text: post,
          media: { media_ids: [mediaId] },
        };

        // Tweet the post
        const tweeted = await twitter.v2.tweet(tweet);
        console.log("Tweet was posted successfully", tweeted);
      } else {
        // No image was provided, so just tweet the post
        const tweeted = await twitter.v2.tweet(post);
        console.log("Tweet was posted successfully", tweeted);
      }
    } catch (error) {
      console.log("Failed to Tweet : ", error);
      return;
    }
  } else {
    console.log("Posting on Twitter require settings first. Not able to Post");
  }
}
export function whatsapp(post) {
  if (
    process.env.WHATSAPP_GROUP_IDS &&
    process.env.WHATSAPP_TOKEN &&
    process.env.WHATSAPP_INSTANCE_ID
  ) {
    const groupIds = process.env.WHATSAPP_GROUP_IDS.split(","); // Convert the comma-separated string to an array
    const postGap = process.env.WHATSAPP_POST_GAP * 1000 || 5000; // Default gap of 5 seconds if not provided
    const headers = {
      "Content-Type": "application/json",
    };

    let sendMessageToGroup = (groupId) => {
      let url;
      let payload;
      if (post.image) {
        payload = {
          chatId: groupId,
          urlFile: post.image,
          fileName: "image.png",
          caption: post.caption || "",
        };
        url = `https://api.green-api.com/waInstance${process.env.WHATSAPP_INSTANCE_ID}/sendFileByUrl/${process.env.WHATSAPP_TOKEN}`;
      } else {
        payload = {
          chatId: groupId,
          message: post,
        };
        url = `https://api.green-api.com/waInstance${process.env.WHATSAPP_INSTANCE_ID}/sendMessage/${process.env.WHATSAPP_TOKEN}`;
      }
      axios
        .post(url, payload, { headers })
        .then((response) => {
          console.log(
            `Message sent to group ${groupId}:`,
            JSON.stringify(response.data)
          );
        })
        .catch((error) => {
          console.log(`Error sending message to group ${groupId}:`, error);
        });
    };

    const sendMessageWithGap = (index) => {
      if (index >= groupIds.length) return;
      const groupId = groupIds[index];
      sendMessageToGroup(groupId);
      setTimeout(() => {
        sendMessageWithGap(index + 1);
      }, postGap);
    };

    sendMessageWithGap(0);
  } else {
    console.log(
      "Posting on Whatsapp requires settings first. Not able to Post"
    );
  }
}
