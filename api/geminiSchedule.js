export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { tasks } = req.body;

    const prompt = `
You are an intelligent productivity planner.

Create the best daily schedule for the following tasks.

Tasks:
${JSON.stringify(tasks)}

Rules:
- Assign realistic time slots
- High priority tasks in morning
- Avoid overlapping
- Return simple list

Example output:
8:00 AM - Workout
9:00 AM - Study React
11:00 AM - Project Work
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    res.status(200).json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "AI scheduling failed"
    });

  }
}