import express from 'express';
import dotenv from 'dotenv';
import { Shopify } from '@shopify/shopify-api';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createApp } from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';
import crypto from 'crypto';

dotenv.config();

const host = 'localhost';
const port = 9000;

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_API_SCOPES, HOST } =
  process.env;

const shops = {};

Shopify.Context.initialize({
  API_KEY: SHOPIFY_API_KEY,
  API_SECRET_KEY: SHOPIFY_API_SECRET,
  SCOPES: SHOPIFY_API_SCOPES,
  HOST_NAME: HOST.replace(/https:\/\//, ''),
  IS_EMBEDDED_APP: true,
});

const bridgeApp = createApp({
  apiKey: SHOPIFY_API_KEY,
  host: 'YnJhdXp6LTItMC5teXNob3BpZnkuY29tL2FkbWlu',
});

const app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(cors());
// app.use(express.json());

app.get('/', async (req, res) => {
  //res.send('Hello World ! Test 3');
  if (typeof shops[req.query.shop] !== 'undefined') {
    // const sessionToken = await getSessionToken(bridgeApp);
    // console.log(sessionToken);
    res.send('Hello World');
  } else {
    res.redirect(`/auth?shop=${req.query.shop}`);
  }
});

app.get('/auth', async (req, res) => {
  const authRoute = await Shopify.Auth.beginAuth(
    req,
    res,
    req.query.shop,
    '/auth/callback',
    false
  );
  res.redirect(authRoute);
});

app.get('/auth/callback', async (req, res) => {
  const shopSession = await Shopify.Auth.validateAuthCallback(
    req,
    res,
    req.query
  );
  console.log(shopSession);
  shops[shopSession.shop] = shopSession;
  res.redirect(`/?shop=${shopSession.shop}&host=${req.query.host}`);
  // res.redirect(
  //   `https://${shopSession.shop}/admin/apps/custom-subscriptions-manager`
  // );
});

async function verifyRequest(req, res, next) {
  console.log(req.query);

  // DESTRUCTURE signature and rest of query object
  const { signature, ...restQueryString } = req.query;

  if (signature && restQueryString) {
    // console.log(signature, restQueryString);

    // Prepare the query string for hashing by
    // sorting and concatenating into a string
    const sortedParams = Object.keys(restQueryString)
      .sort()
      .reduce((accumulator, key) => {
        accumulator += key + '=' + restQueryString[key];

        return accumulator;
      }, '');
    // console.log(sortedParams);

    // Calculate the hex digest of sortedParams
    const calculatedSignature = calculateHexDigest(sortedParams);

    // console.log(calculatedSignature);
    // console.log(signature);

    // Check if both signatures are same. If yes,
    // goto next step. If no, return 400 status error
    if (calculatedSignature == signature) {
      next();
    } else {
      console.log('Unauthenticated request');
      res.status(400).send(`Unauthenticated Request`);
    }
  } else {
    console.log('Unauthenticated request');
    res.status(400).send(`Unauthenticated Request`);
  }
}

app.post(
  '/subscriptions',
  urlencodedParser,
  verifyRequest,
  async (req, res) => {
    // console.log(req.body.customer);
    // console.log(req.query.path_prefix);
    // console.log(req.query.timestamp);
    // console.log(req.query.shop);
    // console.log(req.query.signature);

    const query = `query {
      subscriptions(email:"${req.body.customer}",statuses:[ACTIVATED,PAUSED]){
        nodes{
            id
            token
            currency
            paidAmount
            status
            products {
              imageUrl
            }
            activePlan {
              id
              name
            } 
        }
      }
    }`;

    const response = await axios({
      method: 'post',
      url: 'https://portal.firmhouse.com/graphql',
      headers: {
        'X-PROJECT-ACCESS-TOKEN': 'fCZur8VJcPP2P2ASnmZRLonr',
      },
      data: {
        query: query,
      },
    });

    //console.log(response.data.data.subscriptions.nodes);
    res.json(response.data);
  }
);

// Cancel subscription
app.post(
  '/subscriptions/cancelSubscription',
  urlencodedParser,
  verifyRequest,
  async (req, res) => {
    const query = `mutation{
      cancelSubscription(input:{
        id:${req.body.subscriptionId}
      }){
        errors{
          message
        }
        subscription{
           id
        }
      }
    }
`;

    const response = await axios({
      method: 'post',
      url: 'https://portal.firmhouse.com/graphql',
      headers: {
        'X-PROJECT-ACCESS-TOKEN': 'fCZur8VJcPP2P2ASnmZRLonr',
      },
      data: {
        query: query,
      },
    });

    //console.log(response.data.data.subscriptions.nodes);
    res.json(response.data);
  }
);

// Pause Subscription
app.post(
  '/subscriptions/pauseSubscription',
  urlencodedParser,
  verifyRequest,
  async (req, res) => {
    const query = `mutation{
      pauseSubscription(input:{
        id:${req.body.subscriptionId}
      }){
        errors{
          message
        }
        subscription{
           id
        }
      }
    }
`;

    const response = await axios({
      method: 'post',
      url: 'https://portal.firmhouse.com/graphql',
      headers: {
        'X-PROJECT-ACCESS-TOKEN': 'fCZur8VJcPP2P2ASnmZRLonr',
      },
      data: {
        query: query,
      },
    });

    //console.log(response.data.data.subscriptions.nodes);
    res.json(response.data);
  }
);

// Resume Subscription
app.post(
  '/subscriptions/resumeSubscription',
  urlencodedParser,
  verifyRequest,
  async (req, res) => {
    const query = `mutation{
      resumeSubscription(input:{
        id:${req.body.subscriptionId}
      }){
        errors{
          message
        }
        subscription{
           id
        }
      }
    }
`;

    const response = await axios({
      method: 'post',
      url: 'https://portal.firmhouse.com/graphql',
      headers: {
        'X-PROJECT-ACCESS-TOKEN': 'fCZur8VJcPP2P2ASnmZRLonr',
      },
      data: {
        query: query,
      },
    });

    //console.log(response.data.data.subscriptions.nodes);
    res.json(response.data);
  }
);

// Get single subscription details
app.post(
  '/subscriptions/getSubscription',
  urlencodedParser,
  verifyRequest,
  async (req, res) => {
    const query = `query{
      getSubscription(token:"${req.body.token}"){
              id
              name
              lastName
              startDate
              paidAmount
              paymentMethod
              address
              houseNumber
              zipcode
              city
              country
              locale
              email
              phoneNumber
              status
              orders{
                id
                status
                shipmentDate
                amountCents
                invoice{
                id
                status
                detailsUrl
                }
            }
             orderedProducts{
                id
                shipmentDate
                quantity
                product{
                 id
                 title
                 priceWithSymbol
                 interval
                 intervalUnitOfMeasure
                }
            }
        }
      }`;

    const response = await axios({
      method: 'post',
      url: 'https://portal.firmhouse.com/graphql',
      headers: {
        'X-PROJECT-ACCESS-TOKEN': 'fCZur8VJcPP2P2ASnmZRLonr',
      },
      data: {
        query: query,
      },
    });

    //console.log(response.data.data.subscriptions.nodes);
    res.json(response.data);
  }
);

// Create Subscription
app.post(
  '/subscriptions/createSubscription',
  urlencodedParser,
  verifyRequest,
  async (req, res) => {
    // req.body = JSON.parse(req.body);
    console.log(JSON.parse(req.body.products));
    const query = `mutation {
      createSubscription(input: {
        name: "${req.body.firstName}",
        lastName:"${req.body.lastName}",
        address: "${req.body.address2}", 
        houseNumber: "${req.body.address1}", 
        zipcode: "${req.body.zip}", 
        city: "${req.body.city}", 
        country: "${req.body.country}",
        email: "${req.body.email}", 
        phoneNumber: "${req.body.phone}",
        returnUrl: "http://example.com/thank-you", 
        paymentPageUrl: "http://example.com/cart", 
        orderedProducts:${req.body.products.replace(/"/g, '')}
        }) {
        paymentUrl
        subscription{
          token
          checkoutUrl
          name
          lastName
          address
          houseNumber
          city
          zipcode
          country
          email
          phoneNumber
          orderedProducts{
            productId
            quantity
          }
        }
        errors {
          attribute
          message
          path
        }
      }
    }
`;
    console.log(query);
    const response = await axios({
      method: 'post',
      url: 'https://portal.firmhouse.com/graphql',
      headers: {
        'X-PROJECT-ACCESS-TOKEN': 'fCZur8VJcPP2P2ASnmZRLonr',
      },
      data: {
        query: query,
      },
    });

    // console.log(response.data.data.subscriptions.nodes);
    // console.log(response.data.data);
    res.json(response.data);
  }
);

function calculateHexDigest(query) {
  var hmac = crypto.createHmac('sha256', SHOPIFY_API_SECRET);

  //passing the data to be hashed
  const data = hmac.update(query);

  //Creating the hmac in the required format
  const gen_hmac = data.digest('hex');

  //Printing the output on the console
  // console.log('hmac : ' + gen_hmac);
  return gen_hmac;
}

app.listen(port, () => {
  console.log('App is running on port ' + port);
});
