const MESSAGE = require("../models/gpt");
const GUSER = require("../models/googleauth");
const USER = require("../models/auth");
const EXTRA = require("../models/extrauser");
const CONVERSATION = require("../models/conversation");
const axios = require("axios");
require("dotenv").config();
const { JSDOM } = require("jsdom");
const HttpError = require("../helper/HttpError");
const bcrypt = require("bcryptjs");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
const IMAGETEXT = require("../models/imagetext");
const DATAMODEL = require("../models/jsonDataModel");

const createGpt = async (req, res, next) => {
  const openAi = req.app.get("gpt");
  const { extraId, message, messages, text, converId, model, paidUser } =
    req.body;

  let sentence = "";

  //protect block
  let blockUser;
  try {
    blockUser = await USER.findOne({ extraId: extraId });
  } catch (err) {
    const errors = new HttpError("Find block user failed", 500);
    return next(errors);
  }

  if (!blockUser) {
    blockUser = await GUSER.findOne({ extraId: extraId });
  }

  if (blockUser?.block) {
    const errors = new HttpError("Sorry your account has been blocked", 500);
    return next(errors);
  }
  //protect block

  //protection
  let lmessages;
  if (!req.body.token) {
    try {
      lmessages = await MESSAGE.find({ userId: req.body.extraId });
    } catch (err) {
      const errors = new HttpError("Message find failed", 500);
      return next(errors);
    }
    if (lmessages.length === 1) {
      const errors = new HttpError(
        "Login / Signup for free to send more messages.",
        500
      );
      return next(errors);
    }
  }
  //protection

  //protection paid

  if (req.body.token && paidUser !== "active") {
    if (blockUser.messages.length === 2) {
      const errors = new HttpError(
        " Upgrade to Dr. Mega Plus to send more messages. Message limits will reset on the first day of each month.",
        500
      );
      return next(errors);
    }
  }
  //protection paid

  try {
    const result = await IMAGETEXT.find({ userId: extraId });
    sentence = result.map((item) => item.imagetext).toString();
  } catch (err) {
    const errors = new HttpError("Image Text fetch failed", 500);
    return next(errors);
  }

  let dbData;

  try {
    dbData = await MESSAGE.find({
      $and: [{ userId: extraId }, { conversationId: converId }],
    });
  } catch (err) {
    const errors = new HttpError("fetch message failed", 500);
    return next(errors);
  }

  let extraData;

  try {
    extraData = await EXTRA.find({
      $and: [{ userId: extraId }, { conversationId: converId }],
    });
  } catch (err) {
    const errors = new HttpError("fetch symptoms failed", 500);
    return next(errors);
  }

  let assistantData = dbData.map((item) => item.gpt);
  let userData = dbData.map((item) => item.user);
  let extraUserData = extraData.map((item) => item.user);
  //let assistantData = dbData.map((item) => item.gpt);

  const assisGpt = assistantData.toString() || " ";
  const userGpt = userData.toString() || " ";
  const extraUserGpt = extraUserData.toString() || " ";

  openAi
    .createChatCompletion({
      model: model,

      messages: [
        {
          role: "system",
          content:
            "You are AI physician chatbot and helpful assistance. You will provide any medical concerns information to the users based on their symptoms. And always try to answer smartly so that user can understand easily",
        },
        {
          role: "assistant",
          content: assisGpt,
        },

        {
          role: "user",
          content: userGpt,
        },
        {
          role: "user",
          content: extraUserGpt,
        },
        {
          role: "user",
          content: sentence,
        },
        {
          role: "user",
          content: message,
        },
        {
          role: "user",
          content: text,
        },
      ],
    })
    .then(async (ress) => {
      res.status(200).json({
        result: ress.data,
      });
    })
    .catch((err) => {
      const errors = new HttpError(
        `${err.response.statusText} to chatgpt api`,
        err.response.status
      );
      return next(errors);
    });
};

