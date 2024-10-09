const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Perform a web search to find information not present in the AI's knowledge base or to get up-to-date information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query string",
          },
        },
        required: ["query"],
      },
    },
  },
];

const getChatResponse = async (req, res) => {
  try {
    const { user_question, base64image, chat, type } = req.body;
    const chathistory = JSON.stringify(chat);

    const msgs = [];

    msgs.push({
      role: "system",
      content: `You are a helpful assistant.`,
    });

    msgs.push({ role: "assistant", content: chathistory });

    if (base64image) {
      msgs.push({
        role: "user",
        content: [
          {
            type: "text",
            text: user_question,
          },
          {
            type: "image_url",
            image_url: {
              url: base64image,
            },
          },
        ],
      });
    } else {
      msgs.push({
        role: "user",
        content: user_question,
      });
    }

    console.log("MSGS : ", msgs);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // model: "llama-3.2-11b-vision-preview",
      // stream: true,
      temperature: 0.7,
      tools: tools,
      tool_choice: type === "tool" ? "auto" : "none",
      messages: msgs,
    });

    if (
      response &&
      response.choices &&
      response.choices[0] &&
      response.choices[0].message.tool_calls
    ) {
      const tool_calls = response?.choices[0]?.message?.tool_calls;
      const tool_function_name = tool_calls[0]?.function?.name;
      const tool_query_string = tool_calls[0]?.function?.arguments;

      console.log("Others : ", tool_function_name);
      console.log("Arguments : ", tool_query_string);

      const query = JSON.parse(tool_query_string);
      console.log(query.query);

      if (tool_function_name === "web_search") {
        return res.status(200).json({ success: true, msg: "web_search" , query : query?.query });
      }
    }

    return res
      .status(200)
      .json({ success: true, msg: response.choices[0].message.content });
  } catch (err) {
    console.log("Error in openai chat : ", err);
    return res
      .status(400)
      .json({ success: false, msg: "Something unusual occured." });
  }
};

module.exports = { getChatResponse };
