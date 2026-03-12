const Part = require('../models/Part');
const Topic = require('../models/Topic');
const Question = require('../models/Question');

// Barcha partlarni olish
const getParts = async (req, res) => {
  try {
    const parts = await Part.find().sort({ partNumber: 1 });
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Part bo'yicha topiclarni olish
const getTopicsByPart = async (req, res) => {
  try {
    const { partId } = req.params;
    const topics = await Topic.find({ part: partId }).sort({ name: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Topic bo'yicha savollarni olish
const getQuestionsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const questions = await Question.find({ topic: topicId }).sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Ma'lumotlar bazasiga boshlang'ich ma'lumot qo'shish (seed)
const seedData = async (req, res) => {
  try {
    await Part.deleteMany({});
    await Topic.deleteMany({});
    await Question.deleteMany({});

    const part1 = await Part.create({
      partNumber: 1,
      title: 'Part 1 - Introduction & Interview',
      description: 'The examiner asks general questions about familiar topics like home, work, studies, and interests. (4-5 minutes)',
    });

    const part2 = await Part.create({
      partNumber: 2,
      title: 'Part 2 - Long Turn (Cue Card)',
      description: 'You speak for 1-2 minutes on a given topic. You have 1 minute to prepare.',
    });

    const part3 = await Part.create({
      partNumber: 3,
      title: 'Part 3 - Discussion',
      description: 'The examiner asks deeper, more abstract questions related to the Part 2 topic. (4-5 minutes)',
    });

    const hometown = await Topic.create({ name: 'Hometown', part: part1._id });
    await Question.insertMany([
      { text: "Where is your hometown?", topic: hometown._id, order: 1 },
      { text: "What do you like most about your hometown?", topic: hometown._id, order: 2 },
      { text: "Has your hometown changed much in recent years?", topic: hometown._id, order: 3 },
      { text: "Would you recommend tourists visit your hometown?", topic: hometown._id, order: 4 },
    ]);

    const work = await Topic.create({ name: 'Work & Studies', part: part1._id });
    await Question.insertMany([
      { text: "Do you work or are you a student?", topic: work._id, order: 1 },
      { text: "What do you like about your job/studies?", topic: work._id, order: 2 },
      { text: "What would you like to change about your job/studies?", topic: work._id, order: 3 },
      { text: "Do you plan to continue with this in the future?", topic: work._id, order: 4 },
    ]);

    const hobbies = await Topic.create({ name: 'Hobbies & Free Time', part: part1._id });
    await Question.insertMany([
      { text: "What do you enjoy doing in your free time?", topic: hobbies._id, order: 1 },
      { text: "How long have you been doing this hobby?", topic: hobbies._id, order: 2 },
      { text: "Do you prefer doing activities alone or with others?", topic: hobbies._id, order: 3 },
      { text: "Is there a new hobby you'd like to try?", topic: hobbies._id, order: 4 },
    ]);

    const person = await Topic.create({ name: 'Describe a Person You Admire', part: part2._id });
    await Question.insertMany([
      { text: "Describe a person you admire. You should say: who this person is, how you know this person, what this person does, and explain why you admire this person.", topic: person._id, order: 1 },
    ]);

    const place = await Topic.create({ name: 'Describe a Place You Visited', part: part2._id });
    await Question.insertMany([
      { text: "Describe a place you have visited that you particularly liked. You should say: where it is, when you went there, what you did there, and explain why you liked it.", topic: place._id, order: 1 },
    ]);

    const event = await Topic.create({ name: 'Describe a Memorable Event', part: part2._id });
    await Question.insertMany([
      { text: "Describe a memorable event in your life. You should say: what the event was, when and where it happened, who was with you, and explain why it was memorable.", topic: event._id, order: 1 },
    ]);

    const education = await Topic.create({ name: 'Education & Learning', part: part3._id });
    await Question.insertMany([
      { text: "How has education changed in your country in recent years?", topic: education._id, order: 1 },
      { text: "Do you think online learning will replace traditional classrooms?", topic: education._id, order: 2 },
      { text: "What qualities make a good teacher?", topic: education._id, order: 3 },
      { text: "Should education be free for everyone? Why or why not?", topic: education._id, order: 4 },
    ]);

    const technology = await Topic.create({ name: 'Technology & Society', part: part3._id });
    await Question.insertMany([
      { text: "How has technology changed the way people communicate?", topic: technology._id, order: 1 },
      { text: "Do you think people are too dependent on technology?", topic: technology._id, order: 2 },
      { text: "What are the advantages and disadvantages of social media?", topic: technology._id, order: 3 },
      { text: "How do you think technology will change in the next 20 years?", topic: technology._id, order: 4 },
    ]);

    const environment = await Topic.create({ name: 'Environment', part: part3._id });
    await Question.insertMany([
      { text: "What environmental problems are most serious in your country?", topic: environment._id, order: 1 },
      { text: "What can individuals do to protect the environment?", topic: environment._id, order: 2 },
      { text: "Do you think governments are doing enough to address climate change?", topic: environment._id, order: 3 },
      { text: "How can we encourage more people to be environmentally friendly?", topic: environment._id, order: 4 },
    ]);

    res.json({ message: "Ma'lumotlar muvaffaqiyatli qo'shildi!" });
  } catch (error) {
    res.status(500).json({ message: 'Seed xatosi', error: error.message });
  }
};

// ========== YANGI: Topic qo'shish ==========
const addTopic = async (req, res) => {
  try {
    const { name, partNumber } = req.body;

    const part = await Part.findOne({ partNumber: partNumber });
    if (!part) {
      return res.status(404).json({ message: `Part ${partNumber} topilmadi` });
    }

    const exists = await Topic.findOne({ name: name, part: part._id });
    if (exists) {
      return res.status(400).json({
        message: `"${name}" topic allaqachon Part ${partNumber} da mavjud`,
        topic: exists,
      });
    }

    const topic = await Topic.create({ name: name, part: part._id });

    res.status(201).json({
      message: `"${name}" topic Part ${partNumber} ga qo'shildi!`,
      topic: topic,
    });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

// ========== YANGI: Savol qo'shish ==========
const addQuestion = async (req, res) => {
  try {
    const { topicName, partNumber, questions } = req.body;

    const part = await Part.findOne({ partNumber: partNumber });
    if (!part) {
      return res.status(404).json({ message: `Part ${partNumber} topilmadi` });
    }

    const topic = await Topic.findOne({ name: topicName, part: part._id });
    if (!topic) {
      return res.status(404).json({
        message: `"${topicName}" topic Part ${partNumber} da topilmadi. Avval topic qo'shing.`,
      });
    }

    const existingCount = await Question.countDocuments({ topic: topic._id });

    const questionsToInsert = questions.map((text, index) => ({
      text: text,
      topic: topic._id,
      order: existingCount + index + 1,
    }));

    await Question.insertMany(questionsToInsert);

    res.status(201).json({
      message: `${questions.length} ta savol "${topicName}" (Part ${partNumber}) ga qo'shildi!`,
      addedQuestions: questionsToInsert,
    });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

// ========== DELETE: Topic o'chirish ==========
const deleteTopicById = async (req, res) => {
  try {
    const { topicId } = req.params;

    // Avval shu topicning barcha savollarini o'chirish
    await Question.deleteMany({ topic: topicId });

    // Keyin topicni o'chirish
    const topic = await Topic.findByIdAndDelete(topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic topilmadi' });
    }

    res.json({ message: `"${topic.name}" topic va barcha savollari o'chirildi!` });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

// ========== DELETE: Savol o'chirish ==========
const deleteQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByIdAndDelete(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Savol topilmadi' });
    }

    res.json({ message: "Savol o'chirildi!" });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik', error: error.message });
  }
};

// ========== HAMMASI EXPORT ==========
module.exports = {
  getParts,
  getTopicsByPart,
  getQuestionsByTopic,
  seedData,
  addTopic,
  addQuestion,
  deleteTopicById,
  deleteQuestionById,
};