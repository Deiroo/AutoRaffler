var raffles;
var slugs = [];
import nodemailer from "nodemailer";
import fetch, {Headers} from "node-fetch";
import { fileURLToPath } from 'url';
// Replace 'YOUR_API_KEY' with your actual API key
const __filename = fileURLToPath(import.meta.url);
const apiKey = '@ALPHABOT-API-KEY';

const numCalls = 3;
async function getRaffles() {
  for(let i = 0; i < numCalls; i++){
    try {
    var response = await fetch('https://api.alphabot.app/v1/raffles?' + new URLSearchParams({
            sortDir: 1,
            sort: "ending",
            pageSize: 50,
            pageNum: i,
            filter: "unregistered"}), {
        method: 'GET',
        headers: new Headers({
        Authorization: `Bearer ${apiKey}`,
        }),

    });
    if (!response.ok) {
      mailOptionsError.text += response.status;
      mailOptionsError.text += " " + response.statusText;
      transporter.sendMail(mailOptionsError);
    }

    var data = await response.json();

    raffles = data.data.raffles
    if (Array.isArray(raffles)) { // Check if data is an array
        for (const item of raffles) {
        slugs.push(item.slug);
        }
    } else {
        console.warn("Data is not an array, cannot extract slugs.");
    }
    
    
    
    } catch (error) {
    transporter.sendMail(mailOptionsError, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    }
  }
}

async function register(slugs) {
  const callsPerMinute = 3; // Maximum calls per minute
  const delay = (60 * 1000); // Delay between calls in milliseconds

  let startTime = Date.now();
  let callsMade = 0;
    for (const slug of slugs) {
      if (callsMade >= callsPerMinute) {
        const timeSinceStart = Date.now() - startTime;
        const waitTime = Math.max(0, delay - timeSinceStart); // Wait for remaining time in the minute
  
        //console.log(`Rate limit reached, waiting for ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
  
        startTime = Date.now(); // Reset start time for the next minute
        callsMade = 0;
      }
      //console.log(slug);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 10 seconds timeout
  
      try {
        const response = await fetch('https://api.alphabot.app/v1/register', {
          method: 'POST',
          body: JSON.stringify({
            slug: slug,
          }),
          headers: new Headers({
            Authorization: `Bearer ${apiKey}`,
          }),
          signal: controller.signal, // Add signal for timeout
        });
  
        clearTimeout(timeoutId); // Clear timeout if response received
  
        if (!response.ok) {
          throw new Error(`Error when registering: ${response.statusText}`);
        } else {
          //console.log(response.statusText);
          callsMade++;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          //console.warn(`Registration timed out for slug: ${slug}`);
          callsMade++;
        } else {
          //console.error(error);
          callsMade++;
        }
      } finally {
        clearTimeout(timeoutId); // Ensure timeout is cleared even on errors
      }
    }
  }

  
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'placeholder@gmail.com',
      pass: 'app Password',
    },
  });
  
  var mailOptionsError = {
    from: 'placeholder@gmail.com',
    to: 'placeholder2@gmail.com',
    subject: 'AutoRaffler was not run successfully',
    text: 'AutoRaffler was not run successfully, please fix '  + __filename
  };

   

  await getRaffles();
  register(slugs);










