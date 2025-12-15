const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.borrowings.deleteMany();
    await prisma.reviews.deleteMany();
    await prisma.books.deleteMany();
    await prisma.categories.deleteMany();
    await prisma.authors.deleteMany();
    await prisma.users.deleteMany();

    const adminPass = await bcrypt.hash("Admin123!", 10);
    const user1Pass = await bcrypt.hash("User123!", 10);
    const user2Pass = await bcrypt.hash("123456", 10);

    const [admin, user1, user2] = await Promise.all([
      prisma.users.create({
        data: {
          name: "Admin User",
          email: "admin@book.com",
          password: adminPass,
          role: "admin",
        },
      }),
      prisma.users.create({
        data: {
          name: "Sena",
          email: "sena@book.com",
          password: user1Pass,
          role: "user",
        },
      }),
      prisma.users.create({
        data: {
          name: "Ali",
          email: "ali@book.com",
          password: user2Pass,
          role: "user",
        },
      }),
    ]);

    const fiction = await prisma.categories.create({
      data: { categoryname: "Fiction" },
    });
    const nonfiction = await prisma.categories.create({
      data: { categoryname: "Non-Fiction" },
    });

    const [scifi, classics, fantasy, philosophy] = await Promise.all([
      prisma.categories.create({
        data: { categoryname: "Science Fiction", parentid: fiction.id },
      }),
      prisma.categories.create({
        data: { categoryname: "Classics", parentid: fiction.id },
      }),
      prisma.categories.create({
        data: { categoryname: "Fantasy", parentid: fiction.id },
      }),
      prisma.categories.create({
        data: { categoryname: "Philosophy", parentid: nonfiction.id },
      }),
    ]);

    const authorsData = [
      { fullname: "George Orwell", bio: "English novelist and essayist." },
      { fullname: "Frank Herbert", bio: "American science-fiction author." },
      { fullname: "J.R.R. Tolkien", bio: "English writer, poet, philologist." },
      {
        fullname: "Fyodor Dostoevsky",
        bio: "Russian novelist and philosopher.",
      },
      { fullname: "Jane Austen", bio: "English novelist known for realism." },
      { fullname: "Albert Camus", bio: "French philosopher and author." },
      { fullname: "Yuval Noah Harari", bio: "Historian and author." },
      {
        fullname: "Mary Shelley",
        bio: "English novelist who wrote Frankenstein.",
      },
      { fullname: "Unknown Author", bio: null },
    ];

    const createdAuthors = await Promise.all(
      authorsData.map((a) => prisma.authors.create({ data: a }))
    );

    const [
      orwell,
      herbert,
      tolkien,
      dostoevsky,
      austen,
      camus,
      harari,
      shelley,
      unknown,
    ] = createdAuthors;

    const booksData = [
      {
        title: "1984",
        isbn: "9780451524935",
        description: "Dystopian social science fiction novel.",
        authorid: orwell.id,
        categoryid: classics.id,
        publishedat: new Date("1949-06-08"),
        stock: 10,
      },
      {
        title: "Dune",
        isbn: "9780441172719",
        description: "Epic science fiction novel.",
        authorid: herbert.id,
        categoryid: scifi.id,
        publishedat: new Date("1965-08-01"),
        stock: 7,
      },
      {
        title: "The Hobbit",
        isbn: "9780345339683",
        description: "Fantasy novel and childrens book.",
        authorid: tolkien.id,
        categoryid: fantasy.id,
        publishedat: new Date("1937-09-21"),
        stock: 12,
      },
      {
        title: "Crime and Punishment",
        isbn: "9780140449136",
        description: "Psychological novel about morality and guilt.",
        authorid: dostoevsky.id,
        categoryid: classics.id,
        publishedat: new Date("1866-01-01"),
        stock: 5,
      },
      {
        title: "Pride and Prejudice",
        isbn: "9780141439518",
        description: "Romantic novel of manners.",
        authorid: austen.id,
        categoryid: classics.id,
        publishedat: new Date("1813-01-28"),
        stock: 9,
      },
      {
        title: "The Stranger",
        isbn: "9780679720201",
        description: "Existential novel exploring absurdism.",
        authorid: camus.id,
        categoryid: philosophy.id,
        publishedat: new Date("1942-01-01"),
        stock: 6,
      },
      {
        title: "Sapiens: A Brief History of Humankind",
        isbn: "9780062316097",
        description: "A narrative of humanitys history.",
        authorid: harari.id,
        categoryid: nonfiction.id,
        publishedat: new Date("2011-01-01"),
        stock: 8,
      },
      {
        title: "Frankenstein",
        isbn: "9780486282114",
        description: "Gothic novel about creation and responsibility.",
        authorid: shelley.id,
        categoryid: classics.id,
        publishedat: new Date("1818-01-01"),
        stock: 4,
      },
      {
        title: "The Lord of the Rings",
        isbn: "9780544003415",
        description: "Epic high-fantasy novel.",
        authorid: tolkien.id,
        categoryid: fantasy.id,
        publishedat: new Date("1954-07-29"),
        stock: 0,
      },
      {
        title: "Mysterious Book",
        isbn: "9781234567890",
        description: null,
        authorid: unknown.id,
        categoryid: fiction.id,
        publishedat: null,
        stock: 3,
      },
    ];

    const createdBooks = await Promise.all(
      booksData.map((b) => prisma.books.create({ data: b }))
    );

