export async function generateAISchedule(tasks) {

  const response = await fetch("https://task-application-sigma.vercel.app/api/geminiSchedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tasks })
  });

  const data = await response.json();

  return data;

}