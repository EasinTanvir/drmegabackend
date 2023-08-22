const HttpError = require("../helper/HttpError");
const VET = require("../models/vet");
const USER = require("../models/auth");
const GUSER = require("../models/googleauth");
const VETCONVERSATION = require("../models/vetConversation");
const createVetGpt = async (req, res, next) => {
  const openAi = req.app.get("gpt");
  const { extraId, text, converId, paidUser } = req.body;

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
      lmessages = await VET.find({ userId: req.body.extraId });
    } catch (err) {
      console.log(err);
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

  //plus protection
  if (req.body.token && paidUser !== "active") {
    if (blockUser.vetmessages.length === 2) {
      const errors = new HttpError(
        " Upgrade to Dr. Mega Plus to send more messages. Message limits will reset on the first day of each month.",
        500
      );
      return next(errors);
    }
  }
  //plus protection

  let dbData;

  try {
    dbData = await VET.find({
      $and: [{ userId: extraId }, { conversationId: converId }],
    });
  } catch (err) {
    console.log(err);
  }

  let assistantData = dbData.map((item) => item.vetgpt);
  let userData = dbData.map((item) => item.user);
  const assisGpt = assistantData.toString() || " ";
  const userGpt = userData.toString() || " ";

  openAi
    .createChatCompletion({
      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "system",
          content:
            "You are a pet information chatbot designed to assist users in providing information about various pets. Your primary role is to answer user queries, provide details about different types of pets, their characteristics, care requirements, and any other relevant information. Your goal is to be helpful, informative, and provide accurate responses based on the input provided by the user.",
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
          content: text,
        },
      ],
    })
    .then((ress) => {
      //console.log(res.data.choices[0].message.content);
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

const vetAutoMessageGenrator = async (req, res, next) => {
  const openAi = req.app.get("gpt2");
  const { text, extraId, token, converId } = req.body;

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
  if (!token) {
    try {
      lmessages = await VET.find({ userId: extraId });
    } catch (err) {
      console.log(err);
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

  //plus protection
  if (req.body.token && req.body.paidUser !== "active") {
    if (blockUser.vetmessages.length === 2) {
      const errors = new HttpError(
        " Upgrade to Dr. Mega Plus to send more messages. Message limits will reset on the first day of each month.",
        500
      );
      return next(errors);
    }
  }
  //plus protection

  openAi
    .createChatCompletion({
      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "system",
          content:
            "You are AI pet physician chatbot and helpful assistance for auto question generator to make it easier for the user to ask the next questions about their pet. you will generate exactly four suggestion question based on user question and remember one thing you will only generate question if the user ask for about their pet medical information. Just genrate four question nothing else and organized them by serial number for example 1, 2, 3, 4",
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

const createVetMessage = async (req, res, next) => {
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
    blockUser = await GUSER.findOne({ extraId: req.body.userId });
  }

  if (blockUser?.block) {
    const errors = new HttpError("Sorry your account has been blocked", 500);
    return next(errors);
  }
  //protect block

  if (!req.body.token) {
    let messages;

    try {
      messages = await VET.find({ userId: req.body.userId });
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

  //plus protection
  if (req.body.token && req.body.paidUser !== "active") {
    if (blockUser.vetmessages.length === 2) {
      const errors = new HttpError(
        " Upgrade to Dr. Mega Plus to send more messages. Message limits will reset on the first day of each month.",
        500
      );
      return next(errors);
    }
  }
  //plus protection

  try {
    message = await VET.create(req.body);

    const findUser = await USER.findOne({ extraId: req.body.userId });
    if (findUser) {
      await USER.findOneAndUpdate(
        { extraId: req.body.userId },
        {
          $push: {
            vetmessages: message._id,
          },
        }
      );
    } else {
      await GUSER.findOneAndUpdate(
        { extraId: req.body.userId },
        {
          $push: {
            vetmessages: message._id,
          },
        }
      );
    }
  } catch (err) {
    const errors = new HttpError("create message failed", 500);
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

const getVetMessage = async (req, res) => {
  let message;

  try {
    message = await VET.find({
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

const createVetConversation = async (req, res, next) => {
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
    existingConver = await VETCONVERSATION.find({ userId: req.body.userId });
  } catch (err) {
    const errors = new HttpError("find conversation failed", 500);
    return next(errors);
  }
  if (existingConver.length === 3) {
    const errors = new HttpError(
      "Sorry you can't create more than three conversation",
      500
    );
    return next(errors);
  }

  let createCon;
  if (existingConver.length === 0) {
    console.log(req.body.userId);
    try {
      createCon = await VETCONVERSATION.create({ userId: req.body.userId });
    } catch (err) {
      const errors = new HttpError(
        "create conversation failed in exucute",
        500
      );
      return next(errors);
    }
    res.status(200).json({ con: createCon._id });
  } else if (existingConver.length !== 0 && req.body.first) {
    console.log("req.body.userId");
    console.log(req.body.userId);
    try {
      createCon = await VETCONVERSATION.findOne({ userId: req.body.userId });
    } catch (err) {
      const errors = new HttpError("create conversation failed in first", 500);
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
      createCon = await VETCONVERSATION.create(req.body);
    } catch (err) {
      const errors = new HttpError("create conversation failed", 500);
      return next(errors);
    }
    res.status(200).json({ con: createCon._id });
  }
};

const getVetConversation = async (req, res, next) => {
  let Conver;
  try {
    Conver = await VETCONVERSATION.find({ userId: req.body.userId });
  } catch (err) {
    const errors = new HttpError("find conversation failed", 500);
    return next(errors);
  }

  res.status(200).json({ conver: Conver });
};

const vetDeleteMessages = async (req, res, next) => {
  try {
    await VET.deleteMany({ conversationId: req.body.converId });
  } catch (err) {
    const errors = new HttpError("delete message failed", 500);
    return next(errors);
  }

  res.status(200).json({ message: "Conversation clear successfull" });
};

module.exports = {
  createVetGpt,
  createVetMessage,
  createVetConversation,
  getVetConversation,
  getVetMessage,
  vetDeleteMessages,
  vetAutoMessageGenrator,
};
