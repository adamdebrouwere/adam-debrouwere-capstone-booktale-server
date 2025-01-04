import db from "../config/db.js";

export const getTale = async (req, res) => {
  const { qr_code_id } = req.params;

  if (!qr_code_id) {
    return res.status(400).json({ error: "No QR Code Id" });
  }

  try {
    const getQrId = await db("qr_codes")
      .select("book_id")
      .where({ qr_code_id: qr_code_id })
      .first();
    if (!getQrId) {
      res.status(400).json({ error: "No Qr Code Present" });
    }

    const bookInfo = await db("books").where({ id: getQrId.book_id });

    const comments = await db("comments")
      .where({ qr_id: getQrId.book_id })
      .orderBy("created_at", "desc");

    res.status(200).json({ bookInfo, comments });
  } catch (error) {
    console.error("error getting comments", error);
    res
      .status(500)
      .json({ error: "no booktale created with this id. Try again." });
  }
};
