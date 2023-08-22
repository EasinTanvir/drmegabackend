const USER = require("../models/auth");
const GUSER = require("../models/googleauth");
const CONVERSATION = require("../models/conversation");
const MESSAGE = require("../models/gpt");
const HttpError = require("../helper/HttpError");
const APIONE = require("../models/apikey");
const APITWO = require("../models/apikeytwo");
const APITHREE = require("../models/apikeythree");
const fs = require("fs");
const DATAMODEL = require("../models/jsonDataModel");
const getAdminUsers = async (req, res) => {
  let user;

  try {
    user = await USER.find();
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }
  let guser;
  try {
    guser = await GUSER.find();
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }
  let alluser;
  alluser = user.concat(guser);

  res.status(200).json(alluser);
};

const getAdminConversations = async (req, res) => {
  let conver;

  try {
    conver = await CONVERSATION.find();
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }

  res.status(200).json(conver);
};
const getAdminMessages = async (req, res) => {
  let message;

  try {
    message = await MESSAGE.find();
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }

  res.status(200).json(message);
};

const getUserProfile = async (req, res) => {
  const { id } = req.params;
  let user;

  try {
    user = await USER.findOne({ extraId: id });
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }
  if (!user) {
    try {
      user = await GUSER.findOne({ extraId: id });
    } catch (err) {
      const errors = new HttpError("fetch admin message failed", 500);
      return next(errors);
    }
  }

  res.status(200).json(user);
};

const getConverHistory = async (req, res) => {
  const { id } = req.params;
  let conver;

  try {
    conver = await CONVERSATION.find({ userId: id });
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }

  res.status(200).json(conver);
};

const getMessageHistory = async (req, res, next) => {
  const { id } = req.params;

  let message;

  const search = req.query.search
    ? {
        user: {
          $regex: req.query.search,
          $options: "i",
        },
      }
    : {};

  const gpt = req.query.search
    ? {
        gpt: {
          $regex: req.query.search,
          $options: "i",
        },
      }
    : {};

  try {
    message = await MESSAGE.find({
      userId: id,
      $or: [{ ...search }, { ...gpt }],
    });
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }

  res.status(200).json(message);
};

const spamMessage = async (req, res, next) => {
  const { userId } = req.body;

  let message;

  try {
    message = await MESSAGE.findById(userId);
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }
  if (!message.spam) {
    message.spam = true;
  } else {
    message.spam = false;
  }

  try {
    await message.save();
  } catch (err) {
    const errors = new HttpError("update message failed", 500);
    return next(errors);
  }

  res.status(200).json({ message: "Update Successfully" });
};

const blockUser = async (req, res, next) => {
  const { userId } = req.body;

  let user;

  try {
    user = await USER.findOne({ extraId: userId });
  } catch (err) {
    const errors = new HttpError("fetch admin user failed", 500);
    return next(errors);
  }
  if (!user.block) {
    user.block = true;
  } else {
    user.block = false;
  }

  try {
    await user.save();
  } catch (err) {
    const errors = new HttpError("update user failed", 500);
    return next(errors);
  }

  res.status(200).json({ user: "Update Successfully" });
};

const updateAdminUser = async (req, res, next) => {
  const { userId, admin } = req.body;

  let user;

  try {
    user = await USER.findOne({ extraId: userId });
  } catch (err) {
    const errors = new HttpError("fetch admin user failed", 500);
    return next(errors);
  }

  if (!user) {
    try {
      user = await GUSER.findOne({ extraId: userId });
    } catch (err) {
      const errors = new HttpError("fetch admin user failed", 500);
      return next(errors);
    }
  }

  user.isAdmin = true;

  try {
    await user.save();
  } catch (err) {
    const errors = new HttpError("update user failed", 500);
    return next(errors);
  }

  res.status(200).json({ user: "Update Successfully" });
};