const imageToTextGenerator = async (req, res, next) => {
  const openAi = req.app.get("gpt2");
  const { extraId, token, image, converId, model, paidUser } = req.body;

  let sentence = "";
  let CONFIGDB = "";
  //protect block
  let blockUser;
  try {
    blockUser = await USER.findOne({ extraId: extraId });
  } catch (err) {
    const errors = new HttpError("Find block user failed", 500);
    return next(errors);
  }

  if (!blockUser) {
    blockUser = await GUSER.findOne({ extraId: req.body.extraId });
  }

  if (blockUser?.block) {
    const errors = new HttpError("Sorry your account has been blocked", 500);
    return next(errors);
  }
  //protect block

  //protection
  let lmessages;
  if (!token) {
    try {
      lmessages = await MESSAGE.find({ userId: extraId });
    } catch (err) {
      const errors = new HttpError("fetch messages failed", 500);
      return next(errors);
    }
    if (lmessages.length === 1) {
      const errors = new HttpError(
        "Login / Signup for free to send more messages.",
        500
      );
      return next(errors);
    }
  }
  //protection

  //protection paid

  if (req.body.token && paidUser !== "active") {
    if (blockUser.messages.length === 2) {
      const errors = new HttpError(
        " Upgrade to Dr. Mega Plus to send more messages. Message limits will reset on the first day of each month.",
        500
      );
      return next(errors);
    }
  }
  //protection paid

  //get json data from user
  try {
    CONFIGDB = await DATAMODEL.findOne();
  } catch (err) {
    const errors = new HttpError("find json data failed", 500);
    return next(errors);
  }

  //get json data from user

  //parsing image

  if (!CONFIGDB) {
    const errors = new HttpError(
      "Please  insert Json key for vision Api from admin panel",
      500
    );
    return next(errors);
  }

  if (image) {
    const CONFIG = {
      credentials: {
        private_key: CONFIGDB.private_key,
        client_email: CONFIGDB.client_email,
      },
    };

    const client = new ImageAnnotatorClient(CONFIG);
    let [result] = await client.textDetection(image);

    const ress = result.textAnnotations[0].description.split("\n");
    sentence = ress.join(" ");
    try {
      await IMAGETEXT.create({
        userId: extraId,
        imagetext: sentence,
        conversationId: converId,
      });
    } catch (err) {
      const errors = new HttpError("Create Image to text failed", 500);
      return next(errors);
    }
  }

  try {
    const result = await IMAGETEXT.find({
      $and: [{ userId: extraId }, { conversationId: converId }],
    });
    sentence = result.map((item) => item.imagetext).toString();
  } catch (err) {
    const errors = new HttpError("Find Image to text failed", 500);
    return next(errors);
  }

  //parsing image

  openAi
    .createChatCompletion({
      model: model,

      messages: [
        {
          role: "system",
          content:
            "You are AI Medicine Specialist chatbot. User will provide you the name of a medicine or prescription then you will describe the manufacturer ,uses, dosage, side effects, precaution of that medicine. Your response will be like that Manufacturer : describe the Manufacturer part. Uses : desribe the uses and follow the same rules for others parts",
        },

        {
          role: "user",
          content: sentence,
        },
      ],
    })
    .then((ress) => {
      res.status(200).json({ result: ress.data });
    })
    .catch((err) => {
      const errors = new HttpError(
        `${err.response.statusText} to chatgpt api`,
        err.response.status
      );
      return next(errors);
    });
};

