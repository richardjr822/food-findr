import clientPromise from "@/lib/mongodb";

async function run() {
  const client = await clientPromise;
  const db = client.db();
  const threads = await db.collection("threads").find({ "messages.recipeId": { $exists: true } }).toArray();
  for (const thread of threads) {
    let changed = false;
    for (const msg of thread.messages) {
      if (msg.role === "model" && msg.recipeId && !msg.recipeSnapshot) {
        const recipe = await db.collection("recipes").findOne({ _id: msg.recipeId, userId: thread.userId });
        if (recipe) {
          msg.recipeSnapshot = {
            title: recipe.title,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            nutrition: recipe.nutrition,
          };
          changed = true;
        }
      }
    }
    if (changed) {
      await db.collection("threads").updateOne(
        { id: thread.id, userId: thread.userId },
        { $set: { messages: thread.messages, updatedAt: new Date() } }
      );
    }
  }
  console.log("Backfill complete");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});