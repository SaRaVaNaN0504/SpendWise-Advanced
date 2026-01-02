import axios from "axios";

export const sendMessageToChatbot = async (message) => {
  const response = await axios.post(
    "/chatbot",
    { message }, // JSON BODY
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.reply;
};
