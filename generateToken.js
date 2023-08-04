import dotenv from "dotenv";
dotenv.config();
import  fs from 'fs';
import axios from "axios";
const graphApiVersion = process.env.FACEBOOK_API_VERSION;
const appId = process.env.FACEBOOK_APP_ID;
const appSecret = process.env.FACEBOOK_APP_SECRET;
const yourAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

const url = `https://graph.facebook.com/${graphApiVersion}/oauth/access_token`;

const params = new URLSearchParams();
params.append('grant_type', 'fb_exchange_token');
params.append('client_id', appId);
params.append('client_secret', appSecret);
params.append('fb_exchange_token', yourAccessToken);

axios
  .get(url, { params })
  .then((response) => {
    console.log('Response:', response.data);

    // Create the JSON object
    const jsonObject = {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in
    };

    // Convert the JSON object to a JSON string with 2 spaces indentation for readability
    const jsonString = JSON.stringify(jsonObject, null, 2);

    // Write the JSON string to a file named "response.json"
    fs.writeFile('token.json', jsonString, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('Response written to token.json file successfully.');
      }
    });
  })
  .catch((error) => {
    console.error('Error:', error.response.data);
  });
