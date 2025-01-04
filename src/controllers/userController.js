import db from '../config/db.js';

export const getUserProfile = (req, res) => {
  const authenticatedUser = req.user;
  res.json({
    user: {
      id: authenticatedUser.userId,
      username: authenticatedUser.userName,
    },
  });
};

export const getPastTales = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "No User ID provided" });
  }

  try {
    const user_books = await db("comments")
      .join("qr_codes", "comments.qr_id", "=", "qr_codes.id")
      .join("books", "qr_codes.book_id", "=", "books.id")
      .where("comments.user_id", user_id)
      .select("books.*", "comments.*", "comments.created_at as comment_created_at", "qr_codes.qr_code_id")
      .orderBy("books.created_at", "desc");

    res.status(200).json({ user_books });
  } catch (error) {
    console.error("Error during comment retrieval:", error);
    res.status(500).json({ error: "Error retrieving past tales" });
  }
};

export const postBooktale = async (req, res) => {
  const { title, author, coverUrl, publishDate, qrCodeUrl, qrCodeId } = req.body;

  if (!title || !qrCodeUrl || !qrCodeId) {
    return res.status(400).json({ error: "Missing title or QR code" });
  }

  try {
    const userId = req.user.userId;

    const [bookInfo] = await db("books").insert({
      title,
      author,
      publish_date: publishDate,
      cover_url: coverUrl || null,
    }).returning("id");

    const [qrCode] = await db("qr_codes").insert({
      qr_code_id: qrCodeId,
      qr_code_url: qrCodeUrl,
      book_id: bookInfo.id,
    }).returning("id");

    await db("user_qrs").insert({ user_id: userId, qr_id: qrCode.id });

    res.status(201).json({ message: "Booktale created!" });
  } catch (error) {
    console.error("Error creating booktale:", error);
    res.status(500).json({ error: "Error creating booktale." });
  }
};

export const postComment = async (req, res) => {
  const { qr_code_id } = req.params;
  const { comment, location, username } = req.body;
  const { userId } = req.user;

  if (!comment || comment.trim() === "") {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const qrId = await db("qr_codes").where({ qr_code_id }).select("id").first();
    if (!qrId) return res.status(404).json({ error: "No booktale found" });

    const existingComment = await db("comments").where({ qr_id: qrId.id, user_id: userId }).first();
    if (existingComment) return res.status(400).json({ error: "User has already commented" });

    const newComment = await db("comments").insert({
      qr_id: qrId.id,
      user_id: userId,
      username,
      comment,
      longitude: location.longitude,
      latitude: location.latitude,
      heading: location.heading,
      city: location.city,
      state: location.state,
      country: location.country,
    }).returning("*");

    res.status(201).json({ message: "Comment posted successfully", comment: newComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error posting comment" });
  }
};