await prisma.reviews.createMany({
      data: [
        {
          userid: user1.id,            
          bookid: createdBooks[0].id, 
          rating: 5,
          comment: 'Çok etkileyici bir kitap!',
        },
        {
          userid: user2.id,
          bookid: createdBooks[1].id,
          rating: 4,
          comment: 'Evreni harika kurgulanmış.',
        },
        {
          userid: user1.id,
          bookid: createdBooks[2].id,
          rating: 5,
          comment: 'Çocukken okumuştum, hâlâ güzel.',
        },
        {
          userid: user2.id,
          bookid: createdBooks[3].id,
          rating: 5,
          comment: 'Ağır ama müthiş bir eser.',
        },
        {
          userid: admin.id,
          bookid: createdBooks[4].id,
          rating: 4,
          comment: 'Klasiklerin klasiği.',
        },
        {
          userid: user1.id,
          bookid: createdBooks[5].id,
          rating: 4,
          comment: 'Absürd ve düşündürücü.',
        },
        {
          userid: user2.id,
          bookid: createdBooks[6].id,
          rating: 5,
          comment: 'Tarihi çok iyi özetliyor.',
        },
        {
          userid: admin.id,
          bookid: createdBooks[7].id,
          rating: 4,
          comment: 'Karanlık ama iyi yazılmış.',
        },
        {
          userid: user1.id,
          bookid: createdBooks[4].id,
          rating: 3,
          comment: null,
        },
      ],
    });

    const now = new Date();

    const plusDays = (d) => {
      const t = new Date(now);
      t.setDate(t.getDate() + d);
      return t;
    };

    await prisma.borrowings.createMany({
      data: [
        {
          userid: user1.id,
          bookid: createdBooks[1].id,
          borrowedat: now,
          dueat: plusDays(14),
        },
        {
          userid: user2.id,
          bookid: createdBooks[0].id,
          borrowedat: now,
          dueat: plusDays(7),
        },
        {
          userid: admin.id,
          bookid: createdBooks[6].id,
          borrowedat: now,
          dueat: plusDays(10),
        },
        {
          userid: user1.id,
          bookid: createdBooks[3].id,
          borrowedat: plusDays(-20),
          dueat: plusDays(-6),
          returnedat: plusDays(-5),
        },
        {
          userid: user2.id,
          bookid: createdBooks[2].id,
          borrowedat: plusDays(-15),
          dueat: plusDays(-1),
          returnedat: plusDays(-1),
        },
        {
          userid: user1.id,
          bookid: createdBooks[5].id,
          borrowedat: plusDays(-30),
          dueat: plusDays(-10),
          returnedat: null,
        },
        {
          userid: user2.id,
          bookid: createdBooks[7].id,
          borrowedat: plusDays(-20),
          dueat: plusDays(-5),
          returnedat: null,
        },
      ],
    });

 console.log("Seed başarılı");
  } catch (error) {
    console.error("Seed hatası:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
