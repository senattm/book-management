const { prisma } = require("../config/database");

async function createBook(book) {
 
    const preparedData = {
    title: (book.title || "").trim(),
    isbn: (book.isbn || "").trim(),
    authorid: book.authorid,
    categoryid: book.categoryid,
    description: book.description ? book.description : null,
    publishedat: book.publishedat ? new Date(book.publishedat) : null,
    stock: book.stock === undefined ? 0 : parseInt(book.stock),
  };

  const created = await prisma.books.create({
    data: preparedData,
  });
  return created;
}

module.exports = { createBook };