const getAllMessages = async (req, res, next) => {
  let message;
  const pageSize = 5;
  const page = Number(req.query.pageNumber) || 1;
  let count;
  const search = req.query.search
    ? {
        user: {
          $regex: req.query.search,
          $options: "i",
        },
      }
    : {};

  const gpt = req.query.search
    ? {
        gpt: {
          $regex: req.query.search,
          $options: "i",
        },
      }
    : {};

  try {
    count = await MESSAGE.count({ $or: [{ ...search }, { ...gpt }] });
    message = await MESSAGE.find({ $or: [{ ...search }, { ...gpt }] })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
  } catch (err) {
    const errors = new HttpError("fetch admin message failed", 500);
    return next(errors);
  }

  res.status(200).json({ message, page, pages: Math.ceil(count / pageSize) });
};

const updateApiOne = async (req, res, next) => {
  let api;
  try {
    api = await APIONE.find();
  } catch (err) {
    const errors = new HttpError("find api failed", 500);
    return next(errors);
  }
  if (api.length === 0) {
    try {
      await APIONE.create(req.body);
    } catch (err) {
      const errors = new HttpError("api key create failed", 500);
      return next(errors);
    }
  } else {
    api[0].apikey = req.body.apikey;
    try {
      await api[0].save();
    } catch (err) {
      const errors = new HttpError("api key update failed", 500);
      return next(errors);
    }
  }

  res.status(200).json({ message: "api key update successful" });
};
const updateApiTwo = async (req, res, next) => {
  let api;
  try {
    api = await APITWO.find();
  } catch (err) {
    const errors = new HttpError("find api failed", 500);
    return next(errors);
  }
  if (api.length === 0) {
    try {
      await APITWO.create(req.body);
    } catch (err) {
      const errors = new HttpError("api key create failed", 500);
      return next(errors);
    }
  } else {
    api[0].apikey = req.body.apikey;
    try {
      await api[0].save();
    } catch (err) {
      const errors = new HttpError("api key update failed", 500);
      return next(errors);
    }
  }
  res.status(200).json({ message: "api key update successful" });
};

const updateApiThree = async (req, res, next) => {
  let api;
  try {
    api = await APITHREE.find();
  } catch (err) {
    const errors = new HttpError("find api failed", 500);
    return next(errors);
  }
  if (api.length === 0) {
    try {
      await APITHREE.create(req.body);
    } catch (err) {
      const errors = new HttpError("api key create failed", 500);
      return next(errors);
    }
  } else {
    api[0].apikey = req.body.apikey;
    try {
      await api[0].save();
    } catch (err) {
      const errors = new HttpError("api key update failed", 500);
      return next(errors);
    }
  }
  res.status(200).json({ message: "api key update successful" });
};

const updateJsonApiKey = async (req, res, next) => {
  const filePath = req.file.path;

  // Read the uploaded JSON file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      const errors = new HttpError("Error for  reading json file", 500);
      return next(errors);
    }

    // Parse the JSON data
    const jsonData = JSON.parse(data);

    // Iterate over the parsed data and create Mongoose instances

    const newData = new DATAMODEL(jsonData);

    // Save the instance to the database
    newData
      .save()
      .then((savedData) => {
        // Delete the temporary uploaded file
        fs.unlink(filePath, (err) => {
          if (err) {
            const errors = new HttpError("Error deleting files", 500);
            return next(errors);
          }
        });
        res
          .status(200)
          .json({ message: "File uploaded and data saved successfully" });
      })
      .catch((err) => {
        const errors = new HttpError("Json file upload fail", 500);
        return next(errors);
      });
  });
};

module.exports = {
  getAdminUsers,
  getAdminConversations,
  getAdminMessages,
  getUserProfile,
  getConverHistory,
  getMessageHistory,
  spamMessage,
  blockUser,
  updateAdminUser,
  getAllMessages,
  updateApiOne,
  updateApiTwo,
  updateApiThree,
  updateJsonApiKey,
};