const autoMessageGenrator = async (req, res, next) => {
  const openAi = req.app.get("gpt2");
  const { text, extraId, token, converId, model, paidUser } = req.body;
  console.log(text);
  //protect block
  let blockUser;
  try {
    blockUser = await USER.findOne({ extraId: extraId });
  } catch (err) {
    const errors = new HttpError("Find block user failed", 500);
    return next(errors);
  }

  if (!blockUser) {
    blockUser = await GUSER.findOne({ extraId: req.body.extraId });
  }

  if (blockUser?.block) {
    const errors = new HttpError("Sorry your account has been blocked", 500);
    return next(errors);
  }
  //protect block

  //protection
  let lmessages;
  if (!token) {
    try {
      lmessages = await MESSAGE.find({ userId: extraId });
    } catch (err) {
      const errors = new HttpError("Messages fetch failed", 500);
      return next(errors);
    }
    if (lmessages.length === 1) {
      const errors = new HttpError(
        "Login / Signup for free to send more messages.",
        500
      );
      return next(errors);
    }
  }
  //protection
  //protection paid

  if (req.body.token && paidUser !== "active") {
    if (blockUser.messages.length === 2) {
      const errors = new HttpError(
        " Upgrade to Dr. Mega Plus to send more messages. Message limits will reset on the first day of each month.",
        500
      );
      return next(errors);
    }
  }
  //protection paid
  openAi
    .createChatCompletion({
      model: model,

      messages: [
        {
          role: "system",
          content:
            "You are AI physician chatbot and helpful assistance for auto question generator to make it easier for the user to ask next the questions. you will generate exactly four suggestion question based on user question and remember one thing you will only generate question if the user ask for medical information. Just genrate four question nothing else and organized them by serial number for example 1, 2, 3, 4",
        },

        {
          role: "user",
          content: text,
        },
      ],
    })
    .then((ress) => {
      var input = ress.data.choices[0].message.content;

      var serialNumber = /\d+\.\s+/; // Regular expression to match the serial number pattern followed by one or more whitespaces

      var result = input.split(serialNumber);
      res.status(200).json({ result: result });
    })
    .catch((err) => {
      const errors = new HttpError(
        `${err.response.statusText} to chatgpt api`,
        err.response.status
      );
      return next(errors);
    });
};

const symptomsGenarator = async (req, res, next) => {
  const { model, text } = req.body;
  const openAi = req.app.get("gpt3");

  openAi
    .createChatCompletion({
      model: model,

      messages: [
        {
          role: "system",
          content:
            "You are AI symptoms detector chatbot designed to findout only symptoms from user prompt only symptoms nothing else remember that. For example if a user tell I am suffering from fever. In this line there is symptoms keywords so you will just provide this single word fever as a response nothig else this is really important always remember that you will not provide any other word. if a user provide multiples symptoms you will separate them by comma , but if a user said hello, who are you, goodbye, suggest me something or any other question if you don't find any symptoms in user prompt your response will be null. Because there is no symptoms you are designed for finding symptoms keyword from user prompt nothing else always remember that if you didnt find any symptoms from user prompt your response will be null",
        },
        {
          role: "user",
          content: text,
        },
      ],
    })
    .then((ress) => {
      const test = ress.data.choices[0].message.content;
      const test2 = test.split(",");

      res.status(200).json({ result: test2 });
    })
    .catch((err) => {
      const errors = new HttpError(
        `${err.response.statusText} to chatgpt api`,
        err.response.status
      );
      return next(errors);
    });
};

const pubmedArticles = async (req, res, next) => {
  const { text } = req.body;

  let articlesData = [];
  let articles = [];
  const apiKey = process.env.PUBMED_API_KEY;

  const apiUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${text}%20AND%20medicine&retmax=4&retmode=json&api_key=${apiKey}`;

  try {
    const response = await axios.get(apiUrl);
    const pubmedIds = response.data.esearchresult.idlist;

    if (pubmedIds.length > 0) {
      const joinedIds = pubmedIds.join(",");
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${joinedIds}&retmode=xml&api_key=${apiKey}`;

      const articlesResponse = await axios.get(fetchUrl);
      articlesData = articlesResponse.data;

      // Parse the XML response to extract article details
      const dom = new JSDOM(articlesData);
      const articleElements =
        dom.window.document.querySelectorAll("PubmedArticle");

      // Clear the articles array before populating it
      articles = [];

      // Extract the article information and store it in the articles array
      articleElements.forEach((articleElement) => {
        const pmid = articleElement.querySelector("PMID").textContent;
        const title = articleElement.querySelector("ArticleTitle").textContent;
        const link = `https://pubmed.ncbi.nlm.nih.gov/${pmid}`;

        articles.push({ pmid, title, link });
      });
    } else {
      const errors = new HttpError(
        "No articles found for the given medical term.",
        500
      );
      return next(errors);
    }
  } catch (error) {
    const errors = new HttpError(
      "Error occurred during API request Pease try again",
      500
    );
    return next(errors);
  }

  res.status(200).json({
    articles: articles,
  });
};

const getMessage = async (req, res) => {
  let message;

  try {
    message = await MESSAGE.find({
      $and: [
        { userId: req.body.userId },
        { conversationId: req.body.converId },
      ],
    });
  } catch (err) {
    console.log(err);
  }

  res.status(200).json({ result: message });
};

const createMessage = async (req, res, next) => {
  let message;

  //protect block
  let blockUser;
  try {
    blockUser = await USER.findOne({ extraId: req.body.userId });
  } catch (err) {
    const errors = new HttpError("Find block user failed", 500);
    return next(errors);
  }

  if (!blockUser) {
    blockUser = await GUSER.findOne({ extraId: req.body.extraId });
  }

  if (blockUser?.block) {
    const errors = new HttpError("Sorry your account has been blocked", 500);
    return next(errors);
  }

  //protect block

  if (!req.body.token) {
    let messages;

    try {
      messages = await MESSAGE.find({ userId: req.body.userId });
    } catch (err) {
      console.log(err);
    }

    if (messages.length === 1) {
      const errors = new HttpError(
        "Login / Signup for free to send more messages.",
        500
      );
      return next(errors);
    }
  }

  //protection paid

  if (req.body.token && req.body.paidUser !== "active") {
    if (blockUser?.messages.length === 2) {
      const errors = new HttpError(
        " Upgrade to Dr. Mega Plus to send more messages. Message limits will reset on the first day of each month.",
        500
      );
      return next(errors);
    }
  }
  //protection paid

  try {
    message = await MESSAGE.create(req.body);

    const findUser = await USER.findOne({ extraId: req.body.userId });
    if (findUser) {
      await USER.findOneAndUpdate(
        { extraId: req.body.userId },
        {
          $push: {
            messages: message._id,
          },
        }
      );
    } else {
      await GUSER.findOneAndUpdate(
        { extraId: req.body.userId },
        {
          $push: {
            messages: message._id,
          },
        }
      );
    }
  } catch (err) {
    const errors = new HttpError("create message failed", 500);
    return next(errors);
  }

  message.conversationId = req.body.converId;

  message.automessage[0] = req.body.automessage[0];
  message.automessage[1] = req.body.automessage[1];
  message.automessage[2] = req.body.automessage[2];
  message.automessage[3] = req.body.automessage[3];

  // console.log(req.body.converId);
  try {
    await message.save();
  } catch (err) {
    const errors = new HttpError("update message failed", 500);
    return next(errors);
  }

  res.status(200).json({ result: message });
};

const createConversation = async (req, res, next) => {
  let existingConver;
  //protect block
  let blockUser;
  try {
    blockUser = await USER.findOne({ extraId: req.body.userId });
  } catch (err) {
    const errors = new HttpError("Find block user failed", 500);
    return next(errors);
  }

  //protect block

  try {
    existingConver = await CONVERSATION.find({ userId: req.body.userId });
  } catch (err) {
    const errors = new HttpError("find conversation failed", 500);
    return next(errors);
  }
  if (existingConver.length === 3) {
    const errors = new HttpError(
      "Sorry you can't create more than Three conversation",
      500
    );
    return next(errors);
  }

  let createCon;
  if (existingConver.length === 0) {
    try {
      createCon = await CONVERSATION.create(req.body);
    } catch (err) {
      const errors = new HttpError("create conversation failed", 500);
      return next(errors);
    }
    res.status(200).json({ con: createCon._id });
  } else if (existingConver.length !== 0 && req.body.first) {
    try {
      createCon = await CONVERSATION.findOne({ userId: req.body.userId });
    } catch (err) {
      const errors = new HttpError("create conversation failed", 500);
      return next(errors);
    }
    res.status(200).json({ con: createCon._id });
  } else if (existingConver.length !== 0 && !req.body.token) {
    const errors = new HttpError(
      "You must need to Login/Signup to create multiple conversation",
      500
    );
    return next(errors);
  } else if (existingConver.length !== 0 && req.body.token) {
    if (blockUser.block) {
      const errors = new HttpError("Sorry your account has been blocked", 500);
      return next(errors);
    }
    try {
      createCon = await CONVERSATION.create(req.body);
    } catch (err) {
      const errors = new HttpError("create conversation failed", 500);
      return next(errors);
    }
    res.status(200).json({ con: createCon._id });
  }
};

const getConversation = async (req, res, next) => {
  let Conver;
  try {
    Conver = await CONVERSATION.find({ userId: req.body.userId });
  } catch (err) {
    const errors = new HttpError("find conversation failed", 500);
    return next(errors);
  }

  res.status(200).json({ conver: Conver });
};

const deleteMessages = async (req, res, next) => {
  try {
    await MESSAGE.deleteMany({ conversationId: req.body.converId });
  } catch (err) {
    const errors = new HttpError("delete message failed", 500);
    return next(errors);
  }

  try {
    await EXTRA.deleteMany({ conversationId: req.body.converId });
  } catch (err) {
    const errors = new HttpError("delete message failed", 500);
    return next(errors);
  }
  try {
    await IMAGETEXT.deleteMany({ conversationId: req.body.converId });
  } catch (err) {
    const errors = new HttpError("delete message failed", 500);
    return next(errors);
  }

  res.status(200).json({ message: "Conversation clear successfull" });
};

const createExtra = async (req, res, next) => {
  let message;

  if (!req.body.token) {
    let messages;

    try {
      messages = await EXTRA.find({ userId: req.body.userId });
    } catch (err) {
      console.log(err);
    }

    if (messages.length === 3) {
      const errors = new HttpError(
        "Login / Signup for free to send more messages.",
        500
      );
      return next(errors);
    }
  }

  try {
    message = await EXTRA.create(req.body);
  } catch (err) {
    const errors = new HttpError("create extra message failed", 500);
    return next(errors);
  }

  message.conversationId = req.body.converId;

  try {
    await message.save();
  } catch (err) {
    const errors = new HttpError("update message failed", 500);
    return next(errors);
  }

  res.status(200).json({ result: message });
};

const getConverHistory = async (req, res) => {
  let conver;

  try {
    conver = await CONVERSATION.find({ userId: req.userData.id });
  } catch (err) {
    const errors = new HttpError("fetch user conver failed", 500);
    return next(errors);
  }

  res.status(200).json(conver);
};

const getMessageHistory = async (req, res, next) => {
  let message;

  try {
    message = await MESSAGE.find({ userId: req.userData.id });
  } catch (err) {
    const errors = new HttpError("fetch user message failed", 500);
    return next(errors);
  }

  res.status(200).json(message);
};

const getSpamHistory = async (req, res, next) => {
  let message;

  try {
    message = await MESSAGE.find({
      $and: [{ userId: req.userData.id }, { spam: true }],
    });
  } catch (err) {
    const errors = new HttpError("fetch user spam message failed", 500);
    return next(errors);
  }

  res.status(200).json(message);
};

const updatePassord = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  let user;
  let comparePass;
  let hashPass;

  try {
    user = await USER.findOne({ extraId: req.userData.id });
  } catch (err) {
    const errors = new HttpError("fetch user failed", 500);
    return next(errors);
  }

  try {
    comparePass = await bcrypt.compare(oldPassword, user.password);
  } catch (err) {
    const errors = new HttpError("password compare failed", 500);
    return next(errors);
  }
  if (!comparePass) {
    const errors = new HttpError("Sorry Your password is invalid", 500);
    return next(errors);
  }

  if (newPassword.trim().length < 6) {
    const errors = new HttpError(
      "Password should be at least 6 characters.",
      500
    );
    return next(errors);
  }
  try {
    hashPass = await bcrypt.hash(newPassword, 12);
  } catch (err) {
    const errors = new HttpError("password hashed failed", 500);
    return next(errors);
  }

  user.password = hashPass;

  try {
    await user.save();
  } catch (err) {
    const errors = new HttpError("update password failed", 500);
    return next(errors);
  }

  res.status(200).json({ message: "Password update successful" });
};

module.exports = {
  createGpt,
  createMessage,
  getMessage,
  createExtra,
  createConversation,
  getConversation,
  deleteMessages,
  getConverHistory,
  getMessageHistory,
  getSpamHistory,
  updatePassord,
  autoMessageGenrator,
  symptomsGenarator,
  pubmedArticles,
  imageToTextGenerator,
